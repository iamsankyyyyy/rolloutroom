export interface LoginRequest { username: string; password: string }
export interface RegisterRequest { username: string; email: string; password: string }
export interface TokenResponse { access_token: string; token_type: string }

export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  artist_name: string | null
  tone_preference: string | null
}

export interface UpdateUserRequest {
  artist_name?: string | null
  tone_preference?: string | null
}

export interface Project {
  id: number
  name: string
  project_type: string
  description: string | null
  mood: string | null
  goal: string | null
  created_at: string
  updated_at: string
  owner_id: number
}

export interface CreateProjectRequest {
  name: string
  project_type: string
  description?: string
  mood?: string
  goal?: string
}

export interface UpdateProjectRequest {
  name?: string
  project_type?: string
  description?: string
  mood?: string
  goal?: string
}

export interface Task {
  id: number
  title: string
  status: string
  due_date: string | null
  project_id: number
  user_id: number
  source: string | null
  category: string | null
}

export interface CreateTaskRequest {
  title: string
  status?: string
  due_date?: string | null
  source?: string
  category?: string
}

export interface UpdateTaskRequest {
  title?: string
  status?: string
  due_date?: string | null
  category?: string
}

export type MessageRole = 'user' | 'assistant' | 'system'
export interface Message {
  id: number; role: MessageRole; content: string
  created_at: string; conversation_id: number
}
export interface Conversation {
  id: number; title: string; project_id: number
  created_at: string; updated_at: string; messages: Message[]
}
export interface CreateConversationRequest { title?: string; project_id: number }

export interface AgentExecuteRequest { conversation_id: number; user_message: string }
export interface ToolCall {
  id: string; name: string; input: Record<string, unknown>
  output?: string; status: 'pending' | 'running' | 'success' | 'error'
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
export interface LogEntry {
  id: number; level: LogLevel; message: string; source: string
  created_at: string; project_id?: number; conversation_id?: number
  metadata?: Record<string, unknown>
}
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; size: number }