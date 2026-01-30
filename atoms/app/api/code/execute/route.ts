import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

// 简单的代码执行 API
// 注意：这是一个 MVP 版本，使用简单的 eval/Function 执行
// 生产环境应该使用沙箱环境（如 Docker、VM 等）
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code, language } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // MVP 版本：只支持 JavaScript
    // 生产环境应该使用安全的代码执行服务
    if (language !== 'javascript') {
      return NextResponse.json(
        { error: `语言 ${language} 暂不支持执行` },
        { status: 400 }
      )
    }

    // 捕获输出
    let output = ''
    const originalLog = console.log
    const originalError = console.error

    console.log = (...args: any[]) => {
      output += args.map((arg) => String(arg)).join(' ') + '\n'
    }

    console.error = (...args: any[]) => {
      output += 'Error: ' + args.map((arg) => String(arg)).join(' ') + '\n'
    }

    try {
      // 使用 Function 构造函数创建安全的执行环境
      // 注意：这仍然不是完全安全的，MVP 版本仅用于演示
      const func = new Function(code)
      func()
    } catch (error) {
      output += `执行错误: ${error instanceof Error ? error.message : String(error)}\n`
    } finally {
      console.log = originalLog
      console.error = originalError
    }

    return NextResponse.json({
      output: output || '执行完成，无输出',
    })
  } catch (error) {
    console.error('Code execution error:', error)
    return NextResponse.json(
      { error: '执行失败' },
      { status: 500 }
    )
  }
}
