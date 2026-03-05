'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, ListTodo, Target, Plus, Sparkles } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const QUICK_ACTIONS = [
  { icon: ListTodo, label: '今日任务', prompt: 'What are my top priority tasks today?' },
  { icon: Plus, label: 'Add Task', prompt: 'Add task: ' },
  { icon: Target, label: 'Overview', prompt: 'Give me a quick overview of my tasks by quadrant' },
  { icon: Sparkles, label: 'AI Advice', prompt: 'What should I focus on right now and why?' },
]

/**
 * Quadrants AI Chat Widget
 * Uses internal /api/chat endpoint (Clerk auth, no gateway needed)
 */
export function ClawdbotChatWidget() {
  const { isSignedIn } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Only show for signed-in users
  if (!isSignedIn) return null

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])
  useEffect(() => {
    if (isOpen) { inputRef.current?.focus(); setHasUnread(false) }
  }, [isOpen])

  // Extract projectId from URL if on a project page
  const getProjectId = () => {
    if (typeof window === 'undefined') return undefined
    const match = window.location.pathname.match(/\/projects\/([^/]+)/)
    return match?.[1]
  }

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, projectId: getProjectId() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      
      // If an action was executed, refresh the page to show changes
      if (data.action) {
        setTimeout(() => window.location.reload(), 1500)
      }

      if (!isOpen) setHasUnread(true)
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `⚠️ ${err.message || 'Connection failed'}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    if (prompt.endsWith(': ') || prompt.endsWith('：')) {
      setInput(prompt)
      inputRef.current?.focus()
    } else {
      sendMessage(prompt)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed right-4 bottom-[4.5rem] z-50 w-[340px] h-[480px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">Q</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-100">Quadrants AI</span>
                <p className="text-[10px] text-zinc-500 leading-tight">task assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4 mt-4">
                <div className="text-center">
                  <p className="text-zinc-400 text-sm">👋 Hi! I can help manage your tasks</p>
                  <p className="text-zinc-600 text-xs mt-1">Try a quick action or type anything</p>
                </div>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action.label} onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left group">
                      <action.icon size={14} className="text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md'
                    : msg.role === 'system' ? 'bg-amber-900/30 text-amber-300 border border-amber-800/50'
                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/80 border border-zinc-700/50 px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a task or question..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all" />
              <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2.5 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-blue-500/30 hover:shadow-xl'
        }`}>
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  )
}
