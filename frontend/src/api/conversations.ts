import type { Conversation, CreateConversationRequest, Message } from '../types'

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1, title: 'Discuss rollout strategy', project_id: 1,
    created_at: '2026-04-10T10:00:00Z', updated_at: '2026-04-10T10:30:00Z',
    messages: [
      { id: 1, role: 'user', content: 'What is the best rollout strategy for v2?',
        created_at: '2026-04-10T10:00:00Z', conversation_id: 1 },
      { id: 2, role: 'assistant', content: 'I recommend a canary rollout starting at 5% of traffic...',
        created_at: '2026-04-10T10:01:00Z', conversation_id: 1 },
    ],
  },
]

export async function getConversations(projectId?: number): Promise<Conversation[]> {
  await delay()
  return projectId != null ? MOCK_CONVERSATIONS.filter((c) => c.project_id === projectId) : MOCK_CONVERSATIONS
}
export async function getConversation(id: number): Promise<Conversation> {
  await delay()
  const c = MOCK_CONVERSATIONS.find((c) => c.id === id)
  if (!c) throw new Error(`Conversation ${id} not found`)
  return c
}
export async function createConversation(data: CreateConversationRequest): Promise<Conversation> {
  await delay()
  return { id: Math.floor(Math.random() * 1000) + 10, title: data.title ?? 'New conversation',
    project_id: data.project_id, created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), messages: [] }
}
export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  await delay(800)
  return { id: Math.floor(Math.random() * 10000), role: 'assistant',
    content: `[Mock response] You said: "${content}"`,
    created_at: new Date().toISOString(), conversation_id: conversationId }
}
