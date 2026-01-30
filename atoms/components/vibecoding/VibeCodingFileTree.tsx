'use client'

import { getFileExtension } from '@/lib/ai/fileExtensions'

interface CodeFile {
  path: string
  content: string
  language?: string
}

interface VibeCodingFileTreeProps {
  files: CodeFile[]
  activeFile: string | null
  onSelectFile: (path: string) => void
  generating: boolean
}

export function VibeCodingFileTree({
  files,
  activeFile,
  onSelectFile,
  generating,
}: VibeCodingFileTreeProps) {
  // 构建文件树结构
  const buildTree = (files: CodeFile[]) => {
    const tree: Record<string, any> = {}

    files.forEach((file) => {
      const parts = file.path.split('/')
      let current = tree

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // 文件
          current[part] = { type: 'file', ...file }
        } else {
          // 文件夹
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} }
          }
          current = current[part].children
        }
      })
    })

    return tree
  }

  const renderTree = (tree: Record<string, any>, level = 0) => {
    const entries = Object.entries(tree).sort(([a], [b]) => {
      const aIsFolder = tree[a].type === 'folder'
      const bIsFolder = tree[b].type === 'folder'
      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1
      return a.localeCompare(b)
    })

    return (
      <div className="pl-2">
        {entries.map(([name, item]) => {
          const isActive = item.type === 'file' && item.path === activeFile
          const indent = (level + 1) * 16

          if (item.type === 'folder') {
            return (
              <div key={name} className="py-1">
                <div
                  className="flex items-center text-gray-400 text-sm cursor-pointer hover:text-gray-300"
                  style={{ paddingLeft: `${indent}px` }}
                >
                  <span className="mr-1">📁</span>
                  <span>{name}</span>
                </div>
                {renderTree(item.children, level + 1)}
              </div>
            )
          } else {
            // 确保显示的文件名包含扩展名
            const displayName = (() => {
              // 如果文件名已经有扩展名，直接使用
              if (name.includes('.') && name.lastIndexOf('.') > 0 && name.lastIndexOf('.') < name.length - 1) {
                return name
              }
              // 如果没有扩展名，根据语言类型补充
              if (item.language) {
                const ext = getFileExtension(item.language)
                return `${name}.${ext}`
              }
              // 如果无法确定语言，返回原文件名
              return name
            })()

            return (
              <div
                key={item.path}
                onClick={() => onSelectFile(item.path)}
                className={`
                  flex items-center text-sm py-1 px-4 cursor-pointer transition-colors rounded-md
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }
                `}
                style={{ paddingLeft: `${indent}px` }}
              >
                <span className="mr-1">
                  {getFileIcon(item.language || '')}
                </span>
                <span className="truncate" title={item.path}>{displayName}</span>
              </div>
            )
          }
        })}
      </div>
    )
  }

  const tree = buildTree(files)

  return (
    <div className="min-w-56 p-4">
      <div className="text-md font-semibold text-gray-400 mb-2 px-2">文件结构</div>
      {generating && (
        <div className="px-2 py-2 text-xs text-blue-400 mb-2">
          ⚡ 生成中...
        </div>
      )}
      {files.length === 0 ? (
        <div className="px-2 py-4 text-sm text-gray-500 text-center">
          暂无文件
        </div>
      ) : (
        <div className="text-sm">{renderTree(tree)}</div>
      )}
    </div>
  )
}

function getFileIcon(language: string): string {
  const iconMap: Record<string, string> = {
    javascript: '📜',
    typescript: '📘',
    python: '🐍',
    java: '☕',
    html: '🌐',
    css: '🎨',
    json: '📋',
    markdown: '📝',
    shell: '💻',
    sql: '🗄️',
    go: '🐹',
    rust: '🦀',
  }
  return iconMap[language.toLowerCase()] || '📄'
}
