// Secrets set via `wrangler secret put NAME` — never stored in wrangler.jsonc
// (which is committed to git). Declared here so the Worker knows the shape.
// The wrangler-generated `worker-configuration.d.ts` only covers bindings.

declare interface Env {
  ANTHROPIC_API_KEY?: string
}
