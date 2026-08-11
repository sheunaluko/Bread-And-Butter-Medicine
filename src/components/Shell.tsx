import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { Home, FlaskConical, Pill, ArrowRightLeft, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemePicker } from "@/components/ThemePicker"
import { FeedbackButton } from "@/components/FeedbackButton"
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt"

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/abx", label: "Abx", icon: FlaskConical },
  { to: "/meds", label: "Meds", icon: Pill },
  { to: "/convert", label: "Convert", icon: ArrowRightLeft },
  { to: "/reversal", label: "Reverse", icon: ShieldAlert },
] as const

const titles: Record<string, string> = {
  "/": "bread & butter",
  "/abx": "Antibiotics",
  "/meds": "Meds",
  "/convert": "Convert",
  "/reversal": "AC reversal",
}

export function Shell() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? "bread & butter"

  return (
    <div className="min-h-svh flex flex-col">
      <header className="safe-t sticky top-0 z-10 border-b border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_85%,transparent)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-xs font-bold">
              b
            </span>
            <span className="text-sm font-semibold tracking-tight">{title}</span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden sm:flex items-center gap-1">
              {nav.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-1.5 text-sm",
                      isActive
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                    )
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <FeedbackButton mode="request" />
            <FeedbackButton mode="feedback" />
            <ThemePicker />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 pb-28 sm:pb-10">
        <Outlet />
      </main>

      <nav className="safe-b fixed inset-x-0 bottom-0 z-10 sm:hidden border-t border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-bg)_90%,transparent)] backdrop-blur">
        <ul className="mx-auto flex max-w-3xl">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]",
                  )
                }
              >
                <Icon size={20} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <PwaUpdatePrompt />
    </div>
  )
}
