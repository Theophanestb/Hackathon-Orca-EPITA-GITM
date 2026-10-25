import { InfoIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"

export const DISCLAIMER =
  "This tool is a decision-support prototype, not a diagnosis. Always consult a healthcare professional."

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-start gap-2">
          <InfoIcon className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{DISCLAIMER}</span>
        </p>
        <Link
          href="/privacy"
          className="flex shrink-0 items-center gap-1.5 rounded-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none print:hidden"
        >
          <ShieldCheckIcon className="size-3.5" aria-hidden />
          Processed on your device only
        </Link>
      </div>
    </footer>
  )
}
