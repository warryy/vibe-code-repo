# 快速修复：创建 generated_code 表

## 问题
错误：`relation "generated_code" does not exist`

## 快速解决方案

### 方法 1：使用 Neon Dashboard（最简单）

1. 打开 [Neon Dashboard](https://console.neon.tech/)
2. 选择你的项目
3. 点击 "SQL Editor"
4. 复制并执行以下 SQL：

```sql
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

CREATE INDEX IF NOT EXISTS idx_generated_code_conversation_id ON generated_code(conversation_id);
```

5. 点击 "Run" 执行
6. 刷新应用页面

### 方法 2：使用命令行迁移脚本

```bash
pnpm db:migrate
```

### 方法 3：使用 psql（如果已安装）

```bash
psql $DATABASE_URL -f lib/db/migrations/001_add_generated_code_table.sql
```

## 验证

执行完成后，重新访问 vibecoding 页面，错误应该消失。
