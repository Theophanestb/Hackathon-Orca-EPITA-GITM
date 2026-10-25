"use client"

import { FileUpIcon, FlaskConicalIcon, KeyboardIcon, ShieldCheckIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { FileUpload } from "@/components/input/file-upload"
import { ManualEntry } from "@/components/input/manual-entry"
import { SamplePicker } from "@/components/input/sample-picker"
import { ResultsDashboard, type AnalysisSource } from "@/components/results/results-dashboard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LabReport } from "@/lib/parse"
import { runAnalysis, type FullAnalysis } from "@/lib/report"

type InputTab = AnalysisSource["kind"]

/**
 * Holds the current analysis in memory only. Nothing is stored (no localStorage, no cookies):
 * reloading the page or pressing "Clear" discards the data.
 */
export function Analyzer() {
  const [tab, setTab] = useState<InputTab>("sample")
  const [current, setCurrent] = useState<{ analysis: FullAnalysis; source: AnalysisSource } | null>(null)

  function handleReport(kind: InputTab) {
    return (report: LabReport, label: string) => {
      const analysis = runAnalysis(report)
      setCurrent({ analysis, source: { kind, label } })
      const { analysed, notAnalysed } = analysis.summary
      const patterns = analysis.findings.length
      toast.success("Analysis complete", {
        description:
          `${analysed} marker${analysed === 1 ? "" : "s"} analysed` +
          (notAnalysed ? `, ${notAnalysed} not analysed` : "") +
          `, ${patterns} pattern${patterns === 1 ? "" : "s"} detected.`,
      })
    }
  }

  function clear() {
    setCurrent(null)
    toast("Results cleared", { description: "Nothing was stored: the data is gone." })
    window.scrollTo({ top: 0 })
  }

  if (current) {
    return <ResultsDashboard analysis={current.analysis} source={current.source} onClear={clear} />
  }

  return (
    <div className="flex flex-col gap-10 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <section className="flex flex-col items-start gap-4">
        <Badge variant="secondary" className="h-7 gap-1.5 px-3 text-sm">
          <ShieldCheckIcon aria-hidden />
          Privacy: your data never leaves your device
        </Badge>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Understand your lab results, privately
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Compare each value with adult reference ranges, spot meaningful combinations across markers, and get
          plain-language explanations. Everything runs in your browser.
        </p>
      </section>

      <Card className="gap-0 py-0">
        <Tabs value={tab} onValueChange={(value) => setTab(value as InputTab)} className="gap-0">
          <div className="border-b p-3 sm:p-4">
            <TabsList className="h-10! w-full sm:w-auto">
              <TabsTrigger value="sample" className="px-3">
                <FlaskConicalIcon aria-hidden />
                <span>
                  <span className="hidden sm:inline">Try a </span>Sample
                </span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="px-3">
                <FileUpIcon aria-hidden />
                Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="px-3">
                <KeyboardIcon aria-hidden />
                <span>
                  Manual<span className="hidden sm:inline"> entry</span>
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
          <CardContent className="p-4 text-base sm:p-6">
            <TabsContent value="sample">
              <SamplePicker onReport={handleReport("sample")} />
            </TabsContent>
            <TabsContent value="upload">
              <FileUpload onReport={handleReport("upload")} />
            </TabsContent>
            {/* Kept mounted so typed values survive switching tabs. */}
            <TabsContent value="manual" keepMounted>
              <ManualEntry onReport={handleReport("manual")} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
