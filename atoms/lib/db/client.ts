import { neon } from '@neondatabase/serverless'

// 使用假 URL 用于构建时，运行时会被实际 URL 替换
export const sql = neon(process.env.DATABASE_URL || 'postgresql://user:pass@localhost/db')
