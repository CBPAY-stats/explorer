import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react( ),tailwindcss()],
  base: '/explorer/', // <-- LINHA ALTERADA
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: 'all'
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['4173-ig0l35mn6zkrjhgi9246h-4c198e94.manusvm.computer', 'localhost', '127.0.0.1']
  }
})
