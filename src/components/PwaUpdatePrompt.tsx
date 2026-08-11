/// <reference types="vite-plugin-pwa/react" />
import { useState } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { RefreshCw, X } from "lucide-react"

export function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      // Non-fatal — app still works, just no offline / no auto-update prompt.
      console.error("[pwa] register error", err)
    },
  })

  if (!needRefresh || dismissed) return null

  return (
    <div className="safe-b fixed inset-x-0 bottom-16 sm:bottom-4 z-40 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-lg backdrop-blur">
        <RefreshCw size={14} className="text-[var(--color-accent)]" />
        <span className="text-xs text-[var(--color-text)]">New version available</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-accent-fg)] hover:brightness-110"
        >
          Reload
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
