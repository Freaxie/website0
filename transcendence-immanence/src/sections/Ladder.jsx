import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, lerp, smooth } from '../lib/geom.js'

// Rails converge on a point far above the frame. Rungs crowd together as they rise.
const VP = [800, -700]
const rail = (u, side) => [lerp(800 + side * 250, VP[0], u), lerp(1000, VP[1], u)]
const RUNGS = Array.from({ length: 5 }, (_, k) => 0.08 + (1 - Math.pow(0.7, k)) * 0.62)

const STEPS = [
  { h: 'One beautiful body', p: 'In Plato’s Symposium, Diotima tells Socrates that love begins with a single beautiful body.' },
  { h: 'All beautiful bodies', p: 'Seeing that the beauty of one body is akin to that of another, the lover comes to love it in all of them, and the passion for one relaxes its grip.' },
  { h: 'Beautiful souls', p: 'Next, beauty of soul is found to be worth more than beauty of body.' },
  { h: 'Practices and laws', p: 'From souls, to the beauty of the ways people live together: customs, practices, laws.' },
  { h: 'Knowledge', p: 'From laws, to the kinds of knowledge, until the lover turns toward “the vast open sea of beauty”.' },
  {
    h: 'Beauty itself',
    p: 'And then, suddenly, a beauty that is “itself by itself with itself”, eternal, not in any body or thing at all. The ladder ends. What it leads to is not on it.',
  },
]

function Stage({ progress }) {
  const ref = useRef(null)
  const night = useRef(null)
  const rungs = useRef([])
  const climber = useRef(null)
  const beyond = useRef(null)

  useLoop(ref, (t) => {
    const p = progress.get()
    const k = Math.min(5, p * 6)
    night.current?.setAttribute('height', smooth(0.1, 0.95, p) * 1000 + 400)
    rungs.current.forEach((el, i) => {
      if (!el) return
      const lit = k >= i + 0.5
      el.setAttribute('stroke', lit ? C.lilac : C.violet)
      el.setAttribute('stroke-width', lit ? 5 : 2)
    })
    const idx = Math.floor(k)
    const f = k - idx
    const uA = idx < 5 ? RUNGS[idx] : RUNGS[4]
    const uB = idx < 4 ? RUNGS[idx + 1] : 1.02
    const u = lerp(uA, uB, smooth(0.55, 1, f))
    const [x, y] = [lerp(800, VP[0], u), lerp(1000, VP[1], u)]
    climber.current?.setAttribute('transform', `translate(${x} ${y - 12 - Math.abs(Math.sin(t * 3)) * 4}) scale(${1 - u * 0.8})`)
    beyond.current?.setAttribute('opacity', smooth(0.8, 0.95, p))
  })

  const [la, lb] = [rail(0, -1), rail(1, -1)]
  const [ra, rb] = [rail(0, 1), rail(1, 1)]
  return (
    <svg ref={ref} className="lad__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect x="-400" y="-400" width="2400" height="1800" fill={C.paper} />
      <rect ref={night} x="-400" y="-400" width="2400" height="400" fill={C.night} />
      <path d={`M${la[0]} ${la[1]}L${lb[0]} ${lb[1]}M${ra[0]} ${ra[1]}L${rb[0]} ${rb[1]}`} className="lad__rail" />
      {RUNGS.map((u, i) => {
        const [x1, y1] = rail(u, -1)
        const [x2] = rail(u, 1)
        return (
          <g key={i}>
            <line ref={(el) => (rungs.current[i] = el)} x1={x1} y1={y1} x2={x2} y2={y1} strokeLinecap="round" />
            <text x={x2 + 24} y={y1 + 5} className="lad__tag">
              {String(i + 1).padStart(2, '0')} · {STEPS[i].h}
            </text>
          </g>
        )
      })}
      <g ref={beyond} opacity="0" className="lad__beyond">
        <path d="M800 40V-40M790 -26L800 -40L810 -26" />
        <text x="1000" y="30">06 · Beauty itself — beyond the frame</text>
      </g>
      <g ref={climber}>
        <circle r="14" fill={C.violet} />
        <circle r="26" fill="none" stroke={C.violet} strokeWidth="1" />
      </g>
    </svg>
  )
}

export default function Ladder() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(Math.min(5, Math.floor(p * 6))))
  const ink = useTransform(scrollYProgress, [0.3, 0.36], [C.ink, C.lilac])
  const capBg = useTransform(scrollYProgress, [0.3, 0.36], [C.paper, C.night])
  const s = STEPS[step]

  return (
    <section id="ladder" className="lad" ref={ref}>
      <motion.div className="lad__sticky" style={{ color: ink, '--cap-bg': capBg }}>
        <Stage progress={scrollYProgress} />
        <div className="lad__head">
          <SectionHead no="03" title="The Ladder" tone="inherit" kicker="Transcendence as ascent: each rung leaves the last one behind." />
        </div>
        <div className="lad__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}>
              <span className="lad__k">{String(step + 1).padStart(2, '0')}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
          {step === 5 && (
            <p className="lad__note mono">
              Compare Wittgenstein, 1921: whoever understands him must “throw away the ladder after he has climbed up it”.
            </p>
          )}
        </div>
      </motion.div>
    </section>
  )
}
