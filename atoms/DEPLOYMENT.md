# 部署指南

## 环境变量配置

在生产环境（如 Vercel）中，需要设置以下环境变量：

### 必需的环境变量

1. **数据库连接**
   ```
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

2. **NextAuth 认证密钥**（必需）
   ```
   AUTH_SECRET=your-secret-key-here
   ```
   或者使用（向后兼容）：
   ```
   NEXTAUTH_SECRET=your-secret-key-here
   ```
   
   **重要**：`AUTH_SECRET` 或 `NEXTAUTH_SECRET` 必须设置，否则会出现 `MissingSecret` 错误。
   
   生成密钥的方法：
   ```bash
   openssl rand -base64 32
   ```
   或者在 Node.js 中：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **NextAuth URL**（可选，Vercel 会自动设置）
   ```
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

4. **DeepSeek API**
   ```
   DEEPSEEK_API_KEY=your-deepseek-api-key
   DEEPSEEK_API_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-chat
   ```

## Vercel 部署步骤

1. **连接 Git 仓库**
   - 在 Vercel 中导入你的 GitLab/GitHub 仓库

2. **设置环境变量**
   - 进入项目设置 → Environment Variables
   - 添加所有必需的环境变量
   - 确保为 Production、Preview、Development 环境都设置了变量

3. **部署**
   - Vercel 会自动检测 Next.js 项目并部署
   - 首次部署后，确保所有环境变量都已正确设置

## 常见问题

### MissingSecret 错误

如果看到 `MissingSecret: Please define a secret` 错误：

1. 检查 Vercel 环境变量中是否设置了 `AUTH_SECRET` 或 `NEXTAUTH_SECRET`
2. 确保环境变量名称正确（区分大小写）
3. 重新部署项目以应用新的环境变量

### 生成安全的 Secret

使用以下命令生成一个安全的随机密钥：

```bash
# 使用 OpenSSL
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

将生成的密钥复制到 Vercel 的环境变量中。

## 数据库迁移

部署后，需要运行数据库迁移：

```bash
pnpm db:migrate
```

或者在 Vercel 的部署后脚本中执行。
