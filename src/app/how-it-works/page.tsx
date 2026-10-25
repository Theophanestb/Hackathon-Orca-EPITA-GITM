import type { Metadata } from "next";

import { StatusBadge } from "@/components/results/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMarker, isSexSpecific, MARKERS, PANELS } from "@/data/referenceRanges";
import { BORDERLINE_FRACTION } from "@/lib/analyze";
import { formatRange } from "@/lib/report";
import { RULES, type Priority } from "@/lib/rules";

export const metadata: Metadata = {
  title: "How it works",
  description: "Methodology, reference ranges and combination rules used by Lab Report Analyzer.",
};

const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
const pct = `${BORDERLINE_FRACTION * 100} %`;

const STATUSES = [
  {
    status: "normal",
    rule: `Inside the reference range and not within the borderline band.`,
  },
  {
    status: "borderline",
    direction: "high",
    rule: `Still inside the range, but within ${pct} of a bound. For two-sided ranges the band is ${pct} of the range width (potassium 3.5 to 5.0: borderline from 4.85). For one-sided limits it is ${pct} of the limit (HbA1c below 5.7: borderline from 5.13).`,
  },
  { status: "high", rule: "Outside the reference range (shown as Low or High)." },
  {
    status: "critical",
    direction: "high",
    rule: "Beyond a critical threshold (defined for potassium and sodium). Shown first, with a prompt to seek medical advice quickly.",
  },
  {
    status: "not_analysed",
    rule: "Unknown marker, unsupported unit, or sex-dependent range without sex. Always listed with the reason, never dropped.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <article className="flex flex-col gap-12">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          The analyzer is a small, transparent rules engine. There is no AI model and no black box: every result
          below comes from the tables on this page, applied in your browser.
        </p>
      </header>

      <Section title="1. Reading the report">
        <p>
          Reports come from a sample, a JSON or CSV file, or the manual form. Each line is validated: marker names are
          matched against the reference list and its common aliases (case and punctuation are ignored, so{" "}
          <em>free_t4</em>, <em>FT4</em> and <em>Free T4</em> are the same marker). Invalid numbers, negative values and
          duplicated markers are rejected with the exact line to fix. Units must match the expected unit or an
          equivalent spelling (µIU/mL = mIU/L): values are <strong>never converted</strong>, because a silent wrong
          conversion would be worse than no result.
        </p>
      </Section>

      <Section title="2. Classifying each value">
        <p>
          Two-sided ranges include both bounds (3.5 to 5.0 accepts 3.5 and 5.0). One-sided limits are strict, as
          written: &ldquo;below 5.7&rdquo; means a value of 5.7 is already high, and &ldquo;above 40&rdquo; means 40 is
          low. Status is always shown with an icon and a text label, never with colour alone.
        </p>
        <ul className="flex flex-col gap-3">
          {STATUSES.map((s) => (
            <li key={s.status} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <StatusBadge
                result={{ status: s.status, direction: "direction" in s ? s.direction : undefined }}
                className="w-fit sm:mt-0.5 sm:w-36 sm:shrink-0"
              />
              <span className="text-sm text-muted-foreground">{s.rule}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="3. Reference ranges">
        <p>Adult ranges, for demonstration. Real laboratories publish their own ranges, which may differ.</p>
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Marker</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Reference range</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead className="pr-4">What it measures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MARKERS.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="pl-4 font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {PANELS.find((p) => p.id === m.panel)?.name}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {isSexSpecific(m.range) ? (
                      <>
                        F {formatRange(m.range.female)} · M {formatRange(m.range.male)}
                      </>
                    ) : (
                      formatRange(m.range)
                    )}{" "}
                    <span className="text-muted-foreground">{m.unit}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {m.critical ? (
                      `< ${m.critical.low} or > ${m.critical.high}`
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 whitespace-normal text-muted-foreground">{m.about}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Section>

      <Section title="4. Combination rules">
        <p>
          Some patterns only make sense across several markers. A rule fires only when all its conditions hold.
          &ldquo;High&rdquo; and &ldquo;low&rdquo; mean out of range (a critical value counts, a borderline one does
          not). Detected patterns are sorted by priority.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {RULES.map((rule, index) => (
            <Card key={rule.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <h3>
                    {index + 1}. {rule.title}
                  </h3>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {PRIORITY_LABEL[rule.priority]} priority
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">{rule.condition}</p>
                <p className="text-muted-foreground">{rule.explanation}</p>
                <p>
                  <span className="font-medium">Next step:</span> {rule.nextStep}
                </p>
                <p className="text-xs text-muted-foreground">
                  Markers: {rule.markers.map((id) => getMarker(id).name).join(", ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="5. Limits">
        <ul className="list-disc space-y-2 pl-5">
          <li>Ranges are generic adult values; age, pregnancy, medication and lab methods are not taken into account.</li>
          <li>A value in range does not rule out a condition, and an out-of-range value is not a diagnosis.</li>
          <li>Only the 17 markers above are interpreted; anything else is listed as &ldquo;not analysed&rdquo;.</li>
          <li>This is a hackathon prototype. Always discuss your results with a healthcare professional.</li>
        </ul>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="flex max-w-none flex-col gap-4 leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
