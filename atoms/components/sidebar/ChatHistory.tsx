'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export function ChatHistory() {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null }),
      })
      const data = await response.json()
      router.push(`/chat/${data.conversation.id}`)
      router.refresh()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-gray-400 text-sm">加载中...</div>
    )
  }

  return (
    <div className="p-4">
      <Button
        variant="primary"
        size="sm"
        className="w-full mb-4"
        onClick={handleNewChat}
      >
        + 新建对话
      </Button>

      <div className="space-y-1">
        {conversations.map((conv) => {
          const isActive = pathname === `/chat/${conv.id}`
          const title = conv.title || '新对话'
          
          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              <div className="truncate">{title}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
