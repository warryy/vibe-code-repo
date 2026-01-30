export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface ChatConversation {
  id: string
  title: string | null
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
