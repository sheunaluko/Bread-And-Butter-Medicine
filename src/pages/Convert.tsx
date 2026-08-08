import { useMemo, useState } from "react"
import { AlertTriangle, Info } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Sparkline } from "@/components/Sparkline"
import { opioidCurve, steroidCurve } from "@/lib/curves"
import { cn } from "@/lib/utils"
import { opioids, methadoneMMEPerMg, type Opioid } from "@/data/opioids"
import { steroids } from "@/data/steroids"

const OPIOID_WINDOW_HOURS = 48
const STEROID_WINDOW_HOURS = 72

type Tab = "opioid" | "steroid"

export function Convert() {
  const [tab, setTab] = useState<Tab>("opioid")

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Convert</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Equianalgesic / equipotent dose conversions. Verify before administering.
        </p>
      </header>

      <div className="flex gap-1 rounded-lg bg-[var(--color-surface)] p-1 text-sm">
        {(["opioid", "steroid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 capitalize transition-colors",
              tab === t
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-muted)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "opioid" ? <OpioidConverter /> : <SteroidConverter />}
    </div>
  )
}

/* ---------- Opioid ---------- */

const crossToleranceOptions = [
  { pct: 0, label: "0% (same drug)" },
  { pct: 25, label: "25%" },
  { pct: 33, label: "33%" },
  { pct: 50, label: "50%" },
]

function OpioidConverter() {
  const [sourceId, setSourceId] = useState("morphine-po")
  const [dailyDose, setDailyDose] = useState(60)
  const [reductionPct, setReductionPct] = useState(33)

  const source = opioids.find((o) => o.id === sourceId)!

  const sourceMME = useMemo(() => {
    if (source.special && source.id === "methadone") {
      return dailyDose * methadoneMMEPerMg(dailyDose)
    }
    if (source.special) return null // buprenorphine — refuse
    return dailyDose * source.factor
  }, [source, dailyDose])

  const warnings: string[] = []
  if (source.special && source.id === "buprenorphine")
    warnings.push("Buprenorphine does not convert linearly — consult specialist.")
  if (source.special && source.id === "methadone")
    warnings.push(
      "Methadone conversion is non-linear and the reverse (→ methadone) is riskier than shown. Consult pharmacy / palliative care.",
    )
  if (sourceMME != null) {
    if (sourceMME >= 90)
      warnings.push(
        `Total ${Math.round(sourceMME)} MME/day is ≥90 MME/day — CDC high-risk threshold. Consider co-prescribing naloxone.`,
      )
    else if (sourceMME >= 50)
      warnings.push(
        `Total ${Math.round(sourceMME)} MME/day is ≥50 MME/day — CDC elevated-risk threshold.`,
      )
  }

  return (
    <div className="space-y-4">
      <Panel title="Current regimen">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted)]">Drug</span>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              {opioids.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {o.route.toUpperCase()} ({o.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted)]">
              Total daily dose ({source.unit})
            </span>
            <Input
              type="number"
              min={0}
              step={source.unit === "mcg/hr" ? 12.5 : 1}
              value={dailyDose}
              onChange={(e) => setDailyDose(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        {source.notes && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">{source.notes}</p>
        )}
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            Total oral MME
            {sourceMME != null && (
              <Badge tone={sourceMME >= 90 ? "danger" : sourceMME >= 50 ? "warn" : "ok"}>
                {Math.round(sourceMME)} MME/day
              </Badge>
            )}
          </span>
        }
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--color-muted)]">
            Cross-tolerance reduction (when switching drugs)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {crossToleranceOptions.map((opt) => (
              <button
                key={opt.pct}
                onClick={() => setReductionPct(opt.pct)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  reductionPct === opt.pct
                    ? "border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </label>
      </Panel>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-warn)]">
            <AlertTriangle size={16} /> Cautions
          </div>
          <ul className="space-y-1.5 text-xs text-[var(--color-muted)]">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-baseline justify-between border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="text-sm font-medium">Equivalent daily doses</span>
          <span className="text-[10px] text-[var(--color-muted)]">
            curves: single dose, {OPIOID_WINDOW_HOURS} h window
          </span>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {opioids.map((o) => {
            const isSource = o.id === source.id
            const targetDose = computeTargetDose(sourceMME, o, reductionPct)
            const breakthrough = targetDose != null ? targetDose * 0.1 : null
            const points = opioidCurve(o, { windowHours: OPIOID_WINDOW_HOURS })
            return (
              <li key={o.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className={cn("truncate", isSource && "text-[var(--color-muted)]")}>
                    {o.name}{" "}
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {o.route.toUpperCase()}
                    </span>
                  </div>
                  <Sparkline
                    points={points}
                    width={110}
                    height={22}
                    className="mt-0.5 text-[var(--color-accent)]"
                    fillOpacity={isSource ? 0.08 : 0.18}
                  />
                  <div className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                    onset {fmtOnset(o.onsetMins)} · duration{" "}
                    {o.durationHours[0] === o.durationHours[1]
                      ? `${o.durationHours[0]} h`
                      : `${o.durationHours[0]}–${o.durationHours[1]} h`}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  {targetDose == null ? (
                    <span className="text-[var(--color-muted)]">—</span>
                  ) : (
                    <>
                      <div className="font-medium">
                        {fmtDose(targetDose, o.unit)}{" "}
                        <span className="text-[11px] text-[var(--color-muted)]">/day</span>
                      </div>
                      {breakthrough != null && o.route !== "patch" && !o.special && (
                        <div className="text-[10px] text-[var(--color-muted)]">
                          bt ≈ {fmtDose(breakthrough, o.unit)} q3–4h prn
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Disclaimer>
        MME factors from CDC / widely-used equianalgesic tables. Individual response varies.
        Cross-tolerance reduction is a floor, not a ceiling — start lower if opioid-naive,
        elderly, renal / hepatic impairment, or CNS depressant on board.
      </Disclaimer>
    </div>
  )
}

function computeTargetDose(
  sourceMME: number | null,
  target: Opioid,
  reductionPct: number,
): number | null {
  if (sourceMME == null) return null
  if (target.special) return null
  const adjusted = sourceMME * (1 - reductionPct / 100)
  if (target.factor === 0) return null
  return adjusted / target.factor
}

function fmtOnset(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = mins / 60
  return h < 24 ? `${h.toFixed(h < 3 ? 1 : 0)} h` : `${(h / 24).toFixed(1)} d`
}

function fmtDose(v: number, unit: string): string {
  if (unit === "mcg/hr") {
    // round to nearest common patch strength
    const strengths = [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100]
    const closest = strengths.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a))
    return `${closest} ${unit}`
  }
  if (unit === "mcg") return `${Math.round(v)} ${unit}`
  if (v < 1) return `${v.toFixed(2)} ${unit}`
  if (v < 10) return `${v.toFixed(1)} ${unit}`
  return `${Math.round(v)} ${unit}`
}

/* ---------- Steroid ---------- */

function SteroidConverter() {
  const [sourceId, setSourceId] = useState<string>("prednisone")
  const [dose, setDose] = useState(20)
  const source = steroids.find((s) => s.id === sourceId)!

  // hydrocortisone-equivalent mg = dose * (20 / equivalentDose)
  const hcEq = (dose * 20) / source.equivalentDoseMg

  const targets = steroids.map((s) => ({
    s,
    equivalent: (hcEq * s.equivalentDoseMg) / 20,
  }))

  const warnings: string[] = []
  if (source.mineralocorticoidPotency >= 0.5)
    warnings.push(
      `${source.name} has meaningful mineralocorticoid activity — switching to dex/methylpred/betamethasone loses that.`,
    )
  if (source.duration === "long")
    warnings.push(
      `${source.name} is long-acting (t½ up to ${source.biologicalHalfLifeHours[1]} h) — HPA-axis suppression risk with prolonged use.`,
    )
  if (source.id === "fludrocortisone")
    warnings.push(source.notes ?? "")

  return (
    <div className="space-y-4">
      <Panel title="Current dose">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted)]">Steroid</span>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              {steroids.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-[var(--color-muted)]">Dose (mg)</span>
            <Input
              type="number"
              min={0}
              step={source.equivalentDoseMg < 1 ? 0.25 : 1}
              value={dose}
              onChange={(e) => setDose(Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </Panel>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))] bg-[var(--color-surface)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-warn)]">
            <AlertTriangle size={16} /> Notes
          </div>
          <ul className="space-y-1.5 text-xs text-[var(--color-muted)]">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-baseline justify-between border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="text-sm font-medium">Equivalent doses</span>
          <span className="text-[10px] text-[var(--color-muted)]">
            curves: biological effect, {STEROID_WINDOW_HOURS} h window
          </span>
        </div>
        <ul className="divide-y divide-[var(--color-border)]">
          {targets.map(({ s, equivalent }) => {
            const midHalfLife =
              (s.biologicalHalfLifeHours[0] + s.biologicalHalfLifeHours[1]) / 2
            const points = steroidCurve(midHalfLife, {
              windowHours: STEROID_WINDOW_HOURS,
            })
            return (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "truncate",
                      s.id === source.id && "text-[var(--color-muted)]",
                    )}
                  >
                    {s.name}
                  </div>
                  <Sparkline
                    points={points}
                    width={110}
                    height={22}
                    className="mt-0.5 text-[var(--color-accent)]"
                    fillOpacity={s.id === source.id ? 0.08 : 0.18}
                  />
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    <Badge
                      tone={
                        s.duration === "short"
                          ? "muted"
                          : s.duration === "intermediate"
                            ? "neutral"
                            : "warn"
                      }
                      className="text-[10px]"
                    >
                      {s.duration}
                    </Badge>
                    {s.mineralocorticoidPotency > 0 && (
                      <Badge
                        tone={s.mineralocorticoidPotency >= 5 ? "warn" : "muted"}
                        className="text-[10px]"
                      >
                        MC ×{s.mineralocorticoidPotency}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="font-medium">
                    {equivalent < 1
                      ? equivalent.toFixed(2)
                      : equivalent < 10
                        ? equivalent.toFixed(1)
                        : Math.round(equivalent)}{" "}
                    mg
                  </div>
                  <div className="text-[10px] text-[var(--color-muted)]">
                    t½ {s.biologicalHalfLifeHours[0]}–{s.biologicalHalfLifeHours[1]} h
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Disclaimer>
        Equipotency ratios apply to glucocorticoid effect only. Mineralocorticoid activity,
        biologic half-life, and taper considerations are separate — a "same GC dose" of
        dexamethasone is not clinically interchangeable with hydrocortisone for adrenal
        insufficiency (no MC coverage).
      </Disclaimer>
    </div>
  )
}

/* ---------- Small helpers ---------- */

function Panel({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 text-sm font-medium">{title}</div>
      {children}
    </div>
  )
}

function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2.5 text-[11px] text-[var(--color-muted)]">
      <Info size={13} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

