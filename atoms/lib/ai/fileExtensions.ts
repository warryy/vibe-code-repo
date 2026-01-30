/**
 * 根据语言类型获取文件扩展名
 */
export function getFileExtension(language: string): string {
  const extensionMap: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    json: 'json',
    markdown: 'md',
    mark: 'md',
    yaml: 'yml',
    shell: 'sh',
    sql: 'sql',
    go: 'go',
    rust: 'rs',
    php: 'php',
    ruby: 'rb',
    xml: 'xml',
    vue: 'vue',
    svelte: 'svelte',
    jsx: 'jsx',
    tsx: 'tsx',
  }
  
  return extensionMap[language.toLowerCase()] || 'txt'
}

/**
 * 确保文件路径有正确的扩展名
 */
export function ensureFileExtension(path: string, language?: string): string {
  // 如果路径已经有扩展名，直接返回
  const parts = path.split('/')
  const fileName = parts[parts.length - 1]
  
  // 检查文件名是否有扩展名（最后一个点之后有内容，且不是以点开头）
  if (fileName.includes('.')) {
    const lastDotIndex = fileName.lastIndexOf('.')
    // 如果点不在开头，且点之后有内容，则认为已有扩展名
    if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
      return path
    }
  }
  
  // 如果没有扩展名，根据语言添加
  if (language) {
    const ext = getFileExtension(language)
    return `${path}.${ext}`
  }
  
  // 如果无法确定语言，返回原路径
  return path
}

/**
 * 从文件路径推断语言类型
 */
export function detectLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    htm: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    sql: 'sql',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    xml: 'xml',
    vue: 'vue',
    svelte: 'svelte',
  }
  return languageMap[ext] || 'plaintext'
}
