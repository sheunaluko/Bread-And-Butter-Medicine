// Anticoagulant reversal reference. High-consequence content — every plan
// should trigger a moment of thought, not a click-and-execute. Verify with
// pharmacy / hematology / your institutional guidelines before administering.

export type Severity = "critical" | "urgent" | "non-urgent"
export type Tier = "first-line" | "alternative" | "adjunct" | "off-label"

export interface ReversalOption {
  agent: string
  dose: string
  route?: string
  timing?: string
  tier: Tier
  notes?: string
}

export interface Scenario {
  id: string
  title: string
  severity: Severity
  options: ReversalOption[]
  notes?: string
}

// Decay model for the sparkline. Direct-acting drugs use exponential decay
// with `halfLifeHours`. Irreversible antiplatelets use linear decay across
// `effectDurationDays` (platelet turnover). "Delayed" is for warfarin — INR
// resolution is governed by factor-II turnover, slower than drug clearance.
export type EffectModel = "exp" | "antiplatelet-linear" | "delayed"

export interface Anticoagulant {
  id: string
  name: string
  brand?: string
  class: string
  halfLife: string
  halfLifeHours: number // used for the decay sparkline
  effectModel: EffectModel
  effectDurationDays?: number // for antiplatelet-linear
  monitoring?: string
  specificAntidote?: string
  notes?: string
  scenarios: Scenario[]
}

export const anticoagulants: Anticoagulant[] = [
  {
    id: "warfarin",
    name: "Warfarin",
    brand: "Coumadin",
    class: "Vitamin K antagonist",
    halfLife: "20–60 h (variable)",
    halfLifeHours: 40,
    effectModel: "delayed",
    monitoring: "INR",
    specificAntidote: "Vitamin K",
    scenarios: [
      {
        id: "life-threatening",
        title: "Major / life-threatening bleeding",
        severity: "critical",
        options: [
          {
            agent: "4-factor PCC (Kcentra)",
            dose: "INR 2–<4: 25 units/kg (max 2500 U). INR 4–6: 35 units/kg (max 3500 U). INR >6: 50 units/kg (max 5000 U).",
            route: "IV",
            tier: "first-line",
            notes: "Preferred over FFP. Onset within minutes; recheck INR at 30 min.",
          },
          {
            agent: "Vitamin K (phytonadione)",
            dose: "10 mg",
            route: "IV, slow (over 30 min)",
            tier: "first-line",
            notes: "Give with PCC — sustains reversal after PCC wears off. IV route only for major bleed.",
          },
          {
            agent: "FFP",
            dose: "10–15 mL/kg",
            route: "IV",
            tier: "alternative",
            notes: "Use only if PCC unavailable. Volume load; slower correction.",
          },
        ],
      },
      {
        id: "urgent-procedure",
        title: "Urgent surgery / procedure",
        severity: "urgent",
        options: [
          {
            agent: "Vitamin K",
            dose: "2.5–10 mg PO or 1–2 mg IV",
            timing: "≥6 h before procedure if time allows",
            tier: "first-line",
          },
          {
            agent: "4-factor PCC",
            dose: "25–50 units/kg (per INR)",
            route: "IV",
            timing: "Immediately pre-op if unable to wait",
            tier: "first-line",
          },
        ],
      },
      {
        id: "elevated-inr-no-bleed",
        title: "INR elevated, no significant bleeding",
        severity: "non-urgent",
        options: [
          {
            agent: "Hold warfarin",
            dose: "INR 4.5–10: hold ± 1–2.5 mg PO vit K. INR >10: 2.5–5 mg PO vit K.",
            tier: "first-line",
            notes: "ACCP 2012 / CHEST. Recheck INR in 24 h; resume at reduced dose.",
          },
        ],
      },
    ],
  },
  {
    id: "ufh",
    name: "Unfractionated heparin",
    class: "Indirect thrombin/Xa inhibitor",
    halfLife: "1–2 h",
    halfLifeHours: 1.5,
    effectModel: "exp",
    monitoring: "aPTT or anti-Xa",
    specificAntidote: "Protamine sulfate",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding / overdose",
        severity: "critical",
        options: [
          {
            agent: "Protamine sulfate",
            dose: "1 mg per 100 units heparin given in last 2–3 h (max single dose 50 mg)",
            route: "IV, slow (over 10 min)",
            tier: "first-line",
            notes:
              "Reduce to 0.5 mg per 100 U if 30–60 min elapsed; 0.25 mg per 100 U if 60–120 min. Rapid infusion → hypotension, anaphylaxis. Risk higher in fish allergy / prior NPH insulin exposure.",
          },
        ],
      },
    ],
  },
  {
    id: "enoxaparin",
    name: "Enoxaparin",
    brand: "Lovenox",
    class: "Low-molecular-weight heparin",
    halfLife: "4–7 h (longer in renal failure)",
    halfLifeHours: 5,
    effectModel: "exp",
    monitoring: "Anti-Xa (LMWH assay)",
    specificAntidote: "Protamine (partial only, ~60% neutralization)",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding",
        severity: "critical",
        options: [
          {
            agent: "Protamine sulfate",
            dose: "Last dose <8 h: 1 mg per 1 mg enoxaparin (max 50 mg). 8–12 h: 0.5 mg per 1 mg. >12 h: not indicated.",
            route: "IV, slow",
            tier: "first-line",
            notes: "Partial reversal only. Andexanet is NOT effective for LMWH.",
          },
          {
            agent: "4-factor PCC",
            dose: "25–50 units/kg",
            route: "IV",
            tier: "off-label",
            notes: "If refractory bleeding despite protamine.",
          },
        ],
      },
    ],
  },
  {
    id: "fondaparinux",
    name: "Fondaparinux",
    brand: "Arixtra",
    class: "Indirect factor Xa inhibitor",
    halfLife: "17–21 h (much longer in renal failure)",
    halfLifeHours: 19,
    effectModel: "exp",
    specificAntidote: "None approved",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding",
        severity: "critical",
        options: [
          {
            agent: "rFVIIa (NovoSeven)",
            dose: "90 mcg/kg",
            route: "IV",
            tier: "off-label",
            notes: "Limited data. Thrombotic risk. Protamine is ineffective.",
          },
          {
            agent: "4-factor PCC",
            dose: "50 units/kg",
            route: "IV",
            tier: "off-label",
          },
          {
            agent: "Activated charcoal",
            dose: "50 g",
            route: "PO/NG",
            timing: "Within 2 h of ingestion (rare — SC drug)",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
  {
    id: "dabigatran",
    name: "Dabigatran",
    brand: "Pradaxa",
    class: "Direct thrombin inhibitor",
    halfLife: "12–17 h (much longer in renal failure)",
    halfLifeHours: 14,
    effectModel: "exp",
    monitoring: "dTT, ECT (not routine)",
    specificAntidote: "Idarucizumab (Praxbind)",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major / life-threatening bleeding",
        severity: "critical",
        options: [
          {
            agent: "Idarucizumab (Praxbind)",
            dose: "5 g IV (given as two 2.5 g doses ≤15 min apart)",
            route: "IV",
            tier: "first-line",
            notes: "Onset within minutes. May redose 5 g if re-bleeding + persistent effect.",
          },
          {
            agent: "4-factor PCC",
            dose: "50 units/kg",
            route: "IV",
            tier: "alternative",
            notes: "If idarucizumab unavailable.",
          },
          {
            agent: "Hemodialysis",
            dose: "—",
            tier: "adjunct",
            notes: "~60% removed over 4 h. Consider if renal failure + no antidote available.",
          },
          {
            agent: "Activated charcoal",
            dose: "50 g",
            route: "PO/NG",
            timing: "Within 2 h of last dose",
            tier: "adjunct",
          },
        ],
      },
      {
        id: "urgent-procedure",
        title: "Urgent surgery / procedure",
        severity: "urgent",
        options: [
          {
            agent: "Idarucizumab",
            dose: "5 g IV",
            tier: "first-line",
            notes: "FDA-approved indication.",
          },
        ],
      },
    ],
  },
  {
    id: "apixaban",
    name: "Apixaban",
    brand: "Eliquis",
    class: "Direct factor Xa inhibitor",
    halfLife: "~12 h",
    halfLifeHours: 12,
    effectModel: "exp",
    monitoring: "Anti-Xa (apixaban-calibrated, not routine)",
    specificAntidote: "Andexanet alfa (Andexxa)",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major / life-threatening bleeding",
        severity: "critical",
        options: [
          {
            agent: "Andexanet alfa (Andexxa) — low dose",
            dose: "400 mg IV bolus (30 mg/min), then 4 mg/min × 120 min (480 mg)",
            timing: "Use if last dose ≤5 mg and >8 h ago, OR any dose but time unknown/short",
            tier: "first-line",
            notes: "Thrombotic risk. Very expensive. Effect wanes ~2 h after infusion end.",
          },
          {
            agent: "Andexanet alfa — high dose",
            dose: "800 mg IV bolus (30 mg/min), then 8 mg/min × 120 min (960 mg)",
            timing: "If last dose >5 mg AND <8 h ago (or unknown dose <8 h ago)",
            tier: "first-line",
          },
          {
            agent: "4-factor PCC",
            dose: "50 units/kg (max 5000 U)",
            route: "IV",
            tier: "alternative",
            notes:
              "Cheaper, faster to obtain, no ANNEXA-I mortality signal. Preferred at many centers despite lower level of evidence.",
          },
          {
            agent: "Activated charcoal",
            dose: "50 g",
            route: "PO/NG",
            timing: "Within 2–6 h of last dose",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
  {
    id: "rivaroxaban",
    name: "Rivaroxaban",
    brand: "Xarelto",
    class: "Direct factor Xa inhibitor",
    halfLife: "5–13 h",
    halfLifeHours: 9,
    effectModel: "exp",
    specificAntidote: "Andexanet alfa (Andexxa)",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major / life-threatening bleeding",
        severity: "critical",
        options: [
          {
            agent: "Andexanet alfa — low dose",
            dose: "400 mg IV bolus, then 480 mg over 120 min",
            timing: "Last dose ≤10 mg and >8 h ago",
            tier: "first-line",
          },
          {
            agent: "Andexanet alfa — high dose",
            dose: "800 mg IV bolus, then 960 mg over 120 min",
            timing: "Last dose >10 mg AND <8 h ago (or unknown dose <8 h ago)",
            tier: "first-line",
          },
          {
            agent: "4-factor PCC",
            dose: "50 units/kg (max 5000 U)",
            route: "IV",
            tier: "alternative",
          },
          {
            agent: "Activated charcoal",
            dose: "50 g",
            route: "PO/NG",
            timing: "Within 2–8 h of last dose (rivaroxaban has slower absorption)",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
  {
    id: "edoxaban",
    name: "Edoxaban",
    brand: "Savaysa",
    class: "Direct factor Xa inhibitor",
    halfLife: "10–14 h",
    halfLifeHours: 12,
    effectModel: "exp",
    specificAntidote: "Andexanet alfa (off-label for edoxaban; FDA-approved for apix/riva only)",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major / life-threatening bleeding",
        severity: "critical",
        options: [
          {
            agent: "4-factor PCC",
            dose: "50 units/kg",
            route: "IV",
            tier: "first-line",
            notes: "Preferred first line for edoxaban (andexanet not FDA-labeled).",
          },
          {
            agent: "Andexanet alfa",
            dose: "As per apix/riva dosing scheme",
            tier: "off-label",
          },
        ],
      },
    ],
  },
  {
    id: "aspirin",
    name: "Aspirin",
    class: "COX-1 inhibitor (irreversible)",
    halfLife: "Antiplatelet effect lasts platelet lifespan (~7–10 d)",
    halfLifeHours: 24 * 8,
    effectModel: "antiplatelet-linear",
    effectDurationDays: 8,
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding (esp. intracranial)",
        severity: "critical",
        options: [
          {
            agent: "Platelet transfusion",
            dose: "1 unit apheresis (~6-pack random)",
            route: "IV",
            tier: "alternative",
            notes:
              "PATCH trial: harmful in spontaneous ICH. Consider only for surgical hemorrhage or when procedure required.",
          },
          {
            agent: "DDAVP (desmopressin)",
            dose: "0.3 mcg/kg IV over 30 min",
            tier: "adjunct",
            notes: "Especially useful with uremia or antiplatelet-associated bleeding.",
          },
        ],
      },
    ],
  },
  {
    id: "clopidogrel",
    name: "Clopidogrel",
    brand: "Plavix",
    class: "P2Y12 inhibitor (irreversible)",
    halfLife: "Antiplatelet effect ~5–7 d",
    halfLifeHours: 24 * 6,
    effectModel: "antiplatelet-linear",
    effectDurationDays: 6,
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding / urgent surgery",
        severity: "critical",
        options: [
          {
            agent: "Platelet transfusion",
            dose: "1 unit apheresis",
            route: "IV",
            tier: "alternative",
            notes: "Per PATCH: not for spontaneous ICH. Consider for surgery/procedure.",
          },
          {
            agent: "DDAVP",
            dose: "0.3 mcg/kg IV",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
  {
    id: "ticagrelor",
    name: "Ticagrelor",
    brand: "Brilinta",
    class: "P2Y12 inhibitor (reversible)",
    halfLife: "~7–9 h (active metabolite ~9 h)",
    halfLifeHours: 8,
    effectModel: "exp",
    notes:
      "Because ticagrelor is reversibly bound, platelet transfusion is less effective (circulating drug inhibits transfused platelets).",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding",
        severity: "critical",
        options: [
          {
            agent: "Bentracimab (investigational)",
            dose: "18 g IV bolus + 12 g/h × 4 h + 6 g/h × 12 h",
            tier: "off-label",
            notes: "REVERSE-IT trial. Not yet FDA-approved; check availability.",
          },
          {
            agent: "Platelet transfusion",
            dose: "1–2 units apheresis",
            route: "IV",
            tier: "alternative",
            notes: "Limited efficacy due to reversible binding.",
          },
          {
            agent: "DDAVP",
            dose: "0.3 mcg/kg IV",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
  {
    id: "tpa",
    name: "Alteplase / TNK",
    brand: "Activase / TNKase",
    class: "Thrombolytic (tPA)",
    halfLife: "Alteplase ~5 min (initial); fibrinogenolysis persists hours",
    halfLifeHours: 0.1,
    effectModel: "exp",
    scenarios: [
      {
        id: "major-bleed",
        title: "Major bleeding (esp. ICH post-thrombolysis)",
        severity: "critical",
        options: [
          {
            agent: "Cryoprecipitate",
            dose: "10 units",
            route: "IV",
            tier: "first-line",
            notes: "Repletes fibrinogen. Recheck fibrinogen; give more if <150 mg/dL.",
          },
          {
            agent: "Tranexamic acid (TXA)",
            dose: "10–15 mg/kg IV over 20 min",
            tier: "first-line",
          },
          {
            agent: "Platelet transfusion",
            dose: "1 unit apheresis",
            route: "IV",
            tier: "adjunct",
            notes: "If platelets <100k or antiplatelet on board.",
          },
          {
            agent: "FFP",
            dose: "2 units",
            route: "IV",
            tier: "adjunct",
          },
        ],
      },
    ],
  },
]
