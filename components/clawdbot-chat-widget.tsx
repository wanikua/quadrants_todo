'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, ListTodo, Target, Plus } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface ClawdbotChatWidgetProps {
  gatewayUrl?: string
  gatewayToken?: string
  position?: 'bottom-right' | 'bottom-left'
  projectId?: string
}

const QUICK_ACTIONS = [
  { icon: ListTodo, label: '今日任务', prompt: '看看我今天最优先的任务' },
  { icon: Plus, label: '加任务', prompt: '帮我加个任务：' },
  { icon: Target, label: '项目概览', prompt: '项目概览' },
  { icon: Sparkles, label: 'AI整理', prompt: '帮我分析一下任务优先级' },
]

/**
 * Clawdbot Chat Widget — embedded AI assistant for Quadrants
 * Connects to Clawdbot Gateway API for natural language task management
 */
export function ClawdbotChatWidget({
  gatewayUrl = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL || '',
  gatewayToken = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_TOKEN || '',
  position = 'bottom-right',
  projectId,
}: ClawdbotChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Don't render if gateway is not configured
  if (!gatewayUrl || !gatewayToken) {
    return null
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setHasUnread(false)
    }
  }, [isOpen])

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const contextPrefix = projectId
        ? `[Quadrants project: ${projectId}] `
        : '[Quadrants] '

      const response = await fetch(`${gatewayUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify({
          message: contextPrefix + userMessage.content,
          sessionLabel: 'quadrants-widget',
        }),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()

      const reply: Message = {
        role: 'assistant',
        content: data.reply || data.message || '处理完成',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, reply])
      if (!isOpen) setHasUnread(true)
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '⚠️ 连接失败，请稍后重试',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    if (prompt.endsWith('：') || prompt.endsWith(': ')) {
      setInput(prompt)
      inputRef.current?.focus()
    } else {
      sendMessage(prompt)
    }
  }

  const positionClasses = position === 'bottom-right'
    ? 'right-4 bottom-4'
    : 'left-4 bottom-4'

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses} z-50 w-[340px] h-[480px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
          style={{ bottom: '4.5rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  Q
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
              </div>
              <div>
                <span className="text-sm font-semibold text-zinc-100">Quadrants AI</span>
                <p className="text-[10px] text-zinc-500 leading-tight">powered by Clawdbot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4 mt-4">
                <div className="text-center">
                  <p className="text-zinc-400 text-sm">👋 你好！我是 Quadrants AI 助手</p>
                  <p className="text-zinc-600 text-xs mt-1">帮你用自然语言管理任务</p>
                </div>
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 px-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left group"
                    >
                      <action.icon size={14} className="text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0" />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : msg.role === 'system'
                      ? 'bg-amber-900/30 text-amber-300 border border-amber-800/50'
                      : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-md'
                  }`}
                >
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
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="输入任务或问题..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2.5 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses} z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-blue-500/30 hover:shadow-xl'
        }`}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  )
}
