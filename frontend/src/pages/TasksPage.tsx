import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useUserTasks, useUpdateTaskDirect } from '../hooks/useTasks'
import type { Project, Task } from '../types'

const TYPE_BADGE: Record<string, string> = {
  song: 'bg-indigo-100 text-indigo-700',
  ep: 'bg-purple-100 text-purple-700',
  album: 'bg-rose-100 text-rose-700',
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekEndStr(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const isDone = task.status === 'done'
  const today = todayStr()
  const overdue = !isDone && !!task.due_date && task.due_date < today
  const dueToday = !isDone && !!task.due_date && task.due_date === today

  const rowBg = overdue
    ? 'bg-red-50 border-l-2 border-l-red-300'
    : dueToday
    ? 'bg-amber-50 border-l-2 border-l-amber-300'
    : ''

  const sourceLabel =
    task.source === 'manager_message' ? 'From Manager'
    : task.source === 'agent_suggestion' ? 'Agent Suggestion'
    : 'Manual'
  const sourceStyle =
    task.source === 'manager_message' ? 'bg-indigo-50 text-indigo-500'
    : task.source === 'agent_suggestion' ? 'bg-violet-50 text-violet-500'
    : 'bg-gray-100 text-gray-400'

  const agentLabel =
    task.source_agent === 'creative_director' ? 'Visual Artist'
    : task.source_agent
    ? task.source_agent.charAt(0).toUpperCase() + task.source_agent.slice(1)
    : null

  return (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 px-2 rounded ${rowBg}`}>
      <button onClick={onToggle}
        className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border transition-colors ${isDone ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'} flex items-center justify-center`}>
        {isDone && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.due_date && (
            <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : dueToday ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              Due {task.due_date}{overdue && ' · Overdue'}{dueToday && ' · Today'}
            </span>
          )}
          <span className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${sourceStyle}`}>{sourceLabel}</span>
          {agentLabel && (
            <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-fuchsia-50 text-fuchsia-500">
              {agentLabel}
            </span>
          )}
        </div>
      </div>
      <span className={`flex-shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 mt-0.5 ${isDone ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
        {isDone ? 'Done' : 'Pending'}
      </span>
    </div>
  )
}

export default function TasksPage() {
  const { data: projects = [] } = useProjects()
  const { data: allTasks = [], isLoading } = useUserTasks()
  const { mutate: toggleDirect } = useUpdateTaskDirect()

  const [categoryTab, setCategoryTab] = useState<'professional' | 'personal'>('professional')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDue, setFilterDue] = useState<string>('all')

  const today = todayStr()
  const weekEnd = weekEndStr()

  const categoryFiltered = allTasks.filter((t) => (t.category ?? 'professional') === categoryTab)

  const filtered = categoryFiltered
    .filter((t) => filterProject === 'all' || t.project_id === Number(filterProject))
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .filter((t) => {
      if (filterDue === 'all') return true
      if (!t.due_date) return false
      if (filterDue === 'overdue') return t.due_date < today
      if (filterDue === 'today') return t.due_date === today
      if (filterDue === 'week') return t.due_date >= today && t.due_date <= weekEnd
      return true
    })

  const projectMap = new Map<number, Project>(projects.map((p) => [p.id, p]))
  const groups: { project: Project; tasks: Task[] }[] = []
  const seen = new Set<number>()
  for (const task of filtered) {
    const proj = projectMap.get(task.project_id)
    if (!proj) continue
    if (!seen.has(proj.id)) { seen.add(proj.id); groups.push({ project: proj, tasks: [] }) }
    groups.find((g) => g.project.id === proj.id)!.tasks.push(task)
  }

  const pendingCount = allTasks.filter((t) => t.status !== 'done').length
  const doneCount = allTasks.filter((t) => t.status === 'done').length
  const professionalPending = allTasks.filter((t) => (t.category ?? 'professional') === 'professional' && t.status !== 'done').length
  const personalPending = allTasks.filter((t) => (t.category ?? 'professional') === 'personal' && t.status !== 'done').length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            All tasks across your projects —{' '}
            <span className="text-gray-700 font-medium">{pendingCount} pending</span>, {doneCount} done.
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {([
          { value: 'professional', label: 'Professional', count: professionalPending },
          { value: 'personal', label: 'Personal', count: personalPending },
        ] as const).map((tab) => (
          <button key={tab.value} onClick={() => setCategoryTab(tab.value)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              categoryTab === tab.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${categoryTab === tab.value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'done', label: 'Done' }].map((opt) => (
            <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <select value={filterDue} onChange={(e) => setFilterDue(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700">
          <option value="all">All dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Due this week</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : allTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-400 text-sm">No tasks yet.</p>
          <p className="text-gray-400 text-xs mt-1">Open a project and chat with your Manager — then hit <span className="font-medium text-indigo-400">+ Task</span> on any message.</p>
          <Link to="/projects" className="text-indigo-600 text-sm mt-3 inline-block hover:underline">Go to projects →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-10 text-center">
          <p className="text-gray-400 text-sm">No tasks match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ project, tasks }) => (
            <div key={project.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 capitalize ${TYPE_BADGE[project.project_type] ?? TYPE_BADGE.song}`}>{project.project_type || 'song'}</span>
                <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{project.name}</Link>
                <span className="ml-auto text-xs text-gray-400">{tasks.filter((t) => t.status === 'done').length}/{tasks.length} done</span>
              </div>
              <div className="px-3">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task}
                    onToggle={() => toggleDirect({ taskId: task.id, data: { status: task.status === 'done' ? 'pending' : 'done' }, projectId: task.project_id })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}