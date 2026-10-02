import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { ARCHETYPES } from '../lib/archetypes.js'
import { TAU, range, rng } from '../lib/geom.js'

const R = 168 // radius of the ring of signs
const CORE = 44

// Particles that travel along each ray toward reality; the chosen ray runs fastest.
const r = rng(12)
const MOTES = ARCHETYPES.flatMap((_, k) => Array.from({ length: 14 }, () => ({ k, u: r(), sp: 0.08 + r() * 0.1, off: (r() - 0.5) * 10 })))

export default function Hero() {
  const ref = useRef(null)
  const canvas = useRef(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fade = useTransform(scrollYProgress, range(0, 0.7, 1, 0))
  const spin = useTransform(scrollYProgress, (p) => p * 25)

  // when nobody is choosing, the exhibition chooses for them
  useEffect(() => {
    if (held) return
    const id = setInterval(() => setActive((i) => (i + 1) % ARCHETYPES.length), 2200)
    return () => clearInterval(id)
  }, [held])

  activeRef.current = active

  useLoop(ref, (t, dt) => {
    const el = canvas.current
    if (!el) return
    const b = el.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (el.width !== Math.round(b.width * dpr)) {
      el.width = Math.round(b.width * dpr)
      el.height = Math.round(b.height * dpr)
    }
    const ctx = el.getContext('2d')
    const k = (b.width / 520) * dpr
    ctx.setTransform(k, 0, 0, k, el.width / 2, el.height / 2)
    ctx.clearRect(-260, -260, 520, 520)
    for (const m of MOTES) {
      const on = m.k === activeRef.current
      m.u -= m.sp * dt * (on ? 4 : 1)
      if (m.u < 0) m.u += 1
      const ang = (m.k / 10) * TAU - Math.PI / 2
      const rad = CORE + 8 + m.u * (R - 34 - CORE - 8)
      const nx = -Math.sin(ang)
      const ny = Math.cos(ang)
      ctx.globalAlpha = (on ? 1 : 0.55) * Math.min(1, m.u * 4) * Math.min(1, (1 - m.u) * 6)
      ctx.fillStyle = ARCHETYPES[m.k].color
      ctx.beginPath()
      ctx.arc(Math.cos(ang) * rad + nx * m.off, Math.sin(ang) * rad + ny * m.off, on ? 3.4 : 2.2, 0, TAU)
      ctx.fill()
    }
    // the core breathes
    ctx.globalAlpha = 0.18
    ctx.strokeStyle = ARCHETYPES[activeRef.current].color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, CORE + 10 + ((t * 30) % 40), 0, TAU)
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  const a = ARCHETYPES[active]
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref}>
      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>An atlas in seven rooms</span>
        <span>Ten archetypes · one reality</span>
      </motion.div>

      <div className="hero__text">
        <h1 className="hero__title" aria-label="Ten ways of encountering reality">
          <span className="hero__clip">
            <motion.span className="hero__ten" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 1.3, ease }}>
              Ten ways
            </motion.span>
          </span>
          <motion.span className="hero__of" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 1.7 }}>
            of encountering
          </motion.span>
          <span className="hero__clip">
            <motion.span className="hero__reality" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: 1.5, ease }}>
              Reality
            </motion.span>
          </span>
        </h1>

        <div className="hero__kinetic" aria-live="polite">
          <span className="hero__to">To</span>
          <span className="hero__verb-box">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={a.id} className={`hero__verb hero__verb--${a.id}`} style={{ color: a.color }} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.6, ease }}>
                {a.verb} <span className="hero__it">it.</span>
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="hero__who mono">
            {a.no} · {a.name}
          </span>
        </div>
      </div>

      <motion.div className="hero__wheel" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: 1.2, ease }} onPointerLeave={() => setHeld(false)}>
        <motion.div className="hero__spin" style={{ rotate: spin }}>
          <canvas ref={canvas} className="hero__motes" aria-hidden="true" />
          <svg viewBox="-260 -260 520 520" role="group" aria-label="The ten archetypes around reality">
            <circle r={R} className="hero__ring" />
            <circle r={R * 0.62} className="hero__ring hero__ring--dash" />
            {ARCHETYPES.map((x, i) => {
              const ang = (i / 10) * TAU - Math.PI / 2
              const gx = Math.cos(ang) * R
              const gy = Math.sin(ang) * R
              const on = i === active
              return (
                <g key={x.id}>
                  <line x1={Math.cos(ang) * (CORE + 6)} y1={Math.sin(ang) * (CORE + 6)} x2={gx} y2={gy} stroke={x.color} className={`hero__ray ${on ? 'is-on' : ''}`} />
                  <a
                    href={`#plate-${x.id}`}
                    aria-label={`${x.name}: ${x.verb} reality`}
                    onPointerEnter={() => {
                      setHeld(true)
                      setActive(i)
                    }}
                    onFocus={() => {
                      setHeld(true)
                      setActive(i)
                    }}
                  >
                    <g transform={`translate(${gx} ${gy})`}>
                      <motion.g animate={{ scale: on ? 1.25 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                        <circle r="34" fill={x.color} className="hero__disc" />
                        <path d={x.glyph} transform="translate(-17 -17) scale(0.34)" stroke={x.fg} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.g>
                      <motion.text y={Math.sin(ang) > 0.3 ? 58 : -48} textAnchor="middle" className="hero__label" animate={{ opacity: on ? 1 : 0.55 }}>
                        {x.name}
                      </motion.text>
                    </g>
                  </a>
                </g>
              )
            })}
            <circle r={CORE} className="hero__core" />
            <text y="4" textAnchor="middle" className="hero__core-label">
              REALITY
            </text>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Point at a sign, or let them turn. Each one opens a plate.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
