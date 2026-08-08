// Systemic glucocorticoid equivalents.
// Relative glucocorticoid potency uses hydrocortisone = 1. Equivalent dose is
// the mg of that drug approximately equipotent to 20 mg hydrocortisone (a
// physiologic-replacement-scale reference). Mineralocorticoid activity is
// relative to hydrocortisone = 1.

export type Duration = "short" | "intermediate" | "long"

export interface Steroid {
  id: string
  name: string
  glucocorticoidPotency: number // relative to hydrocortisone
  equivalentDoseMg: number // dose equivalent to 20 mg hydrocortisone
  mineralocorticoidPotency: number // relative to hydrocortisone
  biologicalHalfLifeHours: [number, number]
  duration: Duration
  notes?: string
}

export const steroids: Steroid[] = [
  {
    id: "hydrocortisone",
    name: "Hydrocortisone",
    glucocorticoidPotency: 1,
    equivalentDoseMg: 20,
    mineralocorticoidPotency: 1,
    biologicalHalfLifeHours: [8, 12],
    duration: "short",
  },
  {
    id: "cortisone",
    name: "Cortisone",
    glucocorticoidPotency: 0.8,
    equivalentDoseMg: 25,
    mineralocorticoidPotency: 0.8,
    biologicalHalfLifeHours: [8, 12],
    duration: "short",
  },
  {
    id: "prednisone",
    name: "Prednisone",
    glucocorticoidPotency: 4,
    equivalentDoseMg: 5,
    mineralocorticoidPotency: 0.8,
    biologicalHalfLifeHours: [12, 36],
    duration: "intermediate",
  },
  {
    id: "prednisolone",
    name: "Prednisolone",
    glucocorticoidPotency: 4,
    equivalentDoseMg: 5,
    mineralocorticoidPotency: 0.8,
    biologicalHalfLifeHours: [12, 36],
    duration: "intermediate",
  },
  {
    id: "methylprednisolone",
    name: "Methylprednisolone",
    glucocorticoidPotency: 5,
    equivalentDoseMg: 4,
    mineralocorticoidPotency: 0.5,
    biologicalHalfLifeHours: [12, 36],
    duration: "intermediate",
  },
  {
    id: "triamcinolone",
    name: "Triamcinolone",
    glucocorticoidPotency: 5,
    equivalentDoseMg: 4,
    mineralocorticoidPotency: 0,
    biologicalHalfLifeHours: [12, 36],
    duration: "intermediate",
  },
  {
    id: "dexamethasone",
    name: "Dexamethasone",
    glucocorticoidPotency: 25,
    equivalentDoseMg: 0.75,
    mineralocorticoidPotency: 0,
    biologicalHalfLifeHours: [36, 72],
    duration: "long",
  },
  {
    id: "betamethasone",
    name: "Betamethasone",
    glucocorticoidPotency: 25,
    equivalentDoseMg: 0.6,
    mineralocorticoidPotency: 0,
    biologicalHalfLifeHours: [36, 72],
    duration: "long",
  },
  {
    id: "fludrocortisone",
    name: "Fludrocortisone",
    glucocorticoidPotency: 15,
    equivalentDoseMg: 2,
    mineralocorticoidPotency: 150,
    biologicalHalfLifeHours: [18, 36],
    duration: "intermediate",
    notes:
      "Used for mineralocorticoid effect (adrenal insufficiency, orthostatic hypotension). Not appropriate as a glucocorticoid substitute.",
  },
]
