// Oral morphine milligram equivalents (MME) per unit of drug.
// Based on the CDC MME conversion table + widely used equianalgesic references
// (Sanford, ISMP, palliative-care sources). Cross-tolerance reduction of
// 25–50% is standard when switching to a different opioid.

export type Route = "po" | "iv" | "patch"

export interface Opioid {
  id: string
  name: string
  route: Route
  unit: "mg" | "mcg/hr" | "mcg"
  // MME per 1 unit of drug (mg for most; mcg/hr for fentanyl patch; mcg for IV fentanyl)
  factor: number
  notes?: string
  special?: boolean // methadone / buprenorphine — do not convert linearly
  // Single-dose PK (adult, immediate-release for PO). Illustrative — used for
  // shape-of-onset-and-duration sparklines, not clinical dosing.
  halfLifeHours: number
  absorptionHalfLifeHours?: number // PO only
  patchRiseHours?: number // patch only — time constant for sigmoidal rise
  onsetMins: number
  durationHours: [number, number]
}

export const opioids: Opioid[] = [
  {
    id: "morphine-po",
    name: "Morphine",
    route: "po",
    unit: "mg",
    factor: 1,
    halfLifeHours: 3,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 30,
    durationHours: [4, 6],
  },
  {
    id: "morphine-iv",
    name: "Morphine",
    route: "iv",
    unit: "mg",
    factor: 3,
    halfLifeHours: 2.5,
    onsetMins: 5,
    durationHours: [3, 4],
  },
  {
    id: "hydromorphone-po",
    name: "Hydromorphone",
    route: "po",
    unit: "mg",
    factor: 4,
    halfLifeHours: 2.5,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 30,
    durationHours: [4, 5],
  },
  {
    id: "hydromorphone-iv",
    name: "Hydromorphone",
    route: "iv",
    unit: "mg",
    factor: 20,
    halfLifeHours: 2.5,
    onsetMins: 5,
    durationHours: [3, 4],
  },
  {
    id: "oxycodone-po",
    name: "Oxycodone",
    route: "po",
    unit: "mg",
    factor: 1.5,
    halfLifeHours: 3.5,
    absorptionHalfLifeHours: 0.4,
    onsetMins: 15,
    durationHours: [4, 6],
  },
  {
    id: "hydrocodone-po",
    name: "Hydrocodone",
    route: "po",
    unit: "mg",
    factor: 1,
    halfLifeHours: 4,
    absorptionHalfLifeHours: 0.6,
    onsetMins: 20,
    durationHours: [4, 6],
  },
  {
    id: "oxymorphone-po",
    name: "Oxymorphone",
    route: "po",
    unit: "mg",
    factor: 3,
    halfLifeHours: 8,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 30,
    durationHours: [4, 6],
  },
  {
    id: "codeine-po",
    name: "Codeine",
    route: "po",
    unit: "mg",
    factor: 0.15,
    halfLifeHours: 3,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 30,
    durationHours: [4, 6],
  },
  {
    id: "tramadol-po",
    name: "Tramadol",
    route: "po",
    unit: "mg",
    factor: 0.1,
    halfLifeHours: 6,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 60,
    durationHours: [4, 6],
  },
  {
    id: "tapentadol-po",
    name: "Tapentadol",
    route: "po",
    unit: "mg",
    factor: 0.4,
    halfLifeHours: 4,
    absorptionHalfLifeHours: 0.4,
    onsetMins: 30,
    durationHours: [4, 6],
  },
  {
    id: "fentanyl-patch",
    name: "Fentanyl patch",
    route: "patch",
    unit: "mcg/hr",
    factor: 2.4,
    notes: "Patch strength in mcg/hr. 25 mcg/hr ≈ 60 MME/day.",
    halfLifeHours: 17,
    patchRiseHours: 14,
    onsetMins: 720,
    durationHours: [72, 72],
  },
  {
    id: "fentanyl-iv",
    name: "Fentanyl",
    route: "iv",
    unit: "mcg",
    factor: 0.3,
    notes: "≈100 mcg IV = 30 MME. Rough; heavily context-dependent.",
    halfLifeHours: 3.5,
    onsetMins: 1,
    durationHours: [0.5, 1],
  },
  {
    id: "methadone",
    name: "Methadone",
    route: "po",
    unit: "mg",
    factor: 0,
    special: true,
    notes:
      "Non-linear conversion (ratio grows with dose). CDC: ×4 (≤20 mg/d), ×8 (21–40), ×10 (41–60), ×12 (>60). Consult pharmacy / palliative care.",
    halfLifeHours: 30,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 45,
    durationHours: [4, 8],
  },
  {
    id: "buprenorphine",
    name: "Buprenorphine",
    route: "po",
    unit: "mg",
    factor: 0,
    special: true,
    notes: "Partial agonist. Ceiling effect + precipitated withdrawal risk. Do not convert linearly.",
    halfLifeHours: 30,
    absorptionHalfLifeHours: 0.5,
    onsetMins: 45,
    durationHours: [6, 8],
  },
]

// CDC methadone tiered factor.
export function methadoneMMEPerMg(totalDailyMg: number): number {
  if (totalDailyMg <= 20) return 4
  if (totalDailyMg <= 40) return 8
  if (totalDailyMg <= 60) return 10
  return 12
}
