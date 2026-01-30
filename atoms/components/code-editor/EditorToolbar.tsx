'use client'

import { Button } from '@/components/ui/Button'

interface EditorToolbarProps {
  onRun: () => void
  onNewFile: () => void
  isRunning: boolean
}

export function EditorToolbar({
  onRun,
  onNewFile,
  isRunning,
}: EditorToolbarProps) {
  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={onRun}
        disabled={isRunning}
      >
        {isRunning ? '执行中...' : '▶ 运行'}
      </Button>
      <Button variant="secondary" size="sm" onClick={onNewFile}>
        + 新建文件
      </Button>
    </div>
  )
}
