import { describe, expect, it } from "vitest";

import { getMarker } from "@/data/referenceRanges";
import {
  analyzeEntry,
  analyzeReport,
  borderlineMargin,
  classifyValue,
  normalizeUnit,
  resolveRange,
} from "@/lib/analyze";

describe("classifyValue: two-sided range (potassium 3.5 to 5.0, critical < 3.0 / > 6.0)", () => {
  const { range, critical } = { range: { low: 3.5, high: 5.0 }, critical: { low: 3.0, high: 6.0 } };
  const classify = (v: number) => classifyValue(v, range, critical);

  it("uses 10 % of the range width as borderline band", () => {
    expect(borderlineMargin(range)).toBe(0.15);
  });

  it.each([
    [2.9, "critical", "low"],
    [3.0, "low", "low"], // critical is strict: exactly 3.0 is low, not critical
    [3.49, "low", "low"],
    [3.5, "borderline", "low"], // bounds are inside the range
    [3.65, "borderline", "low"],
    [3.66, "normal", undefined],
    [4.2, "normal", undefined],
    [4.84, "normal", undefined],
    [4.85, "borderline", "high"],
    [5.0, "borderline", "high"],
    [5.01, "high", "high"],
    [6.0, "high", "high"],
    [6.01, "critical", "high"],
  ])("%s -> %s (%s)", (value, status, direction) => {
    expect(classify(value)).toEqual(direction ? { status, direction } : { status });
  });
});

describe("classifyValue: one-sided limits are strict", () => {
  it("'below 5.7' (HbA1c): 5.7 is already high, borderline from 5.13", () => {
    const range = { high: 5.7 };
    expect(classifyValue(5.7, range)).toEqual({ status: "high", direction: "high" });
    expect(classifyValue(5.69, range)).toEqual({ status: "borderline", direction: "high" });
    expect(classifyValue(5.13, range)).toEqual({ status: "borderline", direction: "high" });
    expect(classifyValue(5.12, range)).toEqual({ status: "normal" });
    expect(classifyValue(0, range)).toEqual({ status: "normal" });
  });

  it("'above 40' (HDL): 40 is low, borderline up to 44", () => {
    const range = { low: 40 };
    expect(classifyValue(40, range)).toEqual({ status: "low", direction: "low" });
    expect(classifyValue(40.5, range)).toEqual({ status: "borderline", direction: "low" });
    expect(classifyValue(44, range)).toEqual({ status: "borderline", direction: "low" });
    expect(classifyValue(44.1, range)).toEqual({ status: "normal" });
    expect(classifyValue(90, range)).toEqual({ status: "normal" });
  });

  it("narrow ranges keep a usable normal zone (sodium 135 to 145)", () => {
    const range = { low: 135, high: 145 };
    expect(classifyValue(136, range)).toEqual({ status: "borderline", direction: "low" });
    expect(classifyValue(140, range)).toEqual({ status: "normal" });
    expect(classifyValue(144, range)).toEqual({ status: "borderline", direction: "high" });
  });
});

describe("sex-specific ranges", () => {
  const haemoglobin = getMarker("haemoglobin");

  it("resolves the range for the given sex", () => {
    expect(resolveRange(haemoglobin, "female")).toEqual({ low: 12, high: 16 });
    expect(resolveRange(haemoglobin, "male")).toEqual({ low: 13, high: 17 });
    expect(resolveRange(haemoglobin)).toBeUndefined();
  });

  it("the same value can be normal for a woman and low for a man", () => {
    const entry = { name: "Haemoglobin", value: 12.8, unit: "g/dL" };
    expect(analyzeEntry(entry, "female", 0).status).toBe("normal");
    expect(analyzeEntry(entry, "male", 0).status).toBe("low");
  });

  it("is not analysed when sex is unknown, with an explicit reason", () => {
    const result = analyzeEntry({ name: "Hb", value: 14 }, undefined, 0);
    expect(result.status).toBe("not_analysed");
    expect(result.reason).toMatch(/sex/);
  });
});

describe("analyzeEntry", () => {
  it("matches aliases case- and punctuation-insensitively", () => {
    expect(analyzeEntry({ name: "free_t4", value: 1.2 }, undefined, 0).marker?.id).toBe("ft4");
    expect(analyzeEntry({ name: "LDL-C", value: 100 }, undefined, 0).marker?.id).toBe("ldl");
    expect(analyzeEntry({ name: "Hémoglobine", value: 14 }, "male", 0).marker).toBeUndefined();
  });

  it("keeps unknown markers as 'not analysed' instead of dropping them", () => {
    const result = analyzeEntry({ name: "Vitamin D", value: 32, unit: "ng/mL" }, "female", 0);
    expect(result).toMatchObject({ name: "Vitamin D", value: 32, unit: "ng/mL", status: "not_analysed" });
    expect(result.reason).toMatch(/not in the reference list/);
  });

  it("refuses units it cannot compare, and never converts", () => {
    const result = analyzeEntry({ name: "Glucose", value: 5.4, unit: "mmol/L" }, undefined, 0);
    expect(result.status).toBe("not_analysed");
    expect(result.reason).toMatch(/expected mg\/dL/);
  });

  it("accepts equivalent unit spellings", () => {
    expect(normalizeUnit("µIU/mL")).toBe(normalizeUnit("uIU/ml"));
    expect(analyzeEntry({ name: "TSH", value: 2, unit: "µIU/mL" }, undefined, 0).status).toBe("normal");
    expect(analyzeEntry({ name: "WBC", value: 6, unit: "10^9/L" }, undefined, 0).status).toBe("normal");
    expect(analyzeEntry({ name: "Ferritin", value: 100, unit: "µg/L" }, undefined, 0).status).toBe("normal");
  });

  it("assumes the expected unit when none is given", () => {
    expect(analyzeEntry({ name: "CRP", value: 12 }, undefined, 0)).toMatchObject({ unit: "mg/L", status: "high" });
  });
});

describe("analyzeReport", () => {
  it("counts every status in the summary", () => {
    const { summary, results } = analyzeReport({
      sex: "female",
      entries: [
        { name: "Glucose", value: 85 }, // normal
        { name: "Sodium", value: 135.5 }, // borderline
        { name: "ALT", value: 80 }, // high
        { name: "HDL", value: 35 }, // low
        { name: "Potassium", value: 6.5 }, // critical
        { name: "Vitamin B12", value: 400 }, // not analysed
      ],
    });
    expect(results).toHaveLength(6);
    expect(summary).toEqual({ analysed: 5, normal: 1, borderline: 1, outOfRange: 2, critical: 1, notAnalysed: 1 });
  });
});
