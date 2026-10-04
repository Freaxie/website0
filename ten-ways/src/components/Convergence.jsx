import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { ARCHETYPES } from '../lib/archetypes.js'
import { form } from '../lib/forms.js'
import { TAU, clamp, lerp, smooth } from '../lib/geom.js'
import { bus } from '../lib/bus.js'

// Unlocked by meeting all twenty worlds: each world's geometry leaves its place and joins one orbit.
export default function Convergence() {
  const [open, setOpen] = useState(() => bus.experienced.size === ARCHETYPES.length)
  useEffect(() => bus.on((type) => type === 'all' && setOpen(true)), [])
  return open ? <Orbit /> : null
}

function Orbit() {
  const ref = useRef(null)
  const canvas = useRef(null)
  const t0 = useRef(null)

  useLoop(ref, (t) => {
    const el = canvas.current
    if (!el) return
    if (t0.current === null) t0.current = t
    const b = el.getBoundingClientRect()
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    if (el.width !== Math.round(b.width * dpr)) {
      el.width = Math.round(b.width * dpr)
      el.height = Math.round(b.height * dpr)
    }
    const ctx = el.getContext('2d')
    const w = b.width
    const h = b.height
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const p = clamp((t - t0.current) / 7)
    const cx = w / 2
    const cy = h / 2
    const R1 = Math.min(w, h) * 0.38
    const R2 = Math.min(w, h) * 0.26
    ARCHETYPES.forEach((a, k) => {
      const f = form(a.id)
      const home = (k / ARCHETYPES.length) * TAU - Math.PI / 2
      const hx = cx + Math.cos(home) * R1
      const hy = cy + Math.sin(home) * R1
      const cell = Math.min(w, h) * 0.08
      ctx.fillStyle = a.color
      for (let j = 0; j < 21; j++) {
        const q = f.pts[j * 20]
        const sx = hx + (q.x - 0.5) * cell
        const sy = hy + (q.y - 0.5) * cell
        const ang = ((k * 21 + j) / 420) * TAU + (t - t0.current) * 0.12
        const k2 = smooth(0.15 + k * 0.015, 0.75 + k * 0.01, p)
        const x = lerp(sx, cx + Math.cos(ang) * R2, k2)
        const y = lerp(sy, cy + Math.sin(ang) * R2, k2)
        ctx.globalAlpha = 0.9
        ctx.fillRect(x - 2, y - 2, 4, 4)
      }
    })
    const core = smooth(0.6, 1, p)
    ctx.globalAlpha = core
    ctx.fillStyle = '#0c0c0c'
    ctx.beginPath()
    ctx.arc(cx, cy, R2 * 0.42 * core, 0, TAU)
    ctx.fill()
    ctx.globalAlpha = 1
  })

  return (
    <motion.div className="conv" ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
      <canvas ref={canvas} aria-hidden="true" />
      <p>You have met reality twenty ways. It was one reality each time.</p>
    </motion.div>
  )
}
