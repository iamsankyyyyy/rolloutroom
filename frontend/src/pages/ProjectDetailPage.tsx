import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { useProjectTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { getProjectChat, sendChatMessage, type ChatMessage } from '../api/projects'

const AGENT_META: Record<string, { label: string; bubble: string; nameColor: string; dot: string }> = {
  user: { label: 'You', bubble: 'bg-gray-100 text-gray-800', nameColor: 'text-gray-500', dot: 'bg-gray-400' },
  manager: { label: 'Manager', bubble: 'bg-indigo-50 text-gray-800 border border-indigo-100', nameColor: 'text-indigo-600', dot: 'bg-indigo-500' },
  creative_director: { label: 'Creative Director', bubble: 'bg-purple-50 text-gray-800 border border-purple-100', nameColor: 'text-purple-600', dot: 'bg-purple-500' },
  publicist: { label: 'Publicist', bubble: 'bg-rose-50 text-gray-800 border border-rose-100', nameColor: 'text-rose-600', dot: 'bg-rose-500' },
}

function agentMeta(sender: string) { return AGENT_META[sender] ?? AGENT_META.manager }

const CHANNEL_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'creative_director', label: 'Creative Director' },
  { value: 'publicist', label: 'Publicist' },
]

const TYPE_BADGE: Record<string, string> = {
  song: 'bg-indigo-100 text-indigo-700',
  ep: 'bg-purple-100 text-purple-700',
  album: 'bg-rose-100 text-rose-700',
}

const mdComponents: Components = {
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-0.5">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-relaxed mb-1.5">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  hr: () => <hr className="my-3 border-gray-200" />,
}

function extractTaskTitle(content: string): string {
  const match = content.match(/^[^.!?\n]+[.!?]?/)
  const candidate = match ? match[0].trim() : content.trim()
  return candidate.length > 80 ? candidate.slice(0, 77) + '…' : candidate
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)

  const { data: project, isLoading: loadingProject } = useProject(projectId)
  const { mutate: saveProject, isPending: saving } = useUpdateProject(projectId)

  const { data: tasks = [] } = useProjectTasks(projectId)
  const { mutate: addTask } = useCreateTask(projectId)
  const { mutate: toggleTask } = useUpdateTask(projectId)
  const { mutate: removeTask } = useDeleteTask(projectId)

  const [taskInput, setTaskInput] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskCategory, setTaskCategory] = useState('professional')

  const [taskModalMsg, setTaskModalMsg] = useState<ChatMessage | null>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDue, setModalDue] = useState('')
  const [modalCategory, setModalCategory] = useState('professional')

  const [activeChannel, setActiveChannel] = useState<string>('manager')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('song')
  const [editDesc, setEditDesc] = useState('')
  const [editMood, setEditMood] = useState('')
  const [editGoal, setEditGoal] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!projectId) return
    setLoadingHistory(true)
    setMessages([])
    getProjectChat(projectId, activeChannel)
      .then((res) => setMessages(res.messages))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [projectId, activeChannel])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function openEdit() {
    if (!project) return
    setEditName(project.name)
    setEditType(project.project_type || 'song')
    setEditDesc(project.description ?? '')
    setEditMood(project.mood ?? '')
    setEditGoal(project.goal ?? '')
    setEditing(true)
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    saveProject(
      { name: editName, project_type: editType, description: editDesc || undefined, mood: editMood || undefined, goal: editGoal || undefined },
      { onSuccess: () => setEditing(false) },
    )
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const tempUserMsg: ChatMessage = { id: Date.now(), sender: 'user', content: text, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, tempUserMsg])
    try {
      const res = await sendChatMessage(projectId, text, activeChannel)
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), ...res.messages])
    } catch {
      setMessages((prev) => [...prev, { id: Date.now(), sender: activeChannel, content: 'Something went wrong — please try again.', created_at: new Date().toISOString() }])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleAddTask(e: FormEvent) {
    e.preventDefault()
    if (!taskInput.trim()) return
    addTask(
      { title: taskInput.trim(), due_date: taskDue || null, source: 'manual', category: taskCategory },
      { onSuccess: () => { setTaskInput(''); setTaskDue(''); setTaskCategory('professional') } },
    )
  }

  function openTaskModal(msg: ChatMessage) {
    setModalTitle(extractTaskTitle(msg.content))
    setModalDue('')
    setModalCategory('professional')
    setTaskModalMsg(msg)
  }

  function closeTaskModal() { setTaskModalMsg(null) }

  function handleSaveModalTask(e: FormEvent) {
    e.preventDefault()
    if (!modalTitle.trim()) return
    addTask(
      { title: modalTitle.trim(), due_date: modalDue || null, source: 'manager_message', category: modalCategory },
      { onSuccess: closeTaskModal },
    )
  }

  const activeChannelLabel = CHANNEL_OPTIONS.find((o) => o.value === activeChannel)?.label ?? 'Manager'

  if (loadingProject) return <p className="text-sm text-gray-400 p-6">Loading project…</p>
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Project not found.</p>
      <Link to="/projects" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">← Projects</Link>
    </div>
  )

  const typeBadgeClass = TYPE_BADGE[project.project_type] ?? TYPE_BADGE.song
  const doneTasks = tasks.filter((t) => t.status === 'done').length

  const editForm = (
    <form onSubmit={handleSaveEdit} className="space-y-2.5">
      <input className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Title" value={editName} onChange={(e) => setEditName(e.target.value)} required />
      <select className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={editType} onChange={(e) => setEditType(e.target.value)}>
        <option value="song">Song</option>
        <option value="ep">EP</option>
        <option value="album">Album</option>
      </select>
      <textarea className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={2} placeholder="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mood / Theme" value={editMood} onChange={(e) => setEditMood(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Primary Goal" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </form>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-3 pb-0">
        <Link to="/projects" className="text-xs text-indigo-600 hover:underline">← Projects</Link>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 capitalize ${typeBadgeClass}`}>{project.project_type || 'song'}</span>
          <h1 className="text-base font-bold text-gray-900">{project.name}</h1>
        </div>
        <div className="flex mt-3 -mb-px">
          {CHANNEL_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setActiveChannel(opt.value)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeChannel === opt.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 bg-slate-50">

        {/* Left sidebar: overview — lg+ */}
        <div className="hidden lg:flex w-60 xl:w-72 flex-shrink-0 border-r border-gray-200 bg-white flex-col overflow-y-auto">
          <div className="p-4 flex-1">
            {!editing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Overview</h3>
                  <button onClick={openEdit} className="text-xs text-indigo-600 hover:underline">Edit</button>
                </div>
                {project.description && <p className="text-xs text-gray-700 leading-relaxed">{project.description}</p>}
                <div className="space-y-2">
                  {project.mood && <div><p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Mood</p><p className="text-xs text-gray-600 mt-0.5">{project.mood}</p></div>}
                  {project.goal && <div><p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Goal</p><p className="text-xs text-gray-600 mt-0.5">{project.goal}</p></div>}
                  {!project.description && !project.mood && !project.goal && <p className="text-xs text-gray-400 italic leading-relaxed">No details yet. Add context to get better responses from your agents.</p>}
                </div>
              </div>
            ) : editForm}
          </div>
        </div>

        {/* Center: mobile overview + chat */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile overview — hidden on lg+ */}
          <div className="lg:hidden flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-3">
            {!editing ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-0.5">
                  {project.description && <p className="text-xs text-gray-700 leading-relaxed">{project.description}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {project.mood && <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">Mood:</span> {project.mood}</span>}
                    {project.goal && <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">Goal:</span> {project.goal}</span>}
                    {!project.description && !project.mood && !project.goal && <span className="text-xs text-gray-400 italic">No details added.</span>}
                  </div>
                </div>
                <button onClick={openEdit} className="text-xs text-indigo-600 hover:underline flex-shrink-0">Edit</button>
              </div>
            ) : editForm}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {loadingHistory && <p className="text-xs text-gray-400 text-center pt-8">Loading…</p>}
            {!loadingHistory && messages.length === 0 && (
              <div className="text-center py-12 space-y-1">
                <p className="text-gray-400 text-sm font-medium">{activeChannelLabel}</p>
                <p className="text-gray-400 text-xs">Start the conversation — ask anything about this release.</p>
              </div>
            )}
            {messages.map((msg) => {
              const meta = agentMeta(msg.sender)
              const isUser = msg.sender === 'user'
              const isManager = msg.sender === 'manager'
              return (
                <div key={msg.id} className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isUser ? '' : 'flex gap-2.5'}`}>
                    {!isUser && (
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full ${meta.dot} flex items-center justify-center mt-0.5`}>
                        <span className="text-white text-[10px] font-bold">{meta.label.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      {!isUser && <p className={`text-[11px] font-semibold mb-1 ${meta.nameColor}`}>{meta.label}</p>}
                      <div className={`rounded-2xl px-4 py-2.5 ${meta.bubble} ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                        {isUser ? <p className="text-sm whitespace-pre-wrap">{msg.content}</p> : <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <p className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        {isManager && (
                          <button onClick={() => openTaskModal(msg)} className="text-[10px] font-medium text-indigo-400 hover:text-indigo-600 border border-indigo-200 hover:border-indigo-400 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-indigo-50">
                            + Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center mt-0.5"><span className="text-white text-[10px] font-bold">…</span></div>
                  <div>
                    <p className="text-[11px] font-semibold mb-1 text-gray-400">{activeChannelLabel}</p>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-gray-200">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-4">
            <div className="flex gap-2 items-end">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${activeChannelLabel}… (Enter to send, Shift+Enter for newline)`} rows={2} className="flex-1 resize-none rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition" />
              <button onClick={() => handleSend()} disabled={!input.trim() || sending} className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">Send</button>
            </div>
          </div>
        </div>

        {/* Right sidebar: tasks — md+ */}
        <div className="hidden md:flex w-64 xl:w-72 flex-shrink-0 border-l border-gray-200 bg-white flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tasks</span>
            {tasks.length > 0 && <span className="text-[11px] text-gray-400">{doneTasks}/{tasks.length} done</span>}
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-6">No tasks yet. Hover a Manager message to add one.</p>
            ) : tasks.map((task) => {
              const isDone = task.status === 'done'
              return (
                <div key={task.id} className="group flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <button onClick={() => toggleTask({ taskId: task.id, data: { status: isDone ? 'pending' : 'done' } })}
                    className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border transition-colors ${isDone ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'} flex items-center justify-center`}>
                    {isDone && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug break-words ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {task.due_date && <p className="text-[10px] text-gray-400">{task.due_date}</p>}
                      {task.source === 'manager_message' && <span className="text-[9px] bg-indigo-50 text-indigo-400 rounded px-1 py-0.5 font-medium">Manager</span>}
                    </div>
                  </div>
                  <button onClick={() => removeTask(task.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3">
            <form onSubmit={handleAddTask} className="space-y-1.5">
              <input type="text" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Add a task…" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400" />
              <div className="flex gap-1.5">
                <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500" />
                <button type="submit" disabled={!taskInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">Add</button>
              </div>
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="professional">Professional</option>
                <option value="personal">Personal</option>
              </select>
            </form>
          </div>
        </div>
      </div>

      {/* Modal */}
      {taskModalMsg && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4" onClick={closeTaskModal}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Add as task</h3>
            <p className="text-xs text-gray-400 mb-4">From Manager message</p>
            <form onSubmit={handleSaveModalTask} className="space-y-3">
              <input type="text" value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} placeholder="Task title" autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div>
                <label className="block text-xs text-gray-400 mb-1">Due date (optional)</label>
                <input type="date" value={modalDue} onChange={(e) => setModalDue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select value={modalCategory} onChange={(e) => setModalCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700">
                  <option value="professional">Professional task</option>
                  <option value="personal">Personal schedule</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={!modalTitle.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">Save task</button>
                <button type="button" onClick={closeTaskModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}