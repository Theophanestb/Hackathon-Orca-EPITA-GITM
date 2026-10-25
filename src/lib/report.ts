import type { RefRange } from "@/data/referenceRanges";
import { analyzeReport, type Analysis } from "@/lib/analyze";
import type { LabReport } from "@/lib/parse";
import { evaluateRules, type Finding } from "@/lib/rules";

export interface FullAnalysis extends Analysis {
  findings: Finding[];
}

/** Classification first, then combination rules on top of the classified results. */
export function runAnalysis(report: LabReport): FullAnalysis {
  const analysis = analyzeReport(report);
  return { ...analysis, findings: evaluateRules(analysis.results) };
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2, useGrouping: false });
}

/** "12 – 16", "< 5.7", "> 40". */
export function formatRange(range: RefRange): string {
  const { low, high } = range;
  if (low !== undefined && high !== undefined) return `${formatNumber(low)} – ${formatNumber(high)}`;
  if (high !== undefined) return `< ${formatNumber(high)}`;
  if (low !== undefined) return `> ${formatNumber(low)}`;
  return "–";
}
