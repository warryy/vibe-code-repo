'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInput, ChatMode } from '@/components/chat/ChatInput'

export default function ChatPage() {
  const router = useRouter()
  const [mode, setMode] = useState<ChatMode>('vibecoding')

  const handleSend = async (content: string, sendMode: ChatMode) => {
    try {
      // 创建新对话（标题会在保存第一条消息时自动生成）
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null }),
      })
      const data = await response.json()
      const conversationId = data.conversation.id

      // 保存用户消息
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      // 根据模式跳转
      if (sendMode === 'vibecoding') {
        router.push(`/vibecoding/${conversationId}`)
      } else {
        router.push(`/chat/${conversationId}`)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Vibe Coding PC</h1>
          <p className="text-gray-400">选择对话模式开始使用</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <ChatInput onSend={handleSend} mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </div>
  )
}
