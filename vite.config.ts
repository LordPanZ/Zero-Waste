import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Zero Waste — Despensa sin desperdicio',
        short_name: 'Zero Waste',
        description:
          'Controla tu despensa, evita que la comida caduque y descubre recetas con lo que tienes antes de que se estropee.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f0fdf4',
        theme_color: '#16a34a',
        orientation: 'portrait',
        lang: 'es',
        categories: ['food', 'lifestyle', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Tesseract.js pulls its worker/wasm/traineddata from a CDN at runtime; cache them
        // so OCR keeps working offline after the first successful scan.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('jsdelivr.net') || url.hostname.endsWith('tessdata.projectnaptha.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-engine-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
