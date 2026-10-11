/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Stable vendor chunks cache well across deploys; the graph library is split by the lazy route.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          data: ['idb', 'zod', 'minisearch', 'fflate', 'marked', 'dompurify'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
