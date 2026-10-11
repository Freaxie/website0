/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  // `vite build --mode artifact` makes one self-contained HTML file (hash routes, Google Fonts) for
  // previewing as a claude.ai Artifact. The normal build below is unaffected.
  if (mode === 'artifact')
    return {
      plugins: [react(), viteSingleFile()],
      define: { 'import.meta.env.VITE_ROUTER': JSON.stringify('hash') },
      resolve: { alias: [{ find: /^\.\/fonts$/, replacement: fileURLToPath(new URL('./src/fonts.artifact.ts', import.meta.url)) }] },
      build: { outDir: 'dist-artifact', target: 'es2022' },
    }
  return {
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
  }
})
