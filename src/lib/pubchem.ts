// PubChem REST client. Free, CORS-enabled, no API key.
// Docs: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest

const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound"

// Normalize a drug name for PubChem lookup: strip route/dose parentheticals,
// keep only the primary substance token.
function normalizeName(name: string): string {
  return (
    name
      // remove things like "(IV)", "(PO)", "(patch)"
      .replace(/\([^)]*\)/g, "")
      // drop trailing brand names in brackets
      .replace(/\[[^\]]*\]/g, "")
      // trim punctuation and whitespace
      .trim()
      .replace(/[.,;]+$/g, "")
  )
}

async function fetchText(url: string, signal?: AbortSignal): Promise<string | null> {
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const text = await res.text()
  return text.trim() ? text : null
}

// Try 3D SDF first, then 2D. Returns null if the compound isn't in PubChem
// or has no computed 3D structure (some large / biologic drugs).
export async function fetchStructureByName(
  name: string,
  signal?: AbortSignal,
): Promise<{ format: "sdf"; data: string; dim: "3d" | "2d" } | null> {
  const normalized = normalizeName(name)
  if (!normalized) return null

  const encoded = encodeURIComponent(normalized)
  const url3d = `${BASE}/name/${encoded}/SDF?record_type=3d`
  const url2d = `${BASE}/name/${encoded}/SDF?record_type=2d`

  try {
    const sdf3d = await fetchText(url3d, signal)
    if (sdf3d) return { format: "sdf", data: sdf3d, dim: "3d" }
    const sdf2d = await fetchText(url2d, signal)
    if (sdf2d) return { format: "sdf", data: sdf2d, dim: "2d" }
    return null
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") throw e
    return null
  }
}
