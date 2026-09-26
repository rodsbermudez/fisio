import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [
    react({
      fastRefresh: false, // Desabilita React Refresh para evitar loop via proxy Apache
    }),
  ],
  server: {
    port: 5173,
    host: '127.0.0.1',
    hmr: false, // Desabilita Hot Module Replacement
  },
  build: {
    outDir: 'dist',
  },
})
