import { describe, expect, it } from "vitest";

import type { Sex } from "@/data/referenceRanges";
import { SAMPLES } from "@/data/samples";
import { analyzeReport } from "@/lib/analyze";
import { validateReportObject } from "@/lib/parse";
import { runAnalysis } from "@/lib/report";
import { evaluateRules, RULES } from "@/lib/rules";

function findingsFor(values: Record<string, number>, sex: Sex = "female") {
  const entries = Object.entries(values).map(([name, value]) => ({ name, value }));
  return evaluateRules(analyzeReport({ sex, entries }).results).map((f) => f.rule.id);
}

describe("combination rules", () => {
  it("every rule has the required metadata and a 'discuss with a doctor' next step", () => {
    for (const rule of RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.title).toBeTruthy();
      expect(rule.markers.length).toBeGreaterThanOrEqual(2);
      expect(rule.explanation.length).toBeGreaterThan(40);
      expect(rule.nextStep).toMatch(/^Discuss with a doctor/);
    }
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
  });

  it("1. possible diabetes: high glucose AND HbA1c >= 6.5", () => {
    expect(findingsFor({ glucose: 130, hba1c: 6.5 })).toEqual(["possible-diabetes"]);
    expect(findingsFor({ glucose: 130, hba1c: 6.4 })).toEqual([]);
    expect(findingsFor({ glucose: 97, hba1c: 7.2 })).toEqual([]); // glucose borderline, not high
    expect(findingsFor({ glucose: 130 })).toEqual([]); // HbA1c missing
  });

  it("2. kidney function: high creatinine AND high potassium (critical counts as high)", () => {
    expect(findingsFor({ creatinine: 1.8, potassium: 5.4 })).toEqual(["kidney-function"]);
    expect(findingsFor({ creatinine: 1.8, potassium: 6.8 })).toEqual(["kidney-function"]);
    expect(findingsFor({ creatinine: 1.8, potassium: 4.0 })).toEqual([]);
    expect(findingsFor({ creatinine: 1.8, potassium: 2.5 })).toEqual([]); // critical LOW is not high
  });

  it("3. liver damage: high ALT AND high AST", () => {
    expect(findingsFor({ alt: 90, ast: 70 })).toEqual(["liver-damage"]);
    expect(findingsFor({ alt: 90, ast: 39 })).toEqual([]);
  });

  it("4. iron-deficiency anaemia: low haemoglobin AND low ferritin (sex-aware)", () => {
    expect(findingsFor({ haemoglobin: 11, ferritin: 15 }, "female")).toEqual(["iron-deficiency-anaemia"]);
    expect(findingsFor({ haemoglobin: 12.5, ferritin: 15 }, "female")).toEqual([]);
    expect(findingsFor({ haemoglobin: 12.5, ferritin: 15 }, "male")).toEqual(["iron-deficiency-anaemia"]);
  });

  it("5. hypothyroidism: high TSH AND low free T4", () => {
    expect(findingsFor({ tsh: 8, ft4: 0.6 })).toEqual(["hypothyroidism"]);
    expect(findingsFor({ tsh: 8, ft4: 1.2 })).toEqual([]);
    expect(findingsFor({ tsh: 0.1, ft4: 0.6 })).toEqual([]);
  });

  it("6. cardiovascular risk: high LDL AND low HDL AND high triglycerides", () => {
    expect(findingsFor({ ldl: 160, hdl: 35, triglycerides: 200 })).toEqual(["cardiovascular-risk"]);
    expect(findingsFor({ ldl: 160, hdl: 45, triglycerides: 200 })).toEqual([]);
    expect(findingsFor({ ldl: 160, hdl: 35 })).toEqual([]);
  });

  it("7. infection or inflammation: high WBC AND high CRP", () => {
    expect(findingsFor({ wbc: 14, crp: 30 })).toEqual(["infection-inflammation"]);
    expect(findingsFor({ wbc: 14, crp: 2 })).toEqual([]);
  });

  it("sorts findings by priority, then by rule order", () => {
    const ids = findingsFor({
      ldl: 160, hdl: 35, triglycerides: 200, // low
      wbc: 14, crp: 30, // medium
      alt: 90, ast: 70, // high
      creatinine: 1.8, potassium: 5.4, // high
    });
    expect(ids).toEqual(["kidney-function", "liver-damage", "infection-inflammation", "cardiovascular-risk"]);
  });

  it("lists the involved results with each finding", () => {
    const [finding] = evaluateRules(analyzeReport({ entries: [{ name: "ALT", value: 90 }, { name: "AST", value: 70 }] }).results);
    expect(finding.involved.map((r) => [r.name, r.value])).toEqual([["ALT", 90], ["AST", 70]]);
  });
});

describe("demo samples", () => {
  const analyse = (id: string) => {
    const parsed = validateReportObject(SAMPLES.find((s) => s.id === id)!.data);
    if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
    return runAnalysis(parsed.report);
  };

  it("healthy: everything normal, no finding", () => {
    const { summary, findings } = analyse("healthy");
    expect(summary).toMatchObject({ analysed: 17, normal: 17, notAnalysed: 0 });
    expect(findings).toEqual([]);
  });

  it("single anomaly: exactly one value out of range, one unknown marker, no finding", () => {
    const { summary, findings, results } = analyse("single-anomaly");
    expect(summary).toMatchObject({ outOfRange: 1, borderline: 0, critical: 0, notAnalysed: 1 });
    expect(results.find((r) => r.status === "low")?.name).toBe("Ferritin");
    expect(findings).toEqual([]);
  });

  it("metabolic risk: several combinations", () => {
    const { findings } = analyse("metabolic-risk");
    expect(findings.map((f) => f.rule.id)).toEqual(["possible-diabetes", "liver-damage", "cardiovascular-risk"]);
  });

  it("critical case: a critical value and the kidney rule first", () => {
    const { summary, findings } = analyse("critical");
    expect(summary.critical).toBe(1);
    expect(findings[0].rule.id).toBe("kidney-function");
    expect(findings.map((f) => f.rule.id)).toContain("infection-inflammation");
  });
});
