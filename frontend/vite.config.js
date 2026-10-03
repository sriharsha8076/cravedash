import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // When building for production and serving from the Spring Boot jar,
  // set base to '/' (default).  Adjust if deployed under a subpath.
  base: '/',
});
