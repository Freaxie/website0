import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, lerp, mixHex, openPath, resample, rng, smooth, wave } from '../lib/geom.js'

const M = 72
const OX = 800
const OY = 560

// The destination: a Greek theatre in plan. The circle where the chorus danced, the tiers of the theatron, the skene.
function theatrePlan() {
  const lines = []
  for (let i = 0; i < 20; i++) {
    const rad = 240 + i * 15
    const arc = []
    for (let k = 0; k < M; k++) {
      const th = lerp(-0.26, Math.PI + 0.26, k / (M - 1))
      arc.push([OX + Math.cos(th) * rad, OY - Math.sin(th) * rad])
    }
    lines.push({ pts: arc, kind: 'theatron' })
  }
  for (const rad of [176, 170]) {
    const c = []
    for (let k = 0; k < M; k++) {
      const th = (k / (M - 1)) * TAU - Math.PI / 2
      c.push([OX + Math.cos(th) * rad, OY + Math.sin(th) * rad])
    }
    lines.push({ pts: c, kind: 'orchestra' })
  }
  const poly = (p) => resample(p, M)
  lines.push({ pts: poly([[500, 800], [1100, 800], [1100, 872], [500, 872], [500, 800]]), kind: 'skene' })
  lines.push({ pts: poly([[560, 768], [1040, 768]]), kind: 'skene' })
  lines.push({ pts: poly([[250, 736], [600, 736]]), kind: 'parodos' })
  lines.push({ pts: poly([[1000, 736], [1350, 736]]), kind: 'parodos' })
  return lines
}

const STEPS = [
  {
    k: 'I',
    h: 'The Chorus',
    p: 'It begins as music: a singing, dancing crowd in honour of Dionysus. In the orchestra, the circle where the chorus stood, individuals dissolve into one voice.',
  },
  {
    k: 'II',
    h: 'The Vision',
    p: 'Out of that intoxication, the chorus dreams. Nietzsche: it “discharges itself over and over again in an Apollonian world of images.”',
  },
  {
    k: 'III',
    h: 'The Form',
    p: 'The dream takes shape: stage, mask, dialogue, hero. Measured verse gives an unbearable truth a contour we can look at, and live.',
  },
]

function Stage({ progress }) {
  const ref = useRef(null)
  const paths = useRef([])
  const iris = useRef(null)
  const hero = useRef(null)
  const labels = useRef(null)
  const plan = useMemo(theatrePlan, [])
  const seeds = useMemo(() => {
    const r = rng(77)
    return plan.map(() => ({ s: r() * 10, amp: 50 + r() * 110, y: r(), freq: 0.6 + r() * 1.4, w: 0.8 + r() * 2.6 }))
  }, [plan])

  useLoop(ref, (t) => {
    const p = progress.get()
    // Apollonian light arrives as an iris, opening from the orchestra: the circle where it all began.
    const light = smooth(0.4, 0.62, p)
    iris.current?.setAttribute('r', light * light * 1250)
    plan.forEach((line, i) => {
      const el = paths.current[i]
      if (!el) return
      const sd = seeds[i]
      const e = smooth(0.18 + i * 0.009, 0.62 + i * 0.009, p)
      const ee = e * e * (3 - 2 * e)
      const baseY = 90 + sd.y * 820
      const pts = line.pts.map(([ox, oy], k) => {
        const u = k / (M - 1)
        const cx = -80 + u * 1760
        const cy = baseY + wave(u * 6 * sd.freq + sd.s, t * 1.4, sd.s) * sd.amp * (1 - ee * 0.6) + Math.sin(t * 2 + i) * 8
        return [lerp(cx, ox, ee), lerp(cy, oy, ee)]
      })
      el.setAttribute('d', openPath(pts))
      el.setAttribute('stroke', e < 0.5 ? mixHex(C.crimsonLt, C.purple, e * 2) : mixHex(C.purple, C.cobalt, (e - 0.5) * 2))
      el.setAttribute('stroke-width', lerp(sd.w, line.kind === 'orchestra' ? 2 : 1.1, ee))
    })
    const h = smooth(0.74, 0.86, p)
    hero.current?.setAttribute('r', 16 * h)
    labels.current?.setAttribute('opacity', smooth(0.78, 0.92, p))
  })

  return (
    <svg ref={ref} className="trag__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="-400" y="-400" width="2400" height="1800" fill={C.wineDk} />
      <circle ref={iris} cx={OX} cy={OY} r="0" fill={C.marble} />
      {plan.map((_, i) => (
        <path key={i} ref={(el) => (paths.current[i] = el)} fill="none" strokeLinecap="round" />
      ))}
      <circle ref={hero} cx={OX} cy="836" r="0" fill={C.cobalt} />
      <g ref={labels} className="trag__labels" opacity="0">
        <text x={OX} y={OY + 6} textAnchor="middle">ORCHESTRA</text>
        <text x={OX + 330} y={OY - 420}>THEATRON</text>
        <text x="1112" y="842">SKENE</text>
        <text x="250" y="724">PARODOS</text>
        <text x="1350" y="724" textAnchor="end">PARODOS</text>
        <text x={OX + 26} y="916" textAnchor="middle">the hero: a mask of Dionysus</text>
        <path d={`M${OX} 856V896`} stroke={C.cobalt} strokeWidth="1" />
      </g>
    </svg>
  )
}

export default function Tragedy() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(p < 0.36 ? 0 : p < 0.68 ? 1 : 2))
  const ink = useTransform(scrollYProgress, [0.54, 0.58], [C.paper, C.ink])
  const meter = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const capBg = useTransform(scrollYProgress, [0.54, 0.58], [C.wineDk, C.marble])
  const s = STEPS[step]

  return (
    <section id="tragedy" className="trag" ref={ref}>
      <motion.div className="trag__sticky" style={{ color: ink, '--cap-bg': capBg }}>
        <Stage progress={scrollYProgress} />
        <div className="trag__head">
          <SectionHead no="06" title="Tragedy" tone="inherit" kicker="How a Dionysian experience becomes an Apollonian form." />
        </div>

        <div className="trag__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="trag__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="trag__meter mono" aria-hidden="true">
          <span>Rausch</span>
          <div>
            <motion.i style={{ height: meter }} />
          </div>
          <span>Traum</span>
        </div>
      </motion.div>
    </section>
  )
}
