import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'

const N = 1500

export default function Flame() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const pointer = useRef({ x: -9999, y: -9999 })
  const parts = useRef(null)
  const replaced = useRef(0)
  const [shown, setShown] = useState(0)

  const born = (q, age = 0) => {
    q.a = Math.random() * Math.PI * 2
    q.r = (Math.random() - 0.5) * 0.14
    q.life = 3 + Math.random() * 5
    q.age = age
    q.sp = 0.35 + Math.random() * 0.35
    q.dx = 0
    q.dy = 0
    q.hot = Math.random()
    return q
  }
  if (!parts.current) parts.current = Array.from({ length: N }, () => born({}, Math.random() * 6))

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.current = { w: el.clientWidth, h: el.clientHeight, dpr }
      canvas.current.width = el.clientWidth * dpr
      canvas.current.height = el.clientHeight * dpr
    })
    ro.observe(el)
    const id = setInterval(() => setShown(replaced.current), 250)
    return () => {
      ro.disconnect()
      clearInterval(id)
    }
  }, [])

  useLoop(wrap, (t, dt) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const narrow = w < 820
    const cx = narrow ? w / 2 : w * 0.56
    const cy = h * 0.55
    const R = Math.min(w, h) * (narrow ? 0.3 : 0.3)

    // the form: a circle that never moves
    ctx.strokeStyle = 'rgba(159,193,211,0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()

    const { x: px, y: py } = pointer.current
    for (const q of parts.current) {
      q.age += dt
      if (q.age > q.life) {
        born(q)
        replaced.current++
      }
      q.a += dt * q.sp
      const rr = R * (1 + q.r + Math.sin(q.a * 5 + t) * 0.02)
      let x = cx + Math.cos(q.a) * rr
      let y = cy + Math.sin(q.a) * rr
      const d = Math.hypot(x + q.dx - px, y + q.dy - py)
      if (d < 130) {
        const f = ((130 - d) / 130) * 260 * dt
        q.dx += ((x + q.dx - px) / (d || 1)) * f
        q.dy += ((y + q.dy - py) / (d || 1)) * f
      }
      q.dx *= 1 - Math.min(1, dt * 1.6)
      q.dy *= 1 - Math.min(1, dt * 1.6)
      x += q.dx
      y += q.dy
      const k = q.age / q.life
      const alpha = Math.min(1, k * 6) * Math.min(1, (1 - k) * 4)
      ctx.fillStyle = q.hot > 0.7 ? `rgba(255,174,66,${alpha})` : `rgba(229,67,28,${alpha})`
      const s = 1.4 + q.hot * 2.2
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
    }
  })

  const move = (e) => {
    const b = wrap.current.getBoundingClientRect()
    pointer.current = { x: e.clientX - b.left, y: e.clientY - b.top }
  }

  return (
    <section id="flame" className="flame">
      <div className="flame__canvas" ref={wrap} onPointerMove={move} onPointerLeave={() => (pointer.current = { x: -9999, y: -9999 })}>
        <canvas ref={canvas} role="img" aria-label="A ring made of short-lived sparks. Every spark is replaced within seconds, and the ring keeps its shape." />
      </div>
      <div className="flame__head">
        <SectionHead no="07" title="Form in Flux" tone="paper" kicker="A flame, a whirlpool, a living body: forms that last only because what they are made of keeps changing. Disturb it." />
      </div>

      <div className="flame__stats mono" aria-live="off">
        <div>
          <span>Sparks replaced since you arrived</span>
          <b>{shown.toLocaleString('en-US')}</b>
        </div>
        <div>
          <span>Shape</span>
          <b>a circle · unchanged</b>
        </div>
      </div>

      <figure className="flame__quote">
        <blockquote>“Changing, it rests.”</blockquote>
        <figcaption className="mono">Heraclitus, fragment 84a</figcaption>
        <p>
          The water changes and the river stays; the sparks change and the ring stays. Most of the matter in your body is exchanged over the years, and you remain you. Being is what the becoming keeps.
        </p>
      </figure>
    </section>
  )
}
