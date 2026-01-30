import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'
import { generateConversationTitle } from '@/lib/ai/generateTitle'

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

    // 验证对话属于当前用户，并检查是否已有标题
    const conversation = await sql`
      SELECT id, title FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 检查这是否是第一条消息（对话还没有标题）
    const isFirstMessage = !conversation[0].title

    // 保存用户消息
    const result = await sql`
      INSERT INTO messages (conversation_id, role, content)
      VALUES (${conversationId}, 'user', ${content})
      RETURNING id, role, content, created_at
    `

    // 如果是第一条消息，生成标题
    if (isFirstMessage) {
      try {
        const title = await generateConversationTitle(content)
        // 更新对话标题和时间
        await sql`
          UPDATE conversations
          SET title = ${title}, updated_at = NOW()
          WHERE id = ${conversationId}
        `
      } catch (error) {
        // 如果生成标题失败，使用默认标题
        console.error('Failed to generate title:', error)
        const defaultTitle = content.substring(0, 15) || '新对话'
        await sql`
          UPDATE conversations
          SET title = ${defaultTitle}, updated_at = NOW()
          WHERE id = ${conversationId}
        `
      }
    } else {
      // 更新对话时间
      await sql`
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = ${conversationId}
      `
    }

    return NextResponse.json({ message: result[0] })
  } catch (error) {
    console.error('Save message error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// 删除对话
export async function DELETE(
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
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // 删除对话（级联删除消息）
    await sql`
      DELETE FROM conversations
      WHERE id = ${conversationId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
