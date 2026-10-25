"use client"

import { EraserIcon, PlayIcon } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isSexSpecific, MARKERS, PANELS, type MarkerDef, type MarkerId, type Sex } from "@/data/referenceRanges"
import { parseNumber, type LabReport } from "@/lib/parse"
import { formatRange } from "@/lib/report"

const SEX_ITEMS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
]

type Values = Partial<Record<MarkerId, string>>
type Errors = Partial<Record<MarkerId | "sex" | "form", string>>

function without(errors: Errors, key: keyof Errors): Errors {
  const next = { ...errors }
  delete next[key]
  return next
}

function rangeHint(marker: MarkerDef, sex: Sex | null): string {
  if (!isSexSpecific(marker.range)) return formatRange(marker.range)
  if (sex) return formatRange(marker.range[sex])
  return `F ${formatRange(marker.range.female)} · M ${formatRange(marker.range.male)}`
}

export function ManualEntry({ onReport }: { onReport: (report: LabReport, label: string) => void }) {
  const [sex, setSex] = useState<Sex | null>(null)
  const [values, setValues] = useState<Values>({})
  const [errors, setErrors] = useState<Errors>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Errors = {}
    const entries: LabReport["entries"] = []

    if (!sex) nextErrors.sex = "Select a sex: haemoglobin ranges depend on it."
    for (const marker of MARKERS) {
      const raw = values[marker.id]?.trim()
      if (!raw) continue
      const value = parseNumber(raw)
      if (value === undefined) nextErrors[marker.id] = "Enter a number, e.g. 4.2"
      else if (value < 0) nextErrors[marker.id] = "The value cannot be negative."
      else entries.push({ name: marker.name, value, unit: marker.unit })
    }
    if (entries.length === 0 && Object.keys(nextErrors).every((k) => k === "sex")) {
      nextErrors.form = "Enter at least one value."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please check the form", {
        description: nextErrors.form ?? nextErrors.sex ?? "Some values are not valid numbers.",
      })
      // Bring the first invalid field into view and focus.
      const firstId = nextErrors.sex ? "manual-sex" : `manual-${Object.keys(nextErrors).find((k) => k !== "form")}`
      document.getElementById(firstId)?.focus()
      return
    }
    onReport({ sex: sex!, entries }, `${entries.length} value${entries.length > 1 ? "s" : ""}`)
  }

  function reset() {
    setSex(null)
    setValues({})
    setErrors({})
  }

  const filled = Object.values(values).filter((v) => v?.trim()).length

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <p className="text-muted-foreground">
        Type the values from your report. Leave a field empty if the marker was not measured; use the units shown.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-sex">
          Sex <span className="text-muted-foreground">(required)</span>
        </Label>
        <Select
          items={SEX_ITEMS}
          value={sex}
          onValueChange={(value) => {
            setSex(value as Sex | null)
            setErrors((e) => without(e, "sex"))
          }}
        >
          <SelectTrigger
            id="manual-sex"
            className="h-10 w-full sm:w-56"
            aria-invalid={errors.sex ? true : undefined}
            aria-describedby={errors.sex ? "manual-sex-error" : undefined}
          >
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {SEX_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sex && (
          <p id="manual-sex-error" className="text-sm text-destructive">
            {errors.sex}
          </p>
        )}
      </div>

      {PANELS.map((panel) => {
        const markers = MARKERS.filter((m) => m.panel === panel.id)
        return (
          <fieldset key={panel.id} className="flex flex-col gap-4">
            <legend className="mb-3 text-sm font-semibold tracking-tight">{panel.name}</legend>
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {markers.map((marker) => {
                const id = `manual-${marker.id}`
                const error = errors[marker.id]
                return (
                  <div key={marker.id} className="flex flex-col gap-2">
                    <Label htmlFor={id} className="justify-between">
                      <span>
                        {marker.name}
                        <span className="sr-only"> in {marker.unit}</span>
                      </span>
                      <span className="text-xs font-normal text-muted-foreground tabular-nums">
                        ref. {rangeHint(marker, sex)}
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id={id}
                        inputMode="decimal"
                        autoComplete="off"
                        className="h-10 pr-16 tabular-nums"
                        value={values[marker.id] ?? ""}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={(event) => {
                          const value = event.target.value
                          setValues((v) => ({ ...v, [marker.id]: value }))
                          if (error) setErrors((e) => without(e, marker.id))
                        }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground"
                      >
                        {marker.unit}
                      </span>
                    </div>
                    {error && (
                      <p id={`${id}-error`} className="text-sm text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      {errors.form && (
        <p className="text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-lg sm:border sm:px-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filled} of {MARKERS.length} markers filled
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={reset} className="flex-1 sm:flex-none">
            <EraserIcon data-icon="inline-start" aria-hidden />
            Reset
          </Button>
          <Button type="submit" size="lg" className="flex-1 px-4 sm:flex-none">
            <PlayIcon data-icon="inline-start" aria-hidden />
            Analyse
          </Button>
        </div>
      </div>
    </form>
  )
}
