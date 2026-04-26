import { apiClient } from './client'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types'

export async function getProjectTasks(projectId: number): Promise<Task[]> {
  const res = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`)
  return res.data
}

export async function createTask(projectId: number, data: CreateTaskRequest): Promise<Task> {
  const res = await apiClient.post<Task>(`/projects/${projectId}/tasks`, data)
  return res.data
}

export async function updateTask(
  projectId: number,
  taskId: number,
  data: UpdateTaskRequest,
): Promise<Task> {
  const res = await apiClient.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data)
  return res.data
}

export async function deleteTask(projectId: number, taskId: number): Promise<Task> {
  const res = await apiClient.delete<Task>(`/projects/${projectId}/tasks/${taskId}`)
  return res.data
}

export async function getUserTasks(params?: {
  project_id?: number
  status?: string
}): Promise<Task[]> {
  const res = await apiClient.get<Task[]>('/tasks', { params })
  return res.data
}

export async function updateTaskDirect(taskId: number, data: UpdateTaskRequest): Promise<Task> {
  const res = await apiClient.patch<Task>(`/tasks/${taskId}`, data)
  return res.data
}
