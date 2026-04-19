import type { Project, CreateProjectRequest } from '../types'

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

const MOCK_PROJECTS: Project[] = [
  { id: 1, name: 'Alpha Launch', description: 'Feature flag rollout for v2 release',
    created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-10T14:30:00Z', owner_id: 1 },
  { id: 2, name: 'Backend Infra', description: 'Infrastructure changes and DB migrations',
    created_at: '2026-04-05T09:00:00Z', updated_at: '2026-04-12T11:00:00Z', owner_id: 1 },
]

export async function getProjects(): Promise<Project[]> { await delay(); return MOCK_PROJECTS }
export async function getProject(id: number): Promise<Project> {
  await delay()
  const p = MOCK_PROJECTS.find((p) => p.id === id)
  if (!p) throw new Error(`Project ${id} not found`)
  return p
}
export async function createProject(data: CreateProjectRequest): Promise<Project> {
  await delay()
  return { id: Math.floor(Math.random() * 1000) + 10, name: data.name,
    description: data.description ?? '', created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), owner_id: 1 }
}
export async function deleteProject(_id: number): Promise<void> { await delay() }
