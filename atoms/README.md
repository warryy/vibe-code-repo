# Vibe Coding PC

一个基于 Next.js 的 AI 编程助手平台，支持流式对话和代码执行功能。

## 功能特性

- ✅ 简单邮箱登录/注册（无需验证）
- ✅ AI 流式对话（DeepSeek API）
- ✅ 对话历史记录
- ✅ Monaco Editor 代码编辑器
- ✅ JavaScript 代码执行功能

## 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Neon (PostgreSQL)
- **认证**: NextAuth.js v5
- **AI**: DeepSeek API (deepseek-chat 模型)
- **代码编辑器**: Monaco Editor
- **包管理器**: pnpm

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写以下变量：

```env
# 数据库（Neon PostgreSQL）
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 3. 初始化数据库

连接到你的 Neon 数据库，执行 `lib/db/schema.sql` 中的 SQL 语句创建表结构。

### 4. 运行开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
atoms/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证页面
│   ├── (dashboard)/       # 主应用页面
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── chat/             # 对话组件
│   ├── code-editor/      # 代码编辑器组件
│   ├── sidebar/          # 侧边栏组件
│   └── ui/               # UI 组件
├── lib/                   # 工具函数
│   ├── db/               # 数据库配置
│   ├── auth/             # 认证配置
│   └── ai/               # AI API 封装
└── types/                 # TypeScript 类型定义
```

## 部署到 Vercel

1. 将代码推送到 GitLab 仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（参考 `.env.example`）
4. 部署

## 注意事项

### 代码执行功能

当前 MVP 版本的代码执行功能使用简单的 `Function` 构造函数执行 JavaScript 代码。**这不适合生产环境使用**，因为存在安全风险。

生产环境建议：
- 使用 Docker 容器隔离执行环境
- 使用沙箱服务（如 Judge0、CodeSandbox API）
- 限制执行时间和资源使用
- 添加代码安全检查

### 数据库

确保 Neon 数据库连接字符串正确，并且已执行 Schema 创建语句。

## 开发计划

- [ ] 改进代码执行安全性（沙箱环境）
- [ ] 支持更多编程语言
- [ ] 代码编辑器多文件管理优化
- [ ] 对话导出功能
- [ ] 性能优化

## 许可证

MIT
