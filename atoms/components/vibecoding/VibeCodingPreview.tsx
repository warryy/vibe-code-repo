'use client'

import { useState, useEffect, useRef } from 'react'
import { getFileExtension } from '@/lib/ai/fileExtensions'

interface CodeFile {
  path: string
  content: string
  language?: string
}

interface VibeCodingPreviewProps {
  files: CodeFile[]
  htmlFile: CodeFile | null
}

/**
 * 查找 HTML 文件
 */
function findHtmlFile(files: CodeFile[]): CodeFile | null {
  console.log('[Preview] 查找 HTML 文件，文件列表:', files.map(f => f.path))
  
  // 优先级顺序
  const priorityNames = ['index.html', 'main.html', 'app.html']
  
  // 1. 按优先级查找
  for (const name of priorityNames) {
    const file = files.find(f => {
      const normalizedPath = f.path.toLowerCase()
      return normalizedPath === name || 
             normalizedPath.endsWith(`/${name}`) ||
             normalizedPath.endsWith(`\\${name}`)
    })
    if (file) {
      console.log(`[Preview] ✅ 找到优先级 HTML 文件: ${file.path}`)
      return file
    }
  }
  
  // 2. 查找任何 HTML 文件
  const htmlFile = files.find(f => {
    const ext = f.path.toLowerCase().split('.').pop()
    return ext === 'html' || ext === 'htm'
  })
  
  if (htmlFile) {
    console.log(`[Preview] ✅ 找到 HTML 文件: ${htmlFile.path}`)
  } else {
    console.log('[Preview] ❌ 未找到 HTML 文件')
    console.log('[Preview] 所有文件:', files.map(f => ({
      path: f.path,
      ext: f.path.split('.').pop(),
      language: f.language
    })))
  }
  
  return htmlFile || null
}

/**
 * 内联资源到 HTML
 */
function inlineResources(html: string, files: CodeFile[], basePath: string): string {
  let processedHtml = html

  // 处理 CSS 文件
  const cssRegex = /<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi
  processedHtml = processedHtml.replace(cssRegex, (match, href) => {
    // 解析相对路径
    const resolvedPath = resolvePath(href, basePath)
    // 尝试多种匹配方式
    const cssFile = files.find(f => {
      const normalizedPath = f.path.replace(/^\//, '')
      const normalizedResolved = resolvedPath.replace(/^\//, '')
      return f.path === resolvedPath || 
             f.path === normalizedResolved ||
             normalizedPath === normalizedResolved ||
             f.path.endsWith(resolvedPath) ||
             f.path.endsWith(`/${resolvedPath}`)
    })
    
    if (cssFile) {
      console.log(`[Preview] 内联 CSS: ${href} -> ${cssFile.path}`)
      return `<style>${cssFile.content}</style>`
    }
    console.warn(`[Preview] 未找到 CSS 文件: ${href} (解析为: ${resolvedPath})`)
    return match // 如果找不到文件，保留原标签
  })

  // 处理 JavaScript 文件
  const jsRegex = /<script[^>]+src=["']([^"']+\.js)["'][^>]*><\/script>/gi
  processedHtml = processedHtml.replace(jsRegex, (match, src) => {
    const resolvedPath = resolvePath(src, basePath)
    const jsFile = files.find(f => {
      const normalizedPath = f.path.replace(/^\//, '')
      const normalizedResolved = resolvedPath.replace(/^\//, '')
      return f.path === resolvedPath || 
             f.path === normalizedResolved ||
             normalizedPath === normalizedResolved ||
             f.path.endsWith(resolvedPath) ||
             f.path.endsWith(`/${resolvedPath}`)
    })
    
    if (jsFile) {
      console.log(`[Preview] 内联 JS: ${src} -> ${jsFile.path}`)
      return `<script>${jsFile.content}</script>`
    }
    console.warn(`[Preview] 未找到 JS 文件: ${src} (解析为: ${resolvedPath})`)
    return match
  })

  // 处理内联 script（确保执行顺序）
  // 注意：这里不处理，因为内联的 script 标签已经包含在 HTML 中

  return processedHtml
}

/**
 * 解析相对路径
 */
function resolvePath(relativePath: string, basePath: string): string {
  // 移除查询参数和锚点
  let path = relativePath.split('?')[0].split('#')[0]
  
  // 移除 ./ 前缀
  path = path.replace(/^\.\//, '')
  
  // 如果 basePath 是文件，获取目录
  const baseDir = basePath.includes('/') 
    ? basePath.substring(0, basePath.lastIndexOf('/'))
    : ''
  
  if (baseDir && path) {
    // 处理 ../ 相对路径
    const parts = path.split('/')
    const baseParts = baseDir.split('/').filter(p => p)
    
    for (const part of parts) {
      if (part === '..') {
        baseParts.pop()
      } else if (part !== '.' && part !== '') {
        baseParts.push(part)
      }
    }
    
    return baseParts.join('/')
  }
  
  return path || relativePath
}

export function VibeCodingPreview({ files, htmlFile }: VibeCodingPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  console.log('[Preview] 组件渲染，htmlFile:', htmlFile?.path || 'null')
  console.log('[Preview] files 数量:', files.length)

  useEffect(() => {
    console.log('[Preview] useEffect 触发，htmlFile:', htmlFile?.path || 'null')
    if (htmlFile) {
      updatePreview(htmlFile)
    } else {
      setPreviewUrl(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlFile?.path, htmlFile?.content, files.length])

  const updatePreview = (file: CodeFile) => {
    try {
      // 内联资源
      const processedHtml = inlineResources(file.content, files, file.path)
      
      // 创建 Blob URL
      const blob = new Blob([processedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // 清理旧的 URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      
      setPreviewUrl(url)
      setError(null)
    } catch (err) {
      console.error('Preview error:', err)
      setError(err instanceof Error ? err.message : '预览失败')
    }
  }

  const handleRefresh = () => {
    if (htmlFile) {
      updatePreview(htmlFile)
    }
  }

  // 清理 URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!htmlFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">未找到 HTML 文件</p>
          <p className="text-sm">项目中没有 HTML 文件可以预览</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400">
        <p className="text-lg mb-2">预览错误</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    )
  }

  // 获取显示的文件名（确保包含扩展名）
  const getDisplayFileName = (): string => {
    if (!htmlFile) return ''
    
    const parts = htmlFile.path.split('/')
    const fileName = parts[parts.length - 1]
    
    // 如果文件名已经有扩展名，直接使用
    if (fileName.includes('.') && fileName.lastIndexOf('.') > 0 && fileName.lastIndexOf('.') < fileName.length - 1) {
      return htmlFile.path
    }
    
    // 如果没有扩展名，根据语言类型补充
    if (htmlFile.language) {
      const ext = getFileExtension(htmlFile.language)
      const pathParts = htmlFile.path.split('/')
      pathParts[pathParts.length - 1] = `${fileName}.${ext}`
      return pathParts.join('/')
    }
    
    // 如果无法确定语言，返回原路径
    return htmlFile.path
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* 工具栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-300 font-mono" title={htmlFile?.path || ''}>{getDisplayFileName()}</div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      {/* 预览区域 */}
      <div className="flex-1 relative">
        {previewUrl && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="HTML Preview"
          />
        )}
      </div>
    </div>
  )
}
