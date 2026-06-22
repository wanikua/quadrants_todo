/**
 * "Matrix for everything" — template presets for the generic 2-axis map.
 * Each template configures the axes, optional quadrant tints/labels, and seed points.
 * Coordinates are 0–100: x = left→right, y = bottom→top (high y renders at the top).
 */

export interface AxisConfig {
  label: string
  lowLabel: string
  highLabel: string
}

export interface QuadrantConfig {
  label: string
  /** Tailwind background tint class for the quadrant region. */
  tint: string
}

export interface Quadrants {
  tl: QuadrantConfig
  tr: QuadrantConfig
  bl: QuadrantConfig
  br: QuadrantConfig
}

export interface MatrixPoint {
  id: string
  label: string
  x: number // 0–100, left→right
  y: number // 0–100, bottom→top
  color: string // hex
  note?: string
}

/** A line drawn between two points (by id). */
export interface Connection {
  id: string
  from: string
  to: string
}

export interface MatrixTemplate {
  id: string
  name: string // tab label
  title: string
  subtitle: string
  /** When true, the axis labels are user-editable (competitive / custom). */
  editableAxes: boolean
  xAxis: AxisConfig
  yAxis: AxisConfig
  /** Quadrant tints/labels, or null for a plain scatter with axis-end labels. */
  quadrants: Quadrants | null
  pointNoun: string
  seedPoints: MatrixPoint[]
}

/** Strong dot palette; every dot carries a black border so any color reads on white. */
export const POINT_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

export const TEMPLATES: MatrixTemplate[] = [
  {
    id: "eisenhower",
    name: "Eisenhower",
    title: "Eisenhower Matrix",
    subtitle: "Prioritize tasks by urgency × importance.",
    editableAxes: false,
    pointNoun: "task",
    xAxis: { label: "Urgency", lowLabel: "Not urgent", highLabel: "Urgent" },
    yAxis: { label: "Importance", lowLabel: "Not important", highLabel: "Important" },
    quadrants: {
      tl: { label: "Schedule", tint: "bg-blue-50" },
      tr: { label: "Do First", tint: "bg-red-50" },
      bl: { label: "Eliminate", tint: "bg-gray-100" },
      br: { label: "Delegate", tint: "bg-orange-50" },
    },
    seedPoints: [
      { id: "ei-1", label: "Fix login bug", x: 90, y: 85, color: "#ef4444" },
      { id: "ei-2", label: "Plan Q2 roadmap", x: 38, y: 80, color: "#3b82f6" },
      { id: "ei-3", label: "Reply to emails", x: 82, y: 32, color: "#f97316" },
      { id: "ei-4", label: "Scroll social", x: 22, y: 16, color: "#6b7280" },
    ],
  },
  {
    id: "competitive",
    name: "竞品分析",
    title: "Competitive Landscape",
    subtitle: "Plot competitors on dimensions you choose.",
    editableAxes: true,
    pointNoun: "competitor",
    xAxis: { label: "Price", lowLabel: "Budget", highLabel: "Premium" },
    yAxis: { label: "Quality", lowLabel: "Basic", highLabel: "Best-in-class" },
    quadrants: null,
    seedPoints: [
      { id: "co-1", label: "Us", x: 46, y: 82, color: "#3b82f6" },
      { id: "co-2", label: "Competitor A", x: 82, y: 76, color: "#ef4444" },
      { id: "co-3", label: "Competitor B", x: 28, y: 38, color: "#f59e0b" },
      { id: "co-4", label: "Competitor C", x: 62, y: 54, color: "#10b981" },
    ],
  },
  {
    id: "swot",
    name: "SWOT",
    title: "SWOT Analysis",
    subtitle: "Internal × external, helpful × harmful.",
    editableAxes: false,
    pointNoun: "item",
    xAxis: { label: "Origin", lowLabel: "Internal", highLabel: "External" },
    yAxis: { label: "Effect", lowLabel: "Harmful", highLabel: "Helpful" },
    quadrants: {
      tl: { label: "Strengths", tint: "bg-green-50" },
      tr: { label: "Opportunities", tint: "bg-blue-50" },
      bl: { label: "Weaknesses", tint: "bg-orange-50" },
      br: { label: "Threats", tint: "bg-red-50" },
    },
    seedPoints: [
      { id: "sw-1", label: "Strong brand", x: 26, y: 82, color: "#10b981" },
      { id: "sw-2", label: "Loyal team", x: 33, y: 66, color: "#10b981" },
      { id: "sw-3", label: "Thin margins", x: 24, y: 20, color: "#f97316" },
      { id: "sw-4", label: "New market", x: 76, y: 80, color: "#3b82f6" },
      { id: "sw-5", label: "New competitor", x: 78, y: 22, color: "#ef4444" },
    ],
  },
  {
    id: "effort-impact",
    name: "Effort/Impact",
    title: "Effort × Impact",
    subtitle: "Prioritize ideas — quick wins vs money pits.",
    editableAxes: false,
    pointNoun: "idea",
    xAxis: { label: "Effort", lowLabel: "Easy", highLabel: "Hard" },
    yAxis: { label: "Impact", lowLabel: "Low", highLabel: "High" },
    quadrants: {
      tl: { label: "Quick Wins", tint: "bg-green-50" },
      tr: { label: "Big Bets", tint: "bg-blue-50" },
      bl: { label: "Fill-ins", tint: "bg-gray-100" },
      br: { label: "Money Pits", tint: "bg-red-50" },
    },
    seedPoints: [
      { id: "ef-1", label: "Onboarding tweak", x: 24, y: 78, color: "#10b981" },
      { id: "ef-2", label: "New billing system", x: 82, y: 80, color: "#3b82f6" },
      { id: "ef-3", label: "Tooltip polish", x: 22, y: 24, color: "#6b7280" },
      { id: "ef-4", label: "Legacy migration", x: 80, y: 26, color: "#ef4444" },
    ],
  },
  {
    id: "risk",
    name: "Risk",
    title: "Risk Matrix",
    subtitle: "Likelihood × impact.",
    editableAxes: false,
    pointNoun: "risk",
    xAxis: { label: "Likelihood", lowLabel: "Rare", highLabel: "Likely" },
    yAxis: { label: "Impact", lowLabel: "Minor", highLabel: "Severe" },
    quadrants: {
      tl: { label: "Major", tint: "bg-orange-50" },
      tr: { label: "Critical", tint: "bg-red-50" },
      bl: { label: "Low", tint: "bg-green-50" },
      br: { label: "Moderate", tint: "bg-yellow-50" },
    },
    seedPoints: [
      { id: "ri-1", label: "Data breach", x: 30, y: 86, color: "#f97316" },
      { id: "ri-2", label: "Vendor outage", x: 78, y: 80, color: "#ef4444" },
      { id: "ri-3", label: "Typo in docs", x: 70, y: 18, color: "#eab308" },
      { id: "ri-4", label: "Wifi drop", x: 26, y: 22, color: "#10b981" },
    ],
  },
  {
    id: "bcg",
    name: "BCG",
    title: "Growth–Share Matrix",
    subtitle: "Market share × growth rate (BCG).",
    editableAxes: false,
    pointNoun: "product",
    xAxis: { label: "Market share", lowLabel: "Low", highLabel: "High" },
    yAxis: { label: "Growth", lowLabel: "Low", highLabel: "High" },
    quadrants: {
      tl: { label: "Question Marks", tint: "bg-yellow-50" },
      tr: { label: "Stars", tint: "bg-blue-50" },
      bl: { label: "Dogs", tint: "bg-gray-100" },
      br: { label: "Cash Cows", tint: "bg-green-50" },
    },
    seedPoints: [
      { id: "bc-1", label: "New app", x: 28, y: 80, color: "#eab308" },
      { id: "bc-2", label: "Flagship", x: 82, y: 78, color: "#3b82f6" },
      { id: "bc-3", label: "Legacy tool", x: 24, y: 22, color: "#6b7280" },
      { id: "bc-4", label: "Core product", x: 80, y: 26, color: "#10b981" },
    ],
  },
  {
    id: "custom",
    name: "自定义",
    title: "Custom Matrix",
    subtitle: "Name your axes, drop your points.",
    editableAxes: true,
    pointNoun: "point",
    xAxis: { label: "X Axis", lowLabel: "Low", highLabel: "High" },
    yAxis: { label: "Y Axis", lowLabel: "Low", highLabel: "High" },
    quadrants: null,
    seedPoints: [{ id: "cu-1", label: "Example", x: 50, y: 50, color: "#8b5cf6" }],
  },
]
