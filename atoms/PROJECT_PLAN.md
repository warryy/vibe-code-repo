# 项目计划：Vibe Coding PC 网站

## 一、技术架构

### 1.1 核心框架
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**
- **pnpm** (包管理器)

### 1.2 数据库与认证
- **Neon** (PostgreSQL) - Vercel 推荐
- **NextAuth.js v5** (Auth.js) - 支持多种 OAuth 和邮箱密码

### 1.3 AI 对话
- **DeepSeek API** - 使用 `deepseek-chat` 模型
- **Server-Sent Events (SSE)** 或 **Streaming API** - 实现流式响应

### 1.4 在线代码编辑器
- **Monaco Editor** (VSCode 核心) 或 **CodeSandbox**
- 支持多文件、语法高亮、代码补全

### 1.5 状态管理
- **Zustand** - 轻量级状态管理
- **React Query** - 服务端数据管理

---

## 二、项目结构

```
atoms/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面（登录/注册）
│   │   ├── login/         # 登录页面
│   │   └── register/      # 注册页面
│   ├── (dashboard)/       # 主应用页面
│   │   ├── chat/          # 对话页面
│   │   │   └── [id]/      # 具体对话页面
│   │   ├── code/          # 代码编辑器页面
│   │   └── layout.tsx     # 主布局（左侧栏+右侧内容）
│   ├── api/               # API 路由
│   │   ├── auth/          # NextAuth 路由
│   │   ├── chat/          # AI 对话 API
│   │   │   └── stream/    # 流式对话端点
│   │   └── chat-history/  # 对话历史 API
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── sidebar/           # 左侧功能栏
│   │   ├── Sidebar.tsx
│   │   ├── ChatHistory.tsx
│   │   └── Navigation.tsx
│   ├── chat/              # 对话相关组件
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   └── ChatInput.tsx
│   ├── code-editor/       # 代码编辑器组件
│   │   ├── CodeEditor.tsx
│   │   ├── FileTree.tsx
│   │   └── EditorToolbar.tsx
│   └── ui/                # 通用 UI 组件
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── lib/                   # 工具函数
│   ├── db/                # 数据库配置（Neon）
│   │   └── client.ts
│   ├── auth/              # 认证配置
│   │   └── config.ts
│   └── ai/                # AI API 封装
│       └── deepseek.ts    # DeepSeek API 客户端
├── hooks/                 # 自定义 Hooks
│   ├── useChat.ts         # 对话 Hook
│   └── useStream.ts       # 流式响应 Hook
├── stores/                # Zustand 状态管理
│   ├── chatStore.ts       # 对话状态
│   └── uiStore.ts         # UI 状态
├── types/                 # TypeScript 类型定义
│   ├── chat.ts
│   ├── user.ts
│   └── database.ts
└── public/                # 静态资源
```

---

## 三、功能模块

### 3.1 认证系统（MVP - 简化版）
- [x] 邮箱密码注册/登录（无需邮箱验证）
- [x] 简单会话管理
- [x] 用户信息存储（Neon）
- [ ] ~~OAuth 登录~~（不需要）

### 3.2 AI 对话功能（MVP）
- [ ] DeepSeek API 集成（deepseek-chat 模型）
- [ ] 流式对话实现（SSE）
- [ ] Markdown 渲染
- [ ] 代码高亮显示
- [ ] 消息历史滚动加载
- [ ] 新建/切换对话
- [ ] 对话上下文管理

### 3.3 对话历史管理（MVP）
- [ ] 历史列表展示（左侧栏）
- [ ] 自动保存对话
- [ ] ~~搜索/筛选功能~~（MVP 暂不需要）
- [ ] ~~重命名/删除对话~~（MVP 暂不需要）

### 3.4 代码编辑器（MVP）
- [ ] Monaco Editor 集成
- [ ] 多文件支持
- [ ] 语法高亮
- [ ] 代码补全
- [ ] 文件树导航
- [ ] **代码执行功能**（必需）

---

## 四、数据库设计

### 4.1 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 对话表 (conversations)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 消息表 (messages)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 五、开发步骤

### Phase 1: 项目初始化
1. ✅ 初始化 Next.js + TypeScript + Tailwind
2. ✅ 配置 pnpm workspace
3. ✅ 设置 GitLab 仓库
4. ✅ 配置 Vercel 部署环境

### Phase 2: 认证系统
1. ✅ 配置 Neon 数据库连接
2. ✅ 集成 NextAuth.js v5
3. ✅ 实现登录/注册页面 UI
4. ✅ 用户数据模型和迁移

### Phase 3: 基础布局
1. ✅ 左侧功能栏组件开发
2. ✅ 右侧内容区域布局
3. ✅ 响应式设计实现
4. ✅ 导航路由配置

### Phase 4: AI 对话功能
1. ✅ DeepSeek API 客户端封装
2. ✅ 流式对话 API 端点（SSE）
3. ✅ 对话界面组件开发
4. ✅ 消息渲染（Markdown + 代码高亮）
5. ✅ 对话历史存储到数据库

### Phase 5: 对话历史管理
1. ✅ 历史列表组件开发
2. ✅ 对话 CRUD API 实现
3. ✅ 搜索/筛选功能
4. ✅ 自动保存机制

### Phase 6: 代码编辑器
1. ✅ Monaco Editor 集成
2. ✅ 文件管理系统
3. ✅ 代码编辑器 UI 组件
4. ✅ 与对话功能集成（可选）

### Phase 7: 优化与部署
1. ✅ 性能优化（代码分割、懒加载）
2. ✅ 错误处理和边界情况
3. ✅ Vercel 部署配置
4. ✅ 环境变量和密钥管理

---

## 六、依赖包清单

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@auth/core": "^0.27.0",
    "next-auth": "^5.0.0-beta.25",
    "@neondatabase/serverless": "^0.9.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.28.0",
    "monaco-editor": "^0.45.0",
    "@monaco-editor/react": "^4.6.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 七、环境变量配置

### 7.1 必需环境变量
```env
# 数据库
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000  # 生产环境改为实际域名

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com  # DeepSeek API 基础 URL
DEEPSEEK_MODEL=deepseek-chat  # 使用的模型名称
```

### 7.2 DeepSeek API 配置说明
- **API 端点**: `https://api.deepseek.com/v1/chat/completions`
- **模型名称**: `deepseek-chat`
- **流式响应**: 支持 Server-Sent Events (SSE)
- **认证方式**: Bearer Token (API Key)

### 7.3 Vercel 环境变量设置
在 Vercel 项目设置中添加上述环境变量，确保生产环境正常运行。

---

## 八、DeepSeek API 集成细节

### 8.1 API 请求格式
```typescript
// 流式对话请求
POST https://api.deepseek.com/v1/chat/completions
Headers:
  Authorization: Bearer ${DEEPSEEK_API_KEY}
  Content-Type: application/json

Body:
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 8.2 流式响应处理
- 使用 Server-Sent Events (SSE) 接收流式数据
- 解析 `data:` 前缀的 JSON 数据
- 提取 `choices[0].delta.content` 作为增量内容
- 实时更新前端 UI

### 8.3 错误处理
- API 限流处理（429 错误）
- 网络错误重试机制
- 用户友好的错误提示

---

## 九、UI/UX 设计要点

### 9.1 布局
- **左侧栏宽度**: 280px（可折叠）
- **右侧内容区**: 自适应剩余空间
- **响应式**: 移动端左侧栏可收起

### 9.2 颜色方案
- 深色主题为主（适合编程场景）
- ~~支持浅色主题切换~~（MVP 不需要）

### 9.3 交互
- 流畅的动画过渡
- 加载状态提示
- 错误提示友好

---

## 十、部署清单

### 10.1 Vercel 部署前检查
- [ ] 环境变量已配置
- [ ] 数据库连接正常
- [ ] API 密钥已设置
- [ ] 构建无错误

### 10.2 GitLab CI/CD（可选）
- [ ] 配置 `.gitlab-ci.yml`
- [ ] 自动部署到 Vercel
- [ ] 代码质量检查

---

## 十一、后续优化方向

1. **性能优化**
   - 对话历史虚拟滚动
   - 代码编辑器懒加载
   - 图片和资源优化

2. **功能扩展**
   - 代码执行沙箱
   - 多模型切换
   - 对话导出功能
   - 代码片段收藏

3. **用户体验**
   - 快捷键支持
   - 主题自定义
   - 多语言支持

---

## 确认事项

✅ **已确认需求：**
1. ✅ AI 提供商：**DeepSeek (deepseek-chat 模型)**
2. ✅ 代码编辑器需要执行功能
3. ✅ 不需要 OAuth 登录，简单邮箱登录即可（无需验证邮箱真实性）
4. ✅ 不需要用户订阅/付费功能
5. ✅ 不需要主题切换功能
6. ✅ MVP 版本，只实现最基础的 vibecoding 功能

## MVP 功能范围

### 核心功能
1. **简单邮箱登录/注册**（无需验证）
2. **AI 流式对话**（DeepSeek）
3. **对话历史记录**（自动保存）
4. **代码编辑器**（Monaco Editor）
5. **代码执行功能**

### 暂不实现（后续版本）
- OAuth 登录
- 对话搜索/筛选
- 对话重命名/删除
- 主题切换
- 用户订阅
- 高级功能

---

**开始实施 MVP 版本！**
