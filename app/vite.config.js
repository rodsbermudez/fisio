import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do .env correto (dev/prod)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_URL || '/',
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
  }
})
