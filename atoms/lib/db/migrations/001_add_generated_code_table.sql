-- 迁移脚本：添加 generated_code 表
-- 执行时间：2025-01-30

-- 生成的代码表
CREATE TABLE IF NOT EXISTS generated_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  language VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, file_path)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_generated_code_conversation_id ON generated_code(conversation_id);
