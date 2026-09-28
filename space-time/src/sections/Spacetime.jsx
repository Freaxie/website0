import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { lerp, smooth } from '../lib/geom.js'

const OX = 800
const OY = 760
const S = 70
// Three bodies: one at rest, one drifting right, one hurrying left. Velocities as fractions of c.
const BODIES = [
  { x0: -4, v: 0, name: 'at rest' },
  { x0: -1, v: 0.35, name: 'drifting' },
  { x0: 6.5, v: -0.5, name: 'hurrying' },
]
const TMAX = 5.4

const STEPS = [
  { k: 'I', h: 'A Stage', p: 'For Newton, space is a fixed stage. Bodies take positions on it and move across it; the stage itself never changes.' },
  { k: 'II', h: 'A River', p: 'Time is a separate river, flowing at the same rate everywhere. Join the two and a body’s history becomes a line: its worldline.' },
  {
    k: 'III',
    h: 'One Continuum',
    p: '“Henceforth space by itself, and time by itself, are doomed to fade away into mere shadows, and only a kind of union of the two will preserve an independent reality.” Hermann Minkowski, 1908.',
  },
]

function Stage({ progress }) {
  const ref = useRef(null)
  const now = useRef(null)
  const river = useRef(null)
  const ticks = useRef([])
  const lines = useRef([])
  const dots = useRef([])
  const cone = useRef(null)
  const flash = useRef(null)

  useLoop(ref, (t) => {
    const p = progress.get()
    const m = smooth(0.26, 0.5, p)
    const T = TMAX * smooth(0.36, 0.8, p)
    const nowY = OY - T * S
    now.current?.setAttribute('transform', `translate(0 ${nowY - OY})`)
    const rx = lerp(1420, OX, m)
    river.current?.setAttribute('transform', `translate(${rx - OX} 0)`)
    const flow = ((t * 50) % 70) * (1 - m)
    ticks.current.forEach((el, i) => el?.setAttribute('transform', `translate(0 ${flow})`))
    const loop = (t % 6) - 3
    BODIES.forEach((b, i) => {
      const tt = lerp(loop, T, m)
      const x = OX + (b.x0 + b.v * tt) * S
      const y = lerp(OY, nowY, m)
      dots.current[i]?.setAttribute('transform', `translate(${x} ${y})`)
      lines.current[i]?.setAttribute('d', `M${OX + b.x0 * S} ${OY}L${OX + (b.x0 + b.v * T) * S} ${OY - T * S}`)
    })
    const c = smooth(0.62, 0.76, p)
    cone.current?.setAttribute('opacity', c)
    const k = (t % 3) / 3
    flash.current?.setAttribute('d', `M${OX} ${OY}L${OX + k * 6 * S * c} ${OY - k * 6 * S * c}M${OX} ${OY}L${OX - k * 6 * S * c} ${OY - k * 6 * S * c}`)
  })

  const R = 9 * S
  return (
    <svg ref={ref} className="st__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g ref={cone} opacity="0">
        <path d={`M${OX} ${OY}L${OX + R} ${OY - R}L${OX - R} ${OY - R}Z`} className="st__future" />
        <path d={`M${OX} ${OY}L${OX + R} ${OY + R}L${OX - R} ${OY + R}Z`} className="st__past" />
        <path d={`M${OX - R} ${OY - R}L${OX + R} ${OY + R}M${OX + R} ${OY - R}L${OX - R} ${OY + R}`} className="st__lightline" />
        <text x={OX + 14} y={OY - 300} className="st__label">FUTURE</text>
        <text x={OX + 14} y={OY + 170} className="st__label">PAST</text>
        <text x={OX - 560} y={OY - 40} className="st__label">ELSEWHERE</text>
        <text x={OX + 560} y={OY - 40} textAnchor="end" className="st__label">ELSEWHERE</text>
        <path ref={flash} className="st__flash" />
      </g>
      {BODIES.map((b, i) => (
        <path key={i} ref={(el) => (lines.current[i] = el)} className="st__world" />
      ))}
      <g ref={now}>
        <path d={`M40 ${OY}H1560`} className="st__space" />
        {Array.from({ length: 23 }, (_, i) => (
          <path key={i} d={`M${OX + (i - 11) * S} ${OY - 6}V${OY + 6}`} className="st__space" />
        ))}
        <text x="1380" y={OY - 14} textAnchor="end" className="st__label st__label--space">SPACE · NOW</text>
      </g>
      <g ref={river}>
        <path d={`M${OX} 60V960`} className="st__time" />
        <g ref={(el) => (ticks.current[0] = el)}>
          {Array.from({ length: 15 }, (_, i) => (
            <path key={i} d={`M${OX - 8} ${10 + i * 70}H${OX + 8}`} className="st__time" />
          ))}
        </g>
        <text x={OX + 16} y="80" className="st__label st__label--time">TIME</text>
      </g>
      {BODIES.map((b, i) => (
        <g key={i} ref={(el) => (dots.current[i] = el)}>
          <circle r="11" className="st__body" />
          <text y="-20" textAnchor="middle" className="st__label st__label--body">
            {b.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function Spacetime() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(p < 0.3 ? 0 : p < 0.62 ? 1 : 2))
  const meter = useTransform(scrollYProgress, (p) => `${p * 100}%`)
  const s = STEPS[step]

  return (
    <section id="spacetime" className="st" ref={ref}>
      <div className="st__sticky">
        <Stage progress={scrollYProgress} />
        <div className="st__head">
          <SectionHead no="06" title="Spacetime" tone="paper" kicker="From a stage and a river to a single block." />
        </div>
        <div className="st__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="st__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="st__meter mono" aria-hidden="true">
          <span>Separate</span>
          <div>
            <motion.i style={{ height: meter }} />
          </div>
          <span>United</span>
        </div>
      </div>
    </section>
  )
}
