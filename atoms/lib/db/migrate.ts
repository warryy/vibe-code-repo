/**
 * 数据库迁移工具
 * 
 * 使用方法：
 * 1. 确保 DATABASE_URL 环境变量已设置
 * 2. 运行: pnpm db:migrate
 */

import { sql } from './client'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  try {
    console.log('开始执行数据库迁移...')
    console.log('检查 DATABASE_URL...')

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL 环境变量未设置')
    }

    // 读取迁移文件
    const migrationPath = join(process.cwd(), 'lib/db/migrations/001_add_generated_code_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('执行迁移 SQL...')

    // 分割 SQL 语句并执行
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        await sql(statement)
      }
    }

    console.log('✅ 数据库迁移成功！')
    console.log('✅ generated_code 表已创建')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
    }
    process.exit(1)
  }
}

runMigration()
