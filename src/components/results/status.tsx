import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import type { AnalyzedResult, Direction, Status } from "@/lib/analyze"

export type Tone = "normal" | "borderline" | "out" | "critical" | "muted"

/** Text, background and ring colours per tone, checked for contrast in both themes. */
export const TONE_CLASSES: Record<Tone, string> = {
  normal:
    "bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  borderline:
    "bg-amber-50 text-amber-900 ring-amber-600/30 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25",
  out: "bg-orange-50 text-orange-900 ring-orange-600/30 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/25",
  critical:
    "bg-red-50 text-red-800 ring-red-600/30 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30",
  muted: "bg-muted text-muted-foreground ring-foreground/10",
}

/** Solid colour for small marks (range bar ticks, accents). */
export const TONE_FILL: Record<Tone, string> = {
  normal: "bg-emerald-600 dark:bg-emerald-400",
  borderline: "bg-amber-500 dark:bg-amber-400",
  out: "bg-orange-600 dark:bg-orange-400",
  critical: "bg-red-600 dark:bg-red-400",
  muted: "bg-muted-foreground",
}

interface StatusInfo {
  label: string
  tone: Tone
  icon: LucideIcon
}

export function statusInfo(status: Status, direction?: Direction): StatusInfo {
  switch (status) {
    case "normal":
      return { label: "Normal", tone: "normal", icon: CircleCheckIcon }
    case "borderline":
      return { label: direction === "low" ? "Borderline low" : "Borderline high", tone: "borderline", icon: TriangleAlertIcon }
    case "low":
      return { label: "Low", tone: "out", icon: ArrowDownIcon }
    case "high":
      return { label: "High", tone: "out", icon: ArrowUpIcon }
    case "critical":
      return { label: direction === "low" ? "Critical low" : "Critical high", tone: "critical", icon: OctagonAlertIcon }
    case "not_analysed":
      return { label: "Not analysed", tone: "muted", icon: CircleDashedIcon }
  }
}

export function StatusBadge({
  result,
  className,
}: {
  result: Pick<AnalyzedResult, "status" | "direction">
  className?: string
}) {
  const { label, tone, icon: Icon } = statusInfo(result.status, result.direction)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_CLASSES[tone],
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  )
}
