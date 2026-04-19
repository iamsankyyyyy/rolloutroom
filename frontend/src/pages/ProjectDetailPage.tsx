import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { useConversations, useCreateConversation } from '../hooks/useConversations'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const { data: project, isLoading } = useProject(projectId)
  const { data: conversations } = useConversations(projectId)
  const { mutate: createConv, isPending } = useCreateConversation()

  function handleNewChat() {
    createConv({ project_id: projectId, title: 'New conversation' })
  }

  if (isLoading) return <p className="text-sm text-gray-400">Loading project…</p>

  if (!project) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Project not found.</p>
      <Link to="/projects" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
        Back to projects
      </Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-sm text-indigo-600 hover:underline">← Projects</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.name}</h1>
        {project.description && (
          <p className="text-gray-500 text-sm mt-1">{project.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Created {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
          <button onClick={handleNewChat} disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">
            {isPending ? 'Creating…' : '+ New chat'}
          </button>
        </div>

        {conversations?.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400 text-sm">No conversations yet.</p>
            <button onClick={handleNewChat} className="text-indigo-600 text-sm mt-2 hover:underline">
              Start the first one
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations?.map((c) => (
              <li key={c.id}>
                <Link to={`/chat/${c.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-indigo-300 transition">
                  <span className="text-sm font-medium text-gray-800">{c.title}</span>
                  <span className="text-xs text-gray-400">
                    {c.messages.length} msg{c.messages.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Link to={`/logs?project_id=${project.id}`}
          className="text-sm text-gray-500 hover:text-indigo-600 hover:underline">
          View logs for this project →
        </Link>
      </div>
    </div>
  )
}
