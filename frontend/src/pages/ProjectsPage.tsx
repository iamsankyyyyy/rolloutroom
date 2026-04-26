import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useCreateProject } from '../hooks/useProjects'

const PROJECT_TYPES = [
  { value: 'song', label: 'Song' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
]

const TYPE_BADGE: Record<string, string> = {
  song: 'bg-indigo-100 text-indigo-700',
  ep: 'bg-purple-100 text-purple-700',
  album: 'bg-rose-100 text-rose-700',
}

const TYPE_BORDER: Record<string, string> = {
  song: 'border-l-indigo-400',
  ep: 'border-l-purple-400',
  album: 'border-l-rose-400',
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const { mutate: create, isPending } = useCreateProject()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [projectType, setProjectType] = useState('song')
  const [description, setDescription] = useState('')
  const [mood, setMood] = useState('')
  const [goal, setGoal] = useState('')

  const [filterType, setFilterType] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    create(
      {
        name,
        project_type: projectType,
        description: description || undefined,
        mood: mood || undefined,
        goal: goal || undefined,
      },
      {
        onSuccess: () => {
          setName('')
          setProjectType('song')
          setDescription('')
          setMood('')
          setGoal('')
          setShowForm(false)
        },
      },
    )
  }

  const filtered = (projects ?? [])
    .filter((p) => filterType === 'all' || p.project_type === filterType)
    .sort((a, b) => {
      if (sortOrder === 'newest')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === 'oldest')
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortOrder === 'az') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-800">New project</h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 4:444"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
              placeholder="A short note about this release — helps your team give better advice."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mood / Theme <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. late-night, reflective"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Goal <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. playlist adds, TikTok traction"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      {/* Filter + sort controls */}
      {!isLoading && (projects?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'song', label: 'Song' },
              { value: 'ep', label: 'EP' },
              { value: 'album', label: 'Album' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === opt.value
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A – Z</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading projects…</p>
      ) : projects?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No projects yet.</p>
          <p className="text-gray-400 text-xs mt-1">Create one to start chatting with your team.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 text-sm">No projects match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className={`bg-white rounded-xl border border-gray-200 border-l-4 ${
                TYPE_BORDER[p.project_type] ?? TYPE_BORDER.song
              } p-5 hover:shadow-sm transition block`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[11px] font-medium rounded-full px-2 py-0.5 capitalize ${
                    TYPE_BADGE[p.project_type] ?? TYPE_BADGE.song
                  }`}
                >
                  {p.project_type}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{p.name}</p>
              {p.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
              )}
              {!p.description && p.mood && (
                <p className="text-xs text-gray-400 mt-1">Mood: {p.mood}</p>
              )}
              {p.goal && (
                <p className="text-xs text-gray-400 mt-1">Goal: {p.goal}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Updated {new Date(p.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}