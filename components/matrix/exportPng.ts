import type { AxisConfig, MatrixPoint, Quadrants, Connection } from "./templates"

/** Tailwind tint class → hex, for canvas fills. */
const TINT_HEX: Record<string, string> = {
  "bg-red-50": "#fef2f2",
  "bg-blue-50": "#eff6ff",
  "bg-green-50": "#f0fdf4",
  "bg-orange-50": "#fff7ed",
  "bg-yellow-50": "#fefce8",
  "bg-gray-100": "#f3f4f6",
}

interface ExportArgs {
  title: string
  xAxis: AxisConfig
  yAxis: AxisConfig
  quadrants: Quadrants | null
  points: MatrixPoint[]
  connections: Connection[]
}

/** Render the matrix to an offscreen canvas and trigger a PNG download. Zero dependencies. */
export function exportMatrixPng({ title, xAxis, yAxis, quadrants, points, connections }: ExportArgs): void {
  const SIZE = 1000
  const LEFT = 90
  const BOTTOM = 80
  const TOP = 24
  const RIGHT = 24
  const plot = SIZE - LEFT - RIGHT
  const ox = LEFT
  const oy = TOP

  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const px = (x: number) => ox + (x / 100) * plot
  const py = (y: number) => oy + (1 - y / 100) * plot // high y → top

  // background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, SIZE, SIZE)

  // quadrant tints
  if (quadrants) {
    const half = plot / 2
    const cells: Array<[string, number, number]> = [
      [quadrants.tl.tint, ox, oy],
      [quadrants.tr.tint, ox + half, oy],
      [quadrants.bl.tint, ox, oy + half],
      [quadrants.br.tint, ox + half, oy + half],
    ]
    for (const [tint, x, y] of cells) {
      ctx.fillStyle = TINT_HEX[tint] ?? "#ffffff"
      ctx.fillRect(x, y, half, half)
    }
  }

  // center cross
  ctx.strokeStyle = "rgba(0,0,0,0.15)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox + plot / 2, oy)
  ctx.lineTo(ox + plot / 2, oy + plot)
  ctx.moveTo(ox, oy + plot / 2)
  ctx.lineTo(ox + plot, oy + plot / 2)
  ctx.stroke()

  // connections (under dots)
  const byId = new Map(points.map((p) => [p.id, p]))
  ctx.strokeStyle = "rgba(0,0,0,0.55)"
  ctx.lineWidth = 3
  for (const c of connections) {
    const a = byId.get(c.from)
    const b = byId.get(c.to)
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(px(a.x), py(a.y))
    ctx.lineTo(px(b.x), py(b.y))
    ctx.stroke()
  }

  // plot border
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 4
  ctx.strokeRect(ox, oy, plot, plot)

  // quadrant labels
  if (quadrants) {
    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.font = "bold 22px Inter, system-ui, sans-serif"
    ctx.textBaseline = "top"
    ctx.textAlign = "left"
    ctx.fillText(quadrants.tl.label, ox + 14, oy + 14)
    ctx.textAlign = "right"
    ctx.fillText(quadrants.tr.label, ox + plot - 14, oy + 14)
    ctx.textBaseline = "bottom"
    ctx.textAlign = "left"
    ctx.fillText(quadrants.bl.label, ox + 14, oy + plot - 14)
    ctx.textAlign = "right"
    ctx.fillText(quadrants.br.label, ox + plot - 14, oy + plot - 14)
  }

  // points
  for (const p of points) {
    const cx = px(p.x)
    const cy = py(p.y)
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = "#000000"
    ctx.stroke()
    ctx.font = "bold 18px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillStyle = "#000000"
    ctx.fillText(p.label, cx, cy + 19)
  }

  // axis labels
  ctx.fillStyle = "#000000"
  ctx.font = "900 24px Inter, system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${xAxis.label} →`, ox + plot / 2, oy + plot + BOTTOM / 2)
  ctx.save()
  ctx.translate(ox - 48, oy + plot / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(`${yAxis.label} ↑`, 0, 0)
  ctx.restore()

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-matrix.png`
    a.click()
    URL.revokeObjectURL(url)
  }, "image/png")
}
