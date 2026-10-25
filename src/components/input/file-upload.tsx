"use client"

import { CircleXIcon, DownloadIcon, FileUpIcon, LoaderCircleIcon } from "lucide-react"
import { useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { MAX_FILE_BYTES, parseReport, type LabReport } from "@/lib/parse"

type UploadState =
  | { kind: "idle" }
  | { kind: "reading"; fileName: string }
  | { kind: "error"; fileName: string; errors: string[] }

const ACCEPTED = [".json", ".csv", ".txt"]
const MAX_ERRORS_SHOWN = 8

const CSV_EXAMPLE = `marker,value,unit
sex,female,
Haemoglobin,13.4,g/dL
Fasting glucose,92,mg/dL
Potassium,4.2,mmol/L`

const JSON_EXAMPLE = `{
  "sex": "female",
  "results": [
    { "marker": "Haemoglobin", "value": 13.4, "unit": "g/dL" },
    { "marker": "Fasting glucose", "value": 92, "unit": "mg/dL" }
  ]
}`

export function FileUpload({ onReport }: { onReport: (report: LabReport, label: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>({ kind: "idle" })
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    const fail = (errors: string[]) => {
      setState({ kind: "error", fileName: file.name, errors })
      toast.error("The file could not be analysed", { description: errors[0] })
    }

    if (!ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      return fail([`"${file.name}" is not a JSON or CSV file.`])
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail([`The file is too large (${Math.round(file.size / 1024)} KB). The limit is 1 MB.`])
    }

    setState({ kind: "reading", fileName: file.name })
    try {
      // The file is read in memory by the browser; it is never uploaded anywhere.
      const result = parseReport(await file.text(), file.name)
      if (!result.ok) return fail(result.errors)
      setState({ kind: "idle" })
      onReport(result.report, file.name)
    } catch {
      fail(["The file could not be read. Is it a plain-text JSON or CSV file?"])
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  const reading = state.kind === "reading"

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-muted/60" : "border-border hover:bg-muted/30"
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          {reading ? (
            <LoaderCircleIcon className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <FileUpIcon className="size-5" aria-hidden />
          )}
        </span>
        <div className="flex flex-col gap-1" aria-live="polite">
          <p className="font-medium">{reading ? `Reading ${state.fileName}…` : "Drop your report here"}</p>
          <p className="text-sm text-muted-foreground">JSON or CSV, up to 1 MB. Read locally, never uploaded.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <Button variant="outline" size="lg" disabled={reading} onClick={() => inputRef.current?.click()}>
          Choose a file
        </Button>
      </div>

      {state.kind === "error" && (
        <Alert variant="destructive" className="motion-safe:animate-in motion-safe:fade-in">
          <CircleXIcon aria-hidden />
          <AlertTitle>
            {state.fileName}: {state.errors.length} problem{state.errors.length > 1 ? "s" : ""} found
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {state.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {state.errors.length > MAX_ERRORS_SHOWN && (
              <p className="mt-2">…and {state.errors.length - MAX_ERRORS_SHOWN} more.</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-medium">Expected format</h3>
          <div className="flex flex-wrap gap-2">
            <a href="/samples/template.csv" download className={buttonVariants({ variant: "outline", size: "sm" })}>
              <DownloadIcon data-icon="inline-start" aria-hidden />
              CSV template
            </a>
            <a href="/samples/template.json" download className={buttonVariants({ variant: "outline", size: "sm" })}>
              <DownloadIcon data-icon="inline-start" aria-hidden />
              JSON template
            </a>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <FormatExample title="CSV" code={CSV_EXAMPLE} />
          <FormatExample title="JSON" code={JSON_EXAMPLE} />
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Columns <code className="font-mono text-foreground">marker</code> and{" "}
            <code className="font-mono text-foreground">value</code> are required;{" "}
            <code className="font-mono text-foreground">unit</code> is optional (the expected unit is then assumed).
          </li>
          <li>CSV can be separated by commas, semicolons or tabs. Decimal commas work with semicolons.</li>
          <li>
            Sex is needed for haemoglobin. Unknown markers and unsupported units are shown as &ldquo;not
            analysed&rdquo;, never converted or dropped.
          </li>
        </ul>
      </div>
    </div>
  )
}

function FormatExample({ title, code }: { title: string; code: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-muted/40">
      <figcaption className="border-b px-3 py-1.5 text-xs font-medium text-muted-foreground">{title}</figcaption>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  )
}
