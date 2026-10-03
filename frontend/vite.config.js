import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // When building for production and serving from the Spring Boot jar,
  // set base to '/' (default).  Adjust if deployed under a subpath.
  base: '/',
  server: {
    port: 5173,
    // Proxy /api/* to the Spring Boot backend during local dev.
    // This avoids CORS issues and ensures API calls reach port 8080.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
