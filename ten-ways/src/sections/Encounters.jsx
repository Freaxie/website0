import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Glyph from '../components/Glyph.jsx'
import { ARCHETYPES, THINGS } from '../lib/archetypes.js'

const INKS = ['#ffd23f', '#0c0c0c', '#ffb3d6', '#1f4fd8', '#f7f5f0']

// Ten ways of drawing the same thing. Each gets the silhouette, its clip, and the archetype's colours.
function Treatment({ a, t }) {
  const clip = `url(#enc-clip-${t.id})`
  const [px, py] = t.peak
  const [cx, cy] = t.centre
  const fg = a.fg
  switch (a.id) {
    case 'scientist':
      return (
        <g>
          <g clipPath={clip}>
            {Array.from({ length: 30 }, (_, i) => (
              <line key={i} x1="0" x2="600" y1={i * 14} y2={i * 14} stroke={fg} strokeWidth="1" opacity="0.6" />
            ))}
          </g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i}>
              <line x1="18" x2={i % 2 ? 26 : 34} y1={400 - i * 45} y2={400 - i * 45} stroke={fg} strokeWidth="1.5" />
              {i % 2 === 0 && (
                <text x="40" y={404 - i * 45} className="enc__tiny" fill={fg}>
                  {i * 45}
                </text>
              )}
            </g>
          ))}
          <circle cx={px} cy={py} r="12" fill="none" stroke={fg} strokeWidth="1.5" />
          <line x1={px - 22} x2={px + 22} y1={py} y2={py} stroke={fg} />
          <line x1={px} x2={px} y1={py - 22} y2={py + 22} stroke={fg} />
          <text x={px + 18} y={py - 16} className="enc__tiny" fill={fg}>
            x {px} · y {400 - py} · n = 1
          </text>
        </g>
      )
    case 'engineer':
      return (
        <g>
          {Array.from({ length: 25 }, (_, i) => (
            <line key={`v${i}`} x1={i * 25} x2={i * 25} y1="0" y2="400" stroke={fg} opacity="0.14" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`h${i}`} y1={i * 25} y2={i * 25} x1="0" x2="600" stroke={fg} opacity="0.14" />
          ))}
          <circle cx={px} cy={py} r="90" fill="none" stroke={fg} strokeDasharray="4 6" />
          <circle cx={px} cy={py} r="160" fill="none" stroke={fg} strokeDasharray="4 6" opacity="0.6" />
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" strokeDasharray="10 5" />
          <g clipPath={clip}>
            <rect x="0" y={cy - 14} width="600" height="28" fill="none" stroke={fg} strokeWidth="2" />
            {Array.from({ length: 24 }, (_, i) => (
              <line key={i} x1={i * 25} x2={i * 25 + 14} y1={cy + 14} y2={cy - 14} stroke={fg} />
            ))}
          </g>
          <path d="M20 385H580M20 378V392M580 378V392" stroke={fg} strokeWidth="1.5" />
          <text x="300" y="376" textAnchor="middle" className="enc__tiny" fill={fg}>
            600
          </text>
        </g>
      )
    case 'warrior':
      return (
        <g>
          <path d={t.path} fill={fg} />
          <path d={`M30 392L${px * 0.35} 330L${px * 0.55} 352L${px * 0.75} ${py + 120}L${px * 0.9} ${py + 70}L${px} ${py}`} fill="none" stroke={a.color} strokeWidth="5" strokeLinejoin="round" />
          <line x1={px} x2={px} y1={py} y2={py - 70} stroke={fg} strokeWidth="4" />
          <path d={`M${px} ${py - 70}L${px + 52} ${py - 56}L${px} ${py - 42}Z`} fill={fg} />
        </g>
      )
    case 'artist':
      return (
        <g>
          <g clipPath={clip}>
            {Array.from({ length: 16 }, (_, i) => (
              <rect key={i} x={-300 + i * 70} y="-100" width="70" height="700" fill={INKS[i % INKS.length]} transform="rotate(28 300 200)" />
            ))}
          </g>
          {[-8, 0, 8].map((d) => (
            <path key={d} d={t.path} fill="none" stroke={fg} strokeWidth="2" transform={`translate(${d} ${-d / 2})`} />
          ))}
        </g>
      )
    case 'philosopher':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
          <text x={cx} y={cy + 70} textAnchor="middle" className="enc__q" fill={fg}>
            ?
          </text>
          <text x={px + 16} y={py - 12} className="enc__say" fill={fg}>
            is it, though?
          </text>
        </g>
      )
    case 'explorer':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1.5" opacity="0.6" />
          <path d={`M20 380C80 330 40 290 120 300S200 360 250 300S${px - 40} ${py + 80} ${px} ${py}S${px + 120} ${py + 40} 560 ${py + 30}`} fill="none" stroke={fg} strokeWidth="3" strokeDasharray="1 9" strokeLinecap="round" />
          {[[120, 300], [250, 300], [px, py]].map(([x, y], i) => (
            <path key={i} d={`M${x - 8} ${y - 8}L${x + 8} ${y + 8}M${x + 8} ${y - 8}L${x - 8} ${y + 8}`} stroke={fg} strokeWidth="3" />
          ))}
          <g transform="translate(520 30) scale(0.6)">
            <path d={a.glyph} fill="none" stroke={fg} strokeWidth="4" />
          </g>
        </g>
      )
    case 'monk':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1.5" opacity="0.25" />
          <g transform={`translate(${cx - 120} ${cy - 210}) scale(2.4)`}>
            <path d={a.glyph} fill="none" stroke={fg} strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>
      )
    case 'sovereign':
      return (
        <g>
          <path d={t.path} fill={fg} opacity="0.18" />
          <g clipPath={clip}>
            {[150, 300, 450].map((x) => (
              <line key={x} x1={x} x2={x + 30} y1="0" y2="400" stroke={fg} strokeWidth="2.5" strokeDasharray="10 6" />
            ))}
          </g>
          {['I', 'II', 'III', 'IV'].map((n, i) => (
            <text key={n} x={75 + i * 150 + 15} y="380" textAnchor="middle" className="enc__roman" fill={fg}>
              {n}
            </text>
          ))}
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" />
          <line x1={px} x2={px} y1={py} y2={py - 80} stroke={fg} strokeWidth="3" />
          <rect x={px} y={py - 80} width="46" height="30" fill={fg} />
        </g>
      )
    case 'hedonist':
      return (
        <g>
          <circle cx="470" cy="120" r="70" fill="#ffd23f" />
          {['#fff1e6', '#ffb3a7', '#e8432e'].map((c, i) => (
            <path key={c} d={t.path} fill={c} transform={`translate(0 ${i * 26})`} />
          ))}
        </g>
      )
    default:
      // trickster
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />
          <g transform="translate(0 400) scale(1 -1)">
            <path d={t.path} fill="#1f4fd8" transform="translate(14 0)" opacity="0.8" />
            <path d={t.path} fill={fg} />
          </g>
          {[90, 170, 260].map((y, i) => (
            <rect key={y} x={i % 2 ? 40 : -30} y={y} width="600" height="10" fill={a.color} />
          ))}
        </g>
      )
  }
}

export default function Encounters() {
  const ref = useRef(null)
  const visible = useInView(ref, { amount: 0.4 })
  const [thing, setThing] = useState(THINGS[0].id)
  const [who, setWho] = useState(0)
  const [held, setHeld] = useState(false)
  const t = THINGS.find((x) => x.id === thing)
  const a = ARCHETYPES[who]

  useEffect(() => {
    if (!visible || held) return
    const id = setInterval(() => setWho((i) => (i + 1) % ARCHETYPES.length), 2600)
    return () => clearInterval(id)
  }, [visible, held])

  return (
    <section id="encounters" className="enc" ref={ref}>
      <div className="enc__top">
        <SectionHead no="04" title="One World, Ten Encounters" kicker="The same thing, met ten ways. Choose a thing, then an archetype, and watch it redraw what it sees." />
        <div className="enc__things" role="radiogroup" aria-label="What is encountered">
          {THINGS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={thing === x.id} className={thing === x.id ? 'is-on' : ''} onClick={() => setThing(x.id)}>
              <svg viewBox="0 0 600 400" aria-hidden="true">
                <path d={x.path} />
              </svg>
              <span>{x.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="enc__body">
        <div className="enc__stage" style={{ background: a.color }}>
          <svg viewBox="0 0 600 400" role="img" aria-label={`${t.name}, as the ${a.name.toLowerCase()} sees it`}>
            <defs>
              {THINGS.map((x) => (
                <clipPath key={x.id} id={`enc-clip-${x.id}`}>
                  <path d={x.path} />
                </clipPath>
              ))}
            </defs>
            <AnimatePresence mode="wait">
              <motion.g key={`${a.id}-${t.id}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.45 }}>
                <Treatment a={a} t={t} />
              </motion.g>
            </AnimatePresence>
          </svg>
          <div className="enc__caption" style={{ color: a.fg }}>
            <span className="mono">
              {t.name} · as the {a.name.toLowerCase()} sees it
            </span>
            <AnimatePresence mode="wait">
              <motion.p key={`${a.id}-${t.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                The {a.name.toLowerCase()} {t.lines[a.id].charAt(0).toLowerCase() + t.lines[a.id].slice(1)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <ol className="enc__who" onPointerLeave={() => setHeld(false)}>
          {ARCHETYPES.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                className={i === who ? 'is-on' : ''}
                style={{ '--c': x.color, '--fg': x.fg }}
                onPointerEnter={() => {
                  setHeld(true)
                  setWho(i)
                }}
                onClick={() => {
                  setHeld(true)
                  setWho(i)
                }}
                aria-pressed={i === who}
              >
                <span className="enc__sign">
                  <Glyph d={x.glyph} width={7} />
                </span>
                {x.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
