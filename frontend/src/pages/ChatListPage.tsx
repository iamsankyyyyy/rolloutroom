import { Link } from 'react-router-dom'
import { useConversations } from '../hooks/useConversations'

export default function ChatListPage() {
  const { data: conversations, isLoading } = useConversations()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : conversations?.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-400">No conversations yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Start one from a{' '}
            <Link to="/projects" className="text-indigo-600 hover:underline">project</Link>.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations?.map((c) => (
            <li key={c.id}>
              <Link to={`/chat/${c.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-4 hover:border-indigo-300 hover:shadow-sm transition">
                <div>
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Project #{c.project_id} · {c.messages.length} message{c.messages.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
