/// <reference path="../../worker-configuration.d.ts" />

// Cloudflare Worker: serves static assets + one JSON POST endpoint that
// appends user feedback to a D1 (SQLite) database.
//
// Retrieval is via `wrangler d1 execute` using the developer's authenticated
// wrangler session — see `npm run feedback` in package.json. No auth on the
// ingest path — feedback is anonymous and rate-limited by IP via a SQL count.

interface FeedbackBody {
  text?: unknown
  url?: unknown
  category?: unknown
}

const MAX_LEN = 5000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/api/feedback") {
      if (request.method !== "POST") return new Response("method", { status: 405 })
      return handleFeedback(request, env)
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true })
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: FeedbackBody
  try {
    body = (await request.json()) as FeedbackBody
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_LEN) : ""
  if (!text) return json({ error: "empty" }, 400)

  const category =
    typeof body.category === "string" ? body.category.slice(0, 40) : "general"
  const pageUrl = typeof body.url === "string" ? body.url.slice(0, 300) : ""
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 300)
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown"
  const country =
    (request as unknown as { cf?: { country?: string } }).cf?.country ?? null
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS

  // Rate limit: count recent submissions from this IP in the window.
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM feedback WHERE ip = ? AND ts > ?",
  )
    .bind(ip, cutoff)
    .first<{ n: number }>()
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return json({ error: "rate limited" }, 429)
  }

  await env.DB.prepare(
    "INSERT INTO feedback (ts, category, text, url, ua, country, ip) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(now, category, text, pageUrl, ua, country, ip)
    .run()

  return json({ ok: true }, 201)
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  })
}
