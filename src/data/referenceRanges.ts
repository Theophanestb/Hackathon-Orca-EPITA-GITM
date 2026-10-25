// Adult reference ranges used by the analyzer. Demo values only, not a clinical reference.
//
// Range semantics:
// - Two-sided ranges (low AND high) include both bounds: 3.5 to 5.0 means 3.5 <= value <= 5.0.
// - One-sided limits are strict, exactly as written: "below 5.7" means value < 5.7 and
//   "above 40" means value > 40.
// - Critical thresholds are strict too: "critical below 3.0" means value < 3.0.

export type Sex = "female" | "male";

export type PanelId =
  | "blood-count"
  | "metabolic"
  | "kidney"
  | "liver"
  | "lipids"
  | "thyroid"
  | "inflammation";

export type MarkerId =
  | "haemoglobin"
  | "wbc"
  | "platelets"
  | "ferritin"
  | "glucose"
  | "hba1c"
  | "creatinine"
  | "potassium"
  | "sodium"
  | "alt"
  | "ast"
  | "ldl"
  | "hdl"
  | "triglycerides"
  | "tsh"
  | "ft4"
  | "crp";

export interface RefRange {
  low?: number;
  high?: number;
}

export interface SexSpecificRange {
  female: RefRange;
  male: RefRange;
}

export interface MarkerDef {
  id: MarkerId;
  name: string;
  /** Other names accepted in uploaded reports (matched case- and punctuation-insensitively). */
  aliases: string[];
  unit: string;
  /** Units considered identical to `unit` (same numeric value). No conversion is ever applied. */
  unitAliases?: string[];
  panel: PanelId;
  range: RefRange | SexSpecificRange;
  critical?: RefRange;
  /** One-line, plain-language description. */
  about: string;
}

export const PANELS: { id: PanelId; name: string }[] = [
  { id: "blood-count", name: "Blood count" },
  { id: "metabolic", name: "Metabolic" },
  { id: "kidney", name: "Kidney" },
  { id: "liver", name: "Liver" },
  { id: "lipids", name: "Lipids" },
  { id: "thyroid", name: "Thyroid" },
  { id: "inflammation", name: "Inflammation" },
];

export const MARKERS: MarkerDef[] = [
  {
    id: "haemoglobin",
    name: "Haemoglobin",
    aliases: ["hemoglobin", "hb", "hgb"],
    unit: "g/dL",
    panel: "blood-count",
    range: { female: { low: 12, high: 16 }, male: { low: 13, high: 17 } },
    about: "Oxygen-carrying protein in red blood cells.",
  },
  {
    id: "wbc",
    name: "White blood cells",
    aliases: ["wbc", "leukocytes", "leucocytes", "white blood cell count"],
    unit: "G/L",
    unitAliases: ["10^9/L", "x10^9/L", "10⁹/L", "x10⁹/L", "giga/L"],
    panel: "blood-count",
    range: { low: 4, high: 11 },
    about: "Immune cells; often raised by infection or inflammation.",
  },
  {
    id: "platelets",
    name: "Platelets",
    aliases: ["plt", "platelet count", "thrombocytes"],
    unit: "G/L",
    unitAliases: ["10^9/L", "x10^9/L", "10⁹/L", "x10⁹/L", "giga/L"],
    panel: "blood-count",
    range: { low: 150, high: 400 },
    about: "Cell fragments involved in blood clotting.",
  },
  {
    id: "ferritin",
    name: "Ferritin",
    aliases: ["serum ferritin"],
    unit: "ng/mL",
    unitAliases: ["µg/L", "ug/L", "mcg/L"],
    panel: "blood-count",
    range: { low: 30, high: 300 },
    about: "Reflects the body's iron stores.",
  },
  {
    id: "glucose",
    name: "Fasting glucose",
    aliases: ["glucose", "fasting blood glucose", "fbg", "blood sugar", "glycemia", "glycaemia"],
    unit: "mg/dL",
    panel: "metabolic",
    range: { low: 70, high: 99 },
    about: "Blood sugar measured after at least 8 hours without food.",
  },
  {
    id: "hba1c",
    name: "HbA1c",
    aliases: ["a1c", "glycated haemoglobin", "glycated hemoglobin", "haemoglobin a1c", "hemoglobin a1c"],
    unit: "%",
    panel: "metabolic",
    range: { high: 5.7 },
    about: "Average blood sugar over the last 2 to 3 months.",
  },
  {
    id: "creatinine",
    name: "Creatinine",
    aliases: ["serum creatinine", "creat"],
    unit: "mg/dL",
    panel: "kidney",
    range: { low: 0.6, high: 1.2 },
    about: "Muscle waste product cleared by the kidneys.",
  },
  {
    id: "potassium",
    name: "Potassium",
    aliases: ["k", "k+", "serum potassium"],
    unit: "mmol/L",
    unitAliases: ["mEq/L"],
    panel: "kidney",
    range: { low: 3.5, high: 5.0 },
    critical: { low: 3.0, high: 6.0 },
    about: "Electrolyte essential for heart rhythm and muscles.",
  },
  {
    id: "sodium",
    name: "Sodium",
    aliases: ["na", "na+", "serum sodium"],
    unit: "mmol/L",
    unitAliases: ["mEq/L"],
    panel: "kidney",
    range: { low: 135, high: 145 },
    critical: { low: 125, high: 155 },
    about: "Electrolyte that regulates water balance.",
  },
  {
    id: "alt",
    name: "ALT",
    aliases: ["alat", "sgpt", "alanine aminotransferase", "alanine transaminase"],
    unit: "U/L",
    unitAliases: ["IU/L"],
    panel: "liver",
    range: { low: 7, high: 56 },
    about: "Liver enzyme; rises when liver cells are damaged.",
  },
  {
    id: "ast",
    name: "AST",
    aliases: ["asat", "sgot", "aspartate aminotransferase", "aspartate transaminase"],
    unit: "U/L",
    unitAliases: ["IU/L"],
    panel: "liver",
    range: { low: 10, high: 40 },
    about: "Enzyme found in the liver, heart and muscles.",
  },
  {
    id: "ldl",
    name: "LDL cholesterol",
    aliases: ["ldl", "ldl-c", "ldl c", "low density lipoprotein"],
    unit: "mg/dL",
    panel: "lipids",
    range: { high: 130 },
    about: "\"Bad\" cholesterol that can build up in arteries.",
  },
  {
    id: "hdl",
    name: "HDL cholesterol",
    aliases: ["hdl", "hdl-c", "hdl c", "high density lipoprotein"],
    unit: "mg/dL",
    panel: "lipids",
    range: { low: 40 },
    about: "\"Good\" cholesterol that helps clear other cholesterol.",
  },
  {
    id: "triglycerides",
    name: "Triglycerides",
    aliases: ["tg", "trigs", "triglyceride"],
    unit: "mg/dL",
    panel: "lipids",
    range: { high: 150 },
    about: "Blood fats; strongly influenced by diet and alcohol.",
  },
  {
    id: "tsh",
    name: "TSH",
    aliases: ["thyroid stimulating hormone", "thyrotropin"],
    unit: "mIU/L",
    unitAliases: ["µIU/mL", "uIU/mL", "mU/L"],
    panel: "thyroid",
    range: { low: 0.4, high: 4.0 },
    about: "Pituitary hormone that drives the thyroid.",
  },
  {
    id: "ft4",
    name: "Free T4",
    aliases: ["ft4", "free thyroxine", "t4 free", "t4l"],
    unit: "ng/dL",
    panel: "thyroid",
    range: { low: 0.8, high: 1.8 },
    about: "Main hormone produced by the thyroid.",
  },
  {
    id: "crp",
    name: "CRP",
    aliases: ["c-reactive protein", "c reactive protein", "hs-crp", "hscrp"],
    unit: "mg/L",
    panel: "inflammation",
    range: { high: 5 },
    about: "Protein that rises quickly with inflammation or infection.",
  },
];

export function getMarker(id: MarkerId): MarkerDef {
  return MARKERS.find((m) => m.id === id)!;
}

/** Lower-case and drop everything that isn't a letter or digit: "Free T4" -> "freet4". */
export function normalizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const MARKER_INDEX = new Map<string, MarkerDef>();
for (const marker of MARKERS) {
  for (const key of [marker.id, marker.name, ...marker.aliases]) {
    MARKER_INDEX.set(normalizeName(key), marker);
  }
}

export function findMarker(name: string): MarkerDef | undefined {
  return MARKER_INDEX.get(normalizeName(name));
}

export function isSexSpecific(range: MarkerDef["range"]): range is SexSpecificRange {
  return "female" in range;
}
