import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { blobPoints, closedPath, openPath, range, wave, rng } from '../lib/geom.js'

const APOLLO = 'APOLLONIAN'.split('')
const DION = 'DIONYSIAN'.split('')
const r = rng(23)
// Each Dionysian letter gets its own posture: nothing in this word shares a baseline.
const posture = DION.map(() => ({
  rot: (r() - 0.5) * 16,
  y: (r() - 0.5) * 0.16,
  s: 0.86 + r() * 0.3,
  delay: r() * 0.5,
  from: { x: (r() - 0.5) * 400, y: (r() - 0.5) * 300, rotate: (r() - 0.5) * 120 },
  dur: 5 + r() * 4,
}))

function Field({ mx, my }) {
  const ref = useRef(null)
  const blob = useRef(null)
  const halo = useRef(null)
  const flows = useRef([])

  useLoop(ref, (t) => {
    const px = mx.get()
    const py = my.get()
    const cx = 1010 + px * 70
    const cy = 520 + py * 50
    blob.current?.setAttribute('d', closedPath(blobPoints(cx, cy, 300, 0.2, t * 0.6, { seed: 2, complexity: 1.1 })))
    halo.current?.setAttribute('d', closedPath(blobPoints(cx + 20, cy - 10, 380, 0.16, t * 0.45 + 2, { seed: 5, complexity: 1.4 })))
    flows.current.forEach((el, i) => {
      if (!el) return
      const pts = []
      for (let k = 0; k <= 24; k++) {
        const x = 780 + k * 38
        pts.push([x, 180 + i * 64 + wave(k * 0.32 + i, t * 0.8, i) * (40 + i * 6) + py * 30])
      }
      el.setAttribute('d', openPath(pts))
    })
  })

  const gx = useTransform(mx, (v) => v * -18)
  const draw = (delay) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 1.6, delay: 1.5 + delay, ease: [0.65, 0, 0.35, 1] },
  })

  return (
    <svg ref={ref} className="hero__field" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <motion.g style={{ x: gx }}>
        {/* the module: a grid that stops where Apollo's jurisdiction ends */}
        {Array.from({ length: 11 }, (_, i) => (
          <motion.line key={`v${i}`} x1={80 + i * 80} x2={80 + i * 80} y1="0" y2="1000" className="hero__grid" {...draw(i * 0.04)} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <motion.line key={`h${i}`} x1="0" x2="880" y1={i * 80 + 20} y2={i * 80 + 20} className="hero__grid" {...draw(i * 0.03)} />
        ))}
        <motion.circle cx="560" cy="500" r="330" className="hero__ring" {...draw(0.2)} />
        <motion.circle cx="560" cy="500" r="250" fill="#1c35d6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.4, delay: 1.7, ease: [0.76, 0, 0.24, 1] }} style={{ transformOrigin: '560px 500px' }} />
        <motion.rect x="383" y="323" width="354" height="354" className="hero__ring hero__ring--paper" {...draw(0.6)} />
        <motion.path d="M383 323L737 677M737 323L383 677M560 170V830M230 500H890" className="hero__ring hero__ring--paper" {...draw(0.8)} />
        <circle cx="560" cy="500" r="5" fill="#eeebe4" />
      </motion.g>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 1.9 }}>
        <path ref={halo} className="hero__halo" />
        <path ref={blob} className="hero__blob" />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} ref={(el) => (flows.current[i] = el)} className="hero__flow" />
        ))}
      </motion.g>
    </svg>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const apX = useTransform(scrollYProgress, (p) => `${p * -22}vw`)
  const diX = useTransform(scrollYProgress, (p) => `${p * 22}vw`)
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))
  const mxRaw = useMotionValue(0)
  const myRaw = useMotionValue(0)
  const mx = useSpring(mxRaw, { stiffness: 40, damping: 18 })
  const my = useSpring(myRaw, { stiffness: 40, damping: 18 })

  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    mxRaw.set(((e.clientX - b.left) / b.width - 0.5) * 2)
    myRaw.set(((e.clientY - b.top) / b.height - 0.5) * 2)
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={onMove}>
      <Field mx={mx} my={my} />

      <motion.div className="hero__meta mono" style={{ opacity: fade }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
        <span>A contemporary exhibition</span>
        <span>After F. Nietzsche, <i>Die Geburt der Tragödie</i>, 1872</span>
        <span>Eight rooms · one tension</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Apollonian versus Dionysian">
        <motion.span className="hero__apollo" style={{ x: apX }} aria-hidden="true">
          {APOLLO.map((ch, i) => (
            <span className="cell" key={i}>
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 1.3 + i * 0.06, ease }}>
                {ch}
              </motion.span>
            </span>
          ))}
        </motion.span>

        <span className="hero__mid" aria-hidden="true">
          <motion.span className="hero__side hero__side--apollo" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.4, duration: 1, ease }}>
            <b className="mono">Order · Form · Measure</b>
            <q>Give chaos a shape.</q>
          </motion.span>
          <motion.span className="hero__vs" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 2.2, duration: 1.1, ease }}>
            vs
          </motion.span>
          <motion.span className="hero__side hero__side--dion" initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ delay: 2.6, duration: 1.4 }}>
            <b className="mono">Ecstasy · Instinct · Becoming</b>
            <q>Lose yourself in the experience.</q>
          </motion.span>
        </span>

        <motion.span className="hero__dion" style={{ x: diX }} aria-hidden="true">
          {DION.map((ch, i) => {
            const p = posture[i]
            return (
              <motion.span
                key={i}
                className="dl"
                initial={{ opacity: 0, x: p.from.x, y: p.from.y, rotate: p.from.rotate, filter: 'blur(14px)' }}
                animate={{ opacity: 1, x: 0, y: `${p.y}em`, rotate: p.rot, filter: 'blur(0px)' }}
                transition={{ duration: 2.2, delay: 1.6 + p.delay, ease: [0.16, 1, 0.3, 1] }}
                style={{ '--s': p.s, '--dur': `${p.dur}s` }}
              >
                <span>{ch}</span>
              </motion.span>
            )
          })}
        </motion.span>
      </h1>

      <motion.div className="hero__foot mono" style={{ opacity: fade }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 1 }}>
        <span>Two drives of art. Neither wins.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
