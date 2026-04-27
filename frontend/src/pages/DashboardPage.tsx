import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useUserTasks } from '../hooks/useTasks'
import type { Task } from '../types'

const TYPE_BADGE: Record<string, string> = {
  song: 'bg-indigo-100 text-indigo-700',
  ep: 'bg-purple-100 text-purple-700',
  album: 'bg-rose-100 text-rose-700',
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekEndStr(): string {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: projects, isLoading } = useProjects()
  const { data: allTasks = [] } = useUserTasks()

  const recent = projects?.slice(0, 3) ?? []
  const projectCount = projects?.length ?? 0
  const greeting = projectCount > 0 ? 'Welcome back' : 'Welcome'

  const today = todayStr()
  const tomorrow = tomorrowStr()
  const weekEnd = weekEndStr()

  const pendingTasks = allTasks.filter((t) => t.status !== 'done')
  const overdueTasks = pendingTasks.filter((t) => t.due_date && t.due_date < today)
  const dueSoonTasks = pendingTasks.filter(
    (t) => t.due_date && (t.due_date === today || t.due_date === tomorrow),
  )

  const upcomingTasks: Task[] = [...pendingTasks]
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    .slice(0, 3)

  const todayTasks = allTasks.filter((t) => t.due_date === today)
  const todayDone = todayTasks.filter((t) => t.status === 'done').length
  const weekTasks = allTasks.filter(
    (t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd,
  )
  const weekDone = weekTasks.filter((t) => t.status === 'done').length
  const nextFocus = upcomingTasks[0] ?? null

  return (
    <div className="space-y-5">

      {/* Banners */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700">
            <span className="font-semibold">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>{' '}
            — don't let them slip.
          </span>
          <Link to="/tasks" className="text-xs text-red-600 font-medium hover:underline flex-shrink-0 ml-4">View →</Link>
        </div>
      )}
      {dueSoonTasks.length > 0 && overdueTasks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-700">
            <span className="font-semibold">{dueSoonTasks.length} task{dueSoonTasks.length > 1 ? 's' : ''} due within 2 days.</span>
          </span>
          <Link to="/tasks" className="text-xs text-amber-600 font-medium hover:underline flex-shrink-0 ml-4">View →</Link>
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-gradient-to-br from-indigo-50 via-white to-white rounded-2xl border border-indigo-100 px-8 py-10">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">RolloutRoom</p>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {greeting}, {user?.artist_name || user?.username || '…'}.
            </h1>
            <p className="text-gray-500 mt-2 text-base max-w-lg">
              Your AI release team — Manager, Creative Director, and Publicist — ready to work on each project.
            </p>
            <div className="flex gap-3 mt-6">
              <Link to="/projects" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
                + New project
              </Link>
              <Link to="/projects" className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
                View all projects
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Your projects</h2>
              {(projects?.length ?? 0) > 3 && (
                <Link to="/projects" className="text-sm text-indigo-600 hover:underline">View all</Link>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : recent.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 py-14 text-center">
                <p className="text-gray-400 text-sm">No projects yet.</p>
                <Link to="/projects" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
                  Create your first project →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recent.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 capitalize ${TYPE_BADGE[p.project_type] ?? TYPE_BADGE.song}`}>
                        {p.project_type || 'song'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                    <div className="mt-1 space-y-0.5">
                      {p.mood && <p className="text-xs text-gray-400"><span className="font-medium text-gray-500">Mood:</span> {p.mood}</p>}
                      {p.goal && <p className="text-xs text-gray-400"><span className="font-medium text-gray-500">Goal:</span> {p.goal}</p>}
                    </div>
                    <div className="mt-auto pt-4">
                      <span className="text-xs font-medium text-indigo-600">Open chat →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700">Upcoming tasks</h3>
              <Link to="/tasks" className="text-xs text-indigo-500 hover:underline">All →</Link>
            </div>
            <div className="px-4 py-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No pending tasks yet.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const overdue = task.due_date && task.due_date < today
                    return (
                      <li key={task.id} className="flex items-start gap-2.5">
                        <span className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${overdue ? 'bg-red-400' : 'bg-indigo-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 leading-snug">{task.title}</p>
                          {task.due_date && (
                            <p className={`text-[10px] mt-0.5 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              Due {task.due_date}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">How it works</h3>
            </div>
            <div className="px-4 py-4 space-y-4">
              {[
                { num: '1', text: 'Create a project — song, EP, or album.' },
                { num: '2', text: 'Chat with your AI Manager, Creative Director, or Publicist.' },
                { num: '3', text: 'Turn advice into tasks and timelines.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {step.num}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Today's artist tasks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {todayDone}<span className="text-base font-normal text-gray-400">/{todayTasks.length}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">due today, done</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">This week's planning</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {weekDone}<span className="text-base font-normal text-gray-400">/{weekTasks.length}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">tasks in next 7 days, done</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Next focus</p>
          {nextFocus ? (
            <>
              <p className="text-sm font-semibold text-gray-800 mt-1 leading-snug line-clamp-2">{nextFocus.title}</p>
              {nextFocus.due_date && <p className="text-xs text-gray-400 mt-0.5">Due {nextFocus.due_date}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">All clear</p>
          )}
        </div>
      </div>
    </div>
  )
}