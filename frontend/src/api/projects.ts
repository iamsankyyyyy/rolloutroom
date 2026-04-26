import { apiClient } from './client'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types'

export interface RolloutPlan {
  conversation_id: number
  plan: string
}

export interface ChatMessage {
  id: number
  sender: string
  content: string
  created_at: string
}

export interface ChatHistoryResponse {
  conversation_id: number
  messages: ChatMessage[]
}

export interface ChatReplyResponse {
  messages: ChatMessage[]
}

export async function getProjects(): Promise<Project[]> {
  const res = await apiClient.get<Project[]>('/projects/')
  return res.data
}

export async function getProject(id: number): Promise<Project> {
  const res = await apiClient.get<Project>(`/projects/${id}`)
  return res.data
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const res = await apiClient.post<Project>('/projects/', data)
  return res.data
}

export async function updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
  const res = await apiClient.patch<Project>(`/projects/${id}`, data)
  return res.data
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}

export async function planProjectRollout(projectId: number): Promise<RolloutPlan> {
  const res = await apiClient.post<RolloutPlan>(`/projects/${projectId}/plan`)
  return res.data
}

export async function getLatestPlan(projectId: number): Promise<RolloutPlan | null> {
  try {
    const res = await apiClient.get<RolloutPlan>(`/projects/${projectId}/plan`)
    return res.data
  } catch (err: any) {
    if (err.response?.status === 404) return null
    throw err
  }
}

export async function getProjectChat(
  projectId: number,
  channel = 'manager',
): Promise<ChatHistoryResponse> {
  const res = await apiClient.get<ChatHistoryResponse>(`/projects/${projectId}/chat`, {
    params: { channel },
  })
  return res.data
}

export async function sendChatMessage(
  projectId: number,
  message: string,
  channel = 'manager',
): Promise<ChatReplyResponse> {
  const res = await apiClient.post<ChatReplyResponse>(`/projects/${projectId}/chat`, {
    message,
    channel,
  })
  return res.data
}
