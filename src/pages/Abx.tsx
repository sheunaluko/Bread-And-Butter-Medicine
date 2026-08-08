import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  antibiotics,
  organisms,
  coverage,
  type Coverage,
  type OrganismCategory,
} from "@/data/spectrum"
import { cn } from "@/lib/utils"

const categoryLabel: Record<OrganismCategory, string> = {
  "gram-positive": "Gram +",
  "gram-negative": "Gram -",
  anaerobe: "Anaerobe",
  atypical: "Atypical",
}

const covCell: Record<Coverage, { dot: string; label: string }> = {
  y: { dot: "bg-[var(--color-ok)]", label: "Covers" },
  v: { dot: "bg-[var(--color-warn)]", label: "Variable / resistance concern" },
  n: { dot: "bg-[color-mix(in_oklch,var(--color-danger)_50%,transparent)]", label: "No reliable activity" },
}

type Mode = "byAbx" | "byOrg"

export function Abx() {
  const [mode, setMode] = useState<Mode>("byAbx")
  const [q, setQ] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [selectedAbx, setSelectedAbx] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<OrganismCategory | "all">("all")

  const query = q.trim().toLowerCase()

  const filteredAbx = useMemo(() => {
    if (!query) return antibiotics
    return antibiotics.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.short?.toLowerCase().includes(query) ||
        a.class.toLowerCase().includes(query),
    )
  }, [query])

  const filteredOrgs = useMemo(() => {
    let list = organisms
    if (catFilter !== "all") list = list.filter((o) => o.category === catFilter)
    if (query)
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.short?.toLowerCase().includes(query),
      )
    return list
  }, [query, catFilter])

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Antibiotic spectrum</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Typical coverage — verify with local antibiogram.
        </p>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === "byAbx" ? "Search antibiotics" : "Search organisms"}
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
      </div>

      <div className="flex gap-1 rounded-lg bg-[var(--color-surface)] p-1 text-sm">
        <button
          onClick={() => {
            setMode("byAbx")
            setSelectedAbx(null)
          }}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 transition-colors",
            mode === "byAbx"
              ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "text-[var(--color-muted)]",
          )}
        >
          Pick antibiotic
        </button>
        <button
          onClick={() => {
            setMode("byOrg")
            setSelectedOrg(null)
          }}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 transition-colors",
            mode === "byOrg"
              ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "text-[var(--color-muted)]",
          )}
        >
          Pick organism
        </button>
      </div>

      {mode === "byAbx" && (
        <AbxMode
          filteredAbx={filteredAbx}
          selectedAbx={selectedAbx}
          setSelectedAbx={setSelectedAbx}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
        />
      )}

      {mode === "byOrg" && (
        <OrgMode
          filteredOrgs={filteredOrgs}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
        />
      )}
    </div>
  )
}

interface AbxModeProps {
  filteredAbx: typeof antibiotics
  selectedAbx: string | null
  setSelectedAbx: (v: string | null) => void
  catFilter: OrganismCategory | "all"
  setCatFilter: (v: OrganismCategory | "all") => void
}

function AbxMode({
  filteredAbx,
  selectedAbx,
  setSelectedAbx,
  catFilter,
  setCatFilter,
}: AbxModeProps) {
  const abx = antibiotics.find((a) => a.id === selectedAbx) ?? null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filteredAbx.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAbx(a.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              selectedAbx === a.id
                ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]",
            )}
          >
            <div className="font-medium">{a.short ?? a.name}</div>
            <div className="mt-0.5 text-[11px] text-[var(--color-muted)] truncate">
              {a.class}
            </div>
          </button>
        ))}
      </div>

      {abx && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{abx.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{abx.class}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAbx(null)}>
              <X size={16} />
            </Button>
          </div>
          {abx.notes && (
            <p className="mt-2 text-xs text-[var(--color-warn)]">{abx.notes}</p>
          )}

          <CategoryFilter value={catFilter} onChange={setCatFilter} />

          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {organisms
              .filter((o) => catFilter === "all" || o.category === catFilter)
              .map((o) => {
                const c = coverage[abx.id]?.[o.id] ?? "n"
                const style = covCell[c]
                return (
                  <li key={o.id} className="flex items-center gap-3 py-2">
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)}
                      title={style.label}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm">{o.name}</div>
                    </div>
                    <Badge tone="muted" className="text-[10px]">
                      {categoryLabel[o.category]}
                    </Badge>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
    </div>
  )
}

interface OrgModeProps {
  filteredOrgs: typeof organisms
  selectedOrg: string | null
  setSelectedOrg: (v: string | null) => void
  catFilter: OrganismCategory | "all"
  setCatFilter: (v: OrganismCategory | "all") => void
}

function OrgMode({
  filteredOrgs,
  selectedOrg,
  setSelectedOrg,
  catFilter,
  setCatFilter,
}: OrgModeProps) {
  const org = organisms.find((o) => o.id === selectedOrg) ?? null

  return (
    <div className="space-y-3">
      <CategoryFilter value={catFilter} onChange={setCatFilter} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filteredOrgs.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelectedOrg(o.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              selectedOrg === o.id
                ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{o.name}</span>
              <Badge tone="muted" className="text-[10px]">
                {categoryLabel[o.category]}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {org && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{org.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{categoryLabel[org.category]}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedOrg(null)}>
              <X size={16} />
            </Button>
          </div>

          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {antibiotics
              .map((a) => {
                const c = coverage[a.id]?.[org.id] ?? "n"
                return { a, c }
              })
              .sort((x, y) => {
                const order: Coverage[] = ["y", "v", "n"]
                return order.indexOf(x.c) - order.indexOf(y.c)
              })
              .map(({ a, c }) => {
                const style = covCell[c]
                return (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)}
                      title={style.label}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm">{a.name}</div>
                      <div className="text-[11px] text-[var(--color-muted)] truncate">
                        {a.class}
                      </div>
                    </div>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
    </div>
  )
}

function CategoryFilter({
  value,
  onChange,
}: {
  value: OrganismCategory | "all"
  onChange: (v: OrganismCategory | "all") => void
}) {
  const items: Array<{ id: OrganismCategory | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "gram-positive", label: "Gram +" },
    { id: "gram-negative", label: "Gram -" },
    { id: "anaerobe", label: "Anaerobe" },
    { id: "atypical", label: "Atypical" },
  ]
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onChange(i.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === i.id
              ? "border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
              : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  )
}
