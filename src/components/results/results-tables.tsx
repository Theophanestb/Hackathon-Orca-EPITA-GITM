import { CircleDashedIcon } from "lucide-react"

import { RangeBar } from "@/components/results/range-bar"
import { StatusBadge } from "@/components/results/status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PANELS } from "@/data/referenceRanges"
import type { AnalyzedResult } from "@/lib/analyze"
import { formatNumber, formatRange } from "@/lib/report"

export function ResultsTables({ results }: { results: AnalyzedResult[] }) {
  const analysed = results.filter((r) => r.status !== "not_analysed")
  const notAnalysed = results.filter((r) => r.status === "not_analysed")
  const panels = PANELS.map((panel) => ({
    ...panel,
    rows: analysed.filter((r) => r.marker?.panel === panel.id),
  })).filter((panel) => panel.rows.length > 0)

  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-4">
      <h2 id="results-heading" className="text-lg font-semibold tracking-tight">
        Results by panel
      </h2>
      <div className="grid gap-4">
        {panels.map((panel) => (
          <Card key={panel.id} className="gap-2 pb-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <h3>{panel.name}</h3>
                <span className="text-xs font-normal text-muted-foreground">
                  {panel.rows.length} marker{panel.rows.length > 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="w-[34%] pl-4 text-muted-foreground sm:w-[26%]">Marker</TableHead>
                    <TableHead className="w-[22%] text-right text-muted-foreground sm:w-[14%]">Value</TableHead>
                    <TableHead className="hidden text-muted-foreground sm:table-cell sm:w-[18%]">Reference</TableHead>
                    <TableHead className="hidden text-muted-foreground md:table-cell print:table-cell">
                      <span className="sr-only">Position in range</span>
                    </TableHead>
                    <TableHead className="w-[44%] pr-4 text-right text-muted-foreground sm:w-[20%]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {panel.rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="pl-4 whitespace-normal">
                        <span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground sm:hidden">
                          Ref. {formatRange(r.range!)} {r.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-normal tabular-nums">
                        <span className="font-semibold">{formatNumber(r.value)}</span>{" "}
                        <span className="text-xs text-muted-foreground">{r.unit}</span>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                        {formatRange(r.range!)} <span className="text-xs">{r.unit}</span>
                      </TableCell>
                      <TableCell className="hidden px-4 md:table-cell print:table-cell">
                        <RangeBar result={r} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <StatusBadge result={r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {notAnalysed.length > 0 && (
          <Card className="gap-2 border-dashed pb-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDashedIcon className="size-4 text-muted-foreground" aria-hidden />
                <h3>Not analysed</h3>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These values were read from your report but could not be classified. They are listed so that nothing
                is silently dropped.
              </p>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="w-[34%] pl-4 text-muted-foreground sm:w-[26%]">Marker</TableHead>
                    <TableHead className="w-[22%] text-right text-muted-foreground sm:w-[14%]">Value</TableHead>
                    <TableHead className="pr-4 text-muted-foreground">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notAnalysed.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="pl-4 font-medium whitespace-normal">{r.name}</TableCell>
                      <TableCell className="text-right whitespace-normal tabular-nums">
                        {formatNumber(r.value)} <span className="text-xs text-muted-foreground">{r.unit}</span>
                      </TableCell>
                      <TableCell className="pr-4 whitespace-normal text-muted-foreground">
                        <StatusBadge result={r} className="mr-2 mb-1" />
                        {r.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
