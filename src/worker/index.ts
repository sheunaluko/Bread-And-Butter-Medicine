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
// /api/analyze-meds — vision LLM extracts a med list from a photo, then
// returns interactions + side effects. Nothing is stored (patient med lists
// are sensitive); image is passed to Workers AI and discarded.
// -----------------------------------------------------------------------------

// ~5MB raw = ~7MB base64. Client is expected to resize before upload but we
// enforce a ceiling as defense-in-depth (Workers request body limit is 100MB
// on paid plans but we don't want to feed huge images to the vision model).
const ANALYZE_MAX_BASE64_LEN = 7_000_000

// Simple in-memory rate limit per Worker isolate. Not perfectly enforced
// across the CF edge (different isolates have separate maps) but adequate
// for personal-scale abuse deterrence. Workers AI account quota is the real
// backstop.
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

  const b64 = raw.replace(/^data:image\/[^;]+;base64,/, "")
  if (b64.length > ANALYZE_MAX_BASE64_LEN) {
    return json({ error: "image too large (max ~5 MB after resize)" }, 413)
  }

  // Decode base64 → byte array for the vision model.
  let bytes: Uint8Array
  try {
    const binary = atob(b64)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  } catch {
    return json({ error: "invalid base64 image" }, 400)
  }

  let modelOut: string
  try {
    // Workers AI vision model. Returns { response: string } for llama vision.
    const result = (await env.AI.run(
      "@cf/meta/llama-3.2-11b-vision-instruct" as never,
      {
        image: [...bytes],
        prompt: ANALYZE_PROMPT,
        max_tokens: 2500,
        temperature: 0.2,
      } as never,
    )) as { response?: string; description?: string }
    modelOut = result.response ?? result.description ?? ""
  } catch (e) {
    return json({ error: "vision model failed", detail: (e as Error).message }, 502)
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
