import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation } from "react-router-dom"
import {
  MessageSquarePlus,
  Lightbulb,
  X,
  Loader2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

type Mode = "feedback" | "request"
type FeedbackCat = "general" | "bug" | "data"
type State = "idle" | "sending" | "sent" | "error"

const feedbackCats: Array<{ id: FeedbackCat; label: string }> = [
  { id: "general", label: "General" },
  { id: "bug", label: "Bug / wrong info" },
  { id: "data", label: "Data correction" },
]

interface Props {
  mode: Mode
}

export function FeedbackButton({ mode }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [toolName, setToolName] = useState("")
  const [category, setCategory] = useState<FeedbackCat>("general")
  const [state, setState] = useState<State>("idle")
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => taRef.current?.focus(), 60)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const isRequest = mode === "request"

  async function submit() {
    const trimmed = text.trim()
    if (!trimmed || state === "sending") return
    setState("sending")
    setError(null)
    try {
      const body = isRequest
        ? {
            text: `${toolName.trim() ? `[${toolName.trim()}] ` : ""}${trimmed}`,
            category: "new-app",
            url: location.pathname + location.search,
          }
        : {
            text: trimmed,
            category,
            url: location.pathname + location.search,
          }
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? `status ${res.status}`)
      }
      setState("sent")
      setText("")
      setToolName("")
      setTimeout(() => {
        setOpen(false)
        setState("idle")
      }, 1200)
    } catch (e) {
      setState("error")
      setError((e as Error).message)
    }
  }

  const title = isRequest ? "Request a new tool" : "Send feedback"
  const Icon = isRequest ? Lightbulb : MessageSquarePlus
  const buttonLabel = isRequest ? "Request a new tool" : "Send feedback"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={buttonLabel}
        title={buttonLabel}
        className="grid h-8 w-8 place-items-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        <Icon size={16} />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fb-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md flex max-h-[min(640px,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-md",
                    isRequest
                      ? "bg-[color-mix(in_oklch,var(--color-accent)_20%,transparent)] text-[var(--color-accent)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                  )}
                >
                  <Icon size={14} />
                </span>
                <div id="fb-title" className="text-sm font-semibold">
                  {title}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isRequest ? (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--color-muted)]">
                    Describe the tool you want — what it does, when you'd reach for
                    it, and what today's workaround is.
                  </p>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-[var(--color-muted)]">
                      Tool name (optional)
                    </span>
                    <Input
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      placeholder="e.g. ABG interpreter"
                      maxLength={80}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-[var(--color-muted)]">Description</span>
                    <textarea
                      ref={taRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={5000}
                      rows={6}
                      placeholder="Enter pH / pCO2 / HCO3 → primary disorder + compensation + AG, plotted on a Davenport diagram. Would use this a few times per shift."
                      className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {feedbackCats.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          category === c.id
                            ? "border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                            : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={taRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={5000}
                    rows={6}
                    placeholder={
                      category === "bug"
                        ? "Which page, what's wrong, what did you expect?"
                        : category === "data"
                          ? "Which drug / cell / dose is off — what should it be?"
                          : "What's on your mind?"
                    }
                    className="w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  />
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                <span>
                  {location.pathname} · {text.length}/5000
                </span>
                {state === "error" && (
                  <span className="text-[var(--color-danger)]">{error}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={!text.trim() || state === "sending"}
              >
                {state === "sending" && <Loader2 size={14} className="animate-spin" />}
                {state === "sent" && <Check size={14} />}
                {state === "sent" ? "Sent" : isRequest ? "Submit request" : "Send"}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
