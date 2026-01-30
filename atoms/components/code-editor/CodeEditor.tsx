'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FileTree } from './FileTree'
import { EditorToolbar } from './EditorToolbar'

// 动态导入 Monaco Editor（避免 SSR 问题）
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
)

interface File {
  name: string
  content: string
  language: string
}

export function CodeEditor() {
  const [files, setFiles] = useState<File[]>([
    {
      name: 'main.js',
      content: 'console.log("Hello, World!");',
      language: 'javascript',
    },
  ])
  const [activeFile, setActiveFile] = useState<string>('main.js')
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)

  const activeFileContent = files.find((f) => f.name === activeFile)

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFile ? { ...f, content: value } : f))
    )
  }

  const handleRun = async () => {
    if (!activeFileContent) return

    setIsRunning(true)
    setOutput('执行中...\n')

    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFileContent.content,
          language: activeFileContent.language,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setOutput(data.output || '执行完成，无输出')
      } else {
        setOutput(`错误: ${data.error || '执行失败'}`)
      }
    } catch (error) {
      setOutput(`错误: ${error instanceof Error ? error.message : '执行失败'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleNewFile = () => {
    const fileName = prompt('输入文件名（包含扩展名）:')
    if (!fileName) return

    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
    }

    setFiles((prev) => [
      ...prev,
      {
        name: fileName,
        content: '',
        language: languageMap[extension] || 'plaintext',
      },
    ])
    setActiveFile(fileName)
  }

  const handleDeleteFile = (fileName: string) => {
    if (files.length === 1) {
      alert('至少需要保留一个文件')
      return
    }

    setFiles((prev) => prev.filter((f) => f.name !== fileName))
    if (activeFile === fileName) {
      const remainingFiles = files.filter((f) => f.name !== fileName)
      setActiveFile(remainingFiles[0]?.name || '')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <EditorToolbar
        onRun={handleRun}
        onNewFile={handleNewFile}
        isRunning={isRunning}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <FileTree
            files={files}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onDeleteFile={handleDeleteFile}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {activeFileContent && (
            <MonacoEditor
              height="100%"
              language={activeFileContent.language}
              value={activeFileContent.content}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          )}
        </div>
      </div>

      <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
        <div className="text-sm font-semibold text-gray-300 mb-2">输出:</div>
        <pre className="text-sm text-gray-200 font-mono overflow-auto h-full bg-gray-900 p-2 rounded">
          {output || '等待执行...'}
        </pre>
      </div>
    </div>
  )
}
