import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'

// 获取对话详情（包含消息）
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversationId = params.id

    // 验证对话属于当前用户
    const conversation = await sql`
      SELECT id, title, created_at, updated_at
      FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 获取消息
    const messages = await sql`
      SELECT id, role, content, created_at
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `

    return NextResponse.json({
      conversation: conversation[0],
      messages,
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// 保存用户消息
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversationId = params.id
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // 验证对话属于当前用户
    const conversation = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 保存用户消息
    const result = await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}, 'user', ${content})
      RETURNING id, role, content, created_at
    `

    // 更新对话时间
    await sql`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}
    `

    return NextResponse.json({ message: result[0] })
  } catch (error) {
    console.error('Save message error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
