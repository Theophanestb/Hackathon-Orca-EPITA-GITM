// Demo reports. The JSON files in public/samples are also downloadable, and they use the same
// format as uploads, so they go through the same validation. Bundled at build time: no fetch.
import critical from "../../public/samples/critical.json";
import healthy from "../../public/samples/healthy.json";
import metabolicRisk from "../../public/samples/metabolic-risk.json";
import singleAnomaly from "../../public/samples/single-anomaly.json";

export interface Sample {
  id: string;
  label: string;
  description: string;
  data: unknown;
}

export const SAMPLES: Sample[] = [
  {
    id: "healthy",
    label: "Healthy adult",
    description: "Man, all 17 markers within their reference ranges.",
    data: healthy,
  },
  {
    id: "single-anomaly",
    label: "Single anomaly",
    description: "Woman, low ferritin only, plus one marker outside the reference list.",
    data: singleAnomaly,
  },
  {
    id: "metabolic-risk",
    label: "Metabolic risk",
    description: "Man, raised glucose, liver enzymes and lipids: several combinations.",
    data: metabolicRisk,
  },
  {
    id: "critical",
    label: "Critical case",
    description: "Woman, critical potassium with kidney, infection and anaemia patterns.",
    data: critical,
  },
];
