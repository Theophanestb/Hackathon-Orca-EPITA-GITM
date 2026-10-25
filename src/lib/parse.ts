// Parses and validates uploaded lab reports (JSON or CSV). Pure functions, no I/O.
// Every problem is reported with enough context (line or item number) to fix the file.

import { findMarker, normalizeName, type Sex } from "@/data/referenceRanges";

export interface ReportEntry {
  /** Marker name exactly as written in the report. */
  name: string;
  value: number;
  unit?: string;
  /** Where the entry came from, for error messages: "line 4" or "result #2". */
  location?: string;
}

export interface LabReport {
  sex?: Sex;
  entries: ReportEntry[];
}

export type ParseResult = { ok: true; report: LabReport } | { ok: false; errors: string[] };

export const MAX_FILE_BYTES = 1_000_000;
export const MAX_ENTRIES = 200;

const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/** Accepts numbers and numeric strings; a decimal comma is allowed ("5,6"). */
export function parseNumber(raw: unknown): number | undefined {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw !== "string") return undefined;
  const text = raw.trim().replace(",", ".");
  return NUMBER.test(text) ? Number(text) : undefined;
}

export function parseSex(raw: unknown): Sex | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim().toLowerCase();
  if (["female", "f", "woman"].includes(value)) return "female";
  if (["male", "m", "man"].includes(value)) return "male";
  return undefined;
}

/** Picks the format from the file name, falling back to sniffing the content. */
export function parseReport(text: string, fileName = ""): ParseResult {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) return parseJsonReport(text);
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) return parseCsvReport(text);
  const first = text.replace(/^﻿/, "").trimStart()[0];
  return first === "{" || first === "[" ? parseJsonReport(text) : parseCsvReport(text);
}

// ---------------------------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------------------------

export function parseJsonReport(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`The file is not valid JSON (${detail}).`] };
  }
  return validateReportObject(data);
}

/** Validates an already-parsed JSON value: `{ "sex"?: ..., "results": [...] }` or a bare array. */
export function validateReportObject(data: unknown): ParseResult {
  const errors: string[] = [];
  let sex: Sex | undefined;
  let results: unknown;

  if (Array.isArray(data)) {
    results = data;
  } else if (isObject(data)) {
    results = data.results;
    if (data.sex !== undefined && data.sex !== null && data.sex !== "") {
      sex = parseSex(data.sex);
      if (!sex) errors.push(`"sex" must be "female" or "male", got ${JSON.stringify(data.sex)}.`);
    }
  } else {
    return { ok: false, errors: ['The JSON must be an object with a "results" array.'] };
  }

  if (results === undefined) {
    return { ok: false, errors: [...errors, 'Missing "results": add an array of { "marker", "value", "unit" } objects.'] };
  }
  if (!Array.isArray(results)) {
    return { ok: false, errors: [...errors, '"results" must be an array.'] };
  }

  const entries: ReportEntry[] = [];
  results.forEach((item, index) => {
    const where = `Result #${index + 1}`;
    if (!isObject(item)) {
      errors.push(`${where}: expected an object like { "marker": "Glucose", "value": 92, "unit": "mg/dL" }.`);
      return;
    }
    const rawName = item.marker ?? item.name;
    if (typeof rawName !== "string" || rawName.trim() === "") {
      errors.push(`${where}: "marker" is missing or empty.`);
      return;
    }
    const name = rawName.trim();
    const label = `${where} ("${name}")`;
    if (item.unit !== undefined && item.unit !== null && typeof item.unit !== "string") {
      errors.push(`${label}: "unit" must be a string.`);
      return;
    }
    const value = parseNumber(item.value);
    const valueError = checkValue(item.value, value);
    if (valueError) {
      errors.push(`${label}: ${valueError}`);
      return;
    }
    entries.push({ name, value: value!, unit: cleanUnit(item.unit), location: `result #${index + 1}` });
  });

  return finish(entries, sex, errors);
}

// ---------------------------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------------------------

/**
 * Expected format (header required, `unit` column optional, `,` `;` or tab separated):
 *
 *   marker,value,unit
 *   sex,female,
 *   Haemoglobin,13.4,g/dL
 *
 * Blank lines and lines starting with `#` are ignored.
 */
export function parseCsvReport(text: string): ParseResult {
  const lines = text.replace(/^﻿/, "").split(/\r\n|\n|\r/);
  const rows = lines
    .map((content, index) => ({ content, line: index + 1 }))
    .filter(({ content }) => content.trim() !== "" && !content.trimStart().startsWith("#"));

  if (rows.length === 0) return { ok: false, errors: ["The file is empty."] };

  const header = rows[0];
  const delimiter = detectDelimiter(header.content);
  const columns = splitCsvLine(header.content, delimiter).map((c) => c.trim().toLowerCase());
  const markerCol = columns.findIndex((c) => c === "marker" || c === "name");
  const valueCol = columns.indexOf("value");
  const unitCol = columns.indexOf("unit");

  if (markerCol === -1 || valueCol === -1) {
    return {
      ok: false,
      errors: [
        `Line ${header.line}: the header must contain "marker" and "value" columns (found: ${columns
          .map((c) => `"${c}"`)
          .join(", ")}). Example: marker,value,unit`,
      ],
    };
  }

  const errors: string[] = [];
  const entries: ReportEntry[] = [];
  let sex: Sex | undefined;

  for (const { content, line } of rows.slice(1)) {
    const cells = splitCsvLine(content, delimiter).map((c) => c.trim());
    if (cells.length > columns.length) {
      // Typically an unquoted decimal comma in a comma-separated file: "12,5" would become 12.
      errors.push(
        `Line ${line}: ${cells.length} columns found but the header has ${columns.length}. ` +
          `For decimal commas, separate columns with ";" or quote the value ("12,5").`,
      );
      continue;
    }
    const name = cells[markerCol] ?? "";
    const rawValue = cells[valueCol] ?? "";

    if (name === "") {
      errors.push(`Line ${line}: the marker name is empty.`);
      continue;
    }
    if (normalizeName(name) === "sex") {
      sex = parseSex(rawValue);
      if (!sex) errors.push(`Line ${line}: sex must be "female" or "male", got "${rawValue}".`);
      continue;
    }
    const value = parseNumber(rawValue);
    const valueError = checkValue(rawValue === "" ? undefined : rawValue, value);
    if (valueError) {
      errors.push(`Line ${line} ("${name}"): ${valueError}`);
      continue;
    }
    entries.push({
      name,
      value: value!,
      unit: unitCol === -1 ? undefined : cleanUnit(cells[unitCol]),
      location: `line ${line}`,
    });
  }

  return finish(entries, sex, errors);
}

function detectDelimiter(header: string): string {
  const counts = [",", ";", "\t"].map((d) => [d, header.split(d).length - 1] as const);
  return counts.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
}

/** Splits one CSV line, honouring double quotes ("a,b" and "" escapes). */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

// ---------------------------------------------------------------------------------------------
// Shared checks
// ---------------------------------------------------------------------------------------------

function checkValue(raw: unknown, value: number | undefined): string | undefined {
  if (raw === undefined || raw === null || raw === "") return "the value is missing.";
  if (value === undefined) return `the value must be a number, got ${JSON.stringify(raw)}.`;
  if (value < 0) return `the value cannot be negative (${value}).`;
  return undefined;
}

function finish(entries: ReportEntry[], sex: Sex | undefined, errors: string[]): ParseResult {
  // Duplicates are ambiguous (which value is right?), so they are rejected rather than guessed.
  const seen = new Map<string, ReportEntry>();
  for (const entry of entries) {
    const key = findMarker(entry.name)?.id ?? normalizeName(entry.name);
    const previous = seen.get(key);
    if (previous) {
      errors.push(
        `"${entry.name}" appears more than once (${previous.location} and ${entry.location}). Keep a single value per marker.`,
      );
    } else {
      seen.set(key, entry);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  if (entries.length === 0) return { ok: false, errors: ["The report contains no results."] };
  if (entries.length > MAX_ENTRIES) {
    return { ok: false, errors: [`Too many results (${entries.length}); the maximum is ${MAX_ENTRIES}.`] };
  }
  return { ok: true, report: { sex, entries } };
}

function cleanUnit(unit: unknown): string | undefined {
  return typeof unit === "string" && unit.trim() !== "" ? unit.trim() : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
