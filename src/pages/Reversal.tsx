import { useMemo, useState } from "react"
import { Search, X, AlertTriangle, Info } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Sparkline } from "@/components/Sparkline"
import { acCurve } from "@/lib/curves"
import { cn } from "@/lib/utils"
import {
  anticoagulants,
  type Anticoagulant,
  type Severity,
  type Tier,
} from "@/data/reversal"

const AC_WINDOW_HOURS = 120 // 5 days

const severityTone: Record<Severity, "danger" | "warn" | "neutral"> = {
  critical: "danger",
  urgent: "warn",
  "non-urgent": "neutral",
}

const tierTone: Record<Tier, "ok" | "neutral" | "muted" | "warn"> = {
  "first-line": "ok",
  alternative: "neutral",
  adjunct: "muted",
  "off-label": "warn",
}

const tierLabel: Record<Tier, string> = {
  "first-line": "first-line",
  alternative: "alternative",
  adjunct: "adjunct",
  "off-label": "off-label",
}

// Category ordering that mirrors typical clinical grouping.
const classOrder = [
  "Vitamin K antagonist",
  "Indirect thrombin/Xa inhibitor",
  "Low-molecular-weight heparin",
  "Indirect factor Xa inhibitor",
  "Direct thrombin inhibitor",
  "Direct factor Xa inhibitor",
  "COX-1 inhibitor (irreversible)",
  "P2Y12 inhibitor (irreversible)",
  "P2Y12 inhibitor (reversible)",
  "Thrombolytic (tPA)",
]

export function Reversal() {
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const query = q.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!query) return anticoagulants
    return anticoagulants.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.brand?.toLowerCase().includes(query) ||
        a.class.toLowerCase().includes(query),
    )
  }, [query])

  const grouped = useMemo(() => {
    const map = new Map<string, Anticoagulant[]>()
    for (const a of filtered) {
      const arr = map.get(a.class) ?? []
      arr.push(a)
      map.set(a.class, arr)
    }
    return classOrder
      .filter((c) => map.has(c))
      .map((c) => ({ cls: c, list: map.get(c)! }))
  }, [filtered])

  const active = anticoagulants.find((a) => a.id === selected)

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AC reversal</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Reversal options by anticoagulant + scenario. Confirm with pharmacy / heme.
        </p>
      </header>

      {!active && (
        <>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Warfarin, apixaban, heparin..."
              className="pl-9"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {grouped.map(({ cls, list }) => (
              <section key={cls} className="space-y-2">
                <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
                  {cls}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((a) => {
                    const points = acCurve(a, { windowHours: AC_WINDOW_HOURS })
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelected(a.id)}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left hover:bg-[var(--color-surface-2)]"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{a.name}</span>
                          {a.brand && (
                            <span className="text-[11px] text-[var(--color-muted)]">
                              {a.brand}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Sparkline
                            points={points}
                            width={110}
                            height={22}
                            className="text-[var(--color-accent)]"
                          />
                          <span className="text-[11px] text-[var(--color-muted)]">
                            t½ {a.halfLife}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
            {grouped.length === 0 && (
              <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted)]">
                No matches.
              </p>
            )}
          </div>
        </>
      )}

      {active && <AcDetail a={active} onBack={() => setSelected(null)} />}
    </div>
  )
}

function AcDetail({ a, onBack }: { a: Anticoagulant; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">
            {a.name}
            {a.brand && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
                {a.brand}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--color-muted)]">{a.class}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X size={16} />
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-sm font-medium">Effect without reversal</div>
          <div className="text-[10px] text-[var(--color-muted)]">
            {AC_WINDOW_HOURS} h ({AC_WINDOW_HOURS / 24} d) window
          </div>
        </div>
        <Sparkline
          points={acCurve(a, { windowHours: AC_WINDOW_HOURS })}
          width={640}
          height={72}
          strokeWidth={1.8}
          className="w-full text-[var(--color-accent)]"
          markers={[24, 48, 72, 96]}
        />
        <div className="mt-1 flex justify-between text-[10px] text-[var(--color-muted)]">
          <span>0 h</span>
          <span>24 h</span>
          <span>48 h</span>
          <span>72 h</span>
          <span>96 h</span>
          <span>120 h</span>
        </div>
        {a.effectModel === "antiplatelet-linear" && (
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            Irreversible platelet inhibition — modeled as linear recovery via
            new-platelet turnover over ~{a.effectDurationDays} d.
          </p>
        )}
        {a.effectModel === "delayed" && (
          <p className="mt-2 text-[11px] text-[var(--color-muted)]">
            INR resolution is governed by factor-II regeneration, not drug clearance.
            Effect persists past the ~{Math.round(a.halfLifeHours)} h drug half-life.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <MetaCell label="Half-life" value={a.halfLife} />
        {a.monitoring && <MetaCell label="Monitoring" value={a.monitoring} />}
        {a.specificAntidote && (
          <MetaCell label="Specific antidote" value={a.specificAntidote} />
        )}
      </div>

      {a.notes && (
        <div className="flex gap-2 rounded-xl border border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))] bg-[var(--color-surface)] px-3 py-2.5 text-xs text-[var(--color-muted)]">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
          <p>{a.notes}</p>
        </div>
      )}

      <div className="space-y-3">
        {a.scenarios.map((s) => (
          <div
            key={s.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-[var(--color-surface)]",
              s.severity === "critical"
                ? "border-[color-mix(in_oklch,var(--color-danger)_50%,var(--color-border))]"
                : s.severity === "urgent"
                  ? "border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))]"
                  : "border-[var(--color-border)]",
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
              <div className="font-medium text-sm">{s.title}</div>
              <Badge tone={severityTone[s.severity]} className="text-[10px]">
                {s.severity}
              </Badge>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {s.options.map((o, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm">{o.agent}</div>
                    <Badge tone={tierTone[o.tier]} className="text-[10px]">
                      {tierLabel[o.tier]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--color-text)]">
                    {o.dose}
                    {o.route && (
                      <span className="text-[var(--color-muted)]"> · {o.route}</span>
                    )}
                  </div>
                  {o.timing && (
                    <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                      When: {o.timing}
                    </div>
                  )}
                  {o.notes && (
                    <div className="mt-1 text-[11px] text-[var(--color-muted)]">
                      {o.notes}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {s.notes && (
              <div className="border-t border-[var(--color-border)] px-4 py-2 text-[11px] text-[var(--color-muted)]">
                {s.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2.5 text-[11px] text-[var(--color-muted)]">
        <Info size={13} className="mt-0.5 shrink-0" />
        <p>
          Doses shown are typical adult regimens for guidance only. Institutional protocols,
          patient-specific renal / hepatic function, and thrombotic risk override this
          reference. Call pharmacy / hematology.
        </p>
      </div>
    </div>
  )
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  )
}
