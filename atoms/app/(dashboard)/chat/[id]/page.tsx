'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatPage() {
  const params = useParams()
  const conversationId = params.id as string
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [conversationId])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ChatWindow conversationId={conversationId} />
    </div>
  )
}
