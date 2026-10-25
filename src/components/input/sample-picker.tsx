"use client"

import { PlayIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SAMPLES } from "@/data/samples"
import { validateReportObject, type LabReport } from "@/lib/parse"

const ITEMS = SAMPLES.map((s) => ({ value: s.id, label: s.label }))

export function SamplePicker({ onReport }: { onReport: (report: LabReport, label: string) => void }) {
  const [sampleId, setSampleId] = useState(SAMPLES[0].id)
  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0]

  function analyse() {
    const parsed = validateReportObject(sample.data)
    if (!parsed.ok) {
      toast.error("This sample is invalid", { description: parsed.errors[0] })
      return
    }
    onReport(parsed.report, sample.label)
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground">
        Explore the analyzer with a fictitious report. Each sample shows a different situation.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sample-select">Sample report</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select items={ITEMS} value={sampleId} onValueChange={(value) => value && setSampleId(value)}>
            <SelectTrigger id="sample-select" className="h-10 w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" className="h-10 px-4" onClick={analyse}>
            <PlayIcon data-icon="inline-start" aria-hidden />
            Analyse this sample
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {sample.description}
        </p>
      </div>
    </div>
  )
}
