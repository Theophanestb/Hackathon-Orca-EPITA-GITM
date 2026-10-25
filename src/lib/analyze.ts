// Classifies each reported value against its reference range. Pure functions, no I/O.

import {
  findMarker,
  isSexSpecific,
  type MarkerDef,
  type RefRange,
  type Sex,
} from "@/data/referenceRanges";
import type { LabReport, ReportEntry } from "@/lib/parse";

export type Status = "normal" | "borderline" | "low" | "high" | "critical" | "not_analysed";
export type Direction = "low" | "high";

export interface Classification {
  status: Exclude<Status, "not_analysed">;
  /** Which side of the range the value leans to; absent when plainly normal. */
  direction?: Direction;
}

export interface AnalyzedResult {
  /** Stable React key. */
  key: string;
  /** Display name: the marker's canonical name, or the raw name for unknown markers. */
  name: string;
  value: number;
  unit?: string;
  marker?: MarkerDef;
  /** The range actually applied (sex-specific ranges resolved). */
  range?: RefRange;
  status: Status;
  direction?: Direction;
  /** Why the value was not analysed. */
  reason?: string;
}

export interface Summary {
  analysed: number;
  normal: number;
  borderline: number;
  outOfRange: number;
  critical: number;
  notAnalysed: number;
}

export interface Analysis {
  sex?: Sex;
  results: AnalyzedResult[];
  summary: Summary;
}

/** Share of the range used for the "borderline" band just inside each bound. */
export const BORDERLINE_FRACTION = 0.1;

/**
 * Width of the borderline band. Two-sided ranges use 10 % of the range width (10 % of the bound
 * itself would swallow narrow ranges such as sodium 135 to 145). One-sided limits have no width,
 * so they use 10 % of the limit.
 */
export function borderlineMargin(range: RefRange): number {
  const { low, high } = range;
  const base = low !== undefined && high !== undefined ? high - low : (high ?? low ?? 0);
  return round(base * BORDERLINE_FRACTION);
}

export function classifyValue(value: number, range: RefRange, critical?: RefRange): Classification {
  if (critical?.low !== undefined && value < critical.low) return { status: "critical", direction: "low" };
  if (critical?.high !== undefined && value > critical.high) return { status: "critical", direction: "high" };

  const { low, high } = range;
  const twoSided = low !== undefined && high !== undefined;
  // Two-sided ranges include their bounds; one-sided limits ("below X", "above X") are strict.
  if (low !== undefined && (twoSided ? value < low : value <= low)) return { status: "low", direction: "low" };
  if (high !== undefined && (twoSided ? value > high : value >= high)) return { status: "high", direction: "high" };

  const margin = borderlineMargin(range);
  if (low !== undefined && value <= round(low + margin)) return { status: "borderline", direction: "low" };
  if (high !== undefined && value >= round(high - margin)) return { status: "borderline", direction: "high" };
  return { status: "normal" };
}

export function resolveRange(marker: MarkerDef, sex?: Sex): RefRange | undefined {
  if (!isSexSpecific(marker.range)) return marker.range;
  return sex ? marker.range[sex] : undefined;
}

/** Lower-case, no spaces, µ/μ -> u: "µIU/mL" and "uiu/ml" compare equal. */
export function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/\s+/g, "").replace(/[µμ]/g, "u");
}

export function unitMatches(marker: MarkerDef, unit: string): boolean {
  const target = normalizeUnit(unit);
  return [marker.unit, ...(marker.unitAliases ?? [])].some((u) => normalizeUnit(u) === target);
}

export function analyzeEntry(entry: ReportEntry, sex: Sex | undefined, index: number): AnalyzedResult {
  const marker = findMarker(entry.name);
  const base = { key: `${index}-${entry.name}`, value: entry.value };

  if (!marker) {
    return {
      ...base,
      name: entry.name,
      unit: entry.unit,
      status: "not_analysed",
      reason: "Marker not in the reference list.",
    };
  }

  const shared = { ...base, name: marker.name, marker };
  if (entry.unit && !unitMatches(marker, entry.unit)) {
    return {
      ...shared,
      unit: entry.unit,
      status: "not_analysed",
      reason: `Unit "${entry.unit}" not supported (expected ${marker.unit}). Values are never converted.`,
    };
  }

  const range = resolveRange(marker, sex);
  if (!range) {
    return {
      ...shared,
      unit: marker.unit,
      status: "not_analysed",
      reason: "The reference range depends on sex, which was not provided.",
    };
  }

  return { ...shared, unit: marker.unit, range, ...classifyValue(entry.value, range, marker.critical) };
}

export function summarize(results: AnalyzedResult[]): Summary {
  const count = (...statuses: Status[]) => results.filter((r) => statuses.includes(r.status)).length;
  return {
    analysed: results.length - count("not_analysed"),
    normal: count("normal"),
    borderline: count("borderline"),
    outOfRange: count("low", "high"),
    critical: count("critical"),
    notAnalysed: count("not_analysed"),
  };
}

export function analyzeReport(report: LabReport): Analysis {
  const results = report.entries.map((entry, index) => analyzeEntry(entry, report.sex, index));
  return { sex: report.sex, results, summary: summarize(results) };
}

/** Rounds away floating-point noise (0.1 * 1.5 = 0.15000000000000002). */
function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
