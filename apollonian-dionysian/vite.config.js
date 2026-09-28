import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// `vite build --mode artifact` drops the self-hosted fonts; scripts/artifact.mjs then inlines everything into one page.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  resolve: {
    alias: mode === 'artifact' ? { './fonts.js': fileURLToPath(new URL('./src/fonts-empty.js', import.meta.url)) } : {},
  },
  build: mode === 'artifact' ? { outDir: 'dist-artifact', assetsInlineLimit: 100000000 } : {},
}))
