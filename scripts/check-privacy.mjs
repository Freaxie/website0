// Fails the build if private content could ship in the public bundle.
//
// 1. No file in dist/ may be a private seed file.
// 2. If a private import file exists locally (private/*.private.json, never committed), every
//    distinctive string from its private records is searched for in the built JS/HTML/CSS.
//    This script deliberately contains no sensitive words itself: the repository is public.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

if (!existsSync(dist)) {
  console.error('check-privacy: dist/ not found; run the build first')
  process.exit(1)
}
// The exhibition sub-site is copied verbatim and contains no personal data.
const files = walk(dist).filter((f) => !f.includes(`${join('dist', 'functions')}`))
const problems = []

for (const f of files) if (/private/i.test(f.slice(dist.length))) problems.push(`private-looking file in dist: ${f}`)

const privDir = join(root, 'private')
const privFiles = existsSync(privDir) ? readdirSync(privDir).filter((f) => f.endsWith('.private.json')) : []
let checked = 0
if (privFiles.length) {
  const needles = new Set()
  for (const pf of privFiles) {
    const data = JSON.parse(readFileSync(join(privDir, pf), 'utf8'))
    for (const r of data.records ?? []) {
      if (!r.private) continue
      needles.add(r.id)
      if (r.title && r.title.length >= 14) needles.add(r.title)
      for (const sentence of String(r.body ?? '').split(/(?<=[.!?])\s+|\n+/)) {
        const s = sentence.replace(/[*_`>#-]/g, '').trim()
        if (s.length >= 30) needles.add(s.slice(0, 60))
      }
    }
  }
  const text = files.filter((f) => /\.(js|html|css|json|txt|map)$/.test(f)).map((f) => [f, readFileSync(f, 'utf8')])
  for (const n of needles) {
    checked++
    for (const [f, t] of text) if (t.includes(n)) problems.push(`private text found in ${f.slice(root.length)}: “${n.slice(0, 40)}…”`)
  }
}

if (problems.length) {
  console.error('check-privacy: FAILED\n' + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log(
  privFiles.length
    ? `check-privacy: ok (${files.length} files, ${checked} private strings checked, none found)`
    : `check-privacy: ok (${files.length} files; no local private file to cross-check)`,
)
