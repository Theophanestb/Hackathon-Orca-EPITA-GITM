// Combination rules: patterns across several markers that are more informative together.
// Each rule is declarative data plus a predicate over the analysed results.

import type { MarkerId } from "@/data/referenceRanges";
import type { AnalyzedResult } from "@/lib/analyze";

export type Priority = "high" | "medium" | "low";

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export type ResultLookup = (id: MarkerId) => AnalyzedResult | undefined;

export interface CombinationRule {
  id: string;
  title: string;
  markers: MarkerId[];
  priority: Priority;
  /** The exact trigger condition, in words (shown on the "How it works" page). */
  condition: string;
  explanation: string;
  nextStep: string;
  matches: (get: ResultLookup) => boolean;
}

export interface Finding {
  rule: CombinationRule;
  involved: AnalyzedResult[];
}

/** Out of range on the high side; a critical value counts, a borderline one does not. */
export function isHigh(result: AnalyzedResult | undefined): boolean {
  return result?.direction === "high" && (result.status === "high" || result.status === "critical");
}

export function isLow(result: AnalyzedResult | undefined): boolean {
  return result?.direction === "low" && (result.status === "low" || result.status === "critical");
}

export const DIABETES_HBA1C_THRESHOLD = 6.5;

export const RULES: CombinationRule[] = [
  {
    id: "possible-diabetes",
    title: "Possible diabetes",
    markers: ["glucose", "hba1c"],
    priority: "high",
    condition: `Fasting glucose high AND HbA1c ≥ ${DIABETES_HBA1C_THRESHOLD} %`,
    explanation:
      "Both your current blood sugar and your 3-month average are raised. Together, these values match the usual criteria used to screen for diabetes.",
    nextStep: "Discuss with a doctor, who may confirm it with a repeat test.",
    matches: (get) => {
      const hba1c = get("hba1c");
      return (
        isHigh(get("glucose")) &&
        hba1c !== undefined &&
        hba1c.status !== "not_analysed" &&
        hba1c.value >= DIABETES_HBA1C_THRESHOLD
      );
    },
  },
  {
    id: "kidney-function",
    title: "Kidney function to check",
    markers: ["creatinine", "potassium"],
    priority: "high",
    condition: "Creatinine high AND potassium high",
    explanation:
      "Creatinine is cleared by the kidneys and potassium is balanced by them. When both are high, the kidneys may not be filtering as well as they should, and high potassium can affect heart rhythm.",
    nextStep: "Discuss with a doctor promptly. High potassium can need quick attention.",
    matches: (get) => isHigh(get("creatinine")) && isHigh(get("potassium")),
  },
  {
    id: "liver-damage",
    title: "Possible liver damage",
    markers: ["alt", "ast"],
    priority: "high",
    condition: "ALT high AND AST high",
    explanation:
      "ALT and AST are enzymes released when liver cells are stressed or damaged. Both being high points to the liver (causes range from medication and alcohol to fatty liver or hepatitis).",
    nextStep: "Discuss with a doctor, who can look for the cause.",
    matches: (get) => isHigh(get("alt")) && isHigh(get("ast")),
  },
  {
    id: "iron-deficiency-anaemia",
    title: "Possible iron-deficiency anaemia",
    markers: ["haemoglobin", "ferritin"],
    priority: "medium",
    condition: "Haemoglobin low AND ferritin low",
    explanation:
      "Low haemoglobin means less oxygen is carried in the blood, and low ferritin means iron stores are depleted. Together they suggest anaemia caused by a lack of iron, which can explain tiredness.",
    nextStep: "Discuss with a doctor before taking iron supplements.",
    matches: (get) => isLow(get("haemoglobin")) && isLow(get("ferritin")),
  },
  {
    id: "hypothyroidism",
    title: "Possible hypothyroidism",
    markers: ["tsh", "ft4"],
    priority: "medium",
    condition: "TSH high AND free T4 low",
    explanation:
      "When the thyroid produces too little hormone (low free T4), the pituitary gland pushes harder by releasing more TSH. This pairing is the typical pattern of an underactive thyroid.",
    nextStep: "Discuss with a doctor, who may run further thyroid tests.",
    matches: (get) => isHigh(get("tsh")) && isLow(get("ft4")),
  },
  {
    id: "infection-inflammation",
    title: "Possible infection or inflammation",
    markers: ["wbc", "crp"],
    priority: "medium",
    condition: "White blood cells high AND CRP high",
    explanation:
      "White blood cells fight infection and CRP rises quickly with inflammation. Both being high suggests the body is responding to an infection or another inflammatory process.",
    nextStep: "Discuss with a doctor, especially if you have fever or feel unwell.",
    matches: (get) => isHigh(get("wbc")) && isHigh(get("crp")),
  },
  {
    id: "cardiovascular-risk",
    title: "Cardiovascular risk profile",
    markers: ["ldl", "hdl", "triglycerides"],
    priority: "low",
    condition: "LDL high AND HDL low AND triglycerides high",
    explanation:
      "High \"bad\" cholesterol, low \"good\" cholesterol and high triglycerides together increase the long-term risk of heart and blood-vessel disease. It is a risk profile, not a disease, and lifestyle has a strong effect on it.",
    nextStep: "Discuss with a doctor, who can assess your overall cardiovascular risk.",
    matches: (get) => isHigh(get("ldl")) && isLow(get("hdl")) && isHigh(get("triglycerides")),
  },
];

/** Runs every rule; findings are sorted by priority, then by rule order. */
export function evaluateRules(results: AnalyzedResult[], rules: CombinationRule[] = RULES): Finding[] {
  const byId = new Map<MarkerId, AnalyzedResult>();
  for (const result of results) {
    if (result.marker && !byId.has(result.marker.id)) byId.set(result.marker.id, result);
  }
  const get: ResultLookup = (id) => byId.get(id);

  return rules
    .map((rule, order) => ({ rule, order }))
    .filter(({ rule }) => rule.matches(get))
    .sort((a, b) => PRIORITY_ORDER[a.rule.priority] - PRIORITY_ORDER[b.rule.priority] || a.order - b.order)
    .map(({ rule }) => ({
      rule,
      involved: rule.markers.map(get).filter((r): r is AnalyzedResult => r !== undefined),
    }));
}
