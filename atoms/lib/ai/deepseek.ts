export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface DeepSeekStreamOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

export async function* streamDeepSeekChat(
  messages: DeepSeekMessage[],
  options: DeepSeekStreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  const apiUrl = process.env.DEEPSEEK_API_URL?.trim() || 'https://api.deepseek.com'
  const model = options.model || process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set')
  }

  // 确保 API key 格式正确（移除可能的空格）
  const cleanApiKey = apiKey.trim()

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `DeepSeek API error: ${response.status}`
    
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage += ` - ${errorJson.error?.message || errorText}`
    } catch {
      errorMessage += ` - ${errorText}`
    }
    
    // 如果是认证错误，提供更详细的提示
    if (response.status === 401) {
      console.error('DeepSeek API 认证失败')
      console.error('API Key 长度:', cleanApiKey.length)
      console.error('API Key 前缀:', cleanApiKey.substring(0, 8) + '...')
      errorMessage += '\n\n请检查以下几点：'
      errorMessage += '\n1. DEEPSEEK_API_KEY 是否正确设置（检查 .env.local 文件）'
      errorMessage += '\n2. API key 是否有效（可能已过期或被撤销）'
      errorMessage += '\n3. 在 https://platform.deepseek.com/api_keys 查看并重新生成 API key'
      errorMessage += '\n4. 确保 API key 没有多余的空格或换行符'
    }
    
    throw new Error(errorMessage)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Failed to get response reader')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          return
        }

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}
