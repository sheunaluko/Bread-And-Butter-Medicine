import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
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
  plugins: [
    react(),
    tailwindcss(),
    devFeedbackStub(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'bread & butter medicine',
        short_name: 'bread & butter',
        description: 'Personal hospitalist toolkit — antibiotic spectrum, FDA drug lookup, opioid/steroid conversion, AC reversal.',
        theme_color: '#0d0e14',
        background_color: '#0d0e14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Bump precache size limit to accommodate the 3dmol chunk (~580KB).
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        // Never intercept /api/* — those are Worker routes that MUST hit the origin.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // openFDA drug labels: stale-while-revalidate keeps searches instant
            // on repeat and refreshes in the background.
            urlPattern: ({ url }: { url: URL }) => url.hostname === 'api.fda.gov',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'openfda',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // PubChem SDF structures: cache-first, structures don't change.
            urlPattern: ({ url }: { url: URL }) => url.hostname === 'pubchem.ncbi.nlm.nih.gov',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pubchem',
              expiration: { maxEntries: 300, maxAgeSeconds: 180 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // don't run SW in dev — annoying to debug
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
