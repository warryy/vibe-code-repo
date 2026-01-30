export interface User {
  id: string
  email: string
  name: string | null
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: Date
  updated_at: Date
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: Date
}
