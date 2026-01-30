import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'
import { generateCodeStream } from '@/lib/ai/generateCodeStream'
import { CodeFile } from '@/lib/ai/generateCode'
import { ensureFileExtension } from '@/lib/ai/fileExtensions'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  console.log('[VibeCoding GenerateStream] ====== 流式生成开始 ======')

  const session = await auth()

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { conversationId, userRequest } = await req.json()

    if (!conversationId || !userRequest) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userRequest are required' }),
        { status: 400 }
      )
    }

    console.log('[VibeCoding GenerateStream] ConversationId:', conversationId)
    console.log('[VibeCoding GenerateStream] UserRequest:', userRequest.substring(0, 100))

    // 验证对话属于当前用户
    const conversation = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404 }
      )
    }

    // 获取现有代码
    let existingCode: CodeFile[] = []
    try {
      const existingCodeRows = await sql`
        SELECT file_path, content, language
        FROM generated_code
        WHERE conversation_id = ${conversationId}
        ORDER BY file_path
      `
      existingCode = existingCodeRows.map((row: any) => ({
        path: row.file_path,
        content: row.content,
        language: row.language,
      }))
      console.log('[VibeCoding GenerateStream] 现有代码文件数:', existingCode.length)
    } catch (dbError) {
      console.error('[VibeCoding GenerateStream] ⚠️ 获取现有代码失败:', dbError)
    }

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const files: CodeFile[] = []

        try {
          console.log('[VibeCoding GenerateStream] 开始流式生成...')
          for await (const chunk of generateCodeStream(
            userRequest,
            existingCode.length > 0 ? existingCode : undefined
          )) {
            if (chunk.type === 'file' && chunk.data) {
              let file = chunk.data
              
              // 确保文件路径有扩展名
              if (file.path && file.language) {
                const originalPath = file.path
                file.path = ensureFileExtension(file.path, file.language)
                if (originalPath !== file.path) {
                  console.log(`[VibeCoding GenerateStream] 📝 补充扩展名: ${originalPath} -> ${file.path}`)
                }
              }
              
              files.push(file)

              // 立即保存到数据库
              try {
                await sql`
                  INSERT INTO generated_code (conversation_id, file_path, content, language)
                  VALUES (${conversationId}, ${file.path}, ${file.content}, ${file.language || null})
                  ON CONFLICT (conversation_id, file_path)
                  DO UPDATE SET
                    content = EXCLUDED.content,
                    language = EXCLUDED.language,
                    updated_at = NOW()
                `
                console.log(`[VibeCoding GenerateStream] ✅ 文件已保存: ${file.path}`)
              } catch (saveError) {
                console.error(`[VibeCoding GenerateStream] ❌ 保存文件失败 ${file.path}:`, saveError)
              }

              // 发送文件到前端
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'file', file })}\n\n`)
              )
            } else if (chunk.type === 'progress') {
              // 发送进度更新
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: chunk.data })}\n\n`)
              )
            } else if (chunk.type === 'done') {
              console.log(`[VibeCoding GenerateStream] ✅ 完成，共生成 ${files.length} 个文件`)
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'done', fileCount: files.length })}\n\n`)
              )
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()

              const totalDuration = Date.now() - startTime
              console.log('[VibeCoding GenerateStream] ====== 流式生成完成 ======')
              console.log('[VibeCoding GenerateStream] 总耗时:', totalDuration, 'ms')
              return
            }
          }
        } catch (error) {
          console.error('[VibeCoding GenerateStream] ❌ 流式生成错误:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
          )
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[VibeCoding GenerateStream] ❌ 请求处理错误:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate code' }),
      { status: 500 }
    )
  }
}
