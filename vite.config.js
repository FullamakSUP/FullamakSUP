import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin"

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // 👇 Tambah ini untuk PostCSS
  css: {
    postcss: './postcss.config.js',
  }
})