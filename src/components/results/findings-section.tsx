import { CircleCheckIcon, OctagonAlertIcon, StethoscopeIcon } from "lucide-react"
import { cn } from "cn"

import { StatusBadge, TONE_CLASSES } from "@/components/results/status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AnalyzedResult } from "@/lib/analyze"
import { formatNumber } from "@/lib/report"
import type { Finding, Priority } from "@/lib/rules"

const PRIORITY: Record<Priority, { label: string; className: string; accent: string }> = {
  high: { label: "High priority", className: TONE_CLASSES.critical, accent: "before:bg-red-600 dark:before:bg-red-400" },
  medium: { label: "Medium priority", className: TONE_CLASSES.out, accent: "before:bg-orange-500 dark:before:bg-orange-400" },
  low: { label: "Low priority", className: TONE_CLASSES.borderline, accent: "before:bg-amber-400" },
}

export function CriticalBanner({ results }: { results: AnalyzedResult[] }) {
  const critical = results.filter((r) => r.status === "critical")
  if (critical.length === 0) return null
  return (
    <Alert className="border-red-600/40 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
      <OctagonAlertIcon aria-hidden />
      <AlertTitle className="font-semibold">
        {critical.length === 1 ? "A critical value was detected" : `${critical.length} critical values were detected`}
      </AlertTitle>
      <AlertDescription className="text-red-900/90 dark:text-red-200/90">
        <p>
          {critical.map((r) => `${r.name} ${formatNumber(r.value)} ${r.unit ?? ""}`.trim()).join(", ")}. Values this
          far outside the range can need prompt medical attention: contact a doctor or your lab without delay.
        </p>
      </AlertDescription>
    </Alert>
  )
}

export function FindingsSection({ findings }: { findings: Finding[] }) {
  return (
    <section aria-labelledby="findings-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="findings-heading" className="text-lg font-semibold tracking-tight">
          Alerts
        </h2>
        <span className="text-sm text-muted-foreground">
          {findings.length === 0
            ? "No pattern detected"
            : `${findings.length} pattern${findings.length > 1 ? "s" : ""} detected`}
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
          <p>
            None of the 7 combination rules matched these results. Individual values can still be out of range: check
            the table below.
          </p>
        </div>
      ) : (
        <ol className="grid gap-4 lg:grid-cols-2">
          {findings.map(({ rule, involved }) => {
            const priority = PRIORITY[rule.priority]
            return (
              <li
                key={rule.id}
                className={cn(
                  "relative flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-5 pl-6 ring-1 ring-foreground/10",
                  "before:absolute before:inset-y-0 before:left-0 before:w-1",
                  priority.accent
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{rule.title}</h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      priority.className
                    )}
                  >
                    <OctagonAlertIcon className="size-3.5" aria-hidden />
                    {priority.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{rule.explanation}</p>
                <ul aria-label="Values involved" className="flex flex-wrap gap-2">
                  {involved.map((r) => (
                    <li key={r.key} className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className="tabular-nums">
                        {formatNumber(r.value)} {r.unit}
                      </span>
                      <StatusBadge result={r} />
                    </li>
                  ))}
                </ul>
                <p className="mt-auto flex items-start gap-2 border-t pt-3 text-sm font-medium">
                  <StethoscopeIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {rule.nextStep}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
