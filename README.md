# bread & butter medicine

Personal mobile-friendly hospitalist toolkit — antibiotic spectrum, FDA-sourced pharmacology, opioid/steroid conversion, anticoagulation reversal.

**Live:** https://breadandbuttermedicine.com

## Reference only

Clinical data in `/abx`, `/convert`, and `/reversal` was authored from general medical knowledge — **not from cited references**. Verify against your institution's guidelines before any patient decision. `/meds` uses live FDA drug labels via [openFDA](https://open.fda.gov/) — that source is authoritative.

## Tools

| Route | What |
|---|---|
| `/abx` | Antibiotic spectrum-of-activity matrix (25 abx × 25 organisms). Filter by gram-positive / gram-negative / anaerobe / atypical. Search by drug or by organism. |
| `/meds` | Live openFDA drug-label search. Auto-extracts onset of action, Tmax, elimination t½, and renal/hepatic dose-adjustment sections. Renders a 1-compartment PK curve (IV bolus or PO Bateman absorption, route auto-detected). |
| `/convert` | Opioid MME (CDC factors; methadone tiered non-linearly; buprenorphine refused with warning) + steroid glucocorticoid equipotency. Per-row 48h/72h effect-curve sparklines. Cross-tolerance reduction slider. |
| `/reversal` | Reversal reference for 12 anticoagulants (warfarin, UFH, LMWH, fondaparinux, dabigatran, apix/riva/edox, ASA, clopidogrel, ticagrelor, tPA). Scenarios tagged critical/urgent/non-urgent with tiered options. Per-agent 120h decay curves. |

## Stack

Vite · React 19 · TypeScript · Tailwind v4 (5 themes: midnight / carbon / nord / paper / solar-light, plus auto). Hand-rolled shadcn-style UI primitives; Recharts for the PK chart; hand-rolled SVG sparklines for row-level effect curves. Cloudflare Workers Static Assets serves the SPA and hosts a small feedback endpoint backed by D1. No backend beyond the Worker — openFDA is called from the browser.

## Local dev

```bash
npm install
npm run dev             # frontend only; feedback POSTs log to terminal
npm run dev:worker      # build + wrangler dev; feedback POSTs → local D1
```

## Deploy (Cloudflare)

```bash
npm run db:create       # once — creates D1, prints database_id
# paste id into wrangler.jsonc → d1_databases[0].database_id
npm run db:migrate      # applies schema.sql to remote D1
npm run deploy          # ships Worker + static assets
```

`wrangler.jsonc` uses `workers_dev: false` and `preview_urls: false` — the Worker binds to the custom domain(s) declared in the `routes` block, nothing more.

## Feedback

Anonymous submissions from the app's *request a tool* and *feedback* buttons land in D1. Read with your existing `wrangler` session — no secrets in the repo:

```bash
npm run feedback        # pretty table, newest first
npm run feedback:tail   # last 10
npm run feedback:json   # raw JSON via wrangler --json
```
