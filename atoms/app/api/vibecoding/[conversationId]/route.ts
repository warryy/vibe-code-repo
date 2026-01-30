import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'

// 获取对话的生成代码
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversationId = params.conversationId

    // 验证对话属于当前用户
    const conversation = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 获取生成的代码
    const codeFiles = await sql`
      SELECT file_path, content, language, updated_at
      FROM generated_code
      WHERE conversation_id = ${conversationId}
      ORDER BY file_path
    `

    return NextResponse.json({
      files: codeFiles.map((file: any) => ({
        path: file.file_path,
        content: file.content,
        language: file.language,
        updatedAt: file.updated_at,
      })),
    })
  } catch (error) {
    console.error('Get generated code error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
