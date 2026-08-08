import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "ok" | "warn" | "danger" | "muted"

const tones: Record<Tone, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-text)]",
  ok: "bg-[color-mix(in_oklch,var(--color-ok)_25%,transparent)] text-[var(--color-ok)]",
  warn: "bg-[color-mix(in_oklch,var(--color-warn)_25%,transparent)] text-[var(--color-warn)]",
  danger: "bg-[color-mix(in_oklch,var(--color-danger)_25%,transparent)] text-[var(--color-danger)]",
  muted: "bg-transparent text-[var(--color-muted)]",
}

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = "neutral", ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
