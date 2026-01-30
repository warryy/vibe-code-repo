# 故障排除指南

## DeepSeek API 认证错误 (401)

如果遇到 "Authentication Fails, Your api key is invalid" 错误，请按以下步骤排查：

### 1. 检查 API Key 是否有效

1. 访问 [DeepSeek API Keys 页面](https://platform.deepseek.com/api_keys)
2. 确认你的 API key 是否仍然有效
3. 如果 key 已过期或被撤销，请创建新的 API key

### 2. 检查环境变量配置

确保 `.env.local` 文件中的 `DEEPSEEK_API_KEY` 正确设置：

```env
DEEPSEEK_API_KEY=your-actual-api-key-here
```

**注意：**
- 确保 API key 没有多余的空格
- 确保 API key 没有换行符
- 确保使用正确的 API key（不是其他服务的 key）

### 3. 重启开发服务器

修改 `.env.local` 后，需要重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev
```

### 4. 验证 API Key 格式

DeepSeek API key 通常是 32 位字符的字符串，格式类似：
```
a60e1ba35bf44f40ba1f1b7a864a3768
```

### 5. 测试 API Key

你可以使用 curl 测试 API key 是否有效：

```bash
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

如果返回 401 错误，说明 API key 无效。

### 6. 常见问题

**问题：API key 看起来正确，但仍然报错**
- 检查是否有隐藏字符（复制时可能包含空格）
- 尝试重新生成 API key
- 确认账户是否有足够的余额或配额

**问题：本地可以，但部署后报错**
- 检查 Vercel 环境变量是否正确设置
- 确保环境变量名称完全一致（大小写敏感）
- 重新部署应用

## 数据库连接错误

如果遇到数据库连接错误：

1. 检查 `DATABASE_URL` 是否正确设置
2. 确认 Neon 数据库是否正常运行
3. 检查数据库 Schema 是否已创建（执行 `lib/db/schema.sql`）

## 其他问题

如果遇到其他问题，请检查：
1. Node.js 版本是否符合要求（推荐 18+）
2. 所有依赖是否正确安装：`pnpm install`
3. 查看控制台错误信息获取更多详情
