import { useEffect, useRef, useState } from "react"
import { Palette, Check } from "lucide-react"
import { useTheme, type ThemeChoice, THEMES } from "@/lib/theme"
import { cn } from "@/lib/utils"

const LABEL: Record<ThemeChoice, string> = {
  auto: "Auto",
  midnight: "Midnight",
  carbon: "Carbon",
  nord: "Nord",
  paper: "Paper",
  "solar-light": "Solar",
}

const options: ThemeChoice[] = ["auto", ...THEMES]

export function ThemePicker() {
  const { choice, setChoice } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme"
        className="grid h-8 w-8 place-items-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        <Palette size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-40 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {options.map((t) => (
            <button
              key={t}
              role="menuitemradio"
              aria-checked={choice === t}
              onClick={() => {
                setChoice(t)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                choice === t
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              )}
            >
              <span className="flex items-center gap-2">
                <ThemeSwatch theme={t} />
                {LABEL[t]}
              </span>
              {choice === t && <Check size={13} className="text-[var(--color-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ThemeSwatch({ theme }: { theme: ThemeChoice }) {
  const colors: Record<ThemeChoice, [string, string]> = {
    auto: ["#0d0e14", "#f5f2ea"],
    midnight: ["#0d0e14", "#6cf6ff"],
    carbon: ["#05060a", "#7cffbe"],
    nord: ["#2e3440", "#88c0d0"],
    paper: ["#f5f2ea", "#c17a3d"],
    "solar-light": ["#fdf6e3", "#268bd2"],
  }
  const [bg, accent] = colors[theme]
  return (
    <span
      className="grid h-4 w-4 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border)]"
      style={{ background: bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
    </span>
  )
}
