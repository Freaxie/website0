import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { lerp, rng, smooth } from '../lib/geom.js'

const WORDS = ['sweet', 'bitter', 'hot', 'cold', 'colour']

const STEPS = [
  { k: 'I', h: 'How things seem', p: 'Sweet and bitter, hot and cold, red and blue: the world as it shows up to someone.' },
  {
    k: 'II',
    h: 'How things are',
    p: '“By convention sweet, by convention bitter, by convention hot, by convention cold, by convention colour; in reality, atoms and void.” Democritus, c. 420 BCE',
  },
  {
    k: 'III',
    h: 'Two kinds of quality',
    p: 'Galileo and later Locke kept the split: shape, size and motion belong to things themselves; colour, taste and warmth exist only in the one who perceives.',
  },
  {
    k: 'IV',
    h: 'Berkeley’s reply',
    p: 'In 1710 George Berkeley pushed back: shape and motion are known only through the senses too. Strip away every quality that lives in the mind, and nothing is left over to be “matter”.',
  },
]

function sample(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const size = Math.min(h / (WORDS.length * 1.02), w / 4.2)
  ctx.font = `italic ${size}px 'Instrument Serif', serif`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#000'
  const x0 = w * (w < 820 ? 0.08 : 0.1)
  WORDS.forEach((word, i) => ctx.fillText(word, x0, h * 0.14 + i * size * 0.98))
  const data = ctx.getImageData(0, 0, w, h).data
  const r = rng(68)
  const pts = []
  const step = w < 820 ? 4 : 5
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step)
      if (data[(y * w + x) * 4 + 3] > 128) {
        const word = Math.min(WORDS.length - 1, Math.max(0, Math.floor((y - h * 0.14 + size * 0.49) / (size * 0.98))))
        pts.push({ x, y, word, tx: r() * w, ty: r() * h, ph: r() * 6.28, s: 1.5 + r() * 2.5 })
      }
  return pts
}

export default function Atoms() {
  const ref = useRef(null)
  const wrap = useRef(null)
  const canvas = useRef(null)
  const pts = useRef([])
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(p < 0.2 ? 0 : p < 0.55 ? 1 : p < 0.78 ? 2 : 3))
  // the title turns light once the void has risen behind it
  const ink = useTransform(scrollYProgress, (p) => (p > 0.5 ? '#f4f3fb' : '#0c0c0e'))

  useEffect(() => {
    const el = wrap.current
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      size.current = { w, h, dpr }
      canvas.current.width = w * dpr
      canvas.current.height = h * dpr
      pts.current = sample(w, h)
    }
    let ro
    ;(document.fonts?.ready || Promise.resolve()).then(() => {
      build()
      ro = new ResizeObserver(build)
      ro.observe(el)
    })
    return () => ro?.disconnect()
  }, [])

  useLoop(wrap, (t) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    const p = scrollYProgress.get()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#f4f3fb'
    ctx.fillRect(0, 0, w, h)
    // the void rises from below
    const v = smooth(0.12, 0.6, p)
    ctx.fillStyle = '#151412'
    ctx.fillRect(0, h * (1 - v), w, h * v)
    for (const q of pts.current) {
      const e = smooth(0.14 + q.word * 0.07, 0.3 + q.word * 0.07, p)
      const jit = e * 6
      const x = lerp(q.x, q.tx, e) + Math.sin(t * 2 + q.ph) * jit
      const y = lerp(q.y, q.ty, e) + Math.cos(t * 1.7 + q.ph) * jit
      if (e < 0.5) {
        ctx.fillStyle = '#3c3cff'
        ctx.fillRect(x, y, 5, 5)
      } else {
        ctx.fillStyle = '#f3c300'
        ctx.fillRect(x - q.s / 2, y - q.s / 2, q.s, q.s)
      }
    }
  })

  const s = STEPS[step]
  return (
    <section id="atoms" className="atm" ref={ref}>
      <div className="atm__sticky">
        <div className="atm__canvas" ref={wrap}>
          <canvas ref={canvas} role="img" aria-label="The words sweet, bitter, hot, cold and colour dissolve into moving yellow particles on a dark ground" />
        </div>
        <motion.div className="atm__head" style={{ color: ink }}>
          <SectionHead no="03" title="Atoms & Void" tone="inherit" kicker="Take away what you taste and see. What is left?" />
        </motion.div>
        <div className="atm__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={s.k} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45 }}>
              <span className="atm__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
