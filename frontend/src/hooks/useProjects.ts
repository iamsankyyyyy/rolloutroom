import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, getProject, createProject, deleteProject } from '../api'
import type { CreateProjectRequest } from '../types'

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: getProjects })
}
export function useProject(id: number) {
  return useQuery({ queryKey: ['projects', id], queryFn: () => getProject(id) })
}
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
