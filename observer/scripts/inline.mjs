// Folds the `vite build --mode single` output into one self-contained HTML file
// (dist-single/observer.html), e.g. for hosting the experience as a single page.
import { readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../dist-single/', import.meta.url)
let html = readFileSync(new URL('index.html', dir), 'utf8')

html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_, src) => {
  const js = readFileSync(new URL(src, dir), 'utf8').replaceAll('</script', '<\\/script')
  return `<script type="module">${js}</script>`
})
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g, (_, href) => {
  return `<style>${readFileSync(new URL(href, dir), 'utf8')}</style>`
})
if (/(src|href)="\.\/assets\//.test(html)) throw new Error('an asset was left un-inlined')

writeFileSync(new URL('observer.html', dir), html)
console.log(`dist-single/observer.html (${(html.length / 1024).toFixed(0)} KB)`)
