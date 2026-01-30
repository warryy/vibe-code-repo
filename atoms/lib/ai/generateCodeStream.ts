import { DeepSeekMessage } from './deepseek'
import { CodeFile } from './generateCode'
import { ensureFileExtension } from './fileExtensions'

/**
 * 流式生成代码 - 逐个文件返回
 */
export async function* generateCodeStream(
  userRequest: string,
  existingCode?: CodeFile[]
): AsyncGenerator<{ type: 'file' | 'progress' | 'done'; data?: any }, void, unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim()
  const apiUrl = process.env.DEEPSEEK_API_URL?.trim() || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set')
  }

  const systemPrompt = `你是一个专业的代码生成助手。根据用户需求生成完整的代码项目。

重要要求：
1. 必须逐个文件返回，每个文件使用以下简单格式：
   FILE:文件路径
   LANGUAGE:语言类型
   CONTENT:
   文件内容（可以多行）
   ENDFILE

2. 文件路径使用 / 分隔，如 src/index.js、package.json 等
3. 如果是多文件项目，请包含必要的配置文件（如 package.json、README.md 等）
4. 代码要完整、可运行
5. 如果用户要求修改现有代码，请基于现有代码进行修改
6. 每生成完一个文件，立即输出该文件的完整格式，不要等待所有文件生成完
7. 严格按照格式输出，不要添加额外说明

示例输出格式：
FILE:package.json
LANGUAGE:json
CONTENT:
{
  "name": "my-project",
  "version": "1.0.0"
}
ENDFILE
FILE:src/index.js
LANGUAGE:javascript
CONTENT:
console.log("Hello");
ENDFILE`

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ]

  // 如果有现有代码，添加到上下文中
  if (existingCode && existingCode.length > 0) {
    messages.push({
      role: 'assistant',
      content: `现有代码结构：\n${JSON.stringify(existingCode.map(f => ({ path: f.path, language: f.language })), null, 2)}`,
    })
  }

  messages.push({
    role: 'user',
    content: userRequest,
  })

  console.log('[GenerateCodeStream] 开始流式生成代码')
  console.log('[GenerateCodeStream] API URL:', apiUrl)
  console.log('[GenerateCodeStream] Model:', model)

  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate code: ${response.status} ${errorText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Failed to get response reader')
  }

  let buffer = ''
  let currentFile: Partial<CodeFile> | null = null
  let accumulatedContent = ''
  let isInFileContent = false
  let fileCount = 0
  let currentState: 'waiting' | 'file' | 'language' | 'content' = 'waiting'

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      // 处理剩余内容
      if (currentFile && currentFile.path && accumulatedContent) {
        currentFile.content = accumulatedContent.trim()
        
        // 确保文件路径有扩展名
        if (currentFile.path && currentFile.language) {
          const originalPath = currentFile.path
          currentFile.path = ensureFileExtension(currentFile.path, currentFile.language)
          if (originalPath !== currentFile.path) {
            console.log(`[GenerateCodeStream] 📝 补充扩展名: ${originalPath} -> ${currentFile.path}`)
          }
        }
        
        fileCount++
        console.log(`[GenerateCodeStream] ✅ 文件 ${fileCount}: ${currentFile.path}`)
        yield { type: 'file', data: currentFile as CodeFile }
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          // 如果有未完成的文件，输出它
          if (currentFile && currentFile.path && accumulatedContent) {
            currentFile.content = accumulatedContent.trim()
            
            // 确保文件路径有扩展名
            if (currentFile.path && currentFile.language) {
              const originalPath = currentFile.path
              currentFile.path = ensureFileExtension(currentFile.path, currentFile.language)
              if (originalPath !== currentFile.path) {
                console.log(`[GenerateCodeStream] 📝 补充扩展名: ${originalPath} -> ${currentFile.path}`)
              }
            }
            
            fileCount++
            console.log(`[GenerateCodeStream] ✅ 文件 ${fileCount}: ${currentFile.path}`)
            yield { type: 'file', data: currentFile as CodeFile }
          }
          console.log(`[GenerateCodeStream] ✅ 完成，共生成 ${fileCount} 个文件`)
          yield { type: 'done' }
          return
        }

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            accumulatedContent += content

            // 检查文件开始标记
            if (accumulatedContent.includes('FILE:') && !currentFile) {
              const fileMatch = accumulatedContent.match(/FILE:([^\n\r]+)/)
              if (fileMatch) {
                // 开始新文件
                currentFile = {
                  path: fileMatch[1].trim(),
                  content: '',
                }
                currentState = 'file'
                console.log(`[GenerateCodeStream] 📝 开始生成文件: ${currentFile.path}`)
                yield { type: 'progress', data: { file: currentFile.path, status: 'generating' } }
                
                // 移除已处理的部分
                const fileStartIndex = accumulatedContent.indexOf('FILE:')
                const matchEnd = accumulatedContent.indexOf('\n', fileStartIndex)
                if (matchEnd >= 0) {
                  accumulatedContent = accumulatedContent.substring(matchEnd + 1)
                } else {
                  accumulatedContent = accumulatedContent.substring(fileStartIndex + fileMatch[0].length)
                }
              }
            }

            // 检查语言标记
            if (currentFile && currentFile.path && !currentFile.language && accumulatedContent.includes('LANGUAGE:')) {
              const langMatch = accumulatedContent.match(/LANGUAGE:([^\n\r]+)/)
              if (langMatch) {
                currentFile.language = langMatch[1].trim()
                
                // 确保文件路径有扩展名
                if (currentFile.path) {
                  const originalPath = currentFile.path
                  currentFile.path = ensureFileExtension(currentFile.path, currentFile.language)
                  if (originalPath !== currentFile.path) {
                    console.log(`[GenerateCodeStream] 📝 补充扩展名: ${originalPath} -> ${currentFile.path}`)
                  }
                }
                
                currentState = 'language'
                
                // 移除已处理的部分
                const langStartIndex = accumulatedContent.indexOf('LANGUAGE:')
                const matchEnd = accumulatedContent.indexOf('\n', langStartIndex)
                if (matchEnd >= 0) {
                  accumulatedContent = accumulatedContent.substring(matchEnd + 1)
                } else {
                  accumulatedContent = accumulatedContent.substring(langStartIndex + langMatch[0].length)
                }
                
                // 检查是否有 CONTENT: 标记
                if (accumulatedContent.includes('CONTENT:')) {
                  const contentStart = accumulatedContent.indexOf('CONTENT:')
                  accumulatedContent = accumulatedContent.substring(contentStart + 'CONTENT:'.length).replace(/^[\n\r]+/, '')
                  isInFileContent = true
                  currentState = 'content'
                }
              }
            }

            // 检查 CONTENT: 标记
            if (currentFile && currentFile.path && !isInFileContent && accumulatedContent.includes('CONTENT:')) {
              const contentStart = accumulatedContent.indexOf('CONTENT:')
              accumulatedContent = accumulatedContent.substring(contentStart + 'CONTENT:'.length).replace(/^[\n\r]+/, '')
              isInFileContent = true
              currentState = 'content'
            }

            // 检查文件结束标记
            if (isInFileContent && currentFile && accumulatedContent.includes('ENDFILE')) {
              const endIndex = accumulatedContent.indexOf('ENDFILE')
              if (endIndex >= 0) {
                currentFile.content = accumulatedContent.substring(0, endIndex).trim()
                
                // 确保文件路径有扩展名（再次检查，以防万一）
                if (currentFile.path && currentFile.language) {
                  currentFile.path = ensureFileExtension(currentFile.path, currentFile.language)
                }
                
                fileCount++
                console.log(`[GenerateCodeStream] ✅ 文件 ${fileCount}: ${currentFile.path} (${currentFile.content.length} 字符)`)
                yield { type: 'file', data: currentFile as CodeFile }
                
                // 移除已处理的部分，准备下一个文件
                accumulatedContent = accumulatedContent.substring(endIndex + 'ENDFILE'.length).replace(/^\n+/, '')
                currentFile = null
                isInFileContent = false
                currentState = 'waiting'
              }
            }

            // 限制缓冲区大小（避免内存问题）
            if (accumulatedContent.length > 100000) {
              // 如果文件内容太长，可能需要分段处理
              console.warn('[GenerateCodeStream] ⚠️ 缓冲区过大，可能需要优化')
            }
          }
        } catch (e) {
          // 忽略解析错误
          console.error('[GenerateCodeStream] 解析错误:', e)
        }
      }
    }
  }

  console.log(`[GenerateCodeStream] ✅ 流结束，共生成 ${fileCount} 个文件`)
  yield { type: 'done' }
}
