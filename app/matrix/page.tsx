"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Plus, Trash2, RotateCcw, SlidersHorizontal, Link2, FileUp, ImageDown, X, Map as MapIcon, List as ListIcon } from "lucide-react"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { MatrixCanvas } from "@/components/matrix/MatrixCanvas"
import { exportMatrixPng } from "@/components/matrix/exportPng"
import {
  TEMPLATES,
  POINT_COLORS,
  type MatrixPoint,
  type AxisConfig,
  type Connection,
} from "@/components/matrix/templates"

interface TplState {
  xAxis: AxisConfig
  yAxis: AxisConfig
  points: MatrixPoint[]
  connections: Connection[]
}

const STORAGE_KEY = "matrix-proto-v2"

function freshStates(): Record<string, TplState> {
  const out: Record<string, TplState> = {}
  for (const t of TEMPLATES) {
    out[t.id] = {
      xAxis: { ...t.xAxis },
      yAxis: { ...t.yAxis },
      points: t.seedPoints.map((p) => ({ ...p })),
      connections: [],
    }
  }
  return out
}

function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `p-${Math.random().toString(36).slice(2)}`
}

function clampNum(v: string): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null
}

/** Parse pasted CSV/TSV rows of `label, x, y` into points. Header row auto-skipped. */
function parseCsv(text: string, pointNoun: string, startIndex: number): MatrixPoint[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const firstCols = lines[0].split(/[,\t]/)
  const hasHeader =
    lines.length > 1 && clampNum((firstCols[1] ?? "").trim()) === null && clampNum((firstCols[2] ?? "").trim()) === null
  const rows = hasHeader ? lines.slice(1) : lines
  return rows.map((line, i) => {
    const cols = line.split(/[,\t]/).map((c) => c.trim())
    const idx = startIndex + i
    return {
      id: nextId(),
      label: cols[0] || `${pointNoun} ${idx + 1}`,
      x: clampNum(cols[1] ?? "") ?? 40 + (idx % 5) * 6,
      y: clampNum(cols[2] ?? "") ?? 40 + ((idx * 3) % 5) * 6,
      color: POINT_COLORS[idx % POINT_COLORS.length],
    }
  })
}

export default function MatrixPage() {
  const [activeId, setActiveId] = useState(TEMPLATES[0].id)
  const [states, setStates] = useState<Record<string, TplState>>(freshStates)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvText, setCsvText] = useState("")

  // Load saved edits.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, Partial<TplState>>
        const norm: Record<string, TplState> = {}
        for (const k of Object.keys(parsed)) {
          const e = parsed[k]
          if (e && Array.isArray(e.points) && e.xAxis && e.yAxis) {
            norm[k] = {
              xAxis: e.xAxis,
              yAxis: e.yAxis,
              points: e.points,
              connections: Array.isArray(e.connections) ? e.connections : [],
            }
          }
        }
        setStates((prev) => ({ ...prev, ...norm }))
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true)
  }, [])

  // Persist edits.
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
    } catch {
      // storage unavailable — non-fatal
    }
  }, [states, loaded])

  const template = useMemo(() => TEMPLATES.find((t) => t.id === activeId) ?? TEMPLATES[0], [activeId])
  const state = states[activeId]
  const byId = useMemo(() => new Map(state.points.map((p) => [p.id, p])), [state.points])

  // Map ⇄ List view. List view groups points into the four quadrants (split at 50).
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const grouped = useMemo(() => {
    const g: Record<"tl" | "tr" | "bl" | "br", typeof state.points> = { tl: [], tr: [], bl: [], br: [] }
    for (const p of state.points) {
      const right = p.x >= 50
      const top = p.y >= 50
      g[top ? (right ? "tr" : "tl") : right ? "br" : "bl"].push(p)
    }
    return g
  }, [state.points])
  const quadLabel = useCallback(
    (key: "tl" | "tr" | "bl" | "br") => {
      if (template.quadrants) return template.quadrants[key].label
      const x = key === "tr" || key === "br" ? state.xAxis.highLabel : state.xAxis.lowLabel
      const y = key === "tl" || key === "tr" ? state.yAxis.highLabel : state.yAxis.lowLabel
      return `${y} · ${x}`
    },
    [template.quadrants, state.xAxis, state.yAxis],
  )
  const selectedPoint = selectedId ? state.points.find((p) => p.id === selectedId) ?? null : null

  const patchState = useCallback(
    (patch: Partial<TplState>) => setStates((prev) => ({ ...prev, [activeId]: { ...prev[activeId], ...patch } })),
    [activeId],
  )

  const mutatePoints = useCallback(
    (fn: (pts: MatrixPoint[]) => MatrixPoint[]) =>
      setStates((prev) => ({ ...prev, [activeId]: { ...prev[activeId], points: fn(prev[activeId].points) } })),
    [activeId],
  )

  const movePoint = useCallback(
    (id: string, x: number, y: number) => mutatePoints((pts) => pts.map((p) => (p.id === id ? { ...p, x, y } : p))),
    [mutatePoints],
  )

  const addPoint = useCallback(
    (x = 50, y = 50) => {
      const id = nextId()
      mutatePoints((pts) => [
        ...pts,
        { id, label: `New ${template.pointNoun}`, x, y, color: POINT_COLORS[pts.length % POINT_COLORS.length] },
      ])
      setSelectedId(id)
    },
    [mutatePoints, template.pointNoun],
  )

  const updatePoint = useCallback(
    (id: string, patch: Partial<MatrixPoint>) => mutatePoints((pts) => pts.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [mutatePoints],
  )

  const removePoint = useCallback(
    (id: string) => {
      setStates((prev) => {
        const s = prev[activeId]
        return {
          ...prev,
          [activeId]: {
            ...s,
            points: s.points.filter((p) => p.id !== id),
            connections: s.connections.filter((c) => c.from !== id && c.to !== id),
          },
        }
      })
      setSelectedId((s) => (s === id ? null : s))
      setConnectFrom((f) => (f === id ? null : f))
    },
    [activeId],
  )

  const handleConnectPick = useCallback(
    (id: string) => {
      if (!connectFrom) {
        setConnectFrom(id)
        return
      }
      if (connectFrom === id) {
        setConnectFrom(null)
        return
      }
      setStates((prev) => {
        const s = prev[activeId]
        const exists = s.connections.some(
          (c) => (c.from === connectFrom && c.to === id) || (c.from === id && c.to === connectFrom),
        )
        if (exists) return prev
        return { ...prev, [activeId]: { ...s, connections: [...s.connections, { id: nextId(), from: connectFrom, to: id }] } }
      })
      setConnectFrom(null)
    },
    [activeId, connectFrom],
  )

  const removeConnection = useCallback(
    (id: string) =>
      setStates((prev) => ({
        ...prev,
        [activeId]: { ...prev[activeId], connections: prev[activeId].connections.filter((c) => c.id !== id) },
      })),
    [activeId],
  )

  const resetTemplate = useCallback(() => {
    setStates((prev) => ({
      ...prev,
      [activeId]: {
        xAxis: { ...template.xAxis },
        yAxis: { ...template.yAxis },
        points: template.seedPoints.map((p) => ({ ...p })),
        connections: [],
      },
    }))
    setSelectedId(null)
    setConnectFrom(null)
  }, [activeId, template])

  const importCsv = useCallback(() => {
    const rows = parseCsv(csvText, template.pointNoun, state.points.length)
    if (rows.length > 0) mutatePoints((pts) => [...pts, ...rows])
    setCsvText("")
    setCsvOpen(false)
  }, [csvText, template.pointNoun, state.points.length, mutatePoints])

  const handleExport = useCallback(() => {
    exportMatrixPng({
      title: template.title,
      xAxis: state.xAxis,
      yAxis: state.yAxis,
      quadrants: template.quadrants,
      points: state.points,
      connections: state.connections,
    })
  }, [template, state])

  const switchTemplate = (id: string) => {
    setActiveId(id)
    setSelectedId(null)
    setConnectFrom(null)
  }

  const noun = template.pointNoun
  const nounPlural = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}s`
  const toolBtn = "flex items-center justify-center gap-1.5 rounded-xl border-2 border-black py-2 text-xs font-black transition-all"

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader />

      <main className="pt-12 pb-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-9 space-y-4 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-yellow-300 border-3 border-black rounded-full px-5 py-2 shadow-bold-sm -rotate-1">
              <span className="text-sm font-black text-black tracking-tight">Matrix for everything</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight leading-[1.05]">
              A visual <span className="text-highlight-yellow">alternative to tables</span>
            </h1>
            <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
              Name two axes, drop your points, drag to position. Eisenhower, competitive maps, SWOT — one canvas.
            </p>
          </div>

          {/* Template switcher */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {TEMPLATES.map((t) => {
              const isActive = activeId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => switchTemplate(t.id)}
                  className={`px-5 py-2.5 rounded-xl border-3 border-black font-black transition-all ${
                    isActive ? "bg-black text-white shadow-bold scale-105" : "bg-white text-black shadow-bold-sm hover-lift-shadow"
                  }`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>

          {/* Canvas + control deck */}
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-start">
            <div className="animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-black leading-none tracking-tight">{template.title}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-2">{template.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-1 bg-gray-100 border-2 border-black rounded-full p-1">
                    <button
                      onClick={() => setViewMode("map")}
                      title="Map view"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${viewMode === "map" ? "bg-white shadow-bold-sm" : "hover:bg-gray-200"}`}
                    >
                      <MapIcon className={`w-4 h-4 ${viewMode === "map" ? "text-black" : "text-gray-500"}`} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      title="List view"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white shadow-bold-sm" : "hover:bg-gray-200"}`}
                    >
                      <ListIcon className={`w-4 h-4 ${viewMode === "list" ? "text-black" : "text-gray-500"}`} />
                    </button>
                  </div>
                  <span className="hidden sm:inline-flex items-center bg-white border-2 border-black rounded-full px-3 py-1 text-xs font-black text-black shadow-bold-sm whitespace-nowrap">
                    {state.points.length} {nounPlural.toLowerCase()}
                  </span>
                </div>
              </div>

              {viewMode === "map" ? (
                <MatrixCanvas
                  template={template}
                  xAxis={state.xAxis}
                  yAxis={state.yAxis}
                  points={state.points}
                  connections={state.connections}
                  onMove={movePoint}
                  onAdd={addPoint}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  connectMode={connectMode}
                  connectFrom={connectFrom}
                  onConnectPick={handleConnectPick}
                />
              ) : (
                <div className="grid grid-cols-2 grid-rows-2 gap-3 aspect-square">
                  {(["tl", "tr", "bl", "br"] as const).map((key) => (
                    <div
                      key={key}
                      className={`rounded-2xl border-3 border-black ${template.quadrants ? template.quadrants[key].tint : "bg-gray-50"} p-3 flex flex-col min-h-0 overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-black text-xs sm:text-sm text-black leading-tight">{quadLabel(key)}</span>
                        <span className="text-[11px] font-black text-black/40 shrink-0">{grouped[key].length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                        {grouped[key].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg border-2 transition-all ${selectedId === p.id ? "border-black bg-white shadow-bold-sm" : "border-transparent hover:border-black/30 hover:bg-white/70"}`}
                          >
                            <span className="w-3 h-3 rounded-full border border-black shrink-0" style={{ background: p.color }} />
                            <span className="text-sm font-bold text-black truncate">{p.label}</span>
                          </button>
                        ))}
                        {grouped[key].length === 0 && (
                          <p className="text-[11px] text-black/30 font-semibold italic px-1">empty</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 font-medium mt-3 text-center">
                {viewMode === "list"
                  ? "按象限分组 · 点击项目可在右侧编辑"
                  : connectMode
                    ? "连线模式:依次点两个圆点连线"
                    : "拖动圆点移动 · 双击空白处添加 · 在右侧重命名 / 删除"}
              </p>
            </div>

            {/* Control deck */}
            <aside className="bg-white border-3 border-black rounded-2xl shadow-bold p-5 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="-mx-5 -mt-5 mb-5 px-5 py-3 bg-black text-white rounded-t-[13px] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-black text-sm tracking-tight">Controls</span>
              </div>

              {/* Toolbar */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => {
                    setConnectMode((m) => !m)
                    setConnectFrom(null)
                  }}
                  className={`${toolBtn} ${connectMode ? "bg-blue-500 text-white shadow-bold-sm" : "bg-white text-black hover-lift-shadow shadow-bold-sm"}`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Connect
                </button>
                <button onClick={() => setCsvOpen((o) => !o)} className={`${toolBtn} bg-white text-black hover-lift-shadow shadow-bold-sm`}>
                  <FileUp className="w-3.5 h-3.5" /> Import
                </button>
                <button onClick={handleExport} className={`${toolBtn} bg-white text-black hover-lift-shadow shadow-bold-sm`}>
                  <ImageDown className="w-3.5 h-3.5" /> PNG
                </button>
              </div>

              {csvOpen && (
                <div className="mb-4 space-y-2">
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={4}
                    placeholder={"Paste rows:\nlabel, x, y\nLabel, 70, 40"}
                    className="w-full border-2 border-black rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none resize-none"
                  />
                  <button
                    onClick={importCsv}
                    className="w-full bg-black text-white border-2 border-black rounded-xl py-2 text-xs font-black shadow-bold-sm hover-lift-shadow transition-all"
                  >
                    Import rows
                  </button>
                </div>
              )}

              {template.editableAxes && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Axes</h3>
                    {(["xAxis", "yAxis"] as const).map((axisKey) => (
                      <div key={axisKey} className="space-y-1.5">
                        <input
                          value={state[axisKey].label}
                          onChange={(e) => patchState({ [axisKey]: { ...state[axisKey], label: e.target.value } } as Partial<TplState>)}
                          className="w-full border-2 border-black rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none"
                          placeholder={axisKey === "xAxis" ? "X axis" : "Y axis"}
                        />
                        <div className="flex gap-2">
                          <input
                            value={state[axisKey].lowLabel}
                            onChange={(e) => patchState({ [axisKey]: { ...state[axisKey], lowLabel: e.target.value } } as Partial<TplState>)}
                            className="w-1/2 border-2 border-black/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-black"
                            placeholder="low"
                          />
                          <input
                            value={state[axisKey].highLabel}
                            onChange={(e) => patchState({ [axisKey]: { ...state[axisKey], highLabel: e.target.value } } as Partial<TplState>)}
                            className="w-1/2 border-2 border-black/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-black"
                            placeholder="high"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-dashed border-black/10 my-5" />
                </>
              )}

              {/* Selected point detail */}
              {selectedPoint && (
                <div className="border-2 border-black rounded-xl p-3 mb-5 space-y-2.5 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Selected</span>
                    <button onClick={() => removePoint(selectedPoint.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={selectedPoint.label}
                    onChange={(e) => updatePoint(selectedPoint.id, { label: e.target.value })}
                    className="w-full border-2 border-black rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {POINT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updatePoint(selectedPoint.id, { color: c })}
                        className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                          selectedPoint.color === c ? "border-black ring-2 ring-black ring-offset-1" : "border-black/30"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <textarea
                    value={selectedPoint.note ?? ""}
                    onChange={(e) => updatePoint(selectedPoint.id, { note: e.target.value })}
                    rows={2}
                    placeholder="Add a note…"
                    className="w-full border-2 border-black/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-black resize-none"
                  />
                  <p className="text-[10px] text-gray-400 font-mono">x {selectedPoint.x} · y {selectedPoint.y}</p>
                </div>
              )}

              {/* Points list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{nounPlural}</h3>
                  <span className="text-xs font-bold text-gray-400">{state.points.length}</span>
                </div>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {state.points.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedId === p.id ? "border-black bg-gray-50 shadow-bold-sm" : "border-black/10 hover:border-black/40"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="flex-1 min-w-0 text-sm font-bold truncate">{p.label}</span>
                      {p.note ? <span title="has note" className="w-1.5 h-1.5 rounded-full bg-black/40 flex-shrink-0" /> : null}
                      <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                        {p.x},{p.y}
                      </span>
                    </div>
                  ))}
                  {state.points.length === 0 && (
                    <p className="text-xs text-gray-400 font-medium text-center py-6">Double-click the map or hit add.</p>
                  )}
                </div>
                <button
                  onClick={() => addPoint()}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white border-2 border-black rounded-xl py-2.5 font-black shadow-bold-sm hover-lift-shadow transition-all"
                >
                  <Plus className="w-4 h-4" /> Add {noun}
                </button>
              </div>

              {/* Connections list */}
              {state.connections.length > 0 && (
                <>
                  <div className="border-t-2 border-dashed border-black/10 my-5" />
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Links</h3>
                    {state.connections.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-xs font-bold p-1.5 rounded-lg border-2 border-black/10">
                        <span className="flex-1 min-w-0 truncate">
                          {byId.get(c.from)?.label ?? "?"} — {byId.get(c.to)?.label ?? "?"}
                        </span>
                        <button onClick={() => removeConnection(c.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="border-t-2 border-dashed border-black/10 my-5" />
              <button
                onClick={resetTemplate}
                className="w-full flex items-center justify-center gap-2 bg-white text-black border-2 border-black/20 hover:border-black rounded-xl py-2 text-sm font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset template
              </button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
