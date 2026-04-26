import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getUserTasks,
  updateTaskDirect,
} from '../api/tasks'
import type { CreateTaskRequest, UpdateTaskRequest } from '../types'

export function useProjectTasks(projectId: number) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => getProjectTasks(projectId),
    enabled: !!projectId,
  })
}

export function useUserTasks() {
  return useQuery({
    queryKey: ['tasks', 'user'],
    queryFn: () => getUserTasks(),
  })
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => createTask(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'user'] })
    },
  })
}

export function useUpdateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskRequest }) =>
      updateTask(projectId, taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'user'] })
    },
  })
}

export function useUpdateTaskDirect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: number
      data: UpdateTaskRequest
      projectId?: number
    }) => updateTaskDirect(taskId, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', 'user'] })
      if (variables.projectId !== undefined) {
        qc.invalidateQueries({ queryKey: ['tasks', variables.projectId] })
      }
    },
  })
}

export function useDeleteTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'user'] })
    },
  })
}
