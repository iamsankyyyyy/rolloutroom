import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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

      {/* Overdue banner */}
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
            <span className="font-semibold">{dueSoonTasks.length} task{dueSoonTasks.length > 1 ? 's' : ''} due today or tomorrow.</span>
          </span>
          <Link to="/tasks" className="text-xs text-amber-600 font-medium hover:underline flex-shrink-0 ml-4">View →</Link>
        </div>
      )}

      {/* 2-column layout — stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero card — tighter padding on mobile */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-white rounded-2xl border border-indigo-100 px-4 py-7 sm:px-8 sm:py-10">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">RolloutRoom</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {greeting}, {user?.artist_name || user?.username || '…'}.
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg">
              Your AI release team — Manager, Creative Director, and Publicist — ready to work on each project.
            </p>
            {/* CTA buttons stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6">
              <Link to="/projects" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors text-center">
                + New project
              </Link>
              <Link to="/agent-chats" className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors text-center">
                Open Agent Chats
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

        {/* Right sidebar */}
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
                    const dueToday = task.due_date === today
                    const dueTom = task.due_date === tomorrow
                    return (
                      <li key={task.id} className="flex items-start gap-2.5">
                        <span className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${overdue ? 'bg-red-400' : 'bg-indigo-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 leading-snug">{task.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {task.due_date && (
                              <p className={`text-[10px] ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                Due {task.due_date}
                              </p>
                            )}
                            {overdue && <span className="text-[9px] font-semibold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">Overdue</span>}
                            {dueToday && <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">Today</span>}
                            {dueTom && <span className="text-[9px] font-semibold bg-yellow-100 text-yellow-700 rounded-full px-1.5 py-0.5">Tomorrow</span>}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* How it works — clickable steps */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">How it works</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Click any step to get started</p>
            </div>
            <div className="px-3 py-3 space-y-1">
              {[
                { num: '1', text: 'Create a project — song, EP, or album.', to: '/projects', action: 'Start →' },
                { num: '2', text: 'Chat with My Manager, Publicist, or Visual Artist.', to: '/agent-chats', action: 'Chat →' },
                { num: '3', text: 'Turn advice into tasks and timelines.', to: '/tasks', action: 'Tasks →' },
              ].map((step) => (
                <button
                  key={step.num}
                  onClick={() => navigate(step.to)}
                  className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-indigo-50 transition-colors group text-left cursor-pointer"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {step.num}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed flex-1 group-hover:text-indigo-700 transition-colors">
                    {step.text}
                  </p>
                  <span className="text-[10px] text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                    {step.action}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip — tighter gap on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Today</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {todayDone}<span className="text-sm sm:text-base font-normal text-gray-400">/{todayTasks.length}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">due today, done</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Week</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {weekDone}<span className="text-sm sm:text-base font-normal text-gray-400">/{weekTasks.length}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">tasks in 7 days, done</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Next</p>
          {nextFocus ? (
            <>
              <p className="text-xs font-semibold text-gray-800 mt-1 leading-snug line-clamp-2">{nextFocus.title}</p>
              {nextFocus.due_date && <p className="text-[10px] text-gray-400 mt-0.5">{nextFocus.due_date}</p>}
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-1">All clear</p>
          )}
        </div>
      </div>

      {/* ── Dashboard-only expanded footer ── */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 mt-6">
        {/* Dark hero band — tighter padding on mobile */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 text-white px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">About RolloutRoom</p>
          <h2 className="text-lg sm:text-xl font-bold leading-snug max-w-lg">
            A full AI release team in your pocket — built for solo artists who don't have a label.
          </h2>
          <p className="text-sm text-gray-400 mt-3 max-w-xl leading-relaxed">
            RolloutRoom gives every independent artist access to the kind of strategic, creative, and promotional support
            that major-label acts take for granted. No agency fees. No waiting on emails.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-5 sm:mt-6">
            <Link
              to="/projects"
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors text-center"
            >
              Start a project
            </Link>
            <Link
              to="/agent-chats"
              className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors text-center"
            >
              Meet your agents
            </Link>
          </div>
        </div>

        {/* Three-column info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-white">
          <div className="px-5 sm:px-6 py-7 sm:py-8">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">For solo artists</h4>
            <ul className="space-y-3">
              {[
                'Plan releases without a label or management.',
                'Stay on top of deadlines, tasks & content schedules.',
                'Get tailored advice tuned to your genre and goals.',
              ].map((line) => (
                <li key={line} className="flex gap-2.5 text-xs text-gray-600 leading-relaxed">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold mt-0.5">→</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-5 sm:px-6 py-7 sm:py-8">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your AI team</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-indigo-600">Manager</p>
                <p className="text-xs text-gray-500 mt-0.5">Release strategy, timelines & career planning.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-600">Publicist</p>
                <p className="text-xs text-gray-500 mt-0.5">Press pitches, IG captions & playlist campaigns.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600">Visual Artist</p>
                <p className="text-xs text-gray-500 mt-0.5">Cover art briefs, moodboards & content aesthetics.</p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-7 sm:py-8">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Project workflow</h4>
            <div className="space-y-3">
              {[
                { n: '1', text: 'Create a project for your song, EP, or album.' },
                { n: '2', text: 'Chat with your agents and get tailored advice.' },
                { n: '3', text: 'Turn suggestions into tasks with one click.' },
              ].map((s) => (
                <div key={s.n} className="flex gap-2.5 items-start">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold flex items-center justify-center mt-0.5">
                    {s.n}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Built as a Final Year Project exploring AI-driven tools for independent artists in the music industry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}