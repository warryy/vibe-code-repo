'use client'

import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim() || loading) return

    const content = input.trim()
    setInput('')
    setLoading(true)

    try {
      await onSend(content)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息... (Shift+Enter 换行)"
        className="
          flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
          text-white placeholder-gray-500 resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
        rows={1}
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || loading}
        className="
          px-6 py-2 bg-blue-600 text-white rounded-lg
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {loading ? '发送中...' : '发送'}
      </button>
    </div>
  )
}
