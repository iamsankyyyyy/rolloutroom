import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProjects } from '../hooks/useProjects'
import { apiClient } from '../api/client'

type AgentId = 'manager' | 'publicist' | 'creative_director'

const AGENTS = [
  {
    id: 'manager' as AgentId,
    name: 'Artist Manager',
    tagline: 'Strategy, timelines & release planning',
    description: 'Get a structured rollout plan, release checklist, or career advice tailored to your project.',
    colorClass: {
      selectedCard: 'border-indigo-400 bg-indigo-50',
      badge: 'bg-indigo-100 text-indigo-700',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
      dot: 'bg-indigo-400',
      header: 'bg-indigo-50 border-indigo-100',
    },
    examplePrompt: "I'm dropping a single in 3 weeks — what should I do to prepare?",
  },
  {
    id: 'publicist' as AgentId,
    name: 'Publicist',
    tagline: 'Press pitches, promo copy & playlist campaigns',
    description: 'Craft IG captions, press pitches, playlist submission emails, and campaign messaging for any release.',
    colorClass: {
      selectedCard: 'border-rose-400 bg-rose-50',
      badge: 'bg-rose-100 text-rose-700',
      btn: 'bg-rose-600 hover:bg-rose-700',
      dot: 'bg-rose-400',
      header: 'bg-rose-50 border-rose-100',
    },
    examplePrompt: "Write a press pitch and IG caption for my dark pop single dropping this Friday.",
  },
  {
    id: 'creative_director' as AgentId,
    name: 'Visual Artist',
    tagline: 'Cover art briefs, aesthetics & content direction',
    description: 'Define the visual identity of a release — cover art brief, moodboard direction, and content aesthetic.',
    colorClass: {
      selectedCard: 'border-amber-400 bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
      btn: 'bg-amber-600 hover:bg-amber-700',
      dot: 'bg-amber-400',
      header: 'bg-amber-50 border-amber-100',
    },
    examplePrompt: "I need a cover art brief and visual concept for a melancholy R&B EP.",
  },
]

interface ChatMsg { sender: string; content: string }

function extractSuggestions(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(?:[-•*]|\d+[.)]) .{5,}/.test(l))
    .map((l) => l.replace(/^(?:[-•*]|\d+[.)]) /, '').trim())
    .filter(Boolean)
}

export default function AgentDeskPage() {
  const { data: projects = [] } = useProjects()
  const qc = useQueryClient()

  const [selectedAgent, setSelectedAgent] = useState<AgentId>('manager')
  const [projectId, setProjectId] = useState('')
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState<ChatMsg | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [savingTasks, setSavingTasks] = useState(false)
  const [tasksSaved, setTasksSaved] = useState(false)

  const agent = AGENTS.find((a) => a.id === selectedAgent)!

  const { mutate: sendBrief, isPending } = useMutation({
    mutationFn: async (vars: { pid: number; msg: string; channel: string }) => {
      const res = await apiClient.post<{ messages: ChatMsg[] }>(
        `/projects/${vars.pid}/chat`,
        { message: vars.msg, channel: vars.channel },
      )
      return res.data.messages
    },
    onSuccess: (messages) => {
      const reply = messages.find((m) => m.sender !== 'user')
      if (reply) {
        setResponse(reply)
        const sugs = extractSuggestions(reply.content)
        setSuggestions(sugs)
        setChecked(new Set(sugs.map((_, i) => i)))
        setTasksSaved(false)
      }
    },
  })

  function handleSend() {
    if (!projectId || !message.trim()) return
    setResponse(null); setSuggestions([])
    sendBrief({ pid: Number(projectId), msg: message.trim(), channel: selectedAgent })
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
      setTasksSaved(true); setChecked(new Set())
    } finally {
      setSavingTasks(false)
    }
  }

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Desk</h1>
        <p className="text-sm text-gray-500 mt-1">Brief your AI team, get advice, and save their suggestions as tasks.</p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AGENTS.map((ag) => (
          <button key={ag.id} onClick={() => { setSelectedAgent(ag.id); setResponse(null); setSuggestions([]) }}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              selectedAgent === ag.id ? ag.colorClass.selectedCard + ' shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}>
            <div className="flex items-start justify-between mb-2">
              <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${ag.colorClass.badge}`}>{ag.name}</span>
              {selectedAgent === ag.id && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${ag.colorClass.dot}`} />}
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-1">{ag.tagline}</p>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{ag.description}</p>
          </button>
        ))}
      </div>

      {/* Brief form */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">Brief your {agent.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Responses are saved to the project's chat history so the full team has context.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project</label>
            <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setResponse(null); setSuggestions([]) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.project_type})</option>)}
            </select>
            {projects.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No projects yet — <a href="/projects" className="text-indigo-500 hover:underline">create one first</a>.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your brief</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              placeholder={agent.examplePrompt}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <button onClick={handleSend} disabled={isPending || !projectId || !message.trim()}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40 ${agent.colorClass.btn}`}>
            {isPending ? 'Sending…' : `Send to ${agent.name} →`}
          </button>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className={`px-5 py-3 border-b flex items-center gap-2 ${agent.colorClass.header}`}>
            <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${agent.colorClass.badge}`}>{agent.name}</span>
            <span className="text-xs text-gray-400">replied</span>
          </div>
          <div className="px-5 py-5">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{response.content}</p>
          </div>
        </div>
      )}

      {/* Suggested tasks */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-indigo-700">Suggested tasks ({suggestions.length})</h3>
              <p className="text-xs text-indigo-400 mt-0.5">Tick the ones to add to this project</p>
            </div>
            {tasksSaved && <span className="text-xs text-green-600 font-medium">Saved to project.</span>}
          </div>
          <div className="px-5 py-1 divide-y divide-gray-50">
            {suggestions.map((sug, i) => (
              <label key={i} className="flex items-start gap-3 py-2.5 cursor-pointer">
                <input type="checkbox" checked={checked.has(i)} onChange={() => toggleCheck(i)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className={`text-sm leading-snug ${checked.has(i) ? 'text-gray-800' : 'text-gray-500'}`}>{sug}</span>
              </label>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            <button onClick={handleSaveTasks} disabled={savingTasks || checked.size === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {savingTasks ? 'Saving…' : checked.size === 0 ? 'Select tasks to save' : `Save ${checked.size} task${checked.size > 1 ? 's' : ''} to project`}
            </button>
            <button onClick={() => setChecked(new Set(suggestions.map((_, i) => i)))} className="text-xs text-indigo-500 hover:underline">Select all</button>
            <button onClick={() => setChecked(new Set())} className="text-xs text-gray-400 hover:underline">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}