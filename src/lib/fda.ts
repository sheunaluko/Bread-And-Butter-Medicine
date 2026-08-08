// openFDA drug label API client. Docs: https://open.fda.gov/apis/drug/label/

const BASE = "https://api.fda.gov/drug/label.json"

export interface FdaResult {
  id?: string
  openfda?: {
    generic_name?: string[]
    brand_name?: string[]
    manufacturer_name?: string[]
    route?: string[]
    substance_name?: string[]
    pharm_class_epc?: string[]
    pharm_class_moa?: string[]
  }
  indications_and_usage?: string[]
  clinical_pharmacology?: string[]
  mechanism_of_action?: string[]
  pharmacokinetics?: string[]
  pharmacodynamics?: string[]
  dosage_and_administration?: string[]
  use_in_specific_populations?: string[]
  contraindications?: string[]
  warnings?: string[]
  warnings_and_cautions?: string[]
  boxed_warning?: string[]
  adverse_reactions?: string[]
  drug_interactions?: string[]
  how_supplied?: string[]
}

export async function searchDrug(q: string, signal?: AbortSignal): Promise<FdaResult[]> {
  const term = q.trim()
  if (!term) return []
  const safe = term.replace(/"/g, "").toLowerCase()
  const query = `(openfda.generic_name:"${safe}"+openfda.brand_name:"${safe}"+openfda.substance_name:"${safe}")`
  const url = `${BASE}?search=${query.replace(/\+/g, "+")}&limit=10`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`openFDA ${res.status}`)
  }
  const data = (await res.json()) as { results?: FdaResult[] }
  return data.results ?? []
}

// pull best display name for a result
export function displayName(r: FdaResult): string {
  const b = r.openfda?.brand_name?.[0]
  const g = r.openfda?.generic_name?.[0]
  if (b && g && b.toLowerCase() !== g.toLowerCase()) return `${cap(b)} (${cap(g)})`
  return cap(b ?? g ?? "Unknown")
}

export function primaryClass(r: FdaResult): string | undefined {
  return r.openfda?.pharm_class_epc?.[0] ?? r.openfda?.pharm_class_moa?.[0]
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Try to extract a numeric half-life (in hours) from free-text PK section.
// Returns { hours, source } on best-effort match, else null.
export interface HalfLifeMatch {
  hours: number
  source: string
}
export function extractHalfLifeHours(text: string): HalfLifeMatch | null {
  const T = text.replace(/\s+/g, " ")
  // patterns: "half-life ... X hours" | "elimination half-life of X hr"
  // catch ranges "6-8 hours" and averages "approximately X"
  const re =
    /(?:half[-\s]?life|t\s*1\s*\/\s*2)[^.]{0,80}?(\d+(?:\.\d+)?)(?:\s*(?:-|to|–)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|days?)/i
  const m = T.match(re)
  if (!m) return null
  return toHours(m[1], m[2], m[3], m[0])
}

export interface DurationMatch {
  hours: number
  source: string
}

// "Onset of action ~ X min" / "onset of antihypertensive effect within X hours"
export function extractOnset(text: string): DurationMatch | null {
  const T = text.replace(/\s+/g, " ")
  const re =
    /onset\s+(?:of\s+(?:action|effect|[a-z-]+\s+effect)\s+)?(?:is\s+|occurs?\s+|within\s+|approximately\s+|about\s+|~\s*)?(?:in\s+)?(\d+(?:\.\d+)?)(?:\s*(?:-|to|–)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|days?)/i
  const m = T.match(re)
  if (!m) return null
  return toHours(m[1], m[2], m[3], m[0])
}

// Tmax / time-to-peak plasma concentration
export function extractTmax(text: string): DurationMatch | null {
  const T = text.replace(/\s+/g, " ")
  const re =
    /(?:t\s*max|time\s+to\s+peak\s+(?:plasma\s+)?(?:concentration|drug\s+concentration)|peak\s+(?:plasma\s+)?concentrations?\s+(?:occur|are\s+achieved|reached|were\s+observed))[^.]{0,100}?(\d+(?:\.\d+)?)(?:\s*(?:-|to|–)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)/i
  const m = T.match(re)
  if (!m) return null
  return toHours(m[1], m[2], m[3], m[0])
}

function toHours(
  a: string,
  b: string | undefined,
  unit: string,
  source: string,
): DurationMatch | null {
  const lo = parseFloat(a)
  const hi = b ? parseFloat(b) : lo
  const mid = (lo + hi) / 2
  const u = unit.toLowerCase()
  let hours = mid
  if (u.startsWith("min")) hours = mid / 60
  if (u.startsWith("day")) hours = mid * 24
  if (!isFinite(hours) || hours <= 0 || hours > 24 * 30) return null
  return { hours, source: source.slice(0, 160) }
}

export type Route = "iv" | "po" | "other"

export function detectRoute(r: FdaResult): Route {
  const routes = (r.openfda?.route ?? []).map((x) => x.toLowerCase())
  if (routes.some((x) => /intravenous|iv|injection|parenteral/.test(x))) return "iv"
  if (routes.some((x) => /oral|by mouth|sublingual|buccal/.test(x))) return "po"
  return "other"
}

// Section extractors for renal / hepatic paragraphs from
// use_in_specific_populations. Returns the paragraph if found.
export function extractSection(text: string, keyword: RegExp): string | null {
  const parts = text.split(/\n{2,}|(?<=\.)\s{2,}/g)
  const hits = parts.filter((p) => keyword.test(p))
  if (!hits.length) return null
  return hits.join("\n\n").trim()
}
