import { Link, useParams } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'

type AgentId = 'manager' | 'publicist' | 'creative_director'

const AGENT_META: Record<AgentId, {
  defaultName: string
  tagline: string
  badge: string
  headerBg: string
  dot: string
}> = {
  manager: {
    defaultName: 'My Manager',
    tagline: 'Strategy, release timelines & planning',
    badge: 'bg-indigo-100 text-indigo-700',
    headerBg: 'from-indigo-50 to-white border-indigo-100',
    dot: 'bg-indigo-500',
  },
  publicist: {
    defaultName: 'My Publicist',
    tagline: 'Press pitches, promo copy & playlist campaigns',
    badge: 'bg-rose-100 text-rose-700',
    headerBg: 'from-rose-50 to-white border-rose-100',
    dot: 'bg-rose-500',
  },
  creative_director: {
    defaultName: 'My Visual Artist',
    tagline: 'Cover art briefs, aesthetics & content direction',
    badge: 'bg-amber-100 text-amber-700',
    headerBg: 'from-amber-50 to-white border-amber-100',
    dot: 'bg-amber-500',
  },
}

const TYPE_BADGE: Record<string, string> = {
  song: 'bg-indigo-100 text-indigo-700',
  ep: 'bg-purple-100 text-purple-700',
  album: 'bg-rose-100 text-rose-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AgentChatIndexPage() {
  const { agentId } = useParams<{ agentId: string }>()
  const { data: projects = [], isLoading } = useProjects()

  const safeAgentId = (agentId && agentId in AGENT_META ? agentId : 'manager') as AgentId
  const meta = AGENT_META[safeAgentId]
  const displayName =
    localStorage.getItem(`rr_agent_name_${safeAgentId}`) ?? meta.defaultName

  // Sort projects newest-first
  const sorted = [...projects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <Link to="/agent-chats" className="text-xs text-indigo-600 hover:underline">
          ← Agent Chats
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <span className={`w-9 h-9 rounded-full ${meta.dot} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">{displayName.charAt(0)}</span>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">{meta.tagline}</p>
          </div>
        </div>
      </div>

      {/* Instruction banner */}
      <div className={`bg-gradient-to-r ${meta.headerBg} border rounded-xl px-5 py-4`}>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Choose a project</span> to open its full conversation with {displayName}.
          Each project has its own saved chat history.
        </p>
      </div>

      {/* Project list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading projects…</p>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-400 text-sm">No projects yet.</p>
          <Link
            to="/projects"
            className="text-indigo-600 text-sm mt-2 inline-block hover:underline"
          >
            Create your first project →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}?agent=${safeAgentId}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              {/* Agent dot */}
              <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${meta.dot}`} />

              {/* Type badge */}
              <span
                className={`text-[11px] font-medium rounded-full px-2 py-0.5 capitalize flex-shrink-0 ${
                  TYPE_BADGE[project.project_type] ?? TYPE_BADGE.song
                }`}
              >
                {project.project_type || 'song'}
              </span>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">
                  {project.name}
                </p>
                {project.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{project.description}</p>
                )}
                {!project.description && project.mood && (
                  <p className="text-xs text-gray-400 mt-0.5">Mood: {project.mood}</p>
                )}
              </div>

              {/* Last updated */}
              <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                {formatDate(project.updated_at)}
              </span>

              {/* CTA */}
              <span className="text-xs font-semibold text-indigo-500 group-hover:text-indigo-700 flex-shrink-0 transition-colors">
                Open chat →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick-brief link */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Want to send a quick brief without opening the full project?{' '}
          <Link to="/agent-chats" className="text-indigo-500 hover:underline font-medium">
            Use Agent Chats →
          </Link>
        </p>
      </div>
    </div>
  )
}