import { Link } from "react-router-dom"
import {
  FlaskConical,
  Pill,
  ArrowRightLeft,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardBody } from "@/components/ui/Card"

const tools = [
  {
    to: "/abx",
    icon: FlaskConical,
    title: "Antibiotic spectrum",
    blurb: "Search common abx, filter by organism coverage.",
  },
  {
    to: "/meds",
    icon: Pill,
    title: "Med lookup",
    blurb: "FDA-sourced pharmacology: onset, t½, renal & hepatic adjustments.",
  },
  {
    to: "/convert",
    icon: ArrowRightLeft,
    title: "Convert",
    blurb: "Opioid MME + steroid equipotency with cautions.",
  },
  {
    to: "/reversal",
    icon: ShieldAlert,
    title: "AC reversal",
    blurb: "Reversal options for warfarin, DOACs, heparins, antiplatelets, tPA.",
  },
] as const

export function Home() {
  return (
    <div className="space-y-6">
      <section className="pt-2">
        <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
          Hospitalist toolkit
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Bread & butter
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-[var(--color-muted)]">
          Quick-reference tools for the floor. Built for the phone in your pocket.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {tools.map(({ to, icon: Icon, title, blurb }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-colors group-hover:bg-[var(--color-surface-2)]">
              <CardBody className="flex h-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-accent)]">
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-[var(--color-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{blurb}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </section>

      <section className="pt-4">
        <p className="text-xs text-[var(--color-muted)]">
          Reference only. Verify with your local antibiogram and pharmacy.
        </p>
      </section>
    </div>
  )
}
