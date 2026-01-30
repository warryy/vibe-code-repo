import { DeepSeekMessage } from './deepseek'

/**
 * 根据对话内容生成简短标题（不超过15个字）
 */
export async function generateConversationTitle(
  userMessage: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  const apiUrl = process.env.DEEPSEEK_API_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set')
  }

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: '你是一个专业的对话标题生成助手。请根据用户的第一条消息，生成一个简洁的对话标题，不超过15个字。只返回标题本身，不要包含任何其他内容、标点符号、引号或解释文字。',
    },
    {
      role: 'user',
      content: `请为以下对话生成一个简洁的标题（不超过15个字）：\n\n${userMessage}`,
    },
  ]

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 50,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate title: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  let title = data.choices?.[0]?.message?.content?.trim() || '新对话'

  // 移除可能的引号或其他标点符号
  title = title.replace(/^["'「」『』《》]|["'「」『』《》]$/g, '').trim()

  // 如果标题为空或太短，使用用户消息的前15个字
  if (!title || title.length < 2) {
    title = userMessage.substring(0, 15).trim() || '新对话'
  }

  // 确保标题不超过15个字
  const maxLength = 15
  if (title.length > maxLength) {
    // 尝试在合适的位置截断（避免截断词语）
    const truncated = title.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > 10) {
      return truncated.substring(0, lastSpace)
    }
    return truncated
  }

  return title
}
