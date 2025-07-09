import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react( ),tailwindcss()],
  base: '/explorer/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['4173-ihgpcs29gz8m4mc3fus1z-68c383e6.manusvm.computer', '4173-ig0l35mn6zkrjhgi9246h-4c198e94.manusvm.computer', 'localhost', '127.0.0.1']
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['4173-ihgpcs29gz8m4mc3fus1z-68c383e6.manusvm.computer', '4173-ig0l35mn6zkrjhgi9246h-4c198e94.manusvm.computer', 'localhost', '127.0.0.1']
  }
})

