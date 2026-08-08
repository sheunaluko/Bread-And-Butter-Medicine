import { useEffect, useState } from "react"

export const THEMES = [
  "midnight",
  "carbon",
  "nord",
  "paper",
  "solar-light",
] as const

export type Theme = (typeof THEMES)[number]
export type ThemeChoice = Theme | "auto"

const STORAGE_KEY = "bb.theme"

export function readStoredChoice(): ThemeChoice {
  if (typeof localStorage === "undefined") return "auto"
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === "auto") return "auto"
  if (v && (THEMES as readonly string[]).includes(v)) return v as Theme
  return "auto"
}

export function resolveTheme(choice: ThemeChoice): Theme {
  if (choice !== "auto") return choice
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
  return prefersLight ? "paper" : "midnight"
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readStoredChoice())

  useEffect(() => {
    applyTheme(resolveTheme(choice))
    if (choice === "auto") {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, choice)
    }
  }, [choice])

  // React to OS light/dark swap only while user is on "auto"
  useEffect(() => {
    if (choice !== "auto") return
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const listener = () => applyTheme(resolveTheme("auto"))
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [choice])

  return { choice, setChoice, resolved: resolveTheme(choice) }
}
