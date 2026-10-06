import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// One project, several experiences. Each page is served at /<name>/ and shares src/shared.
//   vite build                         writes ../dist/<name>/index.html for every page
//   PAGE=<name> vite build --mode single   inlines every asset of one page, for scripts/inline.mjs
const PAGES = {
  observer: 'observer/index.html',
  intuition: 'intuition/index.html',
}
const here = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  const page = process.env.PAGE
  if (single && !PAGES[page]) throw new Error(`PAGE must be one of: ${Object.keys(PAGES).join(', ')}`)
  const input = single
    ? { [page]: here(PAGES[page]) }
    : Object.fromEntries(Object.entries(PAGES).map(([k, v]) => [k, here(v)]))
  return {
    plugins: [react()],
    resolve: { alias: { '@shared': here('src/shared') } },
    base: single ? './' : '/',
    build: {
      // dist/ also holds the lobby and the rooms, so only the single-file build may empty its folder
      outDir: single ? `dist-single/${page}` : '../dist',
      emptyOutDir: single,
      assetsDir: 'labs-assets',
      assetsInlineLimit: single ? Number.MAX_SAFE_INTEGER : 4096,
      rollupOptions: { input },
    },
  }
})
