import type { LogEntry, PaginatedResponse } from '../types'

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

const MOCK_LOGS: LogEntry[] = [
  { id: 1, level: 'INFO', message: 'Agent executed tool: search_codebase',
    source: 'agent', created_at: '2026-04-18T12:00:00Z', project_id: 1, conversation_id: 1 },
  { id: 2, level: 'DEBUG', message: 'Tool call returned 3 results',
    source: 'tool_runner', created_at: '2026-04-18T12:00:01Z', project_id: 1, conversation_id: 1 },
  { id: 3, level: 'WARNING', message: 'Rate limit approaching for LLM provider',
    source: 'llm_client', created_at: '2026-04-18T12:01:00Z' },
  { id: 4, level: 'ERROR', message: 'Tool execution failed: file_write permission denied',
    source: 'tool_runner', created_at: '2026-04-18T12:02:00Z', project_id: 1 },
]

export interface LogsFilter { level?: string; project_id?: number; page?: number; size?: number }

export async function getLogs(filter: LogsFilter = {}): Promise<PaginatedResponse<LogEntry>> {
  await delay()
  let items = [...MOCK_LOGS]
  if (filter.level) items = items.filter((l) => l.level === filter.level)
  if (filter.project_id) items = items.filter((l) => l.project_id === filter.project_id)
  return { items, total: items.length, page: filter.page ?? 1, size: filter.size ?? 50 }
}
