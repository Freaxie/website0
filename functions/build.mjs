// Assembles The Cognitive Functions into dist/functions/ as a static sub-site (runs after `vite build`):
//   dist/functions/index.html      the lobby (served at /functions/)
//   dist/functions/hub.html        the lobby as a page fragment, for hosting as a claude.ai Artifact
//   dist/functions/<pair>.html     each exhibition, byte-for-byte, plus one inline <script> for navigation
// The four exhibitions in functions/exhibitions/ are never modified; they are compiled single-file builds.
// Every link inside the lobby and the rooms is relative, so the sub-folder needs no rewriting.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const at = (p) => new URL(p, import.meta.url)
const out = (p) => new URL(`../dist/functions/${p}`, import.meta.url)
const read = (p) => readFileSync(at(p), 'utf8')

const pairs = JSON.parse(read('pairs.json'))
const pairsJs = JSON.stringify(pairs)
mkdirSync(out(''), { recursive: true })

const hub = read('hub.html').replaceAll('__PAIRS__', pairsJs)
writeFileSync(out('hub.html'), hub)
writeFileSync(
  out('index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="An interactive exhibition in four rooms on the eight cognitive functions." />
<meta name="theme-color" content="#eeede8" />
</head>
<body>
${hub}
</body>
</html>
`,
)

const nav = read('exhibit-nav.js').replaceAll('__PAIRS__', pairsJs)
if (/<\/script/i.test(nav)) throw new Error('exhibit-nav.js must not contain a closing script tag')

for (const { key } of pairs) {
  const html = read(`exhibitions/${key}.html`)
  // the first tag after <head>: the nav script runs before any of the exhibition's own markup
  const anchor = html.match(/<head>(<meta charset=[^>]*>)?/i)
  if (!anchor) throw new Error(`${key}: no <head> to attach navigation to`)
  const at_ = anchor.index + anchor[0].length
  const page = html.slice(0, at_) + `<script data-cf-pair="${key}">${nav}</script>` + html.slice(at_)
  writeFileSync(out(`${key}.html`), page)
}

console.log(`built lobby + ${pairs.length} exhibitions into dist/functions/`)
