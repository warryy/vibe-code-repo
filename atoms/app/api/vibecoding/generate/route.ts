import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { sql } from '@/lib/db/client'
import { generateCode, CodeFile } from '@/lib/ai/generateCode'
import { ensureFileExtension } from '@/lib/ai/fileExtensions'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  console.log('[VibeCoding Generate] ====== 请求开始 ======')
  console.log('[VibeCoding Generate] 时间:', new Date().toISOString())

  try {
    // 1. 认证检查
    console.log('[VibeCoding Generate] 步骤 1: 检查认证')
    const session = await auth()
    console.log('[VibeCoding Generate] Session:', session ? `用户ID: ${session.user?.id}` : '未认证')

    if (!session?.user?.id) {
      console.log('[VibeCoding Generate] ❌ 认证失败')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 解析请求体
    console.log('[VibeCoding Generate] 步骤 2: 解析请求体')
    const body = await req.json()
    const { conversationId, userRequest } = body
    console.log('[VibeCoding Generate] ConversationId:', conversationId)
    console.log('[VibeCoding Generate] UserRequest:', userRequest?.substring(0, 100) + (userRequest?.length > 100 ? '...' : ''))

    if (!conversationId || !userRequest) {
      console.log('[VibeCoding Generate] ❌ 参数缺失')
      return NextResponse.json(
        { error: 'conversationId and userRequest are required' },
        { status: 400 }
      )
    }

    // 3. 验证对话
    console.log('[VibeCoding Generate] 步骤 3: 验证对话归属')
    const conversation = await sql`
      SELECT id FROM conversations
      WHERE id = ${conversationId} AND user_id = ${session.user.id}
    `
    console.log('[VibeCoding Generate] 对话查询结果:', conversation.length > 0 ? '找到' : '未找到')

    if (conversation.length === 0) {
      console.log('[VibeCoding Generate] ❌ 对话不存在或无权限')
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 4. 获取现有代码
    console.log('[VibeCoding Generate] 步骤 4: 获取现有代码')
    let existingCodeRows: any[] = []
    try {
      existingCodeRows = await sql`
        SELECT file_path, content, language
        FROM generated_code
        WHERE conversation_id = ${conversationId}
        ORDER BY file_path
      `
      console.log('[VibeCoding Generate] 现有代码文件数:', existingCodeRows.length)
    } catch (dbError) {
      console.error('[VibeCoding Generate] ⚠️ 获取现有代码失败（可能表不存在）:', dbError)
      existingCodeRows = []
    }

    const existingCode: CodeFile[] = existingCodeRows.map((row: any) => ({
      path: row.file_path,
      content: row.content,
      language: row.language,
    }))

    // 5. 生成代码
    console.log('[VibeCoding Generate] 步骤 5: 调用 AI 生成代码')
    console.log('[VibeCoding Generate] 现有代码数量:', existingCode.length)
    const codeGenStartTime = Date.now()
    
    const generatedCode = await generateCode(
      userRequest,
      existingCode.length > 0 ? existingCode : undefined
    )
    
    const codeGenDuration = Date.now() - codeGenStartTime
    console.log('[VibeCoding Generate] ✅ 代码生成完成，耗时:', codeGenDuration, 'ms')
    console.log('[VibeCoding Generate] 生成文件数:', generatedCode.files.length)
    console.log('[VibeCoding Generate] 文件列表:', generatedCode.files.map(f => f.path).join(', '))

    // 6. 保存代码到数据库
    console.log('[VibeCoding Generate] 步骤 6: 保存代码到数据库')
    const saveStartTime = Date.now()
    
    for (let i = 0; i < generatedCode.files.length; i++) {
      let file = generatedCode.files[i]
      
      // 确保文件路径有扩展名（再次检查，确保保存到数据库时一定有扩展名）
      if (file.path && file.language) {
        const originalPath = file.path
        file.path = ensureFileExtension(file.path, file.language)
        if (originalPath !== file.path) {
          console.log(`[VibeCoding Generate] 📝 补充扩展名: ${originalPath} -> ${file.path}`)
        }
      }
      
      console.log(`[VibeCoding Generate] 保存文件 ${i + 1}/${generatedCode.files.length}: ${file.path}`)
      
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
        console.log(`[VibeCoding Generate] ✅ 文件 ${file.path} 保存成功`)
      } catch (saveError) {
        console.error(`[VibeCoding Generate] ❌ 文件 ${file.path} 保存失败:`, saveError)
        throw saveError
      }
    }
    
    const saveDuration = Date.now() - saveStartTime
    console.log('[VibeCoding Generate] ✅ 所有文件保存完成，耗时:', saveDuration, 'ms')

    const totalDuration = Date.now() - startTime
    console.log('[VibeCoding Generate] ====== 请求成功完成 ======')
    console.log('[VibeCoding Generate] 总耗时:', totalDuration, 'ms')

    return NextResponse.json({
      success: true,
      files: generatedCode.files,
      structure: generatedCode.structure,
    })
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('[VibeCoding Generate] ====== 请求失败 ======')
    console.error('[VibeCoding Generate] 错误类型:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[VibeCoding Generate] 错误信息:', error instanceof Error ? error.message : String(error))
    console.error('[VibeCoding Generate] 错误堆栈:', error instanceof Error ? error.stack : 'N/A')
    console.error('[VibeCoding Generate] 总耗时:', totalDuration, 'ms')
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate code',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
