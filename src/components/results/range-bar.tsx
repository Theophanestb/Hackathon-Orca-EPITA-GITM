import { cn } from "cn"

import type { RefRange } from "@/data/referenceRanges"
import { borderlineMargin, type AnalyzedResult } from "@/lib/analyze"
import { statusInfo, TONE_FILL } from "@/components/results/status"

/** Visible scale around the reference range: half a range width of margin on each side. */
export function scaleFor(range: RefRange): { min: number; max: number } {
  const { low, high } = range
  if (low !== undefined && high !== undefined) {
    const pad = (high - low) * 0.5
    return { min: Math.max(0, low - pad), max: high + pad }
  }
  if (high !== undefined) return { min: 0, max: high * 1.5 } // "below X"
  return { min: 0, max: (low ?? 1) * 2 } // "above X"
}

const toPercent = (value: number, min: number, max: number) =>
  Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

/**
 * Decorative position of the value against its range (the table already states value, range and
 * status in text, so this is aria-hidden). Values beyond the scale stick to the edge with a chevron.
 */
export function RangeBar({ result, className }: { result: AnalyzedResult; className?: string }) {
  const { range } = result
  if (!range) return null

  const { min, max } = scaleFor(range)
  const margin = borderlineMargin(range)
  const normalStart = toPercent(range.low ?? min, min, max)
  const normalEnd = toPercent(range.high ?? max, min, max)
  const lowBand = range.low !== undefined ? toPercent(range.low + margin, min, max) : normalStart
  const highBand = range.high !== undefined ? toPercent(range.high - margin, min, max) : normalEnd
  const position = toPercent(result.value, min, max)
  const overflow = result.value > max ? "right" : result.value < min ? "left" : null
  const { tone } = statusInfo(result.status, result.direction)

  return (
    <div aria-hidden className={cn("relative h-4 w-full min-w-28", className)}>
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 bg-amber-400/45 dark:bg-amber-400/35"
          style={{ left: `${normalStart}%`, width: `${normalEnd - normalStart}%` }}
        />
        <div
          className="absolute inset-y-0 bg-emerald-500/45 dark:bg-emerald-400/40"
          style={{ left: `${lowBand}%`, width: `${Math.max(0, highBand - lowBand)}%` }}
        />
      </div>
      <div
        className={cn(
          "absolute top-0 h-4 w-1 -translate-x-1/2 rounded-full ring-2 ring-background transition-[left] duration-500 motion-reduce:transition-none",
          TONE_FILL[tone]
        )}
        style={{ left: `${position}%` }}
      />
      {overflow && (
        <span
          className={cn(
            "absolute -top-0.5 text-[10px] leading-none font-bold text-muted-foreground",
            overflow === "right" ? "-right-2.5" : "-left-2.5"
          )}
        >
          {overflow === "right" ? "›" : "‹"}
        </span>
      )}
    </div>
  )
}
