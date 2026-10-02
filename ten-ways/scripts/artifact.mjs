// Builds a single self-contained page for hosting as a claude.ai Artifact: artifact/index.html.
// Inlines the bundle's CSS and JS, and loads the fonts from Google Fonts (the only font host artifacts allow).
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const at = (p) => new URL(`../${p}`, import.meta.url)
execSync('npx vite build --mode artifact', { cwd: at(''), stdio: 'inherit' })

const html = readFileSync(at('dist-artifact/index.html'), 'utf8')
const asset = (href) => readFileSync(at(`dist-artifact/${href.replace(/^\.\//, '')}`), 'utf8')
const css = [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => asset(m[1])).join('\n')
const js = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"/g)].map((m) => asset(m[1])).join('\n')
if (/<\/script/i.test(js)) throw new Error('bundle contains a closing script tag')

const page = `<title>Ten Ways of Encountering Reality</title>
<meta name="description" content="An interactive atlas of ten archetypal ways of encountering reality: scientist, engineer, warrior, artist, philosopher, explorer, monk, sovereign, hedonist and trickster.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
mkdirSync(at('artifact'), { recursive: true })
writeFileSync(at('artifact/index.html'), page)
console.log(`artifact/index.html: ${(page.length / 1024).toFixed(0)} KB`)
