import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = registerSchema.parse(body)

    // 检查用户是否已存在
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '用户已存在' },
        { status: 400 }
      )
    }

    // 加密密码
    const password_hash = await bcrypt.hash(password, 10)

    // 创建用户
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${password_hash}, ${name || null})
      RETURNING id, email, name
    `

    return NextResponse.json({
      success: true,
      user: result[0],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入验证失败', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败' },
      { status: 500 }
    )
  }
}
