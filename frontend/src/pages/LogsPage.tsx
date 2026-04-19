import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLogs } from '../hooks/useLogs'
import type { LogLevel } from '../types'

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG:   'bg-gray-100 text-gray-600',
  INFO:    'bg-blue-100 text-blue-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  ERROR:   'bg-red-100 text-red-700',
}

const LEVELS: Array<LogLevel | ''> = ['', 'DEBUG', 'INFO', 'WARNING', 'ERROR']

export default function LogsPage() {
  const [searchParams] = useSearchParams()
  const projectIdParam = searchParams.get('project_id')
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('')

  const { data, isLoading } = useLogs({
    level: levelFilter || undefined,
    project_id: projectIdParam ? Number(projectIdParam) : undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
        <select value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevel | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l || 'All levels'}</option>
          ))}
        </select>
      </div>

      {projectIdParam && (
        <p className="text-sm text-gray-500">
          Showing logs for project <span className="font-medium">#{projectIdParam}</span>
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading logs…</p>
      ) : data?.items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400 text-sm">No log entries found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Time', 'Level', 'Source', 'Message'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono text-xs">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[log.level]}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.source}</td>
                  <td className="px-4 py-3 text-gray-700">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="text-xs text-gray-400 text-right">
          {data.total} entr{data.total !== 1 ? 'ies' : 'y'}
        </p>
      )}
    </div>
  )
}
