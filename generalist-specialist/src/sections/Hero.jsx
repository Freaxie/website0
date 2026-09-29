import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { CHIPS, range, rng } from '../lib/geom.js'

const FIELDS = ['Painting', 'Anatomy', 'Optics', 'Music', 'Law', 'Botany', 'Poetry', 'Geology', 'Chess', 'Cooking', 'Logic', 'Hydraulics', 'Theology', 'Maps', 'Medicine', 'Weaving', 'Algebra', 'History', 'Dance', 'Astronomy']
export const STYLES = ['serif-i', 'mono', 'wide', 'thin', 'serif']
const WORD = 'GENERALIST'.split('')

// Restless letters: every so often, one of them changes its typeface and its colour.
function useRestless(n) {
  const reduce = useReducedMotion()
  const [s, setS] = useState(() => {
    const r = rng(7)
    return Array.from({ length: n }, (_, i) => ({ style: i % STYLES.length, color: Math.floor(r() * CHIPS.length) }))
  })
  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => {
      setS((prev) => {
        const next = [...prev]
        const i = Math.floor(Math.random() * n)
        next[i] = { style: (next[i].style + 1 + Math.floor(Math.random() * 3)) % STYLES.length, color: Math.floor(Math.random() * CHIPS.length) }
        return next
      })
    }, 700)
    return () => clearInterval(id)
  }, [n, reduce])
  return s
}

export default function Hero() {
  const ref = useRef(null)
  const shaft = useRef(null)
  const letters = useRestless(WORD.length)
  const [lit, setLit] = useState(-1)
  const [depth, setDepth] = useState(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))
  const gX = useTransform(scrollYProgress, (p) => `${p * -30}vw`)
  const sY = useTransform(scrollYProgress, (p) => `${p * 30}vh`)

  const onShaft = (e) => {
    const b = shaft.current.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height))
    setDepth({ y: e.clientY - b.top, hours: Math.round((k * 10000) / 50) * 50 })
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref}>
      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>The fox and the hedgehog</span>
        <span>Eight rooms · breadth × depth</span>
      </motion.div>

      <motion.h1 className="hero__gen" style={{ x: gX }} aria-label="Generalist and Specialist">
        {WORD.map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className={`gl gl--${STYLES[letters[i].style]}`}
            style={{ color: CHIPS[letters[i].color] }}
            initial={{ opacity: 0, y: (i % 2 ? -1 : 1) * 60, rotate: (i % 3) * 8 - 8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 1.3 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.h1>

      <div className="hero__band" onPointerLeave={() => setLit(-1)}>
        {FIELDS.map((f, i) => (
          <motion.span
            key={f}
            className={`chip ${lit === i ? 'is-lit' : ''}`}
            style={{ background: CHIPS[i % CHIPS.length] }}
            onPointerEnter={() => setLit(i)}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 1.5 + i * 0.03, ease }}
          >
            <em className="mono">{f}</em>
          </motion.span>
        ))}
      </div>

      <motion.div className="hero__shaft" ref={shaft} style={{ y: sY }} onPointerMove={onShaft} onPointerLeave={() => setDepth(null)} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.3, delay: 1.8, ease }}>
        <span className="hero__spec" aria-hidden="true">
          {'SPECIALIST'.split('').map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </span>
        {[2500, 5000, 7500, 10000].map((h) => (
          <span key={h} className="hero__tick mono" style={{ top: `${h / 100}%` }}>
            {h.toLocaleString('en-US')} h
          </span>
        ))}
        {depth && (
          <span className="hero__sound mono" style={{ top: depth.y }}>
            <i />
            {depth.hours.toLocaleString('en-US')} hours down
          </span>
        )}
      </motion.div>

      <motion.div className="hero__side hero__side--g" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 0.9, ease }}>
        <b className="mono">Breadth · Range · Connection</b>
        <q>Know something about many things.</q>
      </motion.div>
      <motion.div className="hero__side hero__side--s" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.9, ease }}>
        <b className="mono">Depth · Precision · Mastery</b>
        <q>Know everything about one thing.</q>
      </motion.div>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Run along the band. Sound the shaft.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
