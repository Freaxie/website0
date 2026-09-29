import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, rng, range } from '../lib/geom.js'

const PUER = 'PUER'.split('')
const SENEX = 'SENEX'.split('')
const HORIZON = 0.64 // fraction of the height where sky ends and ground begins (0.6 on narrow screens)

export default function Hero() {
  const ref = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const pointer = useRef({ x: -1, y: -1, on: false })
  const puer = useRef([])
  const senA = useRef([])
  const senB = useRef([])
  // current offsets: the puer's letters lift and fall back; the senex's sink and stay down a long time
  const lift = useRef(PUER.map(() => 0))
  const sink = useRef(SENEX.map(() => 0))
  const feathers = useRef(null)
  const strata = useRef(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fade = useTransform(scrollYProgress, range(0, 0.7, 1, 0))
  const up = useTransform(scrollYProgress, (p) => `${p * -40}vh`)

  useEffect(() => {
    const r = rng(4)
    feathers.current = Array.from({ length: 46 }, () => ({ x: r(), y: r(), s: 0.4 + r(), sp: 0.012 + r() * 0.03, ph: r() * TAU, len: 10 + r() * 22 }))
    strata.current = Array.from({ length: 16 }, (_, i) => ({ y: i / 16, ph: r() * TAU, amp: 1 + r() * 3 }))
    const el = canvas.current
    const fit = () => {
      const b = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(b.width * dpr)
      el.height = Math.round(b.height * dpr)
      size.current = { w: b.width, h: b.height, dpr }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(ref, (t, dt) => {
    const el = canvas.current
    if (!el || !feathers.current) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    const hz = h * (w < 820 ? 0.6 : HORIZON)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // sky: feathers drifting up, rocking as they go
    ctx.lineCap = 'round'
    for (const f of feathers.current) {
      f.y -= f.sp * dt
      if (f.y < -0.05) {
        f.y = 1.02
        f.x = Math.random()
      }
      const x = f.x * w + Math.sin(t * 0.7 + f.ph) * 26
      const y = f.y * hz
      const a = Math.sin(t * 1.1 + f.ph) * 0.9
      ctx.strokeStyle = f.s > 1 ? C.sky : C.skyDk
      ctx.globalAlpha = 0.18 + 0.4 * Math.min(1, f.y * 2)
      ctx.lineWidth = f.s > 1 ? 1.5 : 1
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(a) * f.len * 0.5, y - Math.sin(a) * f.len * 0.5)
      ctx.quadraticCurveTo(x + Math.sin(a) * 5, y - Math.cos(a) * 5, x + Math.cos(a) * f.len * 0.5, y + Math.sin(a) * f.len * 0.5)
      ctx.stroke()
    }

    // ground: strata settling slowly downward
    ctx.globalAlpha = 1
    ctx.strokeStyle = C.slate
    ctx.lineWidth = 1
    const gh = h - hz
    for (const s of strata.current) {
      s.y += dt * 0.006
      if (s.y > 1) s.y -= 1
      const y = hz + s.y * gh
      ctx.globalAlpha = 0.25 + 0.5 * s.y
      ctx.beginPath()
      for (let x = 0; x <= w; x += 24) {
        const yy = y + Math.sin(x * 0.006 + s.ph) * s.amp * (1 + s.y * 2)
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // letters
    const box = ref.current.getBoundingClientRect()
    const P = pointer.current
    puer.current.forEach((s, i) => {
      if (!s) return
      const b = s.getBoundingClientRect()
      const cx = b.left + b.width / 2 - box.left
      const cy = b.top + b.height / 2 - box.top + lift.current[i]
      const d = P.on ? Math.hypot(P.x - cx, P.y - cy) : 1e9
      const target = Math.max(0, 1 - d / 320) * 140
      lift.current[i] += (target - lift.current[i]) * Math.min(1, dt * (target > lift.current[i] ? 5 : 1.4))
      const bob = Math.sin(t * 0.9 + i * 1.3) * 10
      const tilt = Math.sin(t * 0.6 + i) * 3
      s.style.transform = `translateY(${bob - lift.current[i]}px) rotate(${tilt}deg)`
    })
    senA.current.forEach((s, i) => {
      if (!s) return
      const b = s.getBoundingClientRect()
      const cx = b.left + b.width / 2 - box.left
      const top = b.top - box.top - sink.current[i]
      const near = P.on && Math.abs(P.x - cx) < b.width * 0.6 && P.y > top - 60 && P.y < top + b.height
      // pressed, a letter sinks; released, it rises back very slowly
      if (near) sink.current[i] = Math.min(b.height * 0.55, sink.current[i] + dt * 90)
      else sink.current[i] = Math.max(0, sink.current[i] - dt * 3)
      const tf = `translateY(${sink.current[i]}px)`
      s.style.transform = tf
      if (senB.current[i]) senB.current[i].style.transform = tf
    })
  })

  const move = (e) => {
    const b = ref.current.getBoundingClientRect()
    pointer.current = { x: e.clientX - b.left, y: e.clientY - b.top, on: true }
  }

  const ease = [0.76, 0, 0.24, 1]
  const senex = (refs, cls) => (
    <span className={`hero__senex ${cls}`} aria-hidden="true">
      {SENEX.map((ch, i) => (
        <span key={i} className="hero__senex-c">
          <motion.span initial={{ y: '-120%' }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 1.7 + i * 0.09, ease: [0.6, 0, 0.9, 1] }}>
            <span ref={(el) => (refs.current[i] = el)} className="hero__senex-l">
              {ch}
            </span>
          </motion.span>
        </span>
      ))}
    </span>
  )

  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={move} onPointerLeave={() => (pointer.current.on = false)}>
      <div className="hero__ground" aria-hidden="true" />
      <canvas ref={canvas} className="hero__canvas" aria-hidden="true" />
      <motion.i className="hero__sun" aria-hidden="true" style={{ y: up }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.6, delay: 1.3, ease }} />

      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>After Ovid, Jung, von Franz and Hillman</span>
        <span>Seven rooms · flight × weight</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Puer Aeternus and Senex">
        <motion.span className="hero__puer" style={{ y: up }} aria-hidden="true">
          {PUER.map((ch, i) => (
            <motion.span key={i} className="hero__puer-l-wrap" initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.8, delay: 1.2 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}>
              <span ref={(el) => (puer.current[i] = el)} className="hero__puer-l">
                {ch}
              </span>
            </motion.span>
          ))}
          <motion.em className="hero__aeternus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 1.9 }}>
            aeternus
          </motion.em>
        </motion.span>
        <span className="hero__senex-wrap">
          {senex(senA, 'hero__senex--above')}
          {senex(senB, 'hero__senex--below')}
        </span>
      </h1>

      <motion.div className="hero__side hero__side--p" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5, duration: 1.2, ease }}>
        <b className="mono">Spirit · Flight · Beginning</b>
        <q>Not yet. Everything is still possible.</q>
      </motion.div>
      <motion.div className="hero__side hero__side--s" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.7, duration: 1.2, ease }}>
        <b className="mono">Time · Weight · Duration</b>
        <q>Already. Everything has its limit.</q>
      </motion.div>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Lift the youth. Press on the old man.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
