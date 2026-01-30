# 数据库设置指南

## 问题

如果遇到错误：`relation "generated_code" does not exist`

这说明数据库表还没有创建，需要执行迁移脚本。

## 解决方案

### 方法 1：使用迁移脚本（推荐）

1. 安装依赖（如果还没有安装 tsx）：
```bash
pnpm install
```

2. 执行迁移：
```bash
pnpm db:migrate
```

### 方法 2：手动执行 SQL

1. 连接到你的 Neon 数据库（可以使用 Neon Dashboard 的 SQL Editor）

2. 执行以下 SQL：

```sql
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
```

### 方法 3：执行完整的 Schema

如果你还没有创建其他表，可以直接执行 `lib/db/schema.sql` 文件中的所有 SQL 语句。

## 验证

执行完成后，可以运行应用并测试 vibecoding 功能。如果表创建成功，错误应该消失。

## 注意事项

- 确保 `DATABASE_URL` 环境变量已正确设置
- 确保数据库连接正常
- 如果表已存在，迁移脚本不会报错（使用了 `IF NOT EXISTS`）
