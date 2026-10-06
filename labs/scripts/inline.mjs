// Folds one page's `vite build --mode single` output into a single self-contained HTML file:
//   PAGE=observer npm run build:single   →   dist-single/observer.html
import { readFileSync, writeFileSync } from 'node:fs'

const page = process.env.PAGE
const root = new URL(`../dist-single/${page}/`, import.meta.url)
const htmlUrl = new URL(`${page}/index.html`, root)
let html = readFileSync(htmlUrl, 'utf8')

html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  const js = readFileSync(new URL(src, htmlUrl), 'utf8').replaceAll('</script', '<\\/script')
  return `<script type="module">${js}</script>`
})
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => {
  return `<style>${readFileSync(new URL(href, htmlUrl), 'utf8')}</style>`
})
if (/(src|href)="\.\.?\/labs-assets\//.test(html)) throw new Error('an asset was left un-inlined')

const out = new URL(`../dist-single/${page}.html`, import.meta.url)
writeFileSync(out, html)
console.log(`dist-single/${page}.html (${(html.length / 1024).toFixed(0)} KB)`)
