import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Painting from '../components/Painting.jsx'
import { ARCHETYPES, ORDERS, byId } from '../lib/archetypes.js'
import { mix, rng } from '../lib/geom.js'
import { LETTERS } from '../lib/letters.js'

// A wax seal: a pooled, uneven disc in the archetype's colour, a ring pressed into it, and its sign
// struck in the middle with a highlight along one edge, the way a seal catches the light.
function Seal({ a }) {
  const edge = useMemo(() => {
    const r = rng(a.no.length * 97 + a.id.length * 13 + a.id.charCodeAt(0))
    const pts = Array.from({ length: 22 }, (_, i) => {
      const t = (i / 22) * Math.PI * 2
      const rad = 46 + (r() - 0.5) * 6 + (i % 5 === 0 ? 3 : 0)
      return [50 + Math.cos(t) * rad, 50 + Math.sin(t) * rad]
    })
    return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z'
  }, [a])
  const dark = mix(a.color, '#000000', 0.42)
  const light = mix(a.color, '#ffffff', 0.38)
  return (
    <svg viewBox="0 0 100 100" className="seal" aria-hidden="true">
      <defs>
        <radialGradient id={`wax-${a.id}`} cx="0.36" cy="0.32" r="0.8">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={a.color} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
      </defs>
      <path d={edge} fill={`url(#wax-${a.id})`} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={dark} strokeWidth="2.2" opacity="0.55" />
      <circle cx="50.8" cy="50.8" r="31" fill="none" stroke={light} strokeWidth="1" opacity="0.45" />
      <g transform="translate(31 31) scale(0.38)">
        <path d={a.glyph} fill="none" stroke={light} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" transform="translate(2 2)" />
        <path d={a.glyph} fill="none" stroke={dark} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

// Room 08: a letter to someone just starting out in each of the ways, from someone who has walked
// it a long time. Choose a seal; the letter opens on the desk.
export default function Letters() {
  const [id, setId] = useState('scientist')
  const [peek, setPeek] = useState(null)
  const a = byId[id]
  const shown = byId[peek || id]
  const L = LETTERS[id]
  const i = ARCHETYPES.indexOf(a)
  const prev = ARCHETYPES[(i + 23) % 24]
  const next = ARCHETYPES[(i + 1) % 24]

  // a link to #letter-<id> anywhere on the page opens that letter
  useEffect(() => {
    const open = () => {
      const m = location.hash.match(/^#letter-([a-z]+)$/)
      if (m && byId[m[1]]) setId(m[1])
    }
    open()
    addEventListener('hashchange', open)
    return () => removeEventListener('hashchange', open)
  }, [])

  return (
    <section id="letters" className="let">
      <SectionHead no="08" title="Letters" kicker="Twenty-four letters to someone just starting out in each of the ways, from someone who has walked it a long time. Choose a seal." />

      <div className="let__desk">
        <nav className="let__tray" aria-label="Choose a letter">
          {ORDERS.map((o) => (
            <div key={o.id} className="let__order">
              <span className="let__oname mono">{o.name}</span>
              <div className="let__seals">
                {o.ids.map((sid) => {
                  const s = byId[sid]
                  return (
                    <a
                      key={sid}
                      id={`letter-${sid}`}
                      href={`#letter-${sid}`}
                      className={`let__seal ${sid === id ? 'is-on' : ''}`}
                      aria-current={sid === id ? 'true' : undefined}
                      aria-label={`Letter ${s.no}: to a young ${s.name.toLowerCase()}`}
                      onPointerEnter={() => setPeek(sid)}
                      onPointerLeave={() => setPeek(null)}
                      onFocus={() => setPeek(sid)}
                      onBlur={() => setPeek(null)}
                      onClick={(e) => {
                        e.preventDefault()
                        setId(sid)
                        history.replaceState(null, '', `#letter-${sid}`)
                      }}
                    >
                      <Seal a={s} />
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="let__peek" aria-hidden="true">
            <span className="mono">Letter {shown.no}</span>
            <em>To a young {shown.name.toLowerCase()}</em>
            <span className="let__verb">To {shown.verb} reality</span>
          </p>
        </nav>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={id}
            className="let__sheet"
            aria-label={`A letter to a young ${a.name.toLowerCase()}`}
            initial={{ opacity: 0, y: 26, rotate: -1.2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -14, rotate: 0.5 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ '--l-acc': a.ink || a.color }}
          >
            <header className="let__head">
              <p className="mono">
                Letter {a.no} of XXIV · to a young {a.name.toLowerCase()}
              </p>
              <p className="let__place">{L.place}</p>
            </header>
            <figure className="let__enc">
              <Painting a={a} compact />
            </figure>
            <p className="let__dear">{L.dear}</p>
            <div className="let__body">
              {L.body.map((p, k) => (
                <p key={k}>{p}</p>
              ))}
            </div>
            <p className="let__close">{L.close}</p>
            <p className="let__sign">{L.sign}</p>
            {L.ps && (
              <p className="let__ps">
                <span>P.S.</span> {L.ps}
              </p>
            )}
            <footer className="let__turn">
              <button type="button" onClick={() => setId(prev.id)}>
                <span className="mono">Letter {prev.no}</span>← To a young {prev.name.toLowerCase()}
              </button>
              <a href={`#plate-${id}`}>
                <span className="mono">Plate {a.no}</span>The {a.name.toLowerCase()}’s entry
              </a>
              <button type="button" onClick={() => setId(next.id)}>
                <span className="mono">Letter {next.no}</span>To a young {next.name.toLowerCase()} →
              </button>
            </footer>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  )
}
