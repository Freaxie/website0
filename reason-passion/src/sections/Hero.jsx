import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, range } from '../lib/geom.js'

const HX = 1090
const HY = 520

// A heartbeat: two bumps per beat, "lub" then "dub".
export const beatShape = (phase) => {
  const lub = Math.exp(-Math.pow((phase - 0.08) / 0.045, 2))
  const dub = 0.6 * Math.exp(-Math.pow((phase - 0.3) / 0.05, 2))
  return lub + dub
}
// An ECG trace for one beat, in a 0..1 phase: flat, P, QRS spike, T.
const ecg = (p) => {
  if (p < 0.1) return 0
  if (p < 0.18) return Math.sin(((p - 0.1) / 0.08) * Math.PI) * 0.12
  if (p < 0.22) return 0
  if (p < 0.24) return -0.15
  if (p < 0.27) return 1
  if (p < 0.3) return -0.3
  if (p < 0.4) return 0
  if (p < 0.55) return Math.sin(((p - 0.4) / 0.15) * Math.PI) * 0.22
  return 0
}

function Field({ state }) {
  const ref = useRef(null)
  const disc = useRef(null)
  const rings = useRef([])
  const trace = useRef(null)
  const bpmText = useRef(null)
  const phase = useRef(0)
  const history = useRef([])

  useLoop(ref, (t, dt) => {
    const s = state.current
    s.agitation = Math.max(0, s.agitation - dt * 0.35)
    const bpm = 62 + s.agitation * 90
    phase.current = (phase.current + (dt * bpm) / 60) % 1
    const b = beatShape(phase.current)
    s.beat = b
    disc.current?.setAttribute('r', 250 + b * 26)
    rings.current.forEach((el, i) => {
      if (!el) return
      const k = (phase.current + i * 0.25) % 1
      el.setAttribute('r', 280 + k * 220)
      el.setAttribute('opacity', (1 - k) * 0.8)
    })
    history.current.push(ecg(phase.current))
    if (history.current.length > 220) history.current.shift()
    if (trace.current) {
      const pts = history.current.map((v, i) => `${i ? 'L' : 'M'}${880 + i * 3.2} ${900 - v * 90}`)
      trace.current.setAttribute('d', pts.join(''))
    }
    if (bpmText.current) bpmText.current.textContent = `${Math.round(bpm)} BPM`
    s.el?.style.setProperty('--beat', b.toFixed(3))
  })

  const draw = (delay, dur = 1.2) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: dur, delay: 1.4 + delay, ease: [0.65, 0, 0.35, 1] },
  })

  return (
    <svg ref={ref} className="hero__field" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* reason: a proof, drawn step by step */}
      <motion.path d="M170 830L790 830L460 250Z" fill={C.cyan} style={{ mixBlendMode: 'multiply' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 0.8 }} />
      <motion.path d="M170 830L790 830L460 250Z" className="hero__proof" {...draw(0, 1.6)} />
      <motion.path d="M460 250V830" className="hero__proof hero__proof--thin" {...draw(0.9)} />
      <motion.path d="M460 800H490V830" className="hero__proof hero__proof--thin" {...draw(1.3, 0.4)} />
      <motion.path d="M100 250H880" className="hero__proof hero__proof--dash" {...draw(1.1)} />
      <motion.path d="M250 830A80 80 0 0 0 214 767" className="hero__proof hero__proof--thin" {...draw(1.6, 0.5)} />
      <motion.path d="M710 830A80 80 0 0 1 746 767" className="hero__proof hero__proof--thin" {...draw(1.7, 0.5)} />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }} className="hero__labels">
        <text x="140" y="870">A</text>
        <text x="800" y="870">B</text>
        <text x="450" y="228">C</text>
        <text x="880" y="905">α + β + γ = 180°</text>
        <text x="880" y="936" className="hero__qed">Q.E.D.</text>
      </motion.g>

      {/* passion: a pulse */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1.2 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <circle key={i} ref={(el) => (rings.current[i] = el)} cx={HX} cy={HY} r="280" className="hero__ring" />
        ))}
        <circle ref={disc} cx={HX} cy={HY} r="250" fill={C.magenta} style={{ mixBlendMode: 'multiply' }} />
        <path ref={trace} className="hero__ecg" />
        <text ref={bpmText} x="1590" y="860" textAnchor="end" className="hero__bpm">
          62 BPM
        </text>
      </motion.g>
    </svg>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const title = useRef(null)
  const state = useRef({ agitation: 0, beat: 0, last: null, el: null })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const rX = useTransform(scrollYProgress, (p) => `${p * -24}vw`)
  const pX = useTransform(scrollYProgress, (p) => `${p * 24}vw`)
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))

  // fast movement raises the pulse; stillness lets it settle
  const onMove = (e) => {
    const s = state.current
    const now = performance.now()
    if (s.last) {
      const dt = Math.max(1, now - s.last.t)
      const v = Math.hypot(e.clientX - s.last.x, e.clientY - s.last.y) / dt
      s.agitation = Math.min(1, s.agitation + v * 0.012)
    }
    s.last = { x: e.clientX, y: e.clientY, t: now }
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section
      id="entrance"
      className="hero"
      ref={(el) => {
        ref.current = el
        state.current.el = el
      }}
      onPointerMove={onMove}
    >
      <Field state={state} />

      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>From Plato to Hume to now</span>
        <span>Eight rooms · two inks</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Reason and Passion" ref={title}>
        <motion.span className="hero__reason" style={{ x: rX }} aria-hidden="true">
          {'REASON'.split('').map((ch, i) => (
            <span className="cell" key={i}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.01, delay: 1.2 + i * 0.12 }}>
                {ch}
              </motion.span>
            </span>
          ))}
          <motion.i className="hero__caret" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 2, duration: 1, repeat: Infinity }} />
        </motion.span>

        <span className="hero__mid" aria-hidden="true">
          <motion.span className="hero__side hero__side--r" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.4, duration: 1, ease }}>
            <b className="mono">Proof · Principle · Deliberation</b>
            <q>Think it through.</q>
          </motion.span>
          <motion.span className="hero__and" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, duration: 1.1, ease }}>
            &amp;
          </motion.span>
          <motion.span className="hero__side hero__side--p" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.6, duration: 1, ease }}>
            <b className="mono">Desire · Feeling · Drive</b>
            <q>Feel it first.</q>
          </motion.span>
        </span>

        <motion.span className="hero__passion" style={{ x: pX }} aria-hidden="true">
          {'Passion'.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="pl"
              style={{ '--i': i }}
              initial={{ opacity: 0, filter: 'blur(14px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: 1.6 + i * 0.08 }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.span>
      </h1>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Which of them should be in charge?</span>
        <span>Move quickly, and watch the pulse.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
