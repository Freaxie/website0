import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, lerp, openPath, smooth, wave } from '../lib/geom.js'

const N = 18
const X0 = 150
const X1 = 1450
const BASE = 820
const HOP = 250

// The leap: two arcs across the wall. u runs 0..1 along it.
const leap = (u) => [lerp(X0, X1, u), BASE - HOP * Math.abs(Math.sin(u * Math.PI * 2))]
const lean = (u) => Math.cos(u * Math.PI * 2) * 0.5

const STEPS = [
  {
    k: 'I',
    h: 'The Frozen Leap',
    p: 'In the 1880s Étienne-Jules Marey photographed a man jumping, many exposures on a single plate. One movement became a row of still positions, laid out side by side.',
  },
  {
    k: 'II',
    h: 'Time as Space',
    p: 'That is how clocks and physics handle time: a line of instants, like points along a ruler. Exact and useful. Henri Bergson thought it left out the thing itself.',
  },
  {
    k: 'III',
    h: 'Durée',
    p: 'Lived time, he argued, is not a row of moments but a flow in which each moment carries the ones before it, the way the notes of a melody are heard in one another.',
  },
]

function Stage({ progress }) {
  const ref = useRef(null)
  const frames = useRef([])
  const front = useRef(null)
  const strands = useRef([])
  const runner = useRef(null)
  const frameData = useMemo(
    () =>
      Array.from({ length: N }, (_, k) => {
        const u = k / (N - 1)
        const [x, y] = leap(u)
        const l = lean(u)
        return { u, x, y, l, t: (u * 1.2).toFixed(2) }
      }),
    [],
  )

  useLoop(ref, (t) => {
    const p = progress.get()
    const sweep = smooth(0.5, 0.57, p)
    front.current?.setAttribute('width', sweep * 1700)
    const fade = 1 - smooth(0.58, 0.8, p)
    frames.current.forEach((el, k) => {
      if (!el) return
      const on = smooth(0.03 + k * 0.018, 0.06 + k * 0.018, p)
      el.setAttribute('opacity', on * fade)
    })
    const flow = smooth(0.55, 0.85, p)
    strands.current.forEach((el, i) => {
      if (!el) return
      const pts = []
      for (let k = 0; k <= 60; k++) {
        const u = k / 60
        const [x, y] = leap(u)
        pts.push([x, y - 50 + (i - 3) * 9 + wave(u * 9 + i, t * 1.2, i) * 10 * flow])
      }
      el.setAttribute('d', openPath(pts))
      el.setAttribute('stroke-dashoffset', 1 - flow)
    })
    if (runner.current) {
      const u = (t * 0.18) % 1
      const [x, y] = leap(u)
      runner.current.setAttribute('transform', `translate(${x} ${y - 50})`)
      runner.current.setAttribute('opacity', smooth(0.8, 0.9, p))
    }
  })

  return (
    <svg ref={ref} className="chrono__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-200" y="-200" width="2000" height="1400" fill={C.paper} />
      <rect ref={front} x="-50" y="-200" height="1400" width="0" fill={C.umberDk} />
      <path d={`M${X0} 900H${X1}`} className="chrono__axis" />
      {frameData.map((f, k) => (
        <g key={k} ref={(el) => (frames.current[k] = el)} opacity="0" className="chrono__frame">
          <line x1={f.x + f.l * 20} y1={f.y - 110} x2={f.x - f.l * 30} y2={f.y} />
          <line x1={f.x} y1={f.y - 60} x2={f.x + 26 + f.l * 20} y2={f.y - 38} />
          <circle cx={f.x + f.l * 24} cy={f.y - 128} r="16" />
          <path d={`M${f.x} 892V908`} />
          <text x={f.x} y="936" textAnchor="middle">
            {f.t}s
          </text>
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} ref={(el) => (strands.current[i] = el)} className="chrono__strand" pathLength="1" strokeDasharray="1 1" strokeDashoffset="1" />
      ))}
      <g ref={runner} opacity="0">
        <circle r="14" fill={C.amber} />
        <circle r="30" fill="none" stroke={C.amber} strokeWidth="1" />
      </g>
    </svg>
  )
}

export default function Chrono() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(p < 0.34 ? 0 : p < 0.64 ? 1 : 2))
  const ink = useTransform(scrollYProgress, [0.53, 0.55], [C.ink, C.cream])
  const capBg = useTransform(scrollYProgress, [0.53, 0.55], [C.paper, C.umberDk])
  const meter = useTransform(scrollYProgress, (p) => `${p * 100}%`)
  const s = STEPS[step]

  return (
    <section id="chrono" className="chrono" ref={ref}>
      <motion.div className="chrono__sticky" style={{ color: ink, '--cap-bg': capBg }}>
        <Stage progress={scrollYProgress} />
        <div className="chrono__head">
          <SectionHead no="03" title="The Frozen Leap" tone="inherit" kicker="What happens to a movement when you cut it into instants." />
        </div>
        <div className="chrono__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.k}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="chrono__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="chrono__meter mono" aria-hidden="true">
          <span>Instants</span>
          <div>
            <motion.i style={{ width: meter }} />
          </div>
          <span>Duration</span>
        </div>
      </motion.div>
    </section>
  )
}
