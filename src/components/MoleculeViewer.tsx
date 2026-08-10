import { useEffect, useRef, useState } from "react"
import { Atom, Loader2 } from "lucide-react"
import { fetchStructureByName } from "@/lib/pubchem"
import { cn } from "@/lib/utils"

// Types for 3dmol are loosely defined here to keep it dynamically importable.
type ThreeDMol = {
  createViewer: (
    el: HTMLElement,
    opts: {
      backgroundColor?: string
      backgroundAlpha?: number
      antialias?: boolean
    },
  ) => Viewer
}
interface Viewer {
  addModel: (data: string, format: string) => Model
  setStyle: (sel: object, style: object) => void
  zoomTo: () => void
  zoom: (factor: number, animationDuration?: number) => void
  spin: (axis?: string | boolean, speed?: number) => void
  render: () => void
  clear: () => void
  resize: () => void
}
interface Model {}

type Status = "idle" | "loading" | "ready" | "not-found" | "error"

interface Props {
  name: string
  className?: string
  height?: number
}

// Renders a small rotating 3D ball-and-stick model of the given drug,
// fetched live from PubChem. Lazy-loads 3dmol so the ~500KB library only
// hits the browser when a molecule is actually viewed.
export function MoleculeViewer({ name, className, height = 220 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [dim, setDim] = useState<"3d" | "2d" | null>(null)

  useEffect(() => {
    let cancelled = false
    const abort = new AbortController()
    setStatus("loading")
    setDim(null)

    ;(async () => {
      try {
        // Fetch structure + import 3dmol in parallel
        const [structure, mod] = await Promise.all([
          fetchStructureByName(name, abort.signal),
          import("3dmol").then((m) => (m.default ?? m) as unknown as ThreeDMol),
        ])
        if (cancelled) return
        if (!structure) {
          setStatus("not-found")
          return
        }
        if (!hostRef.current) return

        // Dispose previous viewer if any
        if (viewerRef.current) {
          viewerRef.current.clear()
          viewerRef.current = null
        }

        // Read accent color from CSS custom property for atom highlighting.
        // For bg we use fully transparent so the surface color underneath shows.
        const viewer = mod.createViewer(hostRef.current, {
          backgroundColor: "black",
          backgroundAlpha: 0,
          antialias: true,
        })
        viewer.addModel(structure.data, "sdf")
        viewer.setStyle({}, { stick: { radius: 0.14 }, sphere: { scale: 0.22 } })
        viewer.zoomTo()
        viewer.zoom(1.15)
        viewer.spin("y", 0.6)
        viewer.render()
        viewerRef.current = viewer

        setDim(structure.dim)
        setStatus("ready")
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return
        if (!cancelled) setStatus("error")
      }
    })()

    return () => {
      cancelled = true
      abort.abort()
      if (viewerRef.current) {
        try {
          viewerRef.current.clear()
        } catch {}
        viewerRef.current = null
      }
    }
  }, [name])

  // Handle resize (theme swap can change layout)
  useEffect(() => {
    if (!viewerRef.current) return
    const ro = new ResizeObserver(() => {
      try {
        viewerRef.current?.resize()
      } catch {}
    })
    if (hostRef.current) ro.observe(hostRef.current)
    return () => ro.disconnect()
  }, [status])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]",
        className,
      )}
      style={{ height }}
    >
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
        <Atom size={11} />
        <span>PubChem · {dim ?? "structure"}</span>
      </div>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}
      {status === "not-found" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[11px] text-[var(--color-muted)]">
          <Atom size={20} className="opacity-40" />
          <span>no structure on PubChem</span>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[var(--color-danger)]">
          couldn't load structure
        </div>
      )}
    </div>
  )
}
