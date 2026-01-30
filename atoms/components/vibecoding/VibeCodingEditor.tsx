'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getFileExtension } from '@/lib/ai/fileExtensions'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
)

interface CodeFile {
  path: string
  content: string
  language?: string
}

interface VibeCodingEditorProps {
  file: CodeFile
  onChange: (content: string) => void
}

export function VibeCodingEditor({ file, onChange }: VibeCodingEditorProps) {
  const [content, setContent] = useState(file.content)

  useEffect(() => {
    setContent(file.content)
  }, [file.path, file.content])

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value)
      onChange(value)
    }
  }

  // 根据文件路径或语言检测编辑器语言
  const detectLanguage = (): string => {
    if (file.language) {
      return file.language
    }

    const ext = file.path.split('.').pop()?.toLowerCase() || ''
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
    }
    return languageMap[ext] || 'plaintext'
  }

  // 获取显示的文件名（确保包含扩展名）
  const getDisplayFileName = (): string => {
    const parts = file.path.split('/')
    const fileName = parts[parts.length - 1]
    
    // 如果文件名已经有扩展名，直接使用
    if (fileName.includes('.') && fileName.lastIndexOf('.') > 0 && fileName.lastIndexOf('.') < fileName.length - 1) {
      return file.path
    }
    
    // 如果没有扩展名，根据语言类型补充
    if (file.language) {
      const ext = getFileExtension(file.language)
      const pathParts = file.path.split('/')
      pathParts[pathParts.length - 1] = `${fileName}.${ext}`
      return pathParts.join('/')
    }
    
    // 如果无法确定语言，返回原路径
    return file.path
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-300 font-mono" title={file.path}>{getDisplayFileName()}</div>
        <div className="text-xs text-gray-500">{detectLanguage()}</div>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={detectLanguage()}
          value={content}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
          }}
        />
      </div>
    </div>
  )
}
