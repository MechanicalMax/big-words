import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    cloudflare(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['BigWordsLogo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Big Words',
        short_name: 'Big Words',
        description: 'Display text as large as possible on screen',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'any',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
      },
    }),
  ],
});