import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( ), tailwindcss()],
  base:
    process.env.NODE_ENV === 'production'
      ? '/explorer/'
      : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['4173-imv9h581avvhjw58wkf9-33be46f2.manusvm.computer', '4173-imv9h581avvhjw58wkf9-33be46f2.manusvm.computer'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: ['4173-imv9h581avvhjw58wkf9-33be46f2.manusvm.computer', '4173-imv9h581avvhjw58wkf9-33be46f2.manusvm.computer'],
  }
})
