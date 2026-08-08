// Toy PK simulator for teaching / visualization only.
//
// IV bolus (1-compartment):        C(t) = C0 * exp(-k*t)
// Oral / extravascular (Bateman):  C(t) = (F*D*ka)/(Vd*(ka-k)) * (exp(-k*t) - exp(-ka*t))
//   → C(0) = 0, rises to Cmax at Tmax = ln(ka/k)/(ka-k), then falls.
//
// k  = ln(2) / t½_elim
// ka = ln(2) / t½_abs

export type PkRoute = "iv" | "po"

export interface PkInput {
  dose: number // mg
  halfLifeHours: number // elimination
  vdLPerKg: number
  weightKg: number
  intervalHours: number
  bioavailability: number // 0..1
  durationHours: number
  route: PkRoute
  absorptionHalfLifeHours?: number // required for PO; defaults to 0.5h
}

export interface PkPoint {
  t: number
  c: number
}

export function simulate(p: PkInput): PkPoint[] {
  const k = Math.log(2) / p.halfLifeHours
  const vd = p.vdLPerKg * p.weightKg // L
  const dosePerVd = (p.bioavailability * p.dose) / vd // mg/L
  const steps = 200
  const dt = p.durationHours / steps
  const nDoses = Math.floor(p.durationHours / p.intervalHours) + 1
  const doseTimes = Array.from({ length: nDoses }, (_, i) => i * p.intervalHours)

  const contribution = (dtSince: number): number => {
    if (dtSince < 0) return 0
    if (p.route === "iv") return dosePerVd * Math.exp(-k * dtSince)
    // PO — Bateman
    const kaHalf = p.absorptionHalfLifeHours ?? 0.5
    const ka = Math.log(2) / kaHalf
    if (Math.abs(ka - k) < 1e-6) {
      // Degenerate ka ≈ k limit form:  C = D/Vd * k * t * exp(-k*t)
      return dosePerVd * k * dtSince * Math.exp(-k * dtSince)
    }
    const factor = ka / (ka - k)
    return dosePerVd * factor * (Math.exp(-k * dtSince) - Math.exp(-ka * dtSince))
  }

  const points: PkPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i * dt
    let c = 0
    for (const td of doseTimes) c += contribution(t - td)
    points.push({ t, c })
  }
  return points
}

// Given elimination k and desired Tmax, back-solve absorption ka via bisection.
// Tmax = ln(ka/k) / (ka - k). Returns absorption half-life in hours.
export function absorptionHalfLifeFromTmax(
  halfLifeHours: number,
  tmaxHours: number,
): number {
  const k = Math.log(2) / halfLifeHours
  if (tmaxHours <= 0) return 0.1
  const target = tmaxHours
  const f = (ka: number) => Math.log(ka / k) / (ka - k) - target
  // ka must be > k for a well-formed absorption curve
  let lo = k * 1.001
  let hi = k * 500
  // f(lo) is large positive (Tmax → 1/k), f(hi) → 0 → f(hi) - target < 0 usually.
  if (f(hi) > 0) return Math.log(2) / hi // cap
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const v = f(mid)
    if (v > 0) lo = mid
    else hi = mid
  }
  const ka = (lo + hi) / 2
  return Math.log(2) / ka
}
