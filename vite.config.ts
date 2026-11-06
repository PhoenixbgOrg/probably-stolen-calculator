/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path: './' (relative, works at any path) by default. For GitHub Pages project sites set
// VITE_BASE_PATH=/<repo-name>/ (or pass `--base`). CLI --base overrides this.
const base = process.env.VITE_BASE_PATH || './';

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, strictPort: true, host: '127.0.0.1' },
  test: { 
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
