# Vibe Coding PC - Skill 文档

> 本文档记录项目的架构设计、功能能力和更新日志。每次架构变动或功能新增/修改时，请及时更新此文档。

**最后更新**: 2025-01-30  
**版本**: 1.0.0

---

## 📋 项目概述

Vibe Coding PC 是一个基于 Next.js 的 AI 编程助手平台，支持流式对话和代码生成功能。

### 核心能力

- ✅ AI 流式对话（DeepSeek API）
- ✅ 对话历史记录和管理
- ✅ 简单邮箱登录/注册（无需验证）
- ✅ VibeCoding 代码生成
- ✅ Monaco Editor 代码编辑器
- ✅ JavaScript 代码执行
- ✅ 自动对话标题生成

---

## 🏗️ 技术架构

### 技术栈

- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **包管理器**: pnpm
- **数据库**: Neon (PostgreSQL)
- **认证**: NextAuth.js v5
- **AI**: DeepSeek API (deepseek-chat 模型)
- **代码编辑器**: Monaco Editor
- **状态管理**: React Hooks + Zustand（计划中）

### 项目结构

```
atoms/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 认证页面组
│   │   ├── login/               # 登录页面
│   │   └── register/            # 注册页面
│   ├── (dashboard)/             # 主应用页面组
│   │   ├── chat/                # 流式对话页面
│   │   │   └── [id]/            # 具体对话页面
│   │   ├── vibecoding/          # VibeCoding 页面
│   │   │   └── [id]/            # 具体 VibeCoding 项目页面
│   │   ├── code/                # 独立代码编辑器页面
│   │   └── layout.tsx           # Dashboard 布局（包含 Sidebar）
│   └── api/                     # API 路由
│       ├── auth/                # 认证相关 API
│       │   ├── [...nextauth]/  # NextAuth 路由
│       │   └── register/       # 注册 API
│       ├── conversations/       # 对话管理 API
│       │   └── [id]/           # 对话详情 API
│       ├── chat/                # 对话相关 API
│       │   └── stream/         # 流式对话 API
│       ├── vibecoding/          # VibeCoding API
│       │   ├── generate/       # 代码生成 API
│       │   └── [conversationId]/ # 获取/更新代码 API
│       └── code/                # 代码执行 API
│           └── execute/         # 代码执行端点
├── components/                   # React 组件
│   ├── sidebar/                 # 侧边栏组件
│   │   ├── Sidebar.tsx          # 主侧边栏（导航 + 对话历史）
│   │   └── ChatHistory.tsx     # 对话历史列表
│   ├── chat/                    # 对话相关组件
│   │   ├── ChatWindow.tsx       # 对话窗口
│   │   ├── MessageList.tsx     # 消息列表
│   │   ├── MessageItem.tsx     # 消息项（支持 Markdown）
│   │   └── ChatInput.tsx       # 输入框（支持模式切换）
│   ├── vibecoding/              # VibeCoding 组件
│   │   ├── VibeCodingView.tsx  # 主视图组件
│   │   ├── VibeCodingFileTree.tsx # 文件树组件
│   │   └── VibeCodingEditor.tsx # 代码编辑器组件
│   ├── code-editor/             # 代码编辑器组件
│   │   ├── CodeEditor.tsx       # 代码编辑器
│   │   ├── FileTree.tsx         # 文件树
│   │   └── EditorToolbar.tsx   # 工具栏
│   ├── ui/                      # 通用 UI 组件
│   │   ├── Button.tsx           # 按钮组件
│   │   └── Input.tsx            # 输入框组件
│   └── providers/                # Context Providers
│       └── SessionProvider.tsx  # NextAuth Session Provider
├── lib/                          # 工具函数和配置
│   ├── db/                      # 数据库相关
│   │   ├── client.ts            # Neon 数据库客户端
│   │   ├── schema.sql           # 数据库 Schema
│   │   └── migrations/          # 数据库迁移脚本
│   ├── auth/                     # 认证相关
│   │   ├── config.ts            # NextAuth 配置
│   │   └── auth.ts              # Auth 辅助函数
│   └── ai/                       # AI 相关
│       ├── deepseek.ts          # DeepSeek API 客户端（流式）
│       ├── generateCode.ts      # 代码生成函数
│       └── generateTitle.ts     # 标题生成函数
└── types/                        # TypeScript 类型定义
    ├── database.ts              # 数据库类型
    ├── chat.ts                  # 对话相关类型
    └── next-auth.d.ts           # NextAuth 类型扩展
```

---

## 🗄️ 数据库架构

### 表结构

#### 1. users（用户表）
```sql
- id: UUID (主键)
- email: VARCHAR(255) (唯一)
- name: VARCHAR(255)
- password_hash: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. conversations（对话表）
```sql
- id: UUID (主键)
- user_id: UUID (外键 -> users.id)
- title: VARCHAR(255) (自动生成)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. messages（消息表）
```sql
- id: UUID (主键)
- conversation_id: UUID (外键 -> conversations.id)
- role: VARCHAR(20) ('user' | 'assistant')
- content: TEXT
- created_at: TIMESTAMP
```

#### 4. generated_code（生成的代码表）✨ 新增
```sql
- id: UUID (主键)
- conversation_id: UUID (外键 -> conversations.id)
- file_path: VARCHAR(500) (文件路径)
- content: TEXT (文件内容)
- language: VARCHAR(50) (语言类型)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(conversation_id, file_path)
```

### 索引

- `idx_conversations_user_id` - 用户对话查询优化
- `idx_messages_conversation_id` - 消息查询优化
- `idx_conversations_updated_at` - 对话排序优化
- `idx_generated_code_conversation_id` - 代码查询优化

---

## 🔌 API 端点

### 认证相关

- `POST /api/auth/register` - 用户注册
- `GET/POST /api/auth/[...nextauth]` - NextAuth 路由

### 对话管理

- `GET /api/conversations` - 获取用户所有对话
- `POST /api/conversations` - 创建新对话
- `GET /api/conversations/[id]` - 获取对话详情（含消息）
- `POST /api/conversations/[id]` - 保存用户消息（自动生成标题）
- `DELETE /api/conversations/[id]` - 删除对话

### AI 对话

- `POST /api/chat/stream` - 流式对话（Server-Sent Events）

### VibeCoding

- `POST /api/vibecoding/generate` - 生成代码
- `GET /api/vibecoding/[conversationId]` - 获取对话的生成代码
- `PUT /api/vibecoding/[conversationId]/file` - 更新单个文件内容

### 代码执行

- `POST /api/code/execute` - 执行 JavaScript 代码（MVP 版本）

---

## 🎨 页面路由

### 公开页面

- `/login` - 登录页面
- `/register` - 注册页面

### 受保护页面（需要登录）

- `/chat` - 首页（对话模式选择）
- `/chat/[id]` - 流式对话页面
- `/vibecoding/[id]` - VibeCoding 项目页面 ✨ 新增
- `/code` - 独立代码编辑器页面

---

## 🚀 核心功能详解

### 1. 流式对话功能

**实现方式**: Server-Sent Events (SSE)

**流程**:
1. 用户发送消息 → 保存到数据库
2. 调用 DeepSeek API（流式）
3. 实时返回 AI 响应片段
4. 前端实时更新 UI
5. 完成后保存完整响应到数据库

**相关文件**:
- `app/api/chat/stream/route.ts`
- `lib/ai/deepseek.ts`
- `components/chat/ChatWindow.tsx`

### 2. VibeCoding 代码生成功能 ✨ 新增

**实现方式**: DeepSeek API + 数据库存储

**流程**:
1. 用户在首页选择 "VibeCoding" 模式并发送需求
2. 跳转到 `/vibecoding/[id]` 页面
3. 自动检测是否有代码，如果没有则调用生成 API
4. AI 生成代码（JSON 格式：文件列表 + 内容）
5. 保存到 `generated_code` 表
6. 展示文件树和代码编辑器
7. 支持继续对话生成更多代码
8. 支持编辑代码并自动保存

**相关文件**:
- `app/api/vibecoding/generate/route.ts`
- `lib/ai/generateCode.ts`
- `components/vibecoding/VibeCodingView.tsx`

### 3. 自动标题生成

**实现方式**: DeepSeek API

**触发时机**: 保存第一条用户消息时

**流程**:
1. 检测对话是否已有标题
2. 如果没有，调用标题生成 API
3. 生成不超过 15 个字的标题
4. 更新对话表

**相关文件**:
- `lib/ai/generateTitle.ts`
- `app/api/conversations/[id]/route.ts`

### 4. 对话历史管理

**功能**:
- 显示所有对话列表
- 支持删除对话
- 支持切换对话
- 自动刷新列表

**相关文件**:
- `components/sidebar/ChatHistory.tsx`

---

## 🔐 认证机制

### NextAuth.js v5 配置

- **策略**: JWT
- **Provider**: Credentials（邮箱密码）
- **Session**: 存储在 JWT Token 中

### 密码处理

- 使用 `bcryptjs` 加密存储
- 注册时自动加密密码
- 登录时验证密码

---

## 🎯 页面布局

### Dashboard Layout

```
┌─────────────────────────────────────┐
│  DashboardLayout                    │
│  ┌──────────┬─────────────────────┐ │
│  │ Sidebar  │  Main Content       │ │
│  │          │                     │ │
│  │ - Logo   │  [页面内容]        │ │
│  │ - 导航   │                     │ │
│  │ - 对话   │                     │ │
│  │   历史   │                     │ │
│  │ - 退出   │                     │ │
│  └──────────┴─────────────────────┘ │
└─────────────────────────────────────┘
```

### VibeCoding 页面布局 ✨ 新增

```
┌─────────────────────────────────────────┐
│  Sidebar (DashboardLayout)              │
│  ┌──────────┬─────────────────────────┐ │
│  │          │  顶部：当前对话 + 输入框 │ │
│  │          ├───────────┬─────────────┤ │
│  │          │ 文件树     │ 代码编辑器  │ │
│  │          │           │             │ │
│  │          │ - src/    │ [Monaco]   │ │
│  └──────────┴───────────┴─────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📝 环境变量

```env
# 数据库
DATABASE_URL=postgresql://...

# NextAuth
AUTH_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# DeepSeek API
DEEPSEEK_API_KEY=...
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

---

## 🔄 更新日志

### 2025-01-30 - v1.0.0

#### ✨ 新增功能

1. **VibeCoding 代码生成功能**
   - AI 代码生成（基于 DeepSeek API）
   - 多文件项目支持
   - 文件树展示
   - 代码编辑器集成（Monaco Editor）
   - 代码自动保存到数据库
   - 支持继续对话生成更多代码

2. **数据库表扩展**
   - 新增 `generated_code` 表
   - 支持存储多文件项目代码

3. **页面布局优化**
   - VibeCoding 页面使用 DashboardLayout 的 Sidebar
   - 移除重复的左侧区域

#### 🐛 修复

- 修复对话历史删除功能
- 修复自动标题生成功能

#### 📚 文档

- 创建 SKILL.md 文档
- 创建 DATABASE_SETUP.md
- 创建 QUICK_FIX.md

---

## 🛠️ 开发指南

### 添加新功能时的检查清单

- [ ] 更新数据库 Schema（如需要）
- [ ] 创建/更新 API 路由
- [ ] 创建/更新 React 组件
- [ ] 更新类型定义
- [ ] 更新 SKILL.md 文档
- [ ] 测试功能
- [ ] 更新环境变量文档（如需要）

### 数据库迁移

1. 创建迁移文件：`lib/db/migrations/XXX_description.sql`
2. 执行迁移：`pnpm db:migrate`
3. 更新 `lib/db/schema.sql`
4. 更新 SKILL.md 中的数据库架构部分

### API 端点添加

1. 创建路由文件：`app/api/[path]/route.ts`
2. 实现 GET/POST/PUT/DELETE 方法
3. 添加认证检查
4. 更新 SKILL.md 中的 API 端点部分

---

## 📖 相关文档

- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - 项目计划文档
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置指南
- [QUICK_FIX.md](./QUICK_FIX.md) - 快速修复指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除指南

---

## 🔮 未来计划

### 短期（MVP 之后）

- [ ] 代码执行安全性改进（Docker 沙箱）
- [ ] 支持更多编程语言执行
- [ ] 代码版本管理
- [ ] 对话导出功能

### 长期

- [ ] 多模型切换
- [ ] 代码片段收藏
- [ ] 协作功能
- [ ] 性能优化（虚拟滚动等）

---

**维护者**: 开发团队  
**更新频率**: 每次架构变动或功能更新时
