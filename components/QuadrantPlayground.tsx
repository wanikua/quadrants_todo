"use client"

import { useState } from "react"
import { Flame, CalendarClock, Users, Ban, CheckCircle2, Plus } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface DemoTask {
  id: number
  description: string
  quad: QuadKey
  color: string
  assignee: string
}

type QuadKey = "urgentImportant" | "notUrgentImportant" | "urgentNotImportant" | "notUrgentNotImportant"

interface QuadConfig {
  key: QuadKey
  labelKey: "doFirst" | "schedule" | "delegate" | "eliminate"
  bg: string
  accent: string
  text: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

const QUADRANTS: QuadConfig[] = [
  { key: "urgentImportant", labelKey: "doFirst", bg: "#FEF2F2", accent: "#EF4444", text: "#991B1B", icon: Flame },
  { key: "notUrgentImportant", labelKey: "schedule", bg: "#EFF6FF", accent: "#3B82F6", text: "#1E3A8A", icon: CalendarClock },
  { key: "urgentNotImportant", labelKey: "delegate", bg: "#FFFBEB", accent: "#F59E0B", text: "#92400E", icon: Users },
  { key: "notUrgentNotImportant", labelKey: "eliminate", bg: "#F9FAFB", accent: "#6B7280", text: "#374151", icon: Ban },
]

const DEMO_TASKS: DemoTask[] = [
  { id: 1, description: "Fix API bug", quad: "urgentImportant", color: "#ef4444", assignee: "Alice" },
  { id: 2, description: "Code review", quad: "urgentImportant", color: "#3b82f6", assignee: "Bob" },
  { id: 3, description: "Plan Q3 roadmap", quad: "notUrgentImportant", color: "#ef4444", assignee: "Alice" },
  { id: 4, description: "Reply to emails", quad: "urgentNotImportant", color: "#10b981", assignee: "Charlie" },
  { id: 5, description: "Browse newsletters", quad: "notUrgentNotImportant", color: "#3b82f6", assignee: "Bob" },
]

export default function QuadrantPlayground() {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<DemoTask[]>(DEMO_TASKS)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [overQuad, setOverQuad] = useState<QuadKey | null>(null)
  const [done, setDone] = useState<Set<number>>(new Set())

  const moveTask = (id: number, quad: QuadKey) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, quad } : t)))
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F9FAFB] p-1.5 select-none">
      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-1.5">
        {QUADRANTS.map((quad) => {
          const quadTasks = tasks.filter((t) => t.quad === quad.key)
          const isOver = overQuad === quad.key
          return (
            <div
              key={quad.key}
              onDragOver={(e) => {
                e.preventDefault()
                if (draggedId != null) setOverQuad(quad.key)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverQuad((p) => (p === quad.key ? null : p))
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedId != null) moveTask(draggedId, quad.key)
                setDraggedId(null)
                setOverQuad(null)
              }}
              className={`flex flex-col overflow-hidden rounded-xl border-2 transition-transform duration-150 ${
                isOver ? "scale-[1.03]" : ""
              }`}
              style={{ backgroundColor: quad.bg, borderColor: isOver ? quad.accent : "#000" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-1.5 pt-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ color: quad.text, backgroundColor: `${quad.accent}26`, borderColor: `${quad.accent}66` }}
                >
                  <quad.icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                  {t(quad.labelKey)}
                </span>
                {quadTasks.length > 0 && (
                  <span
                    className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-black px-0.5 text-[8px] font-black text-white"
                    style={{ backgroundColor: quad.accent }}
                  >
                    {quadTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks */}
              <div className="flex flex-1 flex-col gap-1 overflow-hidden p-1">
                {quadTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <Plus className="h-3 w-3" style={{ color: `${quad.accent}55` }} strokeWidth={3} />
                  </div>
                ) : (
                  quadTasks.map((task) => {
                    const isDone = done.has(task.id)
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedId(task.id)}
                        onDragEnd={() => {
                          setDraggedId(null)
                          setOverQuad(null)
                        }}
                        className={`group flex cursor-grab items-center gap-1 rounded-md border border-black/10 bg-white/70 px-1.5 py-1 transition-all active:cursor-grabbing hover:bg-white ${
                          draggedId === task.id ? "opacity-40" : ""
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDone((prev) => {
                              const next = new Set(prev)
                              next.has(task.id) ? next.delete(task.id) : next.add(task.id)
                              return next
                            })
                          }}
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border"
                          style={{ borderColor: quad.accent, backgroundColor: isDone ? quad.accent : "transparent" }}
                          aria-label="Toggle complete"
                        >
                          {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </button>
                        <span
                          className={`flex-1 truncate text-[10px] font-medium leading-tight ${
                            isDone ? "text-gray-400 line-through" : "text-black"
                          }`}
                        >
                          {task.description}
                        </span>
                        <span
                          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-white text-[7px] font-bold text-white"
                          style={{ backgroundColor: task.color }}
                        >
                          {task.assignee.charAt(0)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="pt-1 text-center text-[10px] font-bold text-gray-400">{t("dragBetween")}</p>
    </div>
  )
}
