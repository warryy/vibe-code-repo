# HTML 预览功能方案

## 📋 需求分析

在 VibeCoding 页面顶部添加两个 Tab：
1. **应用查看** - 预览 HTML 文件
2. **代码查看** - 当前代码编辑器视图（默认）

## 🎯 功能设计

### Tab 切换
- 位置：代码编辑器区域顶部（在文件路径栏上方）
- 样式：类似 ChatInput 的 tab 样式
- 状态：记住当前选中的 tab

### HTML 预览功能

#### 方案 A：简单 iframe 预览（推荐 MVP）

**实现方式**：
- 使用 `<iframe>` 标签预览 HTML
- 使用 `blob:` URL 或 `data:` URL 加载 HTML 内容
- 自动查找 HTML 文件（index.html、main.html 等）

**优点**：
- 实现简单
- 性能好
- 支持基本的 HTML/CSS/JS

**缺点**：
- 相对路径的资源（CSS、JS、图片）可能无法加载
- 需要处理跨域问题

**技术实现**：
```typescript
// 1. 查找 HTML 文件
const htmlFile = codeFiles.find(f => 
  f.path.endsWith('.html') && 
  (f.path.includes('index') || f.path.includes('main'))
) || codeFiles.find(f => f.path.endsWith('.html'))

// 2. 创建 Blob URL
const blob = new Blob([htmlFile.content], { type: 'text/html' })
const url = URL.createObjectURL(blob)

// 3. 在 iframe 中加载
<iframe src={url} />
```

**资源处理**：
- 方案 A1：只预览 HTML，不处理外部资源（最简单）
- 方案 A2：解析 HTML，将相对路径的资源内联（复杂但完整）

---

#### 方案 B：资源代理预览（完整方案）

**实现方式**：
- 创建 API 端点 `/api/vibecoding/[id]/preview/[filePath]`
- 代理所有资源请求（HTML、CSS、JS、图片等）
- 返回对应的文件内容

**优点**：
- 完整支持相对路径资源
- 可以预览完整的多文件项目

**缺点**：
- 需要创建多个 API 端点
- 实现复杂度较高

**技术实现**：
```typescript
// API: /api/vibecoding/[id]/preview/[filePath]
// 返回文件内容，设置正确的 Content-Type

// HTML 中替换资源路径
// <link href="./style.css"> -> <link href="/api/vibecoding/xxx/preview/style.css">
```

---

#### 方案 C：HTML 内容注入 + 资源内联（平衡方案）

**实现方式**：
- 解析 HTML 内容
- 找到 `<link>`、`<script>`、`<img>` 等标签
- 将相对路径的资源内容内联到 HTML 中
- 使用 blob URL 预览

**优点**：
- 不需要额外的 API 端点
- 支持相对路径资源
- 实现复杂度中等

**缺点**：
- 需要解析和修改 HTML
- 大文件可能影响性能

**技术实现**：
```typescript
// 1. 解析 HTML，找到资源引用
// 2. 根据路径查找对应的文件内容
// 3. 内联资源：
//    - CSS: <style>...</style>
//    - JS: <script>...</script>
//    - 图片: data:image/png;base64,...
// 4. 生成新的 HTML 内容
// 5. 使用 blob URL 预览
```

---

## 🎨 UI 设计

### Tab 位置和样式
```
┌─────────────────────────────────────────┐
│  [应用查看] [代码查看] ← Tab 按钮        │
├─────────────────────────────────────────┤
│  文件路径栏                              │
│  ┌─────────────────────────────────────┐ │
│  │  iframe 预览 或  代码编辑器         │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### HTML 文件查找逻辑
1. 优先查找：`index.html`、`main.html`、`app.html`
2. 其次查找：任何 `.html` 文件
3. 如果没有 HTML 文件：显示提示"项目中没有 HTML 文件"

### 预览功能
- **实时更新**：代码修改后自动刷新预览（可选）
- **刷新按钮**：手动刷新预览
- **全屏按钮**：全屏预览（可选）
- **控制台**：显示 JavaScript 错误（可选）

---

## 📝 实施计划

### Phase 1: Tab 切换（基础）
1. ✅ 在 VibeCodingView 组件顶部添加 Tab
2. ✅ 实现 Tab 切换逻辑
3. ✅ 根据 Tab 显示不同内容

### Phase 2: HTML 预览（方案 A - 简单版）
1. ✅ 实现 HTML 文件查找逻辑
2. ✅ 使用 blob URL + iframe 预览
3. ✅ 添加"未找到 HTML"提示

### Phase 3: 资源处理（可选）
- 根据实际需求选择方案 B 或 C
- 或者先实现方案 A，后续再优化

---

## 🔧 技术细节

### HTML 文件查找函数
```typescript
function findHtmlFile(files: CodeFile[]): CodeFile | null {
  // 优先级顺序
  const priorityNames = ['index.html', 'main.html', 'app.html']
  
  // 1. 按优先级查找
  for (const name of priorityNames) {
    const file = files.find(f => f.path.endsWith(name))
    if (file) return file
  }
  
  // 2. 查找任何 HTML 文件
  return files.find(f => f.path.endsWith('.html')) || null
}
```

### Blob URL 预览
```typescript
const htmlFile = findHtmlFile(codeFiles)
if (htmlFile) {
  const blob = new Blob([htmlFile.content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  // 使用后记得清理: URL.revokeObjectURL(url)
}
```

### 资源内联（方案 C）
```typescript
function inlineResources(html: string, files: CodeFile[]): string {
  // 解析 HTML，找到资源引用
  // 替换 <link href="./style.css"> 为 <style>...</style>
  // 替换 <script src="./app.js"> 为 <script>...</script>
  // 替换 <img src="./logo.png"> 为 data URL
}
```

---

## ❓ 需要确认的问题

1. **预览方案选择**：
   - [ ] 方案 A：简单 iframe（MVP，不支持相对路径资源）
   - [ ] 方案 B：资源代理（完整但复杂）
   - [ ] 方案 C：资源内联（平衡方案）

2. **实时更新**：
   - [ ] 代码修改后自动刷新预览
   - [ ] 手动刷新按钮

3. **HTML 文件选择**：
   - [ ] 自动选择第一个 HTML 文件
   - [ ] 允许用户选择要预览的 HTML 文件（如果有多个）

4. **预览功能扩展**：
   - [ ] 全屏预览
   - [ ] 控制台显示 JS 错误
   - [ ] 移动端预览模式

5. **资源处理优先级**：
   - [ ] CSS 文件（重要）
   - [ ] JavaScript 文件（重要）
   - [ ] 图片资源（可选）
   - [ ] 字体文件（可选）

---

## 💡 推荐方案（MVP）

**建议采用：方案 A（简单 iframe）+ 方案 C（资源内联）的组合**

**实施步骤**：
1. 先实现方案 A（快速上线）
2. 如果用户反馈需要资源支持，再实现方案 C

**理由**：
- 方案 A 可以快速实现基本预览功能
- 方案 C 可以后续添加，不需要改动太多代码
- 平衡了开发速度和功能完整性

---

请确认以上方案，确认后开始实施！
