import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Glyph from '../components/Glyph.jsx'
import { ARCHETYPES, THINGS } from '../lib/archetypes.js'
import { bus } from '../lib/bus.js'

const INKS = ['#ffd23f', '#0c0c0c', '#ffb3d6', '#1f4fd8', '#f7f5f0']

// Twenty-four ways of drawing the same thing. Each gets the silhouette, its clip, and the archetype's colours.
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
    case 'cinephile':
      return (
        <g>
          <path d={t.path} fill={fg} opacity="0.85" />
          <rect x="0" y="0" width="600" height="58" fill="#000" />
          <rect x="0" y="342" width="600" height="58" fill="#000" />
          {[200, 400].map((x) => (
            <line key={x} x1={x} x2={x} y1="58" y2="342" stroke={fg} strokeWidth="1" opacity="0.5" />
          ))}
          {[152, 248].map((y) => (
            <line key={y} x1="0" x2="600" y1={y} y2={y} stroke={fg} strokeWidth="1" opacity="0.5" />
          ))}
          <circle cx="30" cy="30" r="6" fill="#d2453a" />
          <text x="44" y="35" className="enc__tiny" fill={fg}>
            REC
          </text>
          <text x="580" y="35" textAnchor="end" className="enc__tiny" fill={fg}>
            00:01:24:16 · 2.39:1
          </text>
          <text x="300" y="378" textAnchor="middle" className="enc__tiny" fill={fg}>
            SC. 12 · TAKE 3
          </text>
        </g>
      )
    case 'musician':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1="0" x2="600" y1={300 + k * 16} y2={300 + k * 16} stroke={fg} strokeWidth="1.2" opacity="0.6" />
          ))}
          <path d={t.path} fill="none" stroke={fg} strokeWidth="9" strokeDasharray="1 26" strokeLinecap="round" />
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1" opacity="0.4" />
          <text x="18" y="362" className="enc__clef" fill={fg}>
            𝄞
          </text>
          {Array.from({ length: 8 }, (_, i) => {
            const x = 90 + i * 62
            const y = 340 - ((i * 3) % 5) * 8
            return (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="8" ry="5.5" transform={`rotate(-20 ${x} ${y})`} fill={fg} />
                <line x1={x + 7} x2={x + 7} y1={y} y2={y - 34} stroke={fg} strokeWidth="1.5" />
              </g>
            )
          })}
        </g>
      )
    case 'entrepreneur':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2" opacity="0.5" />
          <g clipPath={clip}>
            {Array.from({ length: 12 }, (_, i) => {
              const hh = 18 * Math.exp(i * 0.26)
              return <rect key={i} x={20 + i * 48} y={400 - hh} width="30" height={hh} fill={fg} />
            })}
          </g>
          <path d="M40 360C220 350 400 300 540 80" fill="none" stroke={fg} strokeWidth="3" />
          <path d="M520 80H545V105" fill="none" stroke={fg} strokeWidth="3" />
          <text x="500" y="70" textAnchor="end" className="enc__tiny" fill={fg}>
            +340% YOY
          </text>
        </g>
      )
    case 'biohacker':
      return (
        <g>
          {Array.from({ length: 25 }, (_, i) => (
            <line key={`v${i}`} x1={i * 25} x2={i * 25} y1="0" y2="400" stroke={fg} opacity="0.12" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`h${i}`} y1={i * 25} y2={i * 25} x1="0" x2="600" stroke={fg} opacity="0.12" />
          ))}
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1.5" opacity="0.5" />
          <path d={`M0 ${cy}H${px - 60}L${px - 48} ${cy - 10}L${px - 36} ${cy}L${px - 20} ${cy + 14}L${px} ${py}L${px + 20} ${cy + 40}L${px + 34} ${cy}L${px + 70} ${cy - 24}L${px + 100} ${cy}H600`} fill="none" stroke={fg} strokeWidth="3" strokeLinejoin="round" />
          <text x="580" y="30" textAnchor="end" className="enc__tiny" fill={fg}>
            HR 58 · HRV 71 · VO2 52
          </text>
        </g>
      )
    case 'looksmaxxer':
      return (
        <g>
          <g clipPath="url(#enc-half)">
            <path d={t.path} fill={fg} opacity="0.85" />
          </g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2" transform="translate(600 0) scale(-1 1)" strokeDasharray="3 5" />
          <line x1="300" x2="300" y1="0" y2="400" stroke={fg} strokeWidth="1" strokeDasharray="2 6" />
          <path d="M120 40H491M120 32V48M491 32V48" stroke={fg} strokeWidth="1.5" />
          <text x="305" y="28" textAnchor="middle" className="enc__tiny" fill={fg}>
            1 : 1.618
          </text>
        </g>
      )
    case 'theologian':
      return (
        <g>
          {[-1, 0, 1].map((k) => (
            <path key={k} d={`M${260 + k * 70} 0L${300 + k * 70} 0L${380 + k * 130} 400L${300 + k * 130} 400Z`} fill={fg} opacity="0.14" />
          ))}
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" />
          <circle cx={px} cy={py - 34} r="22" fill="none" stroke={fg} strokeWidth="2" />
          <circle cx={px} cy={py - 34} r="30" fill="none" stroke={fg} strokeWidth="1" opacity="0.5" />
          <path d={`M${px} ${py - 70}V${py - 100}M${px - 12} ${py - 88}H${px + 12}`} stroke={fg} strokeWidth="2" />
        </g>
      )
    case 'gardener':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2" />
          <g clipPath={clip}>
            {Array.from({ length: 60 }, (_, i) => {
              const x = (i * 73) % 600
              const y = 80 + ((i * 131) % 320)
              const r = (i * 47) % 180
              return <ellipse key={i} cx={x} cy={y} rx="16" ry="6" transform={`rotate(${r} ${x} ${y})`} fill={fg} opacity={0.5 + (i % 3) * 0.2} />
            })}
          </g>
          <path d={`M${px} ${py}C${px - 10} ${py - 30} ${px + 14} ${py - 46} ${px} ${py - 70}`} fill="none" stroke={fg} strokeWidth="2" />
          <ellipse cx={px + 10} cy={py - 50} rx="10" ry="4" transform={`rotate(-30 ${px + 10} ${py - 50})`} fill={fg} />
        </g>
      )
    case 'storyteller':
      return (
        <g>
          <path d={t.path} fill={fg} opacity="0.16" />
          <path d="M30 330L150 320L360 70L470 280L570 300" fill="none" stroke={fg} strokeWidth="2.5" />
          {[[30, 330, 'once'], [150, 320, 'then'], [360, 70, 'until'], [470, 280, 'and so'], [570, 300, 'the end']].map(([x, y, w]) => (
            <g key={w}>
              <circle cx={x} cy={y} r="5" fill={fg} />
              <text x={x} y={y - 14} textAnchor="middle" className="enc__say" fill={fg}>
                {w}
              </text>
            </g>
          ))}
        </g>
      )
    case 'detective':
      return (
        <g>
          <rect x="0" y="0" width="600" height="400" fill="#000" opacity="0.4" />
          <circle cx={px} cy={py + 40} r="120" fill={fg} opacity="0.1" />
          <path d={t.path} fill="none" stroke={fg} strokeWidth="1.5" strokeDasharray="5 5" />
          {[[px, py], [120, 300], [cx, cy + 40], [520, 330]].map(([x, y], i, arr) => (
            <g key={i}>
              {i > 0 && <path d={`M${arr[i - 1][0]} ${arr[i - 1][1]}Q${(arr[i - 1][0] + x) / 2} ${(arr[i - 1][1] + y) / 2 + 30} ${x} ${y}`} fill="none" stroke="#d2453a" strokeWidth="2" />}
              <circle cx={x} cy={y} r="6" fill="#d2453a" />
              <text x={x + 10} y={y - 8} className="enc__tiny" fill={fg}>
                EXHIBIT {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}
        </g>
      )
    case 'healer':
      return (
        <g>
          <path d={t.path} fill={fg} opacity="0.12" />
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2" />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={cx} cy={cy - 20} r={30 + k * 34} fill="none" stroke={fg} strokeWidth="1.2" opacity={0.6 - k * 0.13} />
          ))}
          <path d={`M${cx - 16} ${cy - 20}H${cx + 16}M${cx} ${cy - 36}V${cy - 4}`} stroke={fg} strokeWidth="5" />
          <text x="20" y="30" className="enc__tiny" fill={fg}>
            PULSE 64 · TEMP 36.8 · RESP 14
          </text>
        </g>
      )
    case 'teacher':
      return (
        <g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" strokeDasharray="14 5" />
          {[[px, py, 'A', -1], [cx - 120, cy + 40, 'B', 1], [cx + 140, cy + 20, 'C', -1]].map(([x, y, n, s]) => (
            <g key={n}>
              <path d={`M${x + s * 70} ${y - 50}L${x + s * 8} ${y - 6}`} stroke={fg} strokeWidth="1.5" />
              <circle cx={x + s * 78} cy={y - 56} r="13" fill="none" stroke={fg} strokeWidth="1.5" />
              <text x={x + s * 78} y={y - 51} textAnchor="middle" className="enc__say" fill={fg}>
                {n}
              </text>
            </g>
          ))}
          <path d="M560 380L470 290" stroke={fg} strokeWidth="4" strokeLinecap="round" />
          <text x="20" y="384" className="enc__say" fill={fg}>
            Explain why A is higher than C.
          </text>
        </g>
      )
    case 'lover':
      return (
        <g>
          <path d={t.path} fill={fg} opacity="0.85" transform="translate(-26 0)" />
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2" transform="translate(26 0)" />
          <path d={`M${px - 26} ${py}C${px - 26} ${py - 80} ${px + 26} ${py - 80} ${px + 26} ${py}`} fill="none" stroke={fg} strokeWidth="1.5" strokeDasharray="2 5" />
        </g>
      )
    case 'rebel':
      return (
        <g>
          <g clipPath="url(#enc-left)">
            <path d={t.path} fill={fg} />
          </g>
          <g clipPath="url(#enc-right)" transform="translate(18 10) rotate(3 300 200)">
            <path d={t.path} fill={fg} />
          </g>
          <path d="M300 0L270 90L320 160L280 250L330 320L300 400" fill="none" stroke={fg} strokeWidth="2" />
          {[60, 140, 220, 300].map((y) => (
            <line key={y} x1="0" x2="600" y1={y} y2={y} stroke={fg} strokeWidth="1" opacity="0.25" strokeDasharray="4 8" />
          ))}
        </g>
      )
    case 'archivist':
      return (
        <g>
          <g clipPath={clip}>
            {Array.from({ length: 96 }, (_, i) => {
              const x = (i % 12) * 50
              const y = Math.floor(i / 12) * 50
              return (
                <g key={i}>
                  <rect x={x + 3} y={y + 3} width="44" height="44" fill="none" stroke={fg} strokeWidth="1" />
                  <text x={x + 7} y={y + 16} className="enc__micro" fill={fg}>
                    {String(i + 1).padStart(3, '0')}
                  </text>
                </g>
              )
            })}
          </g>
          <path d={t.path} fill="none" stroke={fg} strokeWidth="2.5" />
          <text x="20" y="30" className="enc__tiny" fill={fg}>
            NO. 001–096 · FILED
          </text>
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
        <SectionHead no="04" title="One World, Twenty-Four Encounters" kicker="The same thing, met twenty-four ways. Choose a thing, then an archetype, and watch it redraw what it sees." />
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
              <clipPath id="enc-left">
                <path d="M0 0H300L270 90L320 160L280 250L330 320L300 400H0Z" />
              </clipPath>
              <clipPath id="enc-right">
                <path d="M600 0H300L270 90L320 160L280 250L330 320L300 400H600Z" />
              </clipPath>
              <clipPath id="enc-half">
                <rect x="0" y="0" width="300" height="400" />
              </clipPath>
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
                  bus.switched()
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
