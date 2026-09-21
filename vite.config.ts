import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@compiler': fileURLToPath(new URL('./src/compiler', import.meta.url)),
      '@visualization': fileURLToPath(new URL('./src/visualization', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@fixtures': fileURLToPath(new URL('./tests/fixtures', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
