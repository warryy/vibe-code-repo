'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageList } from './MessageList'
import { ChatInput, ChatMode } from './ChatInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatWindowProps {
  conversationId: string
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`)
        const data = await response.json()
        setMessages(data.messages || [])
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [conversationId])

  const handleSendMessage = async (content: string, mode: ChatMode = 'stream') => {
    // 保存用户消息
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      
      // 添加用户消息到列表
      const userMessage: Message = {
        id: data.message.id,
        role: 'user',
        content,
        created_at: data.message.created_at,
      }
      setMessages((prev) => [...prev, userMessage])

      // 创建临时助手消息
      const assistantMessageId = `temp-${Date.now()}`
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      try {
        // 流式获取 AI 响应
        const allMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const streamResponse = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            messages: allMessages,
          }),
        })

        if (!streamResponse.ok) {
          throw new Error('Stream request failed')
        }

        const reader = streamResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // 刷新消息列表以获取保存的助手消息
                  const refreshResponse = await fetch(`/api/conversations/${conversationId}`)
                  const refreshData = await refreshResponse.json()
                  setMessages(refreshData.messages || [])
                  return
                }

                try {
                  const json = JSON.parse(data)
                  if (json.error) {
                    // 处理错误消息
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: `❌ 错误: ${json.error}` }
                          : msg
                      )
                    )
                    return
                  }
                  if (json.content) {
                    fullContent += json.content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: fullContent }
                          : msg
                      )
                    )
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        // 移除临时消息
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
      }
    } catch (error) {
      console.error('Failed to save user message:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-700 p-4">
        <ChatInput onSend={handleSendMessage} mode="stream" />
      </div>
    </div>
  )
}
