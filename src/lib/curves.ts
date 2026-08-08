// Normalized single-dose effect curves for the row sparklines.
// All curves are peak-normalized to 1 for shape comparison — they carry
// no absolute concentration meaning.

import type { Opioid } from "@/data/opioids"
import type { Anticoagulant } from "@/data/reversal"

export interface CurvePoint {
  t: number
  v: number
}

export interface CurveOpts {
  windowHours: number
  steps?: number
}

export function opioidCurve(o: Opioid, opts: CurveOpts): CurvePoint[] {
  const steps = opts.steps ?? 80
  const dt = opts.windowHours / steps
  const k = Math.log(2) / o.halfLifeHours
  const points: CurvePoint[] = []

  for (let i = 0; i <= steps; i++) {
    const t = i * dt
    let v = 0
    if (o.route === "iv") {
      // Bolus: instant Cmax = 1, exp decay
      v = Math.exp(-k * t)
    } else if (o.route === "patch") {
      // Sigmoidal rise to plateau; hold; (no removal modeled in this window)
      const tau = o.patchRiseHours ?? 12
      v = 1 - Math.exp(-t / tau)
    } else {
      // PO — Bateman
      const kaHalf = o.absorptionHalfLifeHours ?? 0.5
      const ka = Math.log(2) / kaHalf
      if (Math.abs(ka - k) < 1e-6) {
        v = k * t * Math.exp(-k * t)
      } else {
        v = (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t))
      }
    }
    points.push({ t, v })
  }

  return normalize(points)
}

// Steroid biological effect decay from single dose. Onset is fast enough
// relative to biological t½ that we model as a step + exponential decay.
export function steroidCurve(
  biologicalHalfLifeMidHours: number,
  opts: CurveOpts,
): CurvePoint[] {
  const steps = opts.steps ?? 80
  const dt = opts.windowHours / steps
  const k = Math.log(2) / biologicalHalfLifeMidHours
  const points: CurvePoint[] = []
  // Quick rise over ~1 hour, then exp decay
  const riseHours = 1
  for (let i = 0; i <= steps; i++) {
    const t = i * dt
    let v: number
    if (t < riseHours) {
      v = t / riseHours
    } else {
      v = Math.exp(-k * (t - riseHours))
    }
    points.push({ t, v })
  }
  return normalize(points)
}

export function acCurve(a: Anticoagulant, opts: CurveOpts): CurvePoint[] {
  const steps = opts.steps ?? 80
  const dt = opts.windowHours / steps
  const points: CurvePoint[] = []

  if (a.effectModel === "antiplatelet-linear") {
    const totalH = (a.effectDurationDays ?? 7) * 24
    for (let i = 0; i <= steps; i++) {
      const t = i * dt
      points.push({ t, v: Math.max(0, 1 - t / totalH) })
    }
  } else if (a.effectModel === "delayed") {
    // Warfarin: INR resolution governed by factor-II regeneration.
    // Rough model: slow logistic decline centered around ~48h.
    // Use effective t½ ~= drug halfLifeHours as fallback.
    const k = Math.log(2) / a.halfLifeHours
    for (let i = 0; i <= steps; i++) {
      const t = i * dt
      // effect stays high early, then falls
      const v = Math.exp(-k * Math.max(0, t - 12))
      points.push({ t, v: Math.min(1, v) })
    }
  } else {
    // Direct-acting: simple exp decay
    const k = Math.log(2) / a.halfLifeHours
    for (let i = 0; i <= steps; i++) {
      const t = i * dt
      points.push({ t, v: Math.exp(-k * t) })
    }
  }

  return normalize(points)
}

function normalize(points: CurvePoint[]): CurvePoint[] {
  const peak = points.reduce((m, p) => (p.v > m ? p.v : m), 0)
  if (peak <= 0) return points
  return points.map((p) => ({ t: p.t, v: p.v / peak }))
}
