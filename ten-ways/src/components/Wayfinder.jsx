import { useEffect, useMemo, useRef, useState } from 'react'
import { ARCHETYPES, byId, ink } from '../lib/archetypes.js'
import { ENTRIES } from '../lib/encyclopedia.js'
import { LETTERS } from '../lib/letters.js'
import { flushAll, slug } from './Entry.jsx'

const KEY = 'xxiv-place'
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}
const write = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* private windows have nowhere to keep it; the page works without */
  }
}

// Everything there is to read, as searchable passages: each knows its archetype, where it lives, and
// the anchor that takes you there.
function build() {
  const docs = []
  const add = (id, where, href, text) => text && docs.push({ id, where, href, text, low: text.toLowerCase() })
  for (const a of ARCHETYPES) {
    const e = ENTRIES[a.id]
    const sec = (name, text) => add(a.id, name, `#s-${a.id}-${slug(name)}`, text)
    add(a.id, 'Plate', `#plate-${a.id}`, `${a.name}. To ${a.verb} reality. ${a.question} ${a.gift} ${a.shadow} ${a.exemplars.join(', ')}. ${a.quote[0]} ${a.quote[1]}`)
    sec('Overview', `${e.def} ${e.etym} ${e.overview.join(' ')}`)
    e.history.forEach((p) => sec('History', p))
    if (e.scene) e.scene.text.forEach((p) => sec('A scene', `${e.scene.title}. ${p}`))
    e.distinctions.forEach(([t, x]) => sec('Distinctions', `${t}: ${x}`))
    ;(e.myths || []).forEach(([m, f]) => sec('Myths and facts', `Myth: ${m} In fact: ${f}`))
    ;(e.curiosities || []).forEach((c) => sec('Curiosities', c))
    ;(e.day || []).forEach(([t, x]) => sec('A day in the life', `${t}. ${x}`))
    sec('Criticism', e.critique)
    sec('Now', e.now)
    const margin = `#plate-${a.id}`
    add(a.id, 'In myth', margin, e.figure)
    e.lineage.forEach(([, label, text]) => add(a.id, 'Lineage', margin, `${label}: ${text}`))
    e.figures.forEach(([n, d, l]) => add(a.id, 'Figures', margin, `${n} (${d}). ${l}`))
    e.lexicon.forEach(([w, d]) => add(a.id, 'Terms', margin, `${w}: ${d}`))
    e.reading.forEach(([t, by]) => add(a.id, 'Further reading', margin, `${t}, ${by}`))
    ;(e.field || []).forEach(([k, v]) => add(a.id, 'Field guide', margin, `${k}: ${v}`))
    const L = LETTERS[a.id]
    if (L) [...L.body, L.ps].forEach((p) => add(a.id, 'Letter', `#letter-${a.id}`, p))
  }
  return docs
}

function snippet(d, q) {
  const i = d.low.indexOf(q)
  const from = Math.max(0, d.text.lastIndexOf(' ', Math.max(0, i - 60)))
  const to = Math.min(d.text.length, i + q.length + 90)
  return [(from > 0 ? '…' : '') + d.text.slice(from, i).trimStart(), d.text.slice(i, i + q.length), d.text.slice(i + q.length, to) + (to < d.text.length ? '…' : '')]
}

// Search, and a marker that remembers where you stopped reading.
export default function Wayfinder() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [resume, setResume] = useState(null)
  const input = useRef(null)
  const docs = useMemo(() => (open ? build() : []), [open])
  const term = q.trim().toLowerCase()
  const hits = useMemo(() => (term.length < 2 ? [] : docs.filter((d) => d.low.includes(term))), [docs, term])

  // remember the plate or room in the middle of the window, and how far into it
  useEffect(() => {
    const saved = read()
    if (saved && saved.id !== 'entrance' && !location.hash && document.getElementById(saved.id)) setResume(saved)
    let t
    const note = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('[id^="plate-"], main > section[id]')
        if (!el) return
        const a = byId[el.id.replace('plate-', '')]
        const label = a ? `The ${a.name}` : el.querySelector('.shead__title')?.textContent || 'the exhibition'
        write({ id: el.id, off: Math.round(scrollY - (el.getBoundingClientRect().top + scrollY)), label })
        if (scrollY > innerHeight) setResume(null)
      }, 600)
    }
    addEventListener('scroll', note, { passive: true })
    return () => {
      removeEventListener('scroll', note)
      clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const key = (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName)
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape') setOpen(false)
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const was = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = was
    }
  }, [open])

  return (
    <>
      <button type="button" className="find-btn mono" onClick={() => setOpen(true)} aria-label="Search the exhibition">
        Search
      </button>

      {resume && (
        <p className="resume">
          <button
            type="button"
            className="resume__go"
            onClick={() => {
              // mount every entry first, so the place is where it was; then go to the very line
              flushAll()
              const el = document.getElementById(resume.id)
              scrollTo({ top: el.getBoundingClientRect().top + scrollY + Math.max(0, resume.off), behavior: 'instant' })
              setResume(null)
            }}
          >
            <span className="mono">Continue where you left off</span>
            <em>{resume.label} →</em>
          </button>
          <button type="button" className="mono" onClick={() => setResume(null)} aria-label="Dismiss">
            ×
          </button>
        </p>
      )}

      {open && (
        <div className="find" role="dialog" aria-modal="true" aria-label="Search" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="find__panel">
            <div className="find__bar">
              <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the entries, the days and the letters" aria-label="Search" />
              <button type="button" className="mono" onClick={() => setOpen(false)}>
                Close ×
              </button>
            </div>
            <p className="find__count mono" aria-live="polite">
              {term.length < 2 ? 'Try a name, a year, a word: Galileo, 1859, hemlock, sunscreen' : `${hits.length} ${hits.length === 1 ? 'passage' : 'passages'}`}
            </p>
            <ol className="find__hits">
              {hits.slice(0, 60).map((d, i) => {
                const a = byId[d.id]
                const [pre, hit, post] = snippet(d, term)
                return (
                  <li key={i}>
                    <a href={d.href} onClick={() => setOpen(false)}>
                      <span className="find__where mono">
                        <i style={{ background: a.color }} />
                        <b style={{ color: ink(a) }}>{a.name}</b> · {d.where}
                      </span>
                      <span className="find__text">
                        {pre}
                        <mark>{hit}</mark>
                        {post}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
            {hits.length > 60 && <p className="find__count mono">Showing the first 60. Add a word to narrow it.</p>}
          </div>
        </div>
      )}
    </>
  )
}
