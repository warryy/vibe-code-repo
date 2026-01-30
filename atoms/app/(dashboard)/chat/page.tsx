'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // 创建新对话并跳转
    const createNewChat = async () => {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: null }),
        })
        const data = await response.json()
        router.push(`/chat/${data.conversation.id}`)
      } catch (error) {
        console.error('Failed to create conversation:', error)
      }
    }

    createNewChat()
  }, [router])

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      正在创建新对话...
    </div>
  )
}
