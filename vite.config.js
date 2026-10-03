import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // All source lives under ./frontend; keeps the project root clean.
  root: './frontend',

  server: {
    port: 5173,
    // Proxy /api/* to the Spring Boot backend during local dev.
    // This avoids CORS issues when running without CloudFront.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Output relative to the root (./frontend), so dist ends up at ./frontend/dist
    outDir: 'dist',
  },
})
