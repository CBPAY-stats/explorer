import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( ), tailwindcss()],
  root: ".", // Define a raiz do projeto para o build como o diretório atual
  base:
    process.env.NODE_ENV === 'production'
      ? '/explorer/'
      : '/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", // Garante que a saída do build vai para a pasta 'dist'
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // Aponta para o index.html na raiz do projeto (que agora é public/)
      },
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
