import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, rng, range } from '../lib/geom.js'
import { GLYPHS, glyphPath } from '../lib/glyphs.js'

const SEAM = 0.58 // where the obsidian ends and the white begins

// Ritual geometry: rings, ticks and the twelve signs, turning very slowly.
function Wheel() {
  return (
    <>
      <svg viewBox="-200 -200 400 400" className="hero__wheel hero__wheel-outer" aria-hidden="true">
        <g>
          <circle r="192" className="w-line" />
          <circle r="150" className="w-line" />
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1="0" y1={-192} x2="0" y2={i % 6 === 0 ? -178 : -186} transform={`rotate(${i * 5})`} className="w-line" />
          ))}
          {GLYPHS.map((g, i) => (
            <g key={g.id} transform={`rotate(${i * 30}) translate(0 -171) scale(0.17) translate(-50 -50)`}>
              <path d={glyphPath(g.prims)} className="w-glyph" />
            </g>
          ))}
        </g>
      </svg>
      <svg viewBox="-200 -200 400 400" className="hero__wheel hero__wheel-inner" aria-hidden="true">
        <g>
          <circle r="112" className="w-line w-line--dash" />
          <polygon points={Array.from({ length: 3 }, (_, i) => `${Math.sin((i * TAU) / 3) * 112},${-Math.cos((i * TAU) / 3) * 112}`).join(' ')} className="w-line" />
          <polygon points={Array.from({ length: 3 }, (_, i) => `${Math.sin((i * TAU) / 3 + Math.PI) * 112},${-Math.cos((i * TAU) / 3 + Math.PI) * 112}`).join(' ')} className="w-line" />
          <circle r="56" className="w-line" />
        </g>
        <circle r="10" className="w-core" />
      </svg>
    </>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const pointer = useRef({ x: -1, y: -1, on: false })
  const mu = useRef(0.72)
  const stars = useRef(null)
  const cols = useRef(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fade = useTransform(scrollYProgress, range(0, 0.7, 1, 0))
  const oY = useTransform(scrollYProgress, (p) => `${p * -18}vh`)
  const aY = useTransform(scrollYProgress, (p) => `${p * 22}vh`)

  useEffect(() => {
    const r = rng(11)
    stars.current = Array.from({ length: 150 }, () => ({ x: r(), y: r(), m: 0.4 + r() * 1.4, ph: r() * TAU }))
    cols.current = Array.from({ length: 40 }, () => ({ sp: 30 + r() * 70, off: r() * 2000, seed: Math.floor(r() * 1e6), on: r() < 0.45 }))
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
    if (!el || !stars.current) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // wide screens split left | right; narrow ones split top / bottom
    const tall = w < 820
    const O = tall ? { x0: 0, x1: w, y0: 0, y1: h * 0.56 } : { x0: 0, x1: w * SEAM, y0: 0, y1: h }
    const A = tall ? { x0: 0, x1: w, y0: h * 0.56, y1: h } : { x0: w * SEAM, x1: w, y0: 0, y1: h }
    const inO = (x, y) => x < O.x1 && y < O.y1
    const inA = (x, y) => x > A.x0 && y > A.y0
    const P = pointer.current

    // ── oracle: stars, and a constellation that forms around the reader's hand
    const near = []
    for (const s of stars.current) {
      const x = O.x0 + s.x * (O.x1 - O.x0)
      const y = O.y0 + s.y * (O.y1 - O.y0)
      const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + s.ph)
      ctx.fillStyle = C.goldLt
      ctx.globalAlpha = 0.25 + 0.6 * tw
      ctx.beginPath()
      ctx.arc(x, y, s.m, 0, TAU)
      ctx.fill()
      if (P.on && inO(P.x, P.y)) {
        const d = Math.hypot(x - P.x, y - P.y)
        if (d < 170) near.push({ x, y, d })
      }
    }
    if (near.length) {
      near.sort((a, b) => a.d - b.d)
      const pts = near.slice(0, 7)
      ctx.strokeStyle = C.gold
      ctx.lineWidth = 1
      // a chain from the nearest star outwards: each joins the closest one already in the figure
      const inFig = [pts[0]]
      for (let i = 1; i < pts.length; i++) {
        let best = inFig[0]
        for (const q of inFig) if (Math.hypot(q.x - pts[i].x, q.y - pts[i].y) < Math.hypot(best.x - pts[i].x, best.y - pts[i].y)) best = q
        ctx.globalAlpha = 0.85 * (1 - pts[i].d / 170)
        ctx.beginPath()
        ctx.moveTo(best.x, best.y)
        ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
        inFig.push(pts[i])
      }
      for (const q of pts) {
        ctx.globalAlpha = 1
        ctx.fillStyle = C.goldLt
        ctx.beginPath()
        ctx.arc(q.x, q.y, 2.4, 0, TAU)
        ctx.fill()
      }
    }

    // ── algorithm: a grid, sparse columns of numbers, and a distribution
    ctx.globalAlpha = 1
    ctx.strokeStyle = C.rule
    ctx.lineWidth = 1
    const step = 44
    ctx.beginPath()
    for (let x = A.x0 + step; x < A.x1; x += step) {
      ctx.moveTo(Math.round(x) + 0.5, A.y0)
      ctx.lineTo(Math.round(x) + 0.5, A.y1)
    }
    for (let y = A.y0 + step; y < A.y1; y += step) {
      ctx.moveTo(A.x0, Math.round(y) + 0.5)
      ctx.lineTo(A.x1, Math.round(y) + 0.5)
    }
    ctx.stroke()

    ctx.font = '500 10px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    cols.current.forEach((c, i) => {
      const x = A.x0 + step * (i + 1)
      if (x > A.x1 - 8 || !c.on) return
      const head = A.y0 + ((t * c.sp + c.off) % (A.y1 - A.y0 + 240)) - 40
      for (let k = 0; k < 9; k++) {
        const y = head - k * 16
        if (y < A.y0 + 6 || y > A.y1 + 10) continue
        const v = ((c.seed + Math.floor(t * 3) * 7 + k * 13) * 2654435761) >>> 0
        ctx.fillStyle = k === 0 ? C.blue : C.black
        ctx.globalAlpha = k === 0 ? 0.95 : 0.32 * (1 - k / 9)
        ctx.fillText(k === 0 ? `.${String(v % 100).padStart(2, '0')}` : String(v % 10), x, y)
      }
    })

    // the distribution: its mean follows the pointer
    const target = P.on && inA(P.x, P.y) ? (P.x - A.x0) / (A.x1 - A.x0) : 0.5 + 0.22 * Math.sin(t * 0.35)
    mu.current += (target - mu.current) * Math.min(1, dt * 3)
    const x0 = A.x0 + 24
    const x1 = A.x1 - 24
    const base = tall ? A.y0 + (A.y1 - A.y0) * 0.55 : h * 0.64
    const amp = (A.y1 - A.y0) * (tall ? 0.22 : 0.26)
    const sd = 0.11
    const m = mu.current
    ctx.globalAlpha = 1
    ctx.beginPath()
    for (let i = 0; i <= 120; i++) {
      const u = i / 120
      const y = base - amp * Math.exp(-((u - m) ** 2) / (2 * sd * sd))
      const x = x0 + (x1 - x0) * u
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.lineTo(x1, base)
    ctx.lineTo(x0, base)
    ctx.closePath()
    ctx.fillStyle = C.blue
    ctx.globalAlpha = 0.1
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = C.blue
    ctx.lineWidth = 2
    ctx.stroke()
    // ±1σ band
    ctx.fillStyle = C.blue
    ctx.globalAlpha = 0.16
    ctx.fillRect(x0 + (x1 - x0) * (m - sd), base - amp * 0.2, (x1 - x0) * sd * 2, amp * 0.2)
    const mx = x0 + (x1 - x0) * m
    ctx.globalAlpha = 1
    ctx.strokeStyle = C.black
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(mx, base - amp - 18)
    ctx.lineTo(mx, base + 10)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = C.black
    ctx.textAlign = 'left'
    ctx.font = '500 11px "JetBrains Mono", monospace'
    ctx.fillText(`μ = ${m.toFixed(3)}   σ = ${sd.toFixed(2)}`, Math.min(mx + 8, x1 - 150), base - amp - 22)

    // crosshair
    if (P.on && inA(P.x, P.y)) {
      ctx.strokeStyle = C.black
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(A.x0, P.y + 0.5)
      ctx.lineTo(A.x1, P.y + 0.5)
      ctx.moveTo(P.x + 0.5, A.y0)
      ctx.lineTo(P.x + 0.5, A.y1)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = C.blue
      ctx.fillRect(P.x - 3, P.y - 3, 6, 6)
      ctx.fillStyle = C.black
      ctx.fillText(`x ${((P.x - A.x0) / (A.x1 - A.x0)).toFixed(3)}  y ${(1 - (P.y - A.y0) / (A.y1 - A.y0)).toFixed(3)}`, Math.min(P.x + 10, w - 170), P.y - 10)
    }
    ctx.globalAlpha = 1
  })

  const move = (e) => {
    const b = ref.current.getBoundingClientRect()
    pointer.current = { x: e.clientX - b.left, y: e.clientY - b.top, on: true }
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={move} onPointerLeave={() => (pointer.current.on = false)}>
      <div className="hero__o" aria-hidden="true" />
      <canvas ref={canvas} className="hero__canvas" aria-hidden="true" />
      <motion.div className="hero__wheel-wrap" style={{ y: oY }} initial={{ opacity: 0, scale: 0.9, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 2.2, delay: 1.2, ease }}>
        <Wheel />
      </motion.div>

      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>Seven rooms · symbol × statistic</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Oracle versus Algorithm">
        <motion.span className="hero__oracle" aria-hidden="true" style={{ y: oY }}>
          {'Oracle'.split('').map((ch, i) => (
            <motion.span key={i} initial={{ opacity: 0, filter: 'blur(14px)', y: 30 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} transition={{ duration: 1.6, delay: 1.3 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}>
              {ch}
            </motion.span>
          ))}
        </motion.span>
        <motion.span className="hero__vs mono" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
          vs
        </motion.span>
        <motion.span className="hero__algo" aria-hidden="true" style={{ y: aY }}>
          {'ALGORITHM'.split('').map((ch, i) => (
            <span key={i} className="hero__algo-clip">
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 1.5 + i * 0.045, ease }}>
                {ch}
              </motion.span>
            </span>
          ))}
        </motion.span>
      </h1>

      <motion.div className="hero__side hero__side--o" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.9, ease }}>
        <b className="mono">Symbol · Intuition · Mystery</b>
        <q>Read what cannot be measured.</q>
      </motion.div>
      <motion.div className="hero__side hero__side--a" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.8, duration: 0.9, ease }}>
        <b className="mono">Data · Probability · Computation</b>
        <q>Calculate what can be predicted.</q>
      </motion.div>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Move through the stars. Move across the grid.</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
