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

    if (url.pathname === "/api/analyze-meds") {
      if (request.method !== "POST") return new Response("method", { status: 405 })
      return handleAnalyzeMeds(request, env)
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

// -----------------------------------------------------------------------------
// /api/analyze-meds — vision LLM (Anthropic Claude Sonnet) extracts a med
// list from a photo, then returns interactions + side effects. Nothing is
// stored (patient med lists are sensitive); image is proxied to Anthropic
// and discarded.
// -----------------------------------------------------------------------------

// ~5MB raw = ~7MB base64. Client is expected to resize before upload but we
// enforce a ceiling as defense-in-depth (Workers request body limit is 100MB
// on paid plans but we don't want to feed huge images to the vision model).
const ANALYZE_MAX_BASE64_LEN = 7_000_000
const ANTHROPIC_MODEL = "claude-sonnet-4-6"

// Simple in-memory rate limit per Worker isolate. Not perfectly enforced
// across the CF edge (different isolates have separate maps) but adequate
// for personal-scale abuse deterrence + cost containment.
const ANALYZE_LIMIT_MAX = 10
const ANALYZE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const analyzeRateHits = new Map<string, number[]>()

function checkAnalyzeRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - ANALYZE_LIMIT_WINDOW_MS
  const prior = (analyzeRateHits.get(ip) ?? []).filter((t) => t > cutoff)
  if (prior.length >= ANALYZE_LIMIT_MAX) {
    analyzeRateHits.set(ip, prior)
    return false
  }
  prior.push(now)
  analyzeRateHits.set(ip, prior)
  return true
}

const ANALYZE_PROMPT = `You are analyzing a photograph of a patient's medication list.
1. Extract every medication you can identify.
2. Identify clinically significant drug-drug interactions.
3. List key side effects per medication (up to 3 common, up to 2 serious).

Return VALID JSON only. No markdown code fences. No commentary before or after.
Schema:
{
  "drugs": [{"name": "generic name", "dose": "e.g. 5 mg", "frequency": "e.g. daily / BID / q8h"}],
  "interactions": [{"pair": ["drug1", "drug2"], "severity": "major" | "moderate" | "minor", "mechanism": "brief", "management": "brief action"}],
  "sideEffects": [{"drug": "generic name", "common": ["up to 3"], "serious": ["up to 2"]}]
}

Rules:
- Prefer generic names.
- Only include clinically significant interactions (skip trivial like ibuprofen+acetaminophen).
- Order interactions most-to-least severe.
- Omit fields whose value is unclear rather than guess.
- If no medication list is visible in the image, return {"drugs": [], "interactions": [], "sideEffects": []}.`

interface AnalyzeBody {
  image?: unknown
}

async function handleAnalyzeMeds(request: Request, env: Env): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return json(
      {
        error:
          "vision service not configured — ANTHROPIC_API_KEY secret is missing on this Worker",
      },
      500,
    )
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown"
  if (!checkAnalyzeRateLimit(ip)) {
    return json({ error: "rate limited (10/hour). Try again later." }, 429)
  }

  let body: AnalyzeBody
  try {
    body = (await request.json()) as AnalyzeBody
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const raw = typeof body.image === "string" ? body.image : ""
  if (!raw) return json({ error: "missing 'image' field (base64 string)" }, 400)

  // Parse data URL to extract media type + base64 payload.
  const match = raw.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
  const mediaType = match ? match[1] : "image/jpeg"
  const b64 = match ? match[2] : raw
  if (b64.length > ANALYZE_MAX_BASE64_LEN) {
    return json({ error: "image too large (max ~5 MB after resize)" }, 413)
  }

  let modelOut: string
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: b64 },
              },
              { type: "text", text: ANALYZE_PROMPT },
            ],
          },
        ],
      }),
    })
    if (!resp.ok) {
      const errText = await resp.text()
      return json(
        {
          error: "anthropic api error",
          status: resp.status,
          detail: errText.slice(0, 800),
        },
        502,
      )
    }
    const data = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    modelOut =
      (data.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("")
        .trim()
  } catch (e) {
    return json({ error: "vision call failed", detail: (e as Error).message }, 502)
  }

  const parsed = extractJson(modelOut)
  if (!parsed) {
    return json(
      { error: "model returned unparseable output", raw: modelOut.slice(0, 800) },
      502,
    )
  }
  return json(parsed)
}

// LLMs occasionally wrap JSON in ``` fences or emit prose before/after.
// Strip fences, then fall back to grabbing the first {...} block.
function extractJson(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }
  return null
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
