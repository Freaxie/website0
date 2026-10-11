// Turns dist-artifact/index.html (one self-contained file from `vite build --mode artifact`) into a page
// fragment for a claude.ai Artifact: the viewer supplies the document skeleton, fonts come from Google Fonts.
// The head is kept as one block (the bundled JS contains literal "<style"/"<script" strings, so it must not
// be picked apart); only the charset/viewport metas, which the skeleton provides, are dropped.
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync(new URL('../dist-artifact/index.html', import.meta.url), 'utf8')
const headStart = src.indexOf('<head>') + '<head>'.length
const headEnd = src.lastIndexOf('</head>')
const bodyStart = src.indexOf('<body>', headEnd) + '<body>'.length
const bodyEnd = src.lastIndexOf('</body>')
let head = src.slice(headStart, headEnd)
const body = src.slice(bodyStart, bodyEnd).trim()

// Drop the skeleton-provided metas and the favicon (the artifact has its own icon); name it for the gallery.
head = head
  .replace(/<meta charset="utf-8" \/>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<link rel="icon"[^>]*>\s*/i, '')
  .replace(/<title>[^<]*<\/title>/i, '')
const fonts =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap" />'
const out = `<title>Krish's Atlas</title>\n${fonts}\n${head.trim()}\n${body}\n`
writeFileSync(new URL('../dist-artifact/atlas.html', import.meta.url), out)
console.log(`dist-artifact/atlas.html: ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`)
