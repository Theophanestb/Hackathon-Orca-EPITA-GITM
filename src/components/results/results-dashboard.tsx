"use client"

import { PrinterIcon, RotateCcwIcon } from "lucide-react"
import { useEffect, useRef } from "react"

import { CriticalBanner, FindingsSection } from "@/components/results/findings-section"
import { ResultsTables } from "@/components/results/results-tables"
import { SummaryCards } from "@/components/results/summary-cards"
import { Button } from "@/components/ui/button"
import type { FullAnalysis } from "@/lib/report"

export interface AnalysisSource {
  kind: "sample" | "upload" | "manual"
  label: string
}

const SOURCE_PREFIX: Record<AnalysisSource["kind"], string> = {
  sample: "Sample",
  upload: "File",
  manual: "Manual entry",
}

export function ResultsDashboard({
  analysis,
  source,
  onClear,
}: {
  analysis: FullAnalysis
  source: AnalysisSource
  onClear: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the results so keyboard and screen-reader users land on them.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    headingRef.current?.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  }, [analysis])

  const sexLabel = analysis.sex ? (analysis.sex === "female" ? "Female" : "Male") : "Sex not specified"

  return (
    <div className="flex flex-col gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="hidden text-sm text-muted-foreground print:block">
            Lab Report Analyzer · generated on {new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="scroll-mt-24 text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
          >
            Your results
          </h1>
          <p className="text-sm text-muted-foreground">
            {SOURCE_PREFIX[source.kind]}: {source.label} · {sexLabel} · {analysis.results.length} value
            {analysis.results.length > 1 ? "s" : ""} read
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" aria-hidden />
            Print / Save as PDF
          </Button>
          <Button variant="ghost" size="lg" onClick={onClear}>
            <RotateCcwIcon data-icon="inline-start" aria-hidden />
            Clear
          </Button>
        </div>
      </div>

      <SummaryCards summary={analysis.summary} />
      <CriticalBanner results={analysis.results} />
      <FindingsSection findings={analysis.findings} />
      <ResultsTables results={analysis.results} />
    </div>
  )
}
