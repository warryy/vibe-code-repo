import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { streamDeepSeekChat } from '@/lib/ai/deepseek'
import { sql } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { conversationId, messages } = await req.json()

    if (!conversationId || !Array.isArray(messages)) {
      return new Response('Invalid request', { status: 400 })
    }

    // 转换消息格式
    const deepseekMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullContent = ''

        try {
          for await (const chunk of streamDeepSeekChat(deepseekMessages)) {
            fullContent += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          }

          // 保存消息到数据库
          await sql`
            INSERT INTO messages (conversation_id, role, content)
            VALUES (${conversationId}, 'assistant', ${fullContent})
          `

          // 更新对话时间
          await sql`
            UPDATE conversations
            SET updated_at = NOW()
            WHERE id = ${conversationId}
          `

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const encoder = new TextEncoder()
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
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
    console.error('Chat stream error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
