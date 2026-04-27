import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useProjects, useCreateProject } from '../hooks/useProjects'
import { useProjectTasks } from '../hooks/useTasks'
import { apiClient } from '../api/client'

type AgentId = 'manager' | 'publicist' | 'creative_director'

const AGENT_DEFAULTS: Record<AgentId, string> = {
  manager: 'My Manager',
  publicist: 'My Publicist',
  creative_director: 'My Visual Artist',
}

function getStoredName(id: AgentId): string {
  return localStorage.getItem(`rr_agent_name_${id}`) ?? AGENT_DEFAULTS[id]
}

const AGENTS = [
  {
    id: 'manager' as AgentId,
    tagline: 'Strategy, timelines & release planning',
    description:
      'Get a structured rollout plan, release checklist, or career advice tailored to your project.',
    colorClass: {
      selectedCard: 'border-indigo-400 bg-indigo-50',
      badge: 'bg-indigo-100 text-indigo-700',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      dot: 'bg-indigo-400',
      header: 'bg-indigo-50 border-indigo-100',
      typing: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      tasksBorder: 'border-indigo-200',
      tasksHeader: 'bg-indigo-50 border-indigo-100',
      indexLink: 'text-indigo-400 hover:text-indigo-600',
    },
    examplePrompt: "I'm dropping a single in 3 weeks — what should I do to prepare?",
  },
  {
    id: 'publicist' as AgentId,
    tagline: 'Press pitches, promo copy & playlist campaigns',
    description:
      'Craft IG captions, press pitches, playlist submission emails, and campaign messaging for any release.',
    colorClass: {
      selectedCard: 'border-rose-400 bg-rose-50',
      badge: 'bg-rose-100 text-rose-700',
      btn: 'bg-rose-600 hover:bg-rose-700',
      dot: 'bg-rose-400',
      header: 'bg-rose-50 border-rose-100',
      typing: 'bg-rose-50 text-rose-600 border-rose-100',
      tasksBorder: 'border-rose-200',
      tasksHeader: 'bg-rose-50 border-rose-100',
      indexLink: 'text-rose-400 hover:text-rose-600',
    },
    examplePrompt: "Write a press pitch and IG caption for my dark pop single dropping this Friday.",
  },
  {
    id: 'creative_director' as AgentId,
    tagline: 'Cover art briefs, aesthetics & content direction',
    description:
      'Define the visual identity of a release — cover art brief, moodboard direction, and content aesthetic.',
    colorClass: {
      selectedCard: 'border-amber-400 bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
      btn: 'bg-amber-600 hover:bg-amber-700',
      dot: 'bg-amber-400',
      header: 'bg-amber-50 border-amber-100',
      typing: 'bg-amber-50 text-amber-600 border-amber-100',
      tasksBorder: 'border-amber-200',
      tasksHeader: 'bg-amber-50 border-amber-100',
      indexLink: 'text-amber-500 hover:text-amber-700',
    },
    examplePrompt: "I need a cover art brief and visual concept for a melancholy R&B EP.",
  },
]

interface ChatMsg {
  sender: string
  content: string
}

function extractSuggestions(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(?:[-•*]|\d+[.)]) .{5,}/.test(l))
    .map((l) => l.replace(/^(?:[-•*]|\d+[.)]) /, '').trim())
    .filter(Boolean)
}

function TypingBubble({ name, colorClass }: { name: string; colorClass: { typing: string } }) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-medium ${colorClass.typing}`}
    >
      <span>{name} is typing</span>
      <span className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
    </div>
  )
}

export default function AgentChatsPage() {
  const { data: projects = [] } = useProjects()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { mutate: createProjectMutate } = useCreateProject()

  const [selectedAgent, setSelectedAgent] = useState<AgentId>('manager')
  const [projectId, setProjectId] = useState('')
  const [message, setMessage] = useState('')
  const [sentMessage, setSentMessage] = useState('')
  const [response, setResponse] = useState<ChatMsg | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [savingTasks, setSavingTasks] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Per-agent display name (localStorage-backed)
  const [agentNames, setAgentNames] = useState<Record<AgentId, string>>(() => ({
    manager: getStoredName('manager'),
    publicist: getStoredName('publicist'),
    creative_director: getStoredName('creative_director'),
  }))
  const [editingAgent, setEditingAgent] = useState<AgentId | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // New-project inline form
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [newProjType, setNewProjType] = useState<'song' | 'ep' | 'album'>('song')
  const [creatingProject, setCreatingProject] = useState(false)

  const agent = AGENTS.find((a) => a.id === selectedAgent)!
  const displayName = agentNames[selectedAgent]

  // Tasks for the selected project (shown in right panel)
  const { data: projectTasks = [] } = useProjectTasks(Number(projectId) || 0)

  // Selected project object (for display)
  const selectedProject = projects.find((p) => String(p.id) === projectId)

  useEffect(() => {
    if (editingAgent && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingAgent])

  function commitAgentName(id: AgentId, name: string) {
    const trimmed = name.trim() || AGENT_DEFAULTS[id]
    localStorage.setItem(`rr_agent_name_${id}`, trimmed)
    setAgentNames((prev) => ({ ...prev, [id]: trimmed }))
    setEditingAgent(null)
  }

  function handleProjectChange(value: string) {
    if (value === '__new__') {
      setShowNewProject(true)
      setProjectId('')
    } else {
      setProjectId(value)
      setShowNewProject(false)
      setResponse(null)
      setSuggestions([])
      setChecked(new Set())
    }
  }

  function handleCreateProject() {
    if (!newProjName.trim()) return
    setCreatingProject(true)
    createProjectMutate(
      { name: newProjName.trim(), project_type: newProjType },
      {
        onSuccess: (proj) => {
          setProjectId(String(proj.id))
          setShowNewProject(false)
          setNewProjName('')
          setNewProjType('song')
          setCreatingProject(false)
        },
        onError: () => setCreatingProject(false),
      },
    )
  }

  async function handleSend() {
    if (!projectId || !message.trim() || isTyping) return

    const msgSnapshot = message.trim()
    const delay = Math.min(2500, 50 * msgSnapshot.length)

    setSentMessage(msgSnapshot)
    setMessage('')
    setResponse(null)
    setSuggestions([])
    setChecked(new Set())
    setSavedCount(0)
    setShowToast(false)
    setIsTyping(true)

    await new Promise((r) => setTimeout(r, delay))

    try {
      const res = await apiClient.post<{ messages: ChatMsg[] }>(
        `/projects/${projectId}/chat`,
        { message: msgSnapshot, channel: selectedAgent },
      )
      const reply = res.data.messages.find((m) => m.sender !== 'user')
      if (reply) {
        setResponse(reply)
        const sugs = extractSuggestions(reply.content)
        setSuggestions(sugs)
        setChecked(new Set(sugs.map((_, i) => i)))
      }
    } finally {
      setIsTyping(false)
    }
  }

  async function handleSaveTasks() {
    if (!projectId || checked.size === 0) return
    setSavingTasks(true)
    try {
      for (const idx of checked) {
        await apiClient.post(`/projects/${projectId}/tasks`, {
          title: suggestions[idx],
          source: 'agent_suggestion',
          source_agent: selectedAgent,
          category: 'professional',
        })
      }
      qc.invalidateQueries({ queryKey: ['tasks', Number(projectId)] })
      qc.invalidateQueries({ queryKey: ['tasks', 'user'] })
      setSavedCount(checked.size)
      setShowToast(true)
      setChecked(new Set())
      setTimeout(() => setShowToast(false), 5000)
    } finally {
      setSavingTasks(false)
    }
  }

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Chats</h1>
        <p className="text-sm text-gray-500 mt-1">
          Brief your AI team, get advice, and turn suggestions into tasks.
        </p>
      </div>

      {/* Agent selector cards — click body to select, "View all chats" link to index */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((ag) => {
          const name = agentNames[ag.id]
          const isSelected = selectedAgent === ag.id
          const isEditingThis = editingAgent === ag.id
          return (
            <div
              key={ag.id}
              onClick={() => {
                if (!isEditingThis) {
                  setSelectedAgent(ag.id)
                  setResponse(null)
                  setSuggestions([])
                  setChecked(new Set())
                }
              }}
              className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col ${
                isSelected
                  ? ag.colorClass.selectedCard + ' shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Name row + rename pencil */}
              <div className="flex items-center gap-1.5 mb-2">
                {isEditingThis ? (
                  <input
                    ref={editInputRef}
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={() => commitAgentName(ag.id, editNameValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitAgentName(ag.id, editNameValue)
                      if (e.key === 'Escape') setEditingAgent(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold bg-white border border-indigo-300 rounded px-1.5 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                ) : (
                  <>
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${ag.colorClass.badge}`}>
                      {name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingAgent(ag.id)
                        setEditNameValue(name)
                      }}
                      title="Rename agent"
                      className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 ml-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                        <path
                          d="M8.5 1.5l2 2-6.5 6.5H2V7.5l6.5-6z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
                {isSelected && !isEditingThis && (
                  <span className={`w-2 h-2 rounded-full ml-auto flex-shrink-0 ${ag.colorClass.dot}`} />
                )}
              </div>

              <p className="text-xs font-semibold text-gray-700">{ag.tagline}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed flex-1">{ag.description}</p>

              {/* "View all chats" link — navigates to index page */}
              <div
                className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  to={`/agent-chats/${ag.id}`}
                  className={`text-[11px] font-medium transition-colors ${ag.colorClass.indexLink}`}
                >
                  View all {name} chats →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Two-column layout: left = chat, right = tasks panel + continue CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* ── LEFT: brief form + typing + response + turn-into-tasks ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Brief form */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className={`px-5 py-3.5 border-b flex items-center gap-2 ${agent.colorClass.header}`}>
              <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${agent.colorClass.badge}`}>
                {displayName}
              </span>
              <span className="text-sm text-gray-600 font-medium">— send a brief</span>
              <span className="text-xs text-gray-400 ml-auto hidden sm:block">
                Saved to project chat history
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Project selector */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Project
                </label>
                <select
                  value={showNewProject ? '__new__' : projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.project_type})
                    </option>
                  ))}
                  <option value="__new__">+ New project…</option>
                </select>
              </div>

              {/* Inline new-project form */}
              {showNewProject && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-indigo-700">Create a new project</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject() }}
                      placeholder="Project name…"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={newProjType}
                      onChange={(e) => setNewProjType(e.target.value as 'song' | 'ep' | 'album')}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="song">Song</option>
                      <option value="ep">EP</option>
                      <option value="album">Album</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateProject}
                      disabled={creatingProject || !newProjName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors"
                    >
                      {creatingProject ? 'Creating…' : 'Create & select'}
                    </button>
                    <button
                      onClick={() => { setShowNewProject(false); setNewProjName('') }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Brief textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Your brief
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
                  }}
                  rows={4}
                  placeholder={agent.examplePrompt}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">⌘/Ctrl + Enter to send</p>
              </div>

              <button
                onClick={handleSend}
                disabled={isTyping || !projectId || !message.trim()}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 ${agent.colorClass.btn}`}
              >
                {isTyping ? 'Waiting for reply…' : `Send to ${displayName} →`}
              </button>
            </div>
          </div>

          {/* Sent message echo */}
          {(isTyping || response) && sentMessage && (
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
                {sentMessage}
              </div>
            </div>
          )}

          {/* Typing bubble */}
          {isTyping && (
            <div>
              <TypingBubble name={displayName} colorClass={agent.colorClass} />
            </div>
          )}

          {/* Agent response */}
          {response && !isTyping && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className={`px-5 py-3 border-b flex items-center gap-2 ${agent.colorClass.header}`}>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${agent.colorClass.badge}`}>
                  {displayName}
                </span>
                <span className="text-xs text-gray-400">replied</span>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {response.content}
                </p>
              </div>
            </div>
          )}

          {/* Turn this into tasks */}
          {suggestions.length > 0 && !isTyping && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-indigo-100 bg-indigo-50">
                <h3 className="text-sm font-semibold text-indigo-800">Turn this into tasks</h3>
                <p className="text-xs text-indigo-500 mt-0.5">
                  Select suggestions to add to your task list
                </p>
              </div>

              <div className="px-5 py-1 divide-y divide-gray-50">
                {suggestions.map((sug, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(i)}
                      onChange={() => toggleCheck(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                    />
                    <span className={`text-sm leading-snug ${checked.has(i) ? 'text-gray-800' : 'text-gray-500'}`}>
                      {sug}
                    </span>
                  </label>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-indigo-100 bg-indigo-50/60 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSaveTasks}
                  disabled={savingTasks || checked.size === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors"
                >
                  {savingTasks
                    ? 'Adding…'
                    : checked.size === 0
                    ? 'Select tasks above'
                    : `Add ${checked.size} selected task${checked.size !== 1 ? 's' : ''} to my list`}
                </button>
                <button
                  onClick={() => setChecked(new Set(suggestions.map((_, i) => i)))}
                  className="text-xs text-indigo-500 hover:underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => setChecked(new Set())}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Success toast */}
              {showToast && (
                <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">
                    {savedCount} task{savedCount !== 1 ? 's' : ''} added to your Tasks list.
                  </span>
                  <Link
                    to="/tasks"
                    className="text-xs text-green-600 font-semibold hover:underline ml-4 flex-shrink-0"
                  >
                    View tasks →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: tasks panel + "Continue in project chat" CTA ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Continue in project chat — shown whenever a project is selected */}
          {projectId && selectedProject && (
            <div className="bg-white rounded-2xl border-2 border-indigo-300 overflow-hidden">
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                  Your reply is saved
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  This conversation is part of{' '}
                  <span className="font-semibold text-gray-700">{selectedProject.name}</span>.
                  Head to the project page to see the full history and continue chatting.
                </p>
                <button
                  onClick={() => navigate(`/projects/${projectId}?agent=${selectedAgent}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Continue in project chat →
                </button>
              </div>
            </div>
          )}

          {/* Tasks panel */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden lg:sticky lg:top-4">
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                projectId ? agent.colorClass.tasksHeader : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Tasks for this project</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Populated from agent suggestions</p>
              </div>
              {projectId && projectTasks.length > 0 && (
                <Link
                  to="/tasks"
                  className="text-xs text-indigo-500 hover:underline flex-shrink-0 ml-3"
                >
                  View all →
                </Link>
              )}
            </div>

            {!projectId ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-gray-400">Select a project above to see its tasks here.</p>
              </div>
            ) : projectTasks.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-2">
                <p className="text-sm font-medium text-gray-500">No tasks yet.</p>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                  Chat with your agent and click{' '}
                  <span className="font-semibold text-indigo-500">"Add selected tasks to my list"</span>{' '}
                  to send suggestions here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {projectTasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${
                        task.status === 'done' ? 'bg-green-400' : 'bg-indigo-300'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${
                          task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Due {task.due_date}</p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 text-[9px] font-medium rounded-full px-1.5 py-0.5 mt-0.5 ${
                        task.status === 'done'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {task.status === 'done' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
                {projectTasks.length > 10 && (
                  <div className="px-4 py-3 text-center">
                    <Link to="/tasks" className="text-xs text-indigo-500 hover:underline">
                      +{projectTasks.length - 10} more →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}