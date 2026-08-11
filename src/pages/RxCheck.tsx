import { useRef, useState } from "react"
import {
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  Pill,
  ChevronDown,
  X,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

interface Drug {
  name: string
  dose?: string
  frequency?: string
}
interface Interaction {
  pair: [string, string]
  severity: "major" | "moderate" | "minor"
  mechanism: string
  management: string
}
interface SideEffect {
  drug: string
  common?: string[]
  serious?: string[]
}
interface Analysis {
  drugs: Drug[]
  interactions: Interaction[]
  sideEffects: SideEffect[]
}

type State =
  | { kind: "idle" }
  | { kind: "resizing" }
  | { kind: "uploading" }
  | { kind: "analyzing" }
  | { kind: "done"; result: Analysis; preview: string }
  | { kind: "error"; message: string; preview?: string }

const RESIZE_MAX = 1024
const RESIZE_QUALITY = 0.85

export function RxCheck() {
  const [state, setState] = useState<State>({ kind: "idle" })
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setState({ kind: "resizing" })
    try {
      const dataUrl = await resizeImage(file, RESIZE_MAX, RESIZE_QUALITY)
      setPreview(dataUrl)
      setState({ kind: "uploading" })
      const res = await fetch("/api/analyze-meds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      setState({ kind: "analyzing" })
      const j = await res.json()
      if (!res.ok) {
        setState({
          kind: "error",
          message: (j as { error?: string }).error ?? `status ${res.status}`,
          preview: dataUrl,
        })
        return
      }
      setState({ kind: "done", result: j as Analysis, preview: dataUrl })
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message })
    }
  }

  function reset() {
    setState({ kind: "idle" })
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rx check</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Photo of a medication list → drug interactions + top side effects. Reference only.
        </p>
      </header>

      {state.kind === "idle" && (
        <PhotoPicker
          onFile={handleFile}
          inputRef={inputRef}
        />
      )}

      {(state.kind === "resizing" ||
        state.kind === "uploading" ||
        state.kind === "analyzing") && (
        <ProgressCard state={state.kind} preview={preview} />
      )}

      {state.kind === "error" && (
        <div className="space-y-3">
          {state.preview && (
            <img
              src={state.preview}
              alt=""
              className="w-full max-h-64 rounded-2xl border border-[var(--color-border)] object-contain bg-[var(--color-bg)]"
            />
          )}
          <div className="rounded-2xl border border-[color-mix(in_oklch,var(--color-danger)_40%,var(--color-border))] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-danger)]">
              <AlertTriangle size={16} /> Analysis failed
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted)] break-words">
              {state.message}
            </p>
          </div>
          <Button onClick={reset} variant="subtle">
            Try another photo
          </Button>
        </div>
      )}

      {state.kind === "done" && (
        <Results result={state.result} preview={state.preview} onReset={reset} />
      )}
    </div>
  )
}

function PhotoPicker({
  onFile,
  inputRef,
}: {
  onFile: (f: File) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  function click(kind: "camera" | "library") {
    if (!inputRef.current) return
    // Camera capture on mobile; plain file picker on desktop or "library"
    if (kind === "camera") inputRef.current.setAttribute("capture", "environment")
    else inputRef.current.removeAttribute("capture")
    inputRef.current.click()
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <Camera
          size={40}
          className="mx-auto text-[var(--color-muted)]"
          strokeWidth={1.4}
        />
        <p className="mt-3 text-sm text-[var(--color-text)]">
          Take a photo of the medication list
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Nothing is stored — image is processed and discarded.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={() => click("camera")}>
            <Camera size={14} /> Camera
          </Button>
          <Button variant="outline" onClick={() => click("library")}>
            <Upload size={14} /> From library
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
      <p className="flex items-start gap-1.5 text-[11px] text-[var(--color-muted)]">
        <Info size={12} className="mt-0.5 shrink-0" />
        LLM-generated analysis — verify every finding against an authoritative
        interaction checker (Lexicomp, Micromedex) before clinical action.
      </p>
    </div>
  )
}

function ProgressCard({
  state,
  preview,
}: {
  state: "resizing" | "uploading" | "analyzing"
  preview: string | null
}) {
  const label =
    state === "resizing"
      ? "Preparing photo…"
      : state === "uploading"
        ? "Uploading…"
        : "Analyzing with vision model (5–15 s)…"
  return (
    <div className="space-y-3">
      {preview && (
        <img
          src={preview}
          alt=""
          className="w-full max-h-72 rounded-2xl border border-[var(--color-border)] object-contain bg-[var(--color-bg)]"
        />
      )}
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
        <span className="text-sm text-[var(--color-text)]">{label}</span>
      </div>
    </div>
  )
}

const sevTone: Record<Interaction["severity"], "danger" | "warn" | "muted"> = {
  major: "danger",
  moderate: "warn",
  minor: "muted",
}

function Results({
  result,
  preview,
  onReset,
}: {
  result: Analysis
  preview: string
  onReset: () => void
}) {
  const empty =
    result.drugs.length === 0 &&
    result.interactions.length === 0 &&
    result.sideEffects.length === 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <img
          src={preview}
          alt=""
          className="w-24 h-24 rounded-xl border border-[var(--color-border)] object-cover"
        />
        <Button variant="ghost" size="icon" onClick={onReset} aria-label="New photo">
          <X size={16} />
        </Button>
      </div>

      {empty && (
        <div className="rounded-2xl border border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))] bg-[var(--color-surface)] p-4 text-sm">
          No medications detected. Try a clearer photo, better lighting, or make
          sure the med list is readable.
        </div>
      )}

      {result.drugs.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-4 py-2.5 text-sm font-medium">
            Medications detected ({result.drugs.length})
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {result.drugs.map((d, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Pill size={14} className="text-[var(--color-muted)]" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  {(d.dose || d.frequency) && (
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {[d.dose, d.frequency].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.interactions.length > 0 && (
        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
            Interactions ({result.interactions.length})
          </div>
          {result.interactions.map((ix, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl border bg-[var(--color-surface)] p-4",
                ix.severity === "major"
                  ? "border-[color-mix(in_oklch,var(--color-danger)_50%,var(--color-border))]"
                  : ix.severity === "moderate"
                    ? "border-[color-mix(in_oklch,var(--color-warn)_40%,var(--color-border))]"
                    : "border-[var(--color-border)]",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-medium text-sm">
                  {ix.pair[0]} <span className="text-[var(--color-muted)]">×</span> {ix.pair[1]}
                </div>
                <Badge tone={sevTone[ix.severity]} className="text-[10px]">
                  {ix.severity}
                </Badge>
              </div>
              {ix.mechanism && (
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">{ix.mechanism}</p>
              )}
              {ix.management && (
                <p className="mt-1 text-[13px] text-[var(--color-text)]">
                  <span className="text-[var(--color-muted)]">→ </span>
                  {ix.management}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {result.sideEffects.length > 0 && (
        <section className="space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
            Side effects
          </div>
          {result.sideEffects.map((se, i) => (
            <SideEffectRow key={i} se={se} />
          ))}
        </section>
      )}

      <div className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-3 py-2.5 text-[11px] text-[var(--color-muted)]">
        <Info size={13} className="mt-0.5 shrink-0" />
        <p>
          LLM-generated from a single photo — misreads, false interactions, and
          omissions all possible. Confirm with an authoritative source before any
          patient decision.
        </p>
      </div>

      <Button onClick={onReset} variant="subtle" className="w-full">
        <Camera size={14} /> Analyze another photo
      </Button>
    </div>
  )
}

function SideEffectRow({ se }: { se: SideEffect }) {
  const [open, setOpen] = useState(false)
  const hasSerious = (se.serious ?? []).length > 0
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          <Pill size={14} className="text-[var(--color-muted)]" />
          <span className="font-medium">{se.drug}</span>
          {hasSerious && (
            <Badge tone="danger" className="text-[9px]">
              serious
            </Badge>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-[var(--color-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="space-y-2 border-t border-[var(--color-border)] px-4 py-3">
          {(se.common ?? []).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                Common
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(se.common ?? []).map((s, i) => (
                  <Badge key={i} tone="neutral" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {hasSerious && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-danger)]">
                Serious
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(se.serious ?? []).map((s, i) => (
                  <Badge key={i} tone="danger" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Client-side image resize — send ~1024px longest side, JPEG q0.85, base64 URL.
// -----------------------------------------------------------------------------

async function resizeImage(file: File, maxDim: number, quality: number): Promise<string> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas 2d context unavailable")
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(img.src)
  return canvas.toDataURL("image/jpeg", quality)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("could not read image"))
    img.src = URL.createObjectURL(file)
  })
}
