import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { ARCHETYPES, byId, ink } from '../lib/archetypes.js'
import { EVENTS } from '../lib/encyclopedia.js'
import { bus } from '../lib/bus.js'

const W = 1000
const L = 150 // room for the lane names
const LANE = 26
const TOP = 34
const H = TOP + ARCHETYPES.length * LANE + 30
const NOW = 2026
const FAR = Math.log10(NOW + 46000)
// time runs on a logarithmic scale of years before now, so forty thousand years and the last forty both fit;
// the scale stops ten years short of the present
const xOf = (year) => L + ((FAR - Math.log10(Math.max(10, NOW - year))) / (FAR - 1)) * (W - L - 24)
const TICKS = [[-40000, '40,000 BC'], [-10000, '10,000 BC'], [-3000, '3000 BC'], [-1000, '1000 BC'], [1, 'AD 1'], [1000, '1000'], [1500, '1500'], [1800, '1800'], [1900, '1900'], [1950, '1950'], [2000, '2000']]
const ERAS = [
  ['all', 'All', -Infinity, Infinity],
  ['before', 'Before writing', -Infinity, -3200],
  ['ancient', 'Antiquity', -3200, 500],
  ['middle', 'Middle Ages', 500, 1500],
  ['early', 'Early modern', 1500, 1800],
  ['modern', 'Modern', 1800, Infinity],
]
const lane = (id) => ARCHETYPES.findIndex((a) => a.id === id)

export default function Lineages() {
  const ref = useRef(null)
  const visible = useInView(ref, { amount: 0.3 })
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const [era, setEra] = useState('all')
  const [, lo, hi] = ERAS.find((e) => e[0] === era).slice(1)
  const listed = useMemo(() => EVENTS.map((e, i) => ({ ...e, i })).filter((e) => e.year >= lo && e.year < hi), [lo, hi])
  const ev = EVENTS[active]
  const a = byId[ev.id]

  // the line reads itself aloud, one moment after another, until someone takes over
  useEffect(() => {
    if (!visible || held) return
    const t = setInterval(() => setActive((i) => (i + 1) % EVENTS.length), 3200)
    return () => clearInterval(t)
  }, [visible, held])

  const pick = (i) => {
    setHeld(true)
    setActive(i)
    bus.switched()
  }
  const step = (d) => pick((active + d + EVENTS.length) % EVENTS.length)
  const pickEra = (id) => {
    setEra(id)
    const [, , from, to] = ERAS.find((e) => e[0] === id)
    const first = EVENTS.findIndex((e) => e.year >= from && e.year < to)
    if (first >= 0) pick(first)
  }

  return (
    <section id="lineages" className="lin" ref={ref}>
      <div className="lin__top">
        <SectionHead
          no="06"
          title="Lineages"
          kicker={`Every way of meeting reality has a history. ${EVENTS.length} dated moments, eight for each of the twenty-four, from a pig painted on a cave wall at least 45,000 years ago to a word coined online, laid on one line.`}
        />
        <div className="lin__now" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <span className="lin__year">{ev.label}</span>
              <a className="lin__who mono" href={`#plate-${a.id}`}>
                <i style={{ background: a.color }} />
                {a.no} · {a.name}
              </a>
              <p className="lin__text">{ev.text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="lin__step mono">
            <button type="button" onClick={() => step(-1)} aria-label="Earlier moment">
              ← Earlier
            </button>
            <span>
              {active + 1} / {EVENTS.length}
            </span>
            <button type="button" onClick={() => step(1)} aria-label="Later moment">
              Later →
            </button>
          </div>
        </div>
      </div>

      <div className="lin__chart" onPointerLeave={() => setHeld(false)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A timeline of ${EVENTS.length} moments across the twenty-four archetypes, on a logarithmic scale of years before now`}>
          {TICKS.map(([y, t]) => (
            <g key={y}>
              <line x1={xOf(y)} x2={xOf(y)} y1={TOP - 10} y2={H - 26} className="lin__tick" />
              <text x={xOf(y)} y={H - 8} textAnchor="middle" className="lin__tlabel">
                {t}
              </text>
            </g>
          ))}
          <line x1={xOf(ev.year)} x2={xOf(ev.year)} y1={TOP - 14} y2={H - 26} stroke={ink(a)} strokeWidth="1.5" className="lin__guide" />
          {ARCHETYPES.map((x, k) => {
            const y = TOP + k * LANE + LANE / 2
            return (
              <g key={x.id} className={ev.id === x.id ? 'is-on' : ''}>
                <text x={L - 14} y={y + 4} textAnchor="end" className="lin__lname">
                  {x.name}
                </text>
                <line x1={L} x2={W - 24} y1={y} y2={y} stroke={x.color} className="lin__lane" />
              </g>
            )
          })}
          {EVENTS.map((e, i) => {
            const x = byId[e.id]
            const on = i === active
            return (
              <g
                key={i}
                transform={`translate(${xOf(e.year)} ${TOP + lane(e.id) * LANE + LANE / 2})`}
                className="lin__dot"
                tabIndex="0"
                role="button"
                aria-label={`${e.label}: ${e.text}`}
                onPointerEnter={() => pick(i)}
                onFocus={() => pick(i)}
              >
                <circle r="10" className="lin__hit" />
                <circle r={on ? 8 : 5} fill={ink(x)} stroke={on ? 'var(--ink)' : 'none'} strokeWidth="2" />
              </g>
            )
          })}
        </svg>
        <p className="lin__scale mono">Logarithmic scale of years before now: each gridline to the left is roughly three to ten times further back.</p>
      </div>

      <div className="lin__eras" role="radiogroup" aria-label="Choose an era">
        {ERAS.map(([id, name, from, to]) => (
          <button key={id} type="button" role="radio" aria-checked={era === id} className={`mono ${era === id ? 'is-on' : ''}`} onClick={() => pickEra(id)}>
            {name}
            <span>{EVENTS.filter((e) => e.year >= from && e.year < to).length}</span>
          </button>
        ))}
      </div>

      <ol className="lin__list">
        {listed.map((e) => {
          const x = byId[e.id]
          return (
            <li key={e.i} className={e.i === active ? 'is-on' : ''}>
              <button type="button" onClick={() => pick(e.i)}>
                <span className="mono lin__ly">{e.label}</span>
                <span className="lin__lt">
                  <span className="mono lin__la">
                    <i style={{ background: x.color }} />
                    {x.name}
                  </span>
                  {e.text}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
