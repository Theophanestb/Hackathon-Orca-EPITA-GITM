import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  parseCsvReport,
  parseJsonReport,
  parseNumber,
  parseReport,
  splitCsvLine,
  type ParseResult,
} from "@/lib/parse";

function expectOk(result: ParseResult) {
  if (!result.ok) throw new Error(`expected ok, got: ${result.errors.join(" | ")}`);
  return result.report;
}

function expectErrors(result: ParseResult) {
  if (result.ok) throw new Error("expected errors, got ok");
  return result.errors;
}

describe("parseNumber", () => {
  it.each([
    [5, 5],
    ["5.6", 5.6],
    ["5,6", 5.6],
    [" 12 ", 12],
    [".5", 0.5],
    ["abc", undefined],
    ["<5", undefined],
    ["", undefined],
    [Number.NaN, undefined],
    [null, undefined],
  ])("%j -> %j", (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected);
  });
});

describe("parseJsonReport", () => {
  it("parses the documented format", () => {
    const report = expectOk(
      parseJsonReport(
        JSON.stringify({ sex: "Female", results: [{ marker: "Glucose", value: 92, unit: "mg/dL" }, { name: "CRP", value: "1,5" }] }),
      ),
    );
    expect(report).toEqual({
      sex: "female",
      entries: [
        { name: "Glucose", value: 92, unit: "mg/dL", location: "result #1" },
        { name: "CRP", value: 1.5, unit: undefined, location: "result #2" },
      ],
    });
  });

  it("accepts a bare array of results", () => {
    expect(expectOk(parseJsonReport('[{"marker":"TSH","value":2}]')).entries).toHaveLength(1);
  });

  it("reports invalid JSON", () => {
    expect(expectErrors(parseJsonReport("{ results: ")).join()).toMatch(/not valid JSON/);
  });

  it("explains a missing or malformed results field", () => {
    expect(expectErrors(parseJsonReport('{"sex":"male"}'))[0]).toMatch(/Missing "results"/);
    expect(expectErrors(parseJsonReport('{"results":{}}'))[0]).toMatch(/must be an array/);
    expect(expectErrors(parseJsonReport('"hello"'))[0]).toMatch(/object with a "results" array/);
  });

  it("collects every item error with its position and name", () => {
    const errors = expectErrors(
      parseJsonReport(
        JSON.stringify({
          sex: "unknown",
          results: [{ marker: "Glucose", value: "high" }, { value: 3 }, { marker: "ALT", value: -4 }, { marker: "AST" }, 42],
        }),
      ),
    );
    expect(errors).toEqual([
      '"sex" must be "female" or "male", got "unknown".',
      'Result #1 ("Glucose"): the value must be a number, got "high".',
      'Result #2: "marker" is missing or empty.',
      'Result #3 ("ALT"): the value cannot be negative (-4).',
      'Result #4 ("AST"): the value is missing.',
      'Result #5: expected an object like { "marker": "Glucose", "value": 92, "unit": "mg/dL" }.',
    ]);
  });

  it("rejects duplicates, including aliases of the same marker", () => {
    const errors = expectErrors(
      parseJsonReport('{"results":[{"marker":"Hb","value":13},{"marker":"Haemoglobin","value":14}]}'),
    );
    expect(errors[0]).toMatch(/"Haemoglobin" appears more than once \(result #1 and result #2\)/);
  });

  it("rejects an empty report", () => {
    expect(expectErrors(parseJsonReport('{"results":[]}'))).toEqual(["The report contains no results."]);
  });
});

describe("parseCsvReport", () => {
  it("parses comma-separated data with a sex row, comments and blank lines", () => {
    const report = expectOk(
      parseCsvReport("﻿# exported 2026-10-25\nmarker,value,unit\r\nsex,male,\n\nGlucose,92,mg/dL\nCRP,1.5\n"),
    );
    expect(report.sex).toBe("male");
    expect(report.entries).toEqual([
      { name: "Glucose", value: 92, unit: "mg/dL", location: "line 5" },
      { name: "CRP", value: 1.5, unit: undefined, location: "line 6" },
    ]);
  });

  it("supports semicolons with decimal commas (European spreadsheets)", () => {
    const report = expectOk(parseCsvReport("Marker;Value;Unit\nPotassium;4,2;mmol/L"));
    expect(report.entries[0]).toMatchObject({ name: "Potassium", value: 4.2, unit: "mmol/L" });
  });

  it("supports tabs, quoted cells and any column order", () => {
    const report = expectOk(parseCsvReport('unit\tvalue\tname\n"mg/dL"\t"130"\t"LDL, calculated"'));
    expect(report.entries[0]).toMatchObject({ name: "LDL, calculated", value: 130, unit: "mg/dL" });
  });

  it("refuses an unquoted decimal comma in a comma-separated file instead of misreading it", () => {
    const errors = expectErrors(parseCsvReport("marker,value,unit\nGlucose,5,4,mmol/L"));
    expect(errors[0]).toMatch(/^Line 2: 4 columns found but the header has 3/);
  });

  it("requires marker and value columns", () => {
    expect(expectErrors(parseCsvReport("test,result\nGlucose,92"))[0]).toMatch(
      /Line 1: the header must contain "marker" and "value" columns \(found: "test", "result"\)/,
    );
  });

  it("reports row errors with line numbers", () => {
    const errors = expectErrors(parseCsvReport("marker,value\nGlucose,abc\n,5\nALT,\nsex,other"));
    expect(errors).toEqual([
      'Line 2 ("Glucose"): the value must be a number, got "abc".',
      "Line 3: the marker name is empty.",
      'Line 4 ("ALT"): the value is missing.',
      'Line 5: sex must be "female" or "male", got "other".',
    ]);
  });

  it("rejects an empty file", () => {
    expect(expectErrors(parseCsvReport("\n# only a comment\n"))).toEqual(["The file is empty."]);
  });
});

describe("splitCsvLine", () => {
  it("handles escaped quotes", () => {
    expect(splitCsvLine('a,"b ""c""",d', ",")).toEqual(["a", 'b "c"', "d"]);
  });
});

describe("parseReport", () => {
  it("picks the parser from the extension, or sniffs the content", () => {
    expect(parseReport('{"results":[{"marker":"TSH","value":2}]}', "r.json").ok).toBe(true);
    expect(parseReport("marker,value\nTSH,2", "r.csv").ok).toBe(true);
    expect(parseReport('  {"results":[{"marker":"TSH","value":2}]}').ok).toBe(true);
    expect(parseReport("marker,value\nTSH,2").ok).toBe(true);
  });

  it("parses the downloadable templates", () => {
    const dir = join(process.cwd(), "public", "samples");
    const csv = expectOk(parseReport(readFileSync(join(dir, "template.csv"), "utf8"), "template.csv"));
    const json = expectOk(parseReport(readFileSync(join(dir, "template.json"), "utf8"), "template.json"));
    expect(csv.entries).toHaveLength(17);
    expect(json).toEqual({ ...csv, entries: csv.entries.map((e, i) => ({ ...e, location: `result #${i + 1}` })) });
  });
});
