import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X, Loader2, ExternalLink } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  searchDrug,
  displayName,
  primaryClass,
  extractHalfLifeHours,
  extractOnset,
  extractTmax,
  extractSection,
  detectRoute,
  type FdaResult,
} from "@/lib/fda"
import { simulate, absorptionHalfLifeFromTmax, type PkRoute } from "@/lib/pk"
import { MoleculeViewer } from "@/components/MoleculeViewer"
import { cn } from "@/lib/utils"

export function Meds() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<FdaResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FdaResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const term = q.trim()
    if (!term) {
      setResults([])
      setError(null)
      setLoading(false)
      abortRef.current?.abort()
      return
    }
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    const timer = window.setTimeout(async () => {
      try {
        const r = await searchDrug(term, controller.signal)
        setResults(r)
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") {
          setError("openFDA lookup failed")
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Med lookup</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Pharmacology from FDA drug labels via openFDA.
        </p>
      </header>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Metoprolol, apixaban, vancomycin..."
          className="pl-9"
        />
        {q && !loading && (
          <button
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-muted)]"
          />
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-warn)]">
          {error}
        </p>
      )}

      {!selected && results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((r, i) => (
            <li key={r.id ?? i}>
              <button
                onClick={() => setSelected(r)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left hover:bg-[var(--color-surface-2)]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{displayName(r)}</div>
                  <div className="truncate text-[11px] text-[var(--color-muted)]">
                    {primaryClass(r) ?? r.openfda?.manufacturer_name?.[0] ?? "—"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.openfda?.route?.slice(0, 2).map((route) => (
                    <Badge key={route} tone="muted" className="text-[10px]">
                      {route.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selected && !loading && q && !results.length && !error && (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted)]">
          No matches on openFDA. Try the generic name.
        </p>
      )}

      {selected && <MedDetail r={selected} onBack={() => setSelected(null)} />}
    </div>
  )
}

function MedDetail({ r, onBack }: { r: FdaResult; onBack: () => void }) {
  const pkText = (r.pharmacokinetics ?? r.clinical_pharmacology ?? []).join("\n\n")
  const pdText = (r.pharmacodynamics ?? []).join("\n\n")
  const combined = [pdText, pkText, (r.clinical_pharmacology ?? []).join("\n\n")]
    .filter(Boolean)
    .join("\n\n")
  const t12 = useMemo(() => (pkText ? extractHalfLifeHours(pkText) : null), [pkText])
  const onset = useMemo(() => (combined ? extractOnset(combined) : null), [combined])
  const tmax = useMemo(() => (combined ? extractTmax(combined) : null), [combined])
  const route = detectRoute(r)
  // PubChem lookup — prefer substance name (cleanest single molecule),
  // fall back to generic, then brand.
  const structureName =
    r.openfda?.substance_name?.[0] ??
    r.openfda?.generic_name?.[0] ??
    r.openfda?.brand_name?.[0] ??
    ""
  const specific = (r.use_in_specific_populations ?? []).join("\n\n")
  const renal = extractSection(specific, /renal|creatinine|CrCl|dialysis|nephro/i)
  const hepatic = extractSection(specific, /hepatic|liver|cirrhosis|child[-\s]?pugh/i)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">{displayName(r)}</div>
          <div className="text-xs text-[var(--color-muted)]">
            {primaryClass(r) ?? "—"} · {r.openfda?.manufacturer_name?.[0] ?? "—"}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {r.openfda?.route?.map((r2) => (
          <Badge key={r2} tone="neutral" className="text-[11px]">
            {r2.toLowerCase()}
          </Badge>
        ))}
        {onset && (
          <Badge tone="ok" className="text-[11px]">
            onset ≈ {fmtDur(onset.hours)}
          </Badge>
        )}
        {tmax && (
          <Badge tone="ok" className="text-[11px]">
            Tmax ≈ {fmtDur(tmax.hours)}
          </Badge>
        )}
        {t12 && (
          <Badge tone="ok" className="text-[11px]">
            t½ ≈ {fmtDur(t12.hours)}
          </Badge>
        )}
      </div>

      {structureName && <MoleculeViewer name={structureName} />}

      {t12 && (
        <PkChart
          halfLifeHours={t12.hours}
          route={route === "iv" ? "iv" : "po"}
          tmaxHours={tmax?.hours}
        />
      )}

      <Section title="Pharmacokinetics" body={pkText} />
      {pdText && <Section title="Pharmacodynamics" body={pdText} />}
      <Section title="Mechanism / clinical pharmacology" body={(r.mechanism_of_action ?? r.clinical_pharmacology ?? []).join("\n\n")} />
      <Section title="Dosage & administration" body={(r.dosage_and_administration ?? []).join("\n\n")} collapsible />
      {renal && <Section title="Renal adjustment" body={renal} tone="warn" />}
      {hepatic && <Section title="Hepatic adjustment" body={hepatic} tone="warn" />}
      <Section title="Contraindications" body={(r.contraindications ?? []).join("\n\n")} collapsible />
      {r.boxed_warning?.length ? (
        <Section title="Boxed warning" body={r.boxed_warning.join("\n\n")} tone="danger" />
      ) : null}
      <Section title="Interactions" body={(r.drug_interactions ?? []).join("\n\n")} collapsible />

      <p className="pt-2 text-[11px] text-[var(--color-muted)]">
        Source: openFDA drug label. See{" "}
        <a
          className="inline-flex items-center gap-0.5 underline hover:text-[var(--color-text)]"
          href={`https://api.fda.gov/drug/label.json?search=id:${r.id ?? ""}`}
          target="_blank"
          rel="noreferrer"
        >
          raw record <ExternalLink size={11} />
        </a>
        .
      </p>
    </div>
  )
}

function Section({
  title,
  body,
  tone = "neutral",
  collapsible = false,
}: {
  title: string
  body: string
  tone?: "neutral" | "warn" | "danger"
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(!collapsible)
  if (!body?.trim()) return null
  const toneStyle =
    tone === "warn"
      ? "border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))]"
      : tone === "danger"
        ? "border-[color-mix(in_oklch,var(--color-danger)_50%,var(--color-border))]"
        : "border-[var(--color-border)]"
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-[var(--color-surface)]", toneStyle)}>
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium",
          !collapsible && "pointer-events-none",
        )}
      >
        <span>{title}</span>
        {collapsible && (
          <span className="text-xs text-[var(--color-muted)]">{open ? "hide" : "show"}</span>
        )}
      </button>
      {open && (
        <div className="whitespace-pre-wrap px-4 pb-4 pt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {body}
        </div>
      )}
    </div>
  )
}

function PkChart({
  halfLifeHours,
  route: initialRoute,
  tmaxHours,
}: {
  halfLifeHours: number
  route: PkRoute
  tmaxHours?: number
}) {
  const [route, setRoute] = useState<PkRoute>(initialRoute)
  const [dose, setDose] = useState(100)
  const [interval, setIntervalH] = useState(Math.max(4, Math.round(halfLifeHours)))
  const [duration] = useState(() => Math.min(72, Math.max(24, halfLifeHours * 5)))
  const [absHalfLife, setAbsHalfLife] = useState(() =>
    tmaxHours
      ? Math.max(0.05, absorptionHalfLifeFromTmax(halfLifeHours, tmaxHours))
      : 0.5,
  )

  const points = useMemo(
    () =>
      simulate({
        dose,
        halfLifeHours,
        vdLPerKg: 0.6, // toy default
        weightKg: 70,
        intervalHours: interval,
        bioavailability: route === "po" ? 0.5 : 1,
        durationHours: duration,
        route,
        absorptionHalfLifeHours: absHalfLife,
      }),
    [dose, interval, duration, halfLifeHours, route, absHalfLife],
  )

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Concentration vs time</div>
          <div className="text-[11px] text-[var(--color-muted)]">
            {route === "iv" ? "IV bolus, 1-compartment" : "Oral, Bateman absorption"} · illustrative only
          </div>
        </div>
        <div className="flex rounded-lg bg-[var(--color-bg)] p-0.5 text-xs">
          <button
            onClick={() => setRoute("iv")}
            className={cn(
              "rounded-md px-2 py-1",
              route === "iv"
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-muted)]",
            )}
          >
            IV
          </button>
          <button
            onClick={() => setRoute("po")}
            className={cn(
              "rounded-md px-2 py-1",
              route === "po"
                ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                : "text-[var(--color-muted)]",
            )}
          >
            PO
          </button>
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => `${v.toFixed(0)}h`}
            />
            <YAxis
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => `t = ${Number(v).toFixed(1)} h`}
              formatter={(v) => [`${Number(v).toFixed(3)} mg/L`, "concentration"]}
            />
            {Array.from({ length: Math.floor(duration / interval) + 1 }).map((_, i) => (
              <ReferenceLine
                key={i}
                x={i * interval}
                stroke="var(--color-muted)"
                strokeDasharray="2 3"
                strokeOpacity={0.4}
              />
            ))}
            <Line
              type="monotone"
              dataKey="c"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className={cn(
          "mt-3 grid gap-3 text-xs",
          route === "po" ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Dose (mg)</span>
          <Input
            type="number"
            min={1}
            value={dose}
            onChange={(e) => setDose(Number(e.target.value) || 0)}
            className="h-9"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--color-muted)]">Interval (h)</span>
          <Input
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setIntervalH(Number(e.target.value) || 1)}
            className="h-9"
          />
        </label>
        {route === "po" && (
          <label className="flex flex-col gap-1">
            <span className="text-[var(--color-muted)]">Abs t½ (h)</span>
            <Input
              type="number"
              min={0.05}
              step={0.1}
              value={absHalfLife}
              onChange={(e) => setAbsHalfLife(Number(e.target.value) || 0.5)}
              className="h-9"
            />
          </label>
        )}
      </div>
    </div>
  )
}

function fmtDur(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 24) return `${hours.toFixed(hours < 3 ? 1 : 0)} h`
  return `${(hours / 24).toFixed(1)} d`
}
