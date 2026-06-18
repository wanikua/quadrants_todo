"use client"
// Eisenhower Matrix — Cute Bold quadrant card grid
import React, { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import TaskSegment from "@/components/TaskSegment"
import type { TaskWithAssignees, Player, Line } from "@/app/types"
import { updateTask, deleteTask, completeTask } from "@/app/db/actions"
import { Trash2, CheckCircle2, Flame, CalendarClock, Users, Ban, Plus, Inbox, X } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n/locales"

interface QuadrantMatrixMapProps {
  tasks: TaskWithAssignees[]
  players: Player[]
  lines: Line[]
  projectId: string
  isMobile: boolean
  onTaskDetailClick: (task: TaskWithAssignees) => void
  onLongPress: (urgency: number, importance: number) => void
  userName?: string
  projectType?: "personal" | "team"
  highestPriorityTaskId?: number | null
  setTasks?: (updater: (prev: TaskWithAssignees[]) => TaskWithAssignees[]) => void
  onOrganizeTasks?: () => void
  isOrganizing?: boolean
  originalTaskPositions?: Map<number, { urgency: number; importance: number }>
  onAcceptOrganize?: () => void
  onRevertOrganize?: () => void
  isFullscreen?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
  onDragStart?: (taskId: number) => void
  onDragEnd?: (taskId: number) => void
  // Focus mode props
  isFocusMode?: boolean
  focusedTaskId?: number
  focusedTaskDescription?: string
  focusIndex?: number
  totalFocusTasks?: number
  onFocusClick?: () => void
}

// ── Quadrant definitions (ported from the Swift CuteBoldStyle reference) ──
type QuadKey = "urgentImportant" | "notUrgentImportant" | "urgentNotImportant" | "notUrgentNotImportant"

interface QuadConfig {
  key: QuadKey
  labelKey: TranslationKey
  subKey: TranslationKey
  bg: string
  accent: string
  text: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  values: { urgency: number; importance: number }
}

const QUADRANTS: QuadConfig[] = [
  {
    key: "urgentImportant",
    labelKey: "doFirst",
    subKey: "urgentImportant",
    bg: "#FEF2F2",
    accent: "#EF4444",
    text: "#991B1B",
    icon: Flame,
    values: { urgency: 75, importance: 75 },
  },
  {
    key: "notUrgentImportant",
    labelKey: "schedule",
    subKey: "notUrgentImportant",
    bg: "#EFF6FF",
    accent: "#3B82F6",
    text: "#1E3A8A",
    icon: CalendarClock,
    values: { urgency: 25, importance: 75 },
  },
  {
    key: "urgentNotImportant",
    labelKey: "delegate",
    subKey: "urgentNotImportant",
    bg: "#FFFBEB",
    accent: "#F59E0B",
    text: "#92400E",
    icon: Users,
    values: { urgency: 75, importance: 25 },
  },
  {
    key: "notUrgentNotImportant",
    labelKey: "eliminate",
    subKey: "notUrgentNotImportant",
    bg: "#F9FAFB",
    accent: "#6B7280",
    text: "#374151",
    icon: Ban,
    values: { urgency: 25, importance: 25 },
  },
]

function quadrantOf(task: { urgency: number; importance: number }): QuadKey {
  const isUrgent = task.urgency >= 50
  const isImportant = task.importance >= 50
  if (isUrgent && isImportant) return "urgentImportant"
  if (!isUrgent && isImportant) return "notUrgentImportant"
  if (isUrgent && !isImportant) return "urgentNotImportant"
  return "notUrgentNotImportant"
}

function priorityScore(task: { urgency: number; importance: number }) {
  return task.importance * 0.6 + task.urgency * 0.4
}

const QuadrantMatrixMap = React.memo(function QuadrantMatrixMap({
  tasks,
  projectType,
  isMobile,
  onTaskDetailClick,
  onLongPress,
  userName,
  highestPriorityTaskId,
  setTasks,
  isOrganizing,
  onAcceptOrganize,
  onRevertOrganize,
  isFullscreen = false,
  onFullscreenChange,
  onDragStart,
  onDragEnd,
  // Focus mode props
  isFocusMode,
  focusedTaskId,
  focusedTaskDescription,
  focusIndex,
  totalFocusTasks,
  onFocusClick,
}: QuadrantMatrixMapProps) {
  const { t } = useTranslation()
  const [draggedTask, setDraggedTask] = useState<TaskWithAssignees | null>(null)
  const [dragOverQuad, setDragOverQuad] = useState<QuadKey | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskWithAssignees | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Drag a task card between quadrants ──
  const handleTaskDragStart = (task: TaskWithAssignees, e: React.DragEvent) => {
    onDragStart?.(task.id)
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id.toString())
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
    setDragOverQuad(null)
  }

  const handleQuadDrop = async (quad: QuadConfig, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverQuad(null)
    if (!draggedTask) return

    const task = draggedTask
    setDraggedTask(null)

    // No-op if dropped into the quadrant it already belongs to
    if (quadrantOf(task) === quad.key) {
      onDragEnd?.(task.id)
      return
    }

    const { urgency, importance } = quad.values
    const oldUrgency = task.urgency
    const oldImportance = task.importance

    if (setTasks) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, urgency, importance } : t)))
    }

    const result = await updateTask(task.id, urgency, importance)
    onDragEnd?.(task.id)

    if (!result.success) {
      if (setTasks) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, urgency: oldUrgency, importance: oldImportance } : t))
        )
      }
      toast.error(result.error || "Failed to move task")
    }
  }

  // ── Complete a task ──
  const handleComplete = useCallback(
    async (task: TaskWithAssignees, e: React.MouseEvent) => {
      e.stopPropagation()
      if (setTasks) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      }
      const result = await completeTask(task.id)
      if (!result.success) {
        toast.error(result.error || "Failed to complete task")
        if (setTasks) {
          setTasks((prev) => [...prev, task])
        }
      } else {
        toast.success(t("taskCompleted"))
      }
    },
    [setTasks, t]
  )

  // ── Delete a task (with confirmation) ──
  const requestDelete = useCallback((task: TaskWithAssignees, e: React.MouseEvent) => {
    e.stopPropagation()
    setTaskToDelete(task)
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return
    const target = taskToDelete
    if (setTasks) {
      setTasks((prev) => prev.filter((t) => t.id !== target.id))
    }
    const result = await deleteTask(target.id)
    if (!result.success) {
      toast.error(result.error || "Failed to delete task")
    }
    setTaskToDelete(null)
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setTaskToDelete(null)
    setShowDeleteConfirm(false)
  }

  // ESC exits fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) onFullscreenChange?.(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, onFullscreenChange])

  const tasksByQuad = (key: QuadKey) =>
    tasks.filter((t) => quadrantOf(t) === key).sort((a, b) => priorityScore(b) - priorityScore(a))

  return (
    <div
      className={`flex flex-col bg-[#F9FAFB] ${
        isFullscreen ? "fixed inset-0 z-40 p-4 sm:p-6" : "flex-1 m-2 rounded-2xl border-3 border-black shadow-bold p-3 sm:p-4"
      }`}
    >
      {/* Re-prioritize preview banner */}
      {isOrganizing && (onAcceptOrganize || onRevertOrganize) && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border-3 border-black bg-purple-100 px-4 py-2 shadow-bold-sm">
          <span className="text-sm font-bold text-purple-900">{t("reprioritizeDone")}</span>
          <div className="flex gap-2">
            <button
              onClick={onRevertOrganize}
              className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold text-black hover-lift-shadow-sm"
            >
              {t("reprioritizeRevert")}
            </button>
            <button
              onClick={onAcceptOrganize}
              className="rounded-lg border-2 border-black bg-black px-3 py-1 text-sm font-bold text-white hover-lift-shadow-sm"
            >
              {t("reprioritizeAccept")}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen close */}
      {isFullscreen && (
        <button
          onClick={() => onFullscreenChange?.(false)}
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border-3 border-black bg-white shadow-bold-sm hover-lift-shadow-sm"
          aria-label={t("close")}
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}

      {/* Axis: IMPORTANT (top) */}
      <div className="flex items-center justify-center gap-1.5 pb-2 text-[11px] font-black tracking-widest text-gray-400">
        <span>↑</span>
        <span>{t("axisImportant")}</span>
      </div>

      <div className="flex flex-1 items-stretch gap-1.5">
        {/* Axis: URGENT (left) */}
        <div className="flex items-center">
          <span className="-rotate-90 whitespace-nowrap text-[11px] font-black tracking-widest text-gray-400">{t("axisUrgent")}</span>
        </div>

        {/* 2×2 grid */}
        <div className="grid flex-1 grid-cols-1 grid-rows-4 gap-2.5 sm:grid-cols-2 sm:grid-rows-2">
          {QUADRANTS.map((quad) => {
            const quadTasks = tasksByQuad(quad.key)
            const isOver = dragOverQuad === quad.key
            return (
              <div
                key={quad.key}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (draggedTask) setDragOverQuad(quad.key)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverQuad((prev) => (prev === quad.key ? null : prev))
                }}
                onDrop={(e) => handleQuadDrop(quad, e)}
                className={`flex min-h-[140px] flex-col overflow-hidden rounded-2xl border-3 shadow-bold transition-all duration-150 ${
                  isOver ? "scale-[1.02]" : ""
                }`}
                style={{
                  backgroundColor: quad.bg,
                  borderColor: isOver ? quad.accent : "#000",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 px-3 pt-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1 text-xs font-bold"
                    style={{
                      color: quad.text,
                      backgroundColor: `${quad.accent}26`,
                      borderColor: `${quad.accent}66`,
                    }}
                  >
                    <quad.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {t(quad.labelKey)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {quadTasks.length > 0 && (
                      <span
                        className="flex h-5 min-w-[20px] items-center justify-center rounded-full border-[1.5px] border-black px-1 text-[10px] font-black text-white"
                        style={{ backgroundColor: quad.accent }}
                      >
                        {quadTasks.length}
                      </span>
                    )}
                    <button
                      onClick={() => onLongPress(quad.values.urgency, quad.values.importance)}
                      className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-black transition-transform hover:scale-110"
                      aria-label={`${t("addTask")} · ${t(quad.labelKey)}`}
                      title={`${t("addTask")} · ${t(quad.labelKey)}`}
                    >
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="px-3 pb-2 pt-0.5 text-[10px] font-medium" style={{ color: `${quad.text}73` }}>
                  {t(quad.subKey)}
                </div>

                {/* Divider */}
                <div className="h-[1.5px]" style={{ backgroundColor: `${quad.accent}33` }} />

                {/* Task list */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                  {quadTasks.length === 0 ? (
                    <div className="flex h-full min-h-[80px] flex-col items-center justify-center gap-1 text-center">
                      <Inbox className="h-5 w-5" style={{ color: `${quad.accent}40` }} strokeWidth={2} />
                      <span className="text-xs font-medium text-gray-400">{t("noTasks")}</span>
                      <span className="text-[10px] text-gray-300">{t("dragHere")}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {quadTasks.map((task) => {
                        const isFocused = isFocusMode && task.id === focusedTaskId
                        const isDimmed = isFocusMode && !isFocused
                        return (
                          <TaskRow
                            key={task.id}
                            task={task}
                            accent={quad.accent}
                            userName={userName}
                            projectType={projectType}
                            isMobile={isMobile}
                            isHighestPriority={task.id === highestPriorityTaskId}
                            isFocused={!!isFocused}
                            isDimmed={!!isDimmed}
                            isDragging={draggedTask?.id === task.id}
                            onDragStart={(e) => handleTaskDragStart(task, e)}
                            onDragEnd={handleTaskDragEnd}
                            onClick={() => {
                              if (isFocusMode) onFocusClick?.()
                              else onTaskDetailClick(task)
                            }}
                            onComplete={(e) => handleComplete(task, e)}
                            onDelete={(e) => requestDelete(task, e)}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Axis: NOT URGENT (right) */}
        <div className="flex items-center">
          <span className="rotate-90 whitespace-nowrap text-[11px] font-black tracking-widest text-gray-400">
            {t("axisNotUrgent")}
          </span>
        </div>
      </div>

      {/* Axis: NOT IMPORTANT (bottom) */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] font-black tracking-widest text-gray-400">
        <span>{t("axisNotImportant")}</span>
        <span>↓</span>
      </div>

      {/* Focus mode floating card */}
      {isFocusMode && focusedTaskDescription && (
        <div
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 cursor-pointer"
          onClick={() => onFocusClick?.()}
        >
          <div className="rounded-2xl border-3 border-black bg-white px-6 py-4 shadow-bold-lg">
            <div className="mb-1 text-xs font-bold text-gray-500">
              {t("priority")} {(focusIndex || 0) + 1} / {totalFocusTasks || 0}
            </div>
            <h3 className="mb-1 text-xl font-black text-black">{focusedTaskDescription}</h3>
            <p className="text-sm text-gray-600">
              {(focusIndex || 0) < (totalFocusTasks || 0) - 1 ? t("clickToContinue") : t("clickToFinish")}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {taskToDelete && <strong>&quot;{taskToDelete.description}&quot;</strong>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})

// ── Single task row ──
interface TaskRowProps {
  task: TaskWithAssignees
  accent: string
  userName?: string
  projectType?: "personal" | "team"
  isMobile: boolean
  isHighestPriority: boolean
  isFocused: boolean
  isDimmed: boolean
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
  onComplete: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}

const TaskRow = React.memo(function TaskRow({
  task,
  accent,
  userName,
  projectType,
  isMobile,
  isHighestPriority,
  isFocused,
  isDimmed,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  onComplete,
  onDelete,
}: TaskRowProps) {
  const { t } = useTranslation()
  return (
    <div
      draggable={!isMobile}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative flex cursor-pointer items-center gap-2 rounded-lg border bg-white/60 px-2.5 py-2 transition-all duration-150 hover:bg-white ${
        isDragging ? "opacity-40" : ""
      } ${isDimmed ? "opacity-30 blur-[1px]" : ""} ${isFocused ? "ring-2 ring-yellow-400" : ""}`}
      style={{
        borderColor: isHighestPriority ? accent : "rgba(0,0,0,0.08)",
        borderWidth: isHighestPriority ? 2 : 1,
      }}
    >
      {/* Assignee / status dot */}
      <div className="shrink-0">
        <TaskSegment
          task={task}
          size={24}
          userName={userName}
          projectType={projectType}
          isHighestPriority={isHighestPriority}
        />
      </div>

      {/* Description */}
      <span className="line-clamp-2 flex-1 text-[13px] font-medium leading-tight text-black">{task.description}</span>

      {/* Actions */}
      <div
        className={`flex shrink-0 items-center gap-1 transition-opacity ${
          isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          onClick={onComplete}
          className="flex h-6 w-6 items-center justify-center rounded-full text-green-600 transition-colors hover:bg-green-100"
          aria-label={t("completeTask")}
          title={t("completeTask")}
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-100"
          aria-label={t("deleteTask")}
          title={t("deleteTask")}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
})

export default QuadrantMatrixMap
