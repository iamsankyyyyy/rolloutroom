import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api'
import type { LogsFilter } from '../api/logs'

export function useLogs(filter: LogsFilter = {}) {
  return useQuery({ queryKey: ['logs', filter], queryFn: () => getLogs(filter) })
}
