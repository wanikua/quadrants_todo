'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ClawdbotChatWidgetProps {
  gatewayUrl?: string
  gatewayToken?: string
  position?: 'bottom-right' | 'bottom-left'
  projectId?: string
}

/**
 * Clawdbot Chat Widget for Quadrants
 * Embeds a floating chat bubble that connects to Clawdbot Gateway API
 * Allows users to manage tasks via natural language from within the Quadrants UI
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
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepend project context if available
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

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || data.message || 'No response',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '连接失败，请稍后再试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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
          className={`fixed ${positionClasses} z-50 w-80 h-[28rem] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
          style={{ bottom: '5rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-zinc-200">Quadrants AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 text-sm mt-8">
                <p>👋 你好！我可以帮你管理任务</p>
                <p className="mt-2 text-xs">试试说："加个任务：修复登录bug"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-xl">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="输入任务或问题..."
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors"
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
        className={`fixed ${positionClasses} z-50 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110`}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </>
  )
}
