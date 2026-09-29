import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { range, rng } from '../lib/geom.js'

// Matter: atoms in a void, colliding with the walls and with you.
function Atoms({ pointer }) {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const atoms = useRef(null)
  if (!atoms.current) {
    const r = rng(420)
    atoms.current = Array.from({ length: 170 }, () => ({ x: r(), y: r(), vx: (r() - 0.5) * 0.2, vy: (r() - 0.5) * 0.2, s: 3 + r() * 7 }))
  }

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.current = { w: el.clientWidth, h: el.clientHeight, dpr }
      canvas.current.width = el.clientWidth * dpr
      canvas.current.height = el.clientHeight * dpr
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(wrap, (_t, dt) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const p = pointer.current
    const b = wrap.current.getBoundingClientRect()
    const px = p.x - b.left
    const py = p.y - b.top
    ctx.fillStyle = '#f3c300'
    for (const a of atoms.current) {
      a.x += a.vx * dt
      a.y += a.vy * dt
      if (a.x < 0 || a.x > 1) (a.vx *= -1), (a.x = Math.min(1, Math.max(0, a.x)))
      if (a.y < 0 || a.y > 1) (a.vy *= -1), (a.y = Math.min(1, Math.max(0, a.y)))
      const x = a.x * w
      const y = a.y * h
      const d = Math.hypot(x - px, y - py)
      if (d < 90 && d > 0) {
        a.vx += ((x - px) / d) * 0.6 * dt
        a.vy += ((y - py) / d) * 0.6 * dt
      }
      const sp = Math.hypot(a.vx, a.vy)
      if (sp > 0.35) (a.vx *= 0.35 / sp), (a.vy *= 0.35 / sp)
      ctx.fillRect(x - a.s / 2, y - a.s / 2, a.s, a.s)
    }
  })

  return (
    <div className="hero__atoms" ref={wrap} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const title = useRef(null)
  const pointer = useRef({ x: -9999, y: -9999 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mX = useTransform(scrollYProgress, (p) => `${p * -24}vw`)
  const iX = useTransform(scrollYProgress, (p) => `${p * 24}vw`)
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))
  const lx = useMotionValue(0)
  const ly = useMotionValue(0)
  const sx = useSpring(lx, { stiffness: 120, damping: 20 })
  const sy = useSpring(ly, { stiffness: 120, damping: 20 })
  const clip = useTransform([sx, sy], ([x, y]) => `circle(150px at ${x}px ${y}px)`)
  const lamp = useTransform([sx, sy], ([x, y]) => `translate(${x - 150}px, ${y - 150}px)`)

  useEffect(() => {
    const place = () => {
      const t = title.current?.getBoundingClientRect()
      if (!t) return
      lx.set(t.width * 0.7)
      ly.set(t.height * 0.5)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [lx, ly])

  const onMove = (e) => {
    pointer.current = { x: e.clientX, y: e.clientY }
    const t = title.current.getBoundingClientRect()
    if (e.clientX > window.innerWidth * 0.5) {
      lx.set(e.clientX - t.left)
      ly.set(e.clientY - t.top)
    }
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={onMove} onPointerLeave={() => (pointer.current = { x: -9999, y: -9999 })}>
      <div className="hero__matter">
        <Atoms pointer={pointer} />
      </div>
      <div className="hero__mind" aria-hidden="true" />

      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>From Democritus to Chalmers</span>
        <span>Eight rooms · one world, or two?</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Materialism and Idealism">
        <motion.span className="hero__mat" style={{ x: mX }} aria-hidden="true">
          {'MATERIALISM'.split('').map((ch, i) => (
            <motion.span key={i} className="brick" initial={{ y: '-120%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 1.3 + i * 0.07 }}>
              {ch}
            </motion.span>
          ))}
        </motion.span>

        <span className="hero__mid" aria-hidden="true">
          <motion.span className="hero__side hero__side--m" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.3, duration: 0.8, ease }}>
            <b className="mono">Matter · Mechanism · Cause</b>
            <q>First, there is stuff.</q>
          </motion.span>
          <motion.span className="hero__and" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.1, duration: 1, ease }}>
            &amp;
          </motion.span>
          <motion.span className="hero__side hero__side--i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 1.6 }}>
            <b className="mono">Mind · Idea · Appearance</b>
            <q>First, there is experience.</q>
          </motion.span>
        </span>

        <motion.span className="hero__idea" style={{ x: iX }} ref={title} aria-hidden="true">
          <span className="hero__ghost">Idealism</span>
          <motion.span className="hero__seen" style={{ clipPath: clip }}>
            Idealism
          </motion.span>
          <motion.i className="hero__lamp" style={{ transform: lamp }} />
        </motion.span>
      </h1>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Push the atoms. Look at the word.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
