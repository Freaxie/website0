import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `vite build` writes the site into ../dist/observer, served at /observer/.
// `vite build --mode single` inlines every asset, for scripts/inline.mjs to fold into one HTML file.
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    plugins: [react()],
    base: single ? './' : '/observer/',
    build: {
      outDir: single ? 'dist-single' : '../dist/observer',
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: single ? Number.MAX_SAFE_INTEGER : 4096,
    },
  }
})
