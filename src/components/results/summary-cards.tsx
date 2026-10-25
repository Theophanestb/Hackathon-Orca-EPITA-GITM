import { ActivityIcon, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { statusInfo, TONE_CLASSES, type Tone } from "@/components/results/status"
import type { Summary } from "@/lib/analyze"

interface Item {
  label: string
  value: number
  icon: LucideIcon
  tone?: Tone
}

export function SummaryCards({ summary }: { summary: Summary }) {
  const items: Item[] = [
    { label: "Markers analysed", value: summary.analysed, icon: ActivityIcon },
    { label: "Normal", value: summary.normal, icon: statusInfo("normal").icon, tone: "normal" },
    { label: "Borderline", value: summary.borderline, icon: statusInfo("borderline").icon, tone: "borderline" },
    { label: "Out of range", value: summary.outOfRange, icon: statusInfo("high").icon, tone: "out" },
    { label: "Critical", value: summary.critical, icon: statusInfo("critical").icon, tone: "critical" },
  ]

  return (
    <ul aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ label, value, icon: Icon, tone }, index) => (
        <li
          key={label}
          className={cn(
            "flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
            index === 0 && "col-span-2 sm:col-span-1"
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg ring-1 ring-inset",
              tone && value > 0 ? TONE_CLASSES[tone] : TONE_CLASSES.muted
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
