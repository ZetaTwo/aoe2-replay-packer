import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import tournamentsData from './rollup-plugin-tournaments.ts'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [
    vue(),
    VueDevTools(),
    imagetools(),
    tournamentsData(),
    wasm(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/libarchive.js/dist/libarchive.wasm',
          dest: 'assets',
          rename: { stripBase: true }
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        spoilers: resolve(import.meta.dirname, 'spoilers.html')
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('unidecode')) {
              return 'vendor_unidecode'
            }
            return 'vendor'
          }
        }
      }
    }
  },
  base: process.env.BASE_URL || ''
})
