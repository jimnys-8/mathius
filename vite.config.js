import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BACKGROUND = '#fff8ee'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /<repository>/; the deploy workflow
  // sets BASE_PATH to that. Locally it is served from the root.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    // Installable app that works offline: the service worker keeps every
    // file of the game on the device. A new version is fetched in the
    // background and used from the next time the game is opened.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mathius',
        short_name: 'Mathius',
        description: 'Mattespel för barn, med bilder som hjälper.',
        lang: 'sv',
        display: 'standalone',
        background_color: BACKGROUND,
        theme_color: BACKGROUND,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Latin covers English and Swedish; the other alphabets are never shown.
        globIgnores: ['**/nunito-{cyrillic,cyrillic-ext,vietnamese}-*.woff2'],
      },
    }),
  ],
})
