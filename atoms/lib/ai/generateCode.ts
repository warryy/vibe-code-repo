import { DeepSeekMessage } from './deepseek'
import { ensureFileExtension } from './fileExtensions'

export interface CodeFile {
  path: string
  content: string
  language?: string
}

export interface GeneratedCode {
  files: CodeFile[]
  structure?: string[]
}

/**
 * 根据用户需求生成代码
 */
export async function generateCode(
  userRequest: string,
  existingCode?: CodeFile[]
): Promise<GeneratedCode> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  const apiUrl = process.env.DEEPSEEK_API_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set')
  }

  const systemPrompt = `你是一个专业的代码生成助手。根据用户需求生成完整的代码项目。

要求：
1. 返回 JSON 格式，包含 files 数组
2. 每个文件包含：path（文件路径）、content（文件内容）、language（语言类型，如 javascript、typescript、python 等）
3. 文件路径使用 / 分隔，如 src/index.js、package.json 等
4. 如果是多文件项目，请包含必要的配置文件（如 package.json、README.md 等）
5. 代码要完整、可运行
6. 如果用户要求修改现有代码，请基于现有代码进行修改

返回格式：
{
  "files": [
    {
      "path": "src/index.js",
      "content": "代码内容",
      "language": "javascript"
    }
  ],
  "structure": ["src/", "src/index.js", "package.json"]
}`

  console.log('[GenerateCode] ====== 开始生成代码 ======')
  console.log('[GenerateCode] API URL:', apiUrl)
  console.log('[GenerateCode] Model:', model)
  console.log('[GenerateCode] API Key 长度:', apiKey.length)
  console.log('[GenerateCode] API Key 前缀:', apiKey.substring(0, 8) + '...')
  console.log('[GenerateCode] 用户请求:', userRequest.substring(0, 100) + (userRequest.length > 100 ? '...' : ''))
  console.log('[GenerateCode] 现有代码文件数:', existingCode?.length || 0)

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ]

  // 如果有现有代码，添加到上下文中
  if (existingCode && existingCode.length > 0) {
    console.log('[GenerateCode] 添加现有代码上下文')
    messages.push({
      role: 'assistant',
      content: `现有代码结构：\n${JSON.stringify(existingCode.map(f => ({ path: f.path, language: f.language })), null, 2)}`,
    })
  }

  messages.push({
    role: 'user',
    content: userRequest,
  })

  console.log('[GenerateCode] 消息数量:', messages.length)
  console.log('[GenerateCode] 准备调用 DeepSeek API...')
  console.log('[GenerateCode] 请求体大小:', JSON.stringify({ model, messages, stream: false, temperature: 0.7, max_tokens: 8000 }).length, 'bytes')
  const apiStartTime = Date.now()

  // 添加超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
    console.error('[GenerateCode] ❌ API 请求超时（120秒）')
  }, 120000) // 120秒超时（代码生成可能需要更长时间）

  try {
    console.log('[GenerateCode] 发送 fetch 请求...')
    const fetchStartTime = Date.now()
    
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept-Encoding': 'gzip, deflate', // 明确指定接受压缩
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 8000,
      }),
      signal: controller.signal,
    })
    
    const fetchDuration = Date.now() - fetchStartTime
    console.log('[GenerateCode] ✅ Fetch 请求完成，耗时:', fetchDuration, 'ms')

    clearTimeout(timeoutId)
    const apiDuration = Date.now() - apiStartTime
    console.log('[GenerateCode] API 响应状态:', response.status, '耗时:', apiDuration, 'ms')
    console.log('[GenerateCode] 响应 Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GenerateCode] ❌ API 错误响应:', response.status)
      console.error('[GenerateCode] 错误内容:', errorText)
      throw new Error(`Failed to generate code: ${response.status} ${errorText}`)
    }

    console.log('[GenerateCode] 开始解析响应 JSON...')
    const jsonParseStartTime = Date.now()
    let data
    
    try {
      console.log('[GenerateCode] 步骤: 读取并解析响应...')
      const readStartTime = Date.now()
      
      // 直接使用 response.json() 可能更快，因为它会自动处理 gzip 和解压缩
      // 使用 Promise.race 添加超时控制
      const responseJsonPromise = response.json()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('[GenerateCode] ❌ 读取响应超时（60秒）')
          reject(new Error('Response read timeout after 60 seconds'))
        }, 60000) // 60秒超时
      })
      
      console.log('[GenerateCode] 等待响应解析...')
      data = await Promise.race([responseJsonPromise, timeoutPromise])
      const readDuration = Date.now() - readStartTime
      
      console.log('[GenerateCode] ✅ 响应解析完成，耗时:', readDuration, 'ms')
      console.log('[GenerateCode] 响应数据类型:', typeof data)
      console.log('[GenerateCode] 响应数据键:', Object.keys(data || {}))
      
      const jsonParseDuration = Date.now() - jsonParseStartTime
      console.log('[GenerateCode] ✅ 总解析耗时:', jsonParseDuration, 'ms')
    } catch (jsonError) {
      const totalDuration = Date.now() - jsonParseStartTime
      console.error('[GenerateCode] ❌ 响应解析失败，总耗时:', totalDuration, 'ms')
      console.error('[GenerateCode] 错误类型:', jsonError instanceof Error ? jsonError.constructor.name : typeof jsonError)
      console.error('[GenerateCode] 错误信息:', jsonError instanceof Error ? jsonError.message : String(jsonError))
      if (jsonError instanceof Error && jsonError.stack) {
        console.error('[GenerateCode] 错误堆栈:', jsonError.stack.substring(0, 500))
      }
      throw new Error(`Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`)
    }

    console.log('[GenerateCode] 步骤: 提取响应内容')
    console.log('[GenerateCode] 响应包含 choices:', data.choices?.length || 0)
    console.log('[GenerateCode] 响应数据结构:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
    })
    
    if (!data.choices || data.choices.length === 0) {
      console.error('[GenerateCode] ❌ 响应中没有 choices')
      console.error('[GenerateCode] 完整响应数据:', JSON.stringify(data, null, 2))
      throw new Error('API response does not contain choices')
    }
    
    const content = data.choices[0]?.message?.content?.trim() || ''
    console.log('[GenerateCode] 响应内容长度:', content.length)
    if (content.length === 0) {
      console.error('[GenerateCode] ⚠️ 警告: 响应内容为空')
      console.error('[GenerateCode] Choice 数据:', JSON.stringify(data.choices[0], null, 2).substring(0, 1000))
      throw new Error('API response content is empty')
    }
    console.log('[GenerateCode] 响应内容预览:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))

    // 尝试解析 JSON
    console.log('[GenerateCode] 步骤: 解析 JSON 响应')
    try {
      // 提取 JSON 部分（可能包含 markdown 代码块）
      let jsonContent = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        console.log('[GenerateCode] 检测到 Markdown 代码块，提取 JSON')
        jsonContent = jsonMatch[1]
      }

      console.log('[GenerateCode] JSON 内容长度:', jsonContent.length)
      console.log('[GenerateCode] JSON 内容预览:', jsonContent.substring(0, 500))
      
      let parsed
      try {
        parsed = JSON.parse(jsonContent)
        console.log('[GenerateCode] ✅ JSON 解析成功')
      } catch (parseError) {
        console.error('[GenerateCode] ❌ JSON.parse 失败')
        console.error('[GenerateCode] 错误:', parseError)
        console.error('[GenerateCode] 尝试解析的内容:', jsonContent.substring(0, 1000))
        throw parseError
      }
      
      // 验证格式
      if (!parsed.files || !Array.isArray(parsed.files)) {
        console.error('[GenerateCode] ❌ 响应格式无效: 缺少 files 数组')
        console.error('[GenerateCode] 解析后的对象:', Object.keys(parsed))
        throw new Error('Invalid response format: missing files array')
      }

      console.log('[GenerateCode] 文件数量:', parsed.files.length)

      // 确保每个文件都有必要的字段
      console.log('[GenerateCode] 开始处理文件列表...')
      const files: CodeFile[] = parsed.files.map((file: any, index: number) => {
        try {
          let filePath = file.path || ''
          const fileLanguage = file.language || detectLanguage(filePath)
          
          // 确保文件路径有扩展名
          filePath = ensureFileExtension(filePath, fileLanguage)
          
          const processed = {
            path: filePath,
            content: file.content || '',
            language: fileLanguage,
          }
          console.log(`[GenerateCode] 文件 ${index + 1}/${parsed.files.length}: ${processed.path} (${processed.language}), 内容长度: ${processed.content.length}`)
          return processed
        } catch (fileError) {
          console.error(`[GenerateCode] ❌ 处理文件 ${index + 1} 失败:`, fileError)
          console.error(`[GenerateCode] 文件数据:`, file)
          throw fileError
        }
      })
      console.log('[GenerateCode] ✅ 所有文件处理完成')

      const result = {
        files,
        structure: parsed.structure || files.map(f => f.path),
      }

      console.log('[GenerateCode] ====== 代码生成成功 ======')
      console.log('[GenerateCode] 返回文件数:', result.files.length)
      console.log('[GenerateCode] 结构:', result.structure)

      return result
    } catch (error) {
      console.error('[GenerateCode] ❌ JSON 解析失败')
      console.error('[GenerateCode] 错误:', error instanceof Error ? error.message : String(error))
      console.error('[GenerateCode] 原始内容长度:', content.length)
      console.error('[GenerateCode] 原始内容前500字符:', content.substring(0, 500))
      throw new Error(`Failed to parse code generation response: ${error instanceof Error ? error.message : String(error)}`)
    }
  } catch (fetchError) {
    clearTimeout(timeoutId)
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      console.error('[GenerateCode] ❌ 请求被中止（超时）')
      throw new Error('API request timeout after 60 seconds')
    }
    console.error('[GenerateCode] ❌ Fetch 错误:', fetchError)
    throw fetchError
  }
}

/**
 * 根据文件路径检测语言类型
 */
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    sql: 'sql',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
  }
  return languageMap[ext] || 'plaintext'
}
