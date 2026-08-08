import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite doesn't know about the Cloudflare Worker, so in `npm run dev`
// POSTs to /api/feedback would 404. This dev-only middleware accepts
// the submission and logs it to the terminal — makes local testing sane
// without needing `wrangler dev`.
function devFeedbackStub(): Plugin {
  return {
    name: 'dev-feedback-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/feedback', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('method')
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          server.config.logger.info(
            `\n\x1b[36m[feedback:dev]\x1b[0m ${JSON.stringify(data)}`,
          )
          res.statusCode = 201
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true, dev: true }))
        } catch {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'invalid json' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devFeedbackStub()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
