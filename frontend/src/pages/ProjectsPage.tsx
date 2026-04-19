import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useCreateProject } from '../hooks/useProjects'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const { mutate: create, isPending } = useCreateProject()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    create(
      { name, description },
      { onSuccess: () => { setName(''); setDescription(''); setShowForm(false) } },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">New project</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading projects…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition block">
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
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
