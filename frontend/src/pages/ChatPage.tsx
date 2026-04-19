import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useConversation, useSendMessage } from '../hooks/useConversations'
import type { Message } from '../types'

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const conversationId = Number(id)

  const { data: conversation, isLoading } = useConversation(conversationId)
  const { mutate: send, isPending } = useSendMessage(conversationId)

  const [input, setInput] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const allMessages = [...(conversation?.messages ?? []), ...optimisticMessages]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
      conversation_id: conversationId,
    }
    setOptimisticMessages((prev) => [...prev, userMsg])
    setInput('')

    send(userMsg.content, {
      onSuccess: (reply) => setOptimisticMessages((prev) => [...prev, reply]),
    })
  }

  if (isLoading) return <p className="text-sm text-gray-400">Loading conversation…</p>

  if (!conversation) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Conversation not found.</p>
      <Link to="/chat" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
        Back to chats
      </Link>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Link to="/chat" className="text-sm text-indigo-600 hover:underline">← Chats</Link>
        <h1 className="text-lg font-semibold text-gray-900">{conversation.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-3">
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Send a message to start the conversation.</p>
          </div>
        ) : (
          allMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="pt-4 border-t border-gray-200 flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ask the agent something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isPending}
        />
        <button type="submit" disabled={isPending || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">
          Send
        </button>
      </form>
    </div>
  )
}
