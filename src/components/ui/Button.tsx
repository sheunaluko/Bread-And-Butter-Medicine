import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Variant = "solid" | "ghost" | "outline" | "subtle"
type Size = "sm" | "md" | "icon"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] active:transition-transform"

const variants: Record<Variant, string> = {
  solid: "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:brightness-110",
  ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  outline:
    "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  subtle: "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:brightness-110",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9",
}

export function Button({
  className,
  variant = "solid",
  size = "md",
  ...rest
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  )
}
