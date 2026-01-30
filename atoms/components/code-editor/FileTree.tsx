'use client'

interface File {
  name: string
  content: string
  language: string
}

interface FileTreeProps {
  files: File[]
  activeFile: string
  onSelectFile: (fileName: string) => void
  onDeleteFile: (fileName: string) => void
}

export function FileTree({
  files,
  activeFile,
  onSelectFile,
  onDeleteFile,
}: FileTreeProps) {
  return (
    <div className="p-2">
      <div className="text-xs font-semibold text-gray-400 mb-2 px-2">文件</div>
      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.name}
            className={`
              flex items-center justify-between px-2 py-1.5 rounded text-sm
              cursor-pointer group
              ${
                activeFile === file.name
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }
            `}
            onClick={() => onSelectFile(file.name)}
          >
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFile(file.name)
              }}
              className="
                opacity-0 group-hover:opacity-100 ml-2 text-red-400 hover:text-red-300
                transition-opacity
              "
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
