"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import type { MatrixTemplate, MatrixPoint, AxisConfig, Connection } from "./templates"

interface MatrixCanvasProps {
  template: MatrixTemplate
  xAxis: AxisConfig
  yAxis: AxisConfig
  points: MatrixPoint[]
  connections: Connection[]
  onMove: (id: string, x: number, y: number) => void
  onAdd: (x: number, y: number) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  connectMode: boolean
  connectFrom: string | null
  onConnectPick: (id: string) => void
}

/**
 * Generic 2-axis map with draggable dots. x = left→right, y = bottom→top.
 * Pointer Events power dragging (mouse + touch); double-click empty space adds a point.
 * In connect mode, tapping points links them instead of dragging.
 *
 * Layering note: the centering transform lives on the positioned wrapper, the entrance
 * pop on a middle wrapper, and hover/drag scale on the dot itself — three separate
 * elements so none of the transforms fight each other.
 */
export function MatrixCanvas({
  template,
  xAxis,
  yAxis,
  points,
  connections,
  onMove,
  onAdd,
  selectedId,
  onSelect,
  connectMode,
  connectFrom,
  onConnectPick,
}: MatrixCanvasProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const q = template.quadrants
  const byId = new Map(points.map((p) => [p.id, p]))

  const toCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const el = ref.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const yTop = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
    return { x: Math.round(x), y: Math.round(100 - yTop) }
  }, [])

  useEffect(() => {
    if (!dragId) return
    const handleMove = (e: PointerEvent) => {
      const c = toCoords(e.clientX, e.clientY)
      if (c) onMove(dragId, c.x, c.y)
    }
    const handleUp = () => setDragId(null)
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }
  }, [dragId, onMove, toCoords])

  const cornerPill = "absolute bg-white border-2 border-black rounded-full px-2 py-0.5 text-[11px] font-black text-black shadow-bold-sm pointer-events-none"
  const edgePill = "absolute bg-white border-2 border-black rounded-full px-1.5 py-0.5 text-[9px] font-bold text-black pointer-events-none"

  return (
    <div className="relative">
      <div className="ml-9 mb-9 relative">
        {/* neo-brutalist offset depth block */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-yellow-300 border-3 border-black rounded-2xl -z-10 pointer-events-none"
        />

        <div
          ref={ref}
          onDoubleClick={(e) => {
            if (connectMode) return
            if ((e.target as HTMLElement).closest("[data-point]")) return
            const c = toCoords(e.clientX, e.clientY)
            if (c) onAdd(c.x, c.y)
          }}
          className={`relative aspect-square w-full bg-white border-3 border-black rounded-2xl overflow-hidden select-none touch-none ${
            connectMode ? "cursor-crosshair" : ""
          }`}
        >
          {/* quadrant tints */}
          {q && (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className={q.tl.tint} />
              <div className={q.tr.tint} />
              <div className={q.bl.tint} />
              <div className={q.br.tint} />
            </div>
          )}

          {/* center cross */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-black/15 pointer-events-none" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-black/15 pointer-events-none" />

          {/* connections */}
          {connections.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {connections.map((c) => {
                const a = byId.get(c.from)
                const b = byId.get(c.to)
                if (!a || !b) return null
                return (
                  <line
                    key={c.id}
                    x1={a.x}
                    y1={100 - a.y}
                    x2={b.x}
                    y2={100 - b.y}
                    stroke="black"
                    strokeWidth={0.6}
                    strokeOpacity={0.55}
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
          )}

          {/* axis-end arrows */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-b-[8px] border-b-black/40 pointer-events-none" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-black/40 pointer-events-none" />

          {/* quadrant labels OR axis-end labels */}
          {q ? (
            <>
              <span className={`${cornerPill} top-2.5 left-2.5`}>{q.tl.label}</span>
              <span className={`${cornerPill} top-2.5 right-2.5`}>{q.tr.label}</span>
              <span className={`${cornerPill} bottom-2.5 left-2.5`}>{q.bl.label}</span>
              <span className={`${cornerPill} bottom-2.5 right-2.5`}>{q.br.label}</span>
            </>
          ) : (
            <>
              <span className={`${edgePill} top-1.5 left-1/2 -translate-x-1/2`}>{yAxis.highLabel}</span>
              <span className={`${edgePill} bottom-1.5 left-1/2 -translate-x-1/2`}>{yAxis.lowLabel}</span>
              <span className={`${edgePill} right-1.5 top-1/2 -translate-y-1/2`}>{xAxis.highLabel}</span>
              <span className={`${edgePill} left-1.5 top-1/2 -translate-y-1/2`}>{xAxis.lowLabel}</span>
            </>
          )}

          {/* points */}
          {points.map((p, i) => {
            const active = dragId === p.id
            const selected = selectedId === p.id
            const isFrom = connectFrom === p.id
            return (
              <div
                key={p.id}
                data-point
                onPointerDown={(e) => {
                  e.preventDefault()
                  if (connectMode) {
                    onConnectPick(p.id)
                    return
                  }
                  setDragId(p.id)
                  onSelect(p.id)
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${connectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                style={{ left: `${p.x}%`, top: `${100 - p.y}%`, zIndex: active ? 50 : selected || isFrom ? 40 : 10 }}
              >
                <div className="animate-pop" style={{ animationDelay: `${Math.min(i * 0.045, 0.45)}s` }}>
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <div
                      className={`w-7 h-7 rounded-full border-2 border-black shadow-bold-sm transition-transform duration-150 ${
                        active ? "scale-125 rotate-6" : selected || isFrom ? "scale-110" : ""
                      } ${isFrom ? "ring-2 ring-blue-500 ring-offset-1" : selected ? "ring-2 ring-black ring-offset-1" : ""}`}
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="px-1.5 py-0.5 bg-white border-2 border-black rounded-md text-[10px] font-black text-black whitespace-nowrap shadow-bold-sm max-w-[130px] truncate">
                      {p.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* y axis name (rotated pill, left) */}
      <div className="absolute left-0 top-0 bottom-9 w-9 flex items-center justify-center pointer-events-none">
        <span className="-rotate-90 whitespace-nowrap text-xs font-black text-black bg-white border-2 border-black rounded-full px-2.5 py-1 shadow-bold-sm">
          {yAxis.label} ↑
        </span>
      </div>
      {/* x axis name (pill, bottom) */}
      <div className="absolute left-9 right-0 bottom-0 h-9 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-black text-black bg-white border-2 border-black rounded-full px-2.5 py-1 shadow-bold-sm">
          {xAxis.label} →
        </span>
      </div>
    </div>
  )
}
