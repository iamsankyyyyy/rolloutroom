import { Link } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useConversations } from '../hooks/useConversations'
import { getApiError } from '../lib/apiError'

function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block rounded bg-gray-200 animate-pulse ${className}`} />
}

export default function DashboardPage() {
  const {
    data: user,
    isLoading: loadingUser,
    isError: userError,
    error: userErrorObj,
  } = useCurrentUser()

  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: conversations, isLoading: loadingConvs } = useConversations()

  return (
    <div className="space-y-8">

      {/* ── Profile card (proof of real backend data) ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {loadingUser ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>

        ) : userError ? (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-red-700">Could not load your profile</p>
              <p className="text-sm text-red-500 mt-0.5">
                {getApiError(userErrorObj, 'The server returned an error.')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Your token may have expired.{' '}
                <Link to="/login" className="text-indigo-600 hover:underline">
                  Sign in again
                </Link>
              </p>
            </div>
          </div>

        ) : user ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.username}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

        ) : null}
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: projects?.length ?? '—' },
          { label: 'Conversations', value: conversations?.length ?? '—' },
          { label: 'Agent Runs', value: '—' },
          { label: 'Log Entries', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loadingProjects || loadingConvs ? <span className="text-gray-300">…</span> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Recent projects ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {loadingProjects ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects?.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent chats ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Recent Chats</h2>
          <Link to="/chat" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {loadingConvs ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {conversations?.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/chat/${c.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-300 transition">
                  <span className="text-sm font-medium text-gray-800">{c.title}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
