import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'

// 更新单个文件内容
export async function PUT(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversationId = params.conversationId
    const { filePath, content } = await req.json()

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'filePath and content are required' },
        { status: 400 }
      )
    }

    // 验证对话属于当前用户
    const conversation = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 更新文件内容
    await sql`
      UPDATE generated_code
      SET content = ${content}, updated_at = NOW()
      WHERE conversation_id = ${conversationId} AND file_path = ${filePath}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update file error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
