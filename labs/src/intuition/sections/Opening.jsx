import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { pointer } from '@shared/lib/pointer.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, clamp, ink, rng, TAU } from '@shared/lib/math.js'
import { Typed } from '@shared/components/Text.jsx'
import { blip } from '@shared/lib/audio.js'
import { ne, ni } from '../color.js'

const EASE = [0.2, 0.7, 0.1, 1]
const GAP_AT = -Math.PI / 4 // the missing piece sits at the upper right
const GAP_HALF = 0.42

// a branching that grows out of each end of the broken line
function tendrils(r) {
  const segs = []
  const grow = (x, y, a, len, depth) => {
    if (depth > 6) return
    const x2 = x + Math.cos(a) * len
    const y2 = y + Math.sin(a) * len
    segs.push({ x, y, x2, y2, depth })
    const n = depth < 2 ? 2 : r() < 0.7 ? 2 : 1
    for (let k = 0; k < n; k++) {
      const turn = (k === 0 ? -1 : 1) * (0.25 + r() * 0.5)
      grow(x2, y2, a + turn, len * (0.62 + r() * 0.2), depth + 1)
    }
  }
  // positions are in units of the circle's radius, relative to its centre
  for (const side of [-1, 1]) {
    const a = GAP_AT + side * GAP_HALF
    const x = Math.cos(a)
    const y = Math.sin(a)
    const tangent = a + side * (Math.PI / 2)
    grow(x, y, tangent - side * 0.5, 0.2, 0)
  }
  return segs
}

export default function Opening({ onEnter }) {
  const [phase, setPhase] = useState(0)
  const [typedDone, setTypedDone] = useState(false)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const live = useRef({ phase: 0 })

  useEffect(() => {
    document.body.classList.add('is-locked')
    document.documentElement.classList.add('is-opening')
    const t = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2100),
      setTimeout(() => setPhase(3), 3600),
      setTimeout(() => setPhase((p) => Math.max(p, 4)), 7400),
    ]
    return () => {
      t.forEach(clearTimeout)
      document.body.classList.remove('is-locked')
      document.documentElement.classList.remove('is-opening')
    }
  }, [])

  useEffect(() => {
    live.current.phase = phase
    if (phase !== 3) return
    const start = pointer.travel
    const id = setInterval(() => {
      if (pointer.travel - start > 140) setPhase((p) => Math.max(p, 4))
    }, 120)
    return () => clearInterval(id)
  }, [phase])

  useCanvas(canvasRef, (ctx, s) => {
    const r = rng(17)
    const arc = Array.from({ length: 460 }, () => {
      // anywhere on the circle except the gap
      const a = GAP_AT + GAP_HALF + r() * (TAU - GAP_HALF * 2)
      return { a, j: (r() - 0.5) * 0.03, z: 0.4 + r() * 0.6, seed: r() * 50 }
    })
    const dust = Array.from({ length: 180 }, () => ({ x: r(), y: r(), z: 0.2 + r() * 0.8 }))
    const segs = tendrils(r)
    const L = { x: 0, y: 0, init: false }
    let active = 0
    let grow = 0
    let close = 0
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        active = approach(active, st.phase >= 3 ? 1 : 0, 1.3, dt)
        const tx = pointer.moved ? s.mx : w / 2 + Math.cos(t * 0.3) * w * 0.2
        const ty = pointer.moved ? s.my : h * 0.6 + Math.sin(t * 0.45) * h * 0.1
        if (!L.init) {
          L.x = tx
          L.y = ty
          L.init = true
        }
        L.x = approach(L.x, tx, 6, dt)
        L.y = approach(L.y, ty, 6, dt)

        const cx = w / 2
        const cy = h * 0.46
        const R = Math.min(w, h) * 0.34
        const gx = cx + Math.cos(GAP_AT) * R
        const gy = cy + Math.sin(GAP_AT) * R
        const near = clamp(1 - Math.hypot(L.x - gx, L.y - gy) / (R * 0.9)) * active
        // stillness near the gap closes it; movement near it sends it outward
        const speed = clamp(pointer.speed / 1400)
        close = approach(close, active * (0.25 + 0.75 * near * (1 - speed)), 1.2, dt)
        grow = clamp(grow + dt * (near * speed * 1.8 + active * 0.04) - dt * 0.08)

        ctx.clearRect(0, 0, w, h)
        for (const p of dust) {
          const d = Math.hypot(p.x * w - L.x, p.y * h - L.y)
          const lit = Math.exp(-(d * d) / (2 * 160 * 160)) * active
          ctx.fillStyle = ink(0.04 + lit * 0.6 * p.z)
          ctx.fillRect(p.x * w, p.y * h, 1 + p.z, 1 + p.z)
          p.y -= dt * 0.002 * p.z
          if (p.y < 0) p.y = 1
        }
        // the broken circle
        for (const p of arc) {
          const rr = R * (1 + p.j + noise3(p.seed, t * 0.3, 0) * 0.006)
          const x = cx + Math.cos(p.a) * rr
          const y = cy + Math.sin(p.a) * rr
          const d = Math.hypot(x - L.x, y - L.y)
          const lit = Math.exp(-(d * d) / (2 * 180 * 180)) * active
          ctx.fillStyle = ink(0.2 + 0.25 * p.z + lit * 0.5)
          ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4)
        }
        // inward: the mind closes the gap with the one curve that fits
        if (close > 0.01) {
          ctx.beginPath()
          ctx.arc(cx, cy, R, GAP_AT - GAP_HALF, GAP_AT + GAP_HALF)
          ctx.strokeStyle = ni(0.18 * close)
          ctx.lineWidth = 7
          ctx.stroke()
          ctx.strokeStyle = ni(0.9 * close)
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.lineWidth = 1
        }
        // outward: or it follows every way the line could go on
        if (grow > 0.01) {
          ctx.beginPath()
          for (const sg of segs) {
            const f = clamp(grow * 7.5 - sg.depth)
            if (f <= 0) continue
            ctx.moveTo(cx + sg.x * R, cy + sg.y * R)
            ctx.lineTo(cx + (sg.x + (sg.x2 - sg.x) * f) * R, cy + (sg.y + (sg.y2 - sg.y) * f) * R)
          }
          ctx.strokeStyle = ne(0.6 * clamp(grow * 2))
          ctx.stroke()
        }
        if (active > 0.01) {
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 120)
          g.addColorStop(0, ink(0.1 * active))
          g.addColorStop(1, ink(0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 120, 0, TAU)
          ctx.fill()
          ctx.fillStyle = `rgba(255,253,248,${0.95 * active})`
          ctx.beginPath()
          ctx.arc(L.x, L.y, 1.6, 0, TAU)
          ctx.fill()
        }
        const el = titleRef.current
        if (el) {
          const rr = el.getBoundingClientRect()
          el.style.setProperty('--lx', `${L.x + s.left - rr.left}px`)
          el.style.setProperty('--ly', `${L.y + s.top - rr.top}px`)
          el.style.setProperty('--la', active.toFixed(3))
        }
      },
    }
  })

  return (
    <motion.section
      className="opening"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      aria-label="Opening"
    >
      <canvas ref={canvasRef} className="opening__canvas" aria-hidden="true" />
      <div className="opening__center">
        <motion.h1
          ref={titleRef}
          className="opening__title"
          initial={{ opacity: 0, filter: 'blur(22px)', letterSpacing: '0.24em' }}
          animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.05em' } : {}}
          transition={{ duration: 3.2, ease: EASE }}
        >
          Something is missing.
        </motion.h1>
        <motion.p
          className="opening__q"
          initial={{ opacity: 0, y: 6 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2, ease: EASE }}
        >
          And you have already started to fill it in.
        </motion.p>
      </div>

      <div className="opening__foot">
        <p className="mono mono--dim opening__msg">
          <Typed
            start={phase >= 4}
            text="Rest near the gap and it closes. Move fast and it branches."
            speed={36}
            onDone={() => setTimeout(() => setTypedDone(true), 900)}
          />
        </p>
        <AnimatePresence>
          {typedDone && (
            <motion.button
              className="enter"
              onClick={() => {
                blip(660, 0.03, 0.4)
                onEnter()
              }}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: EASE }}
            >
              <span className="enter__mark" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="mono mono--ink">Step into the gap</span>
            </motion.button>
          )}
        </AnimatePresence>
        <p className="mono mono--dim opening__fine">
          Sound · headphones recommended · nothing you do leaves this device
        </p>
      </div>

      <div className="opening__marks mono mono--dim" aria-hidden="true">
        <span>INT-00</span>
        <span>
          <span className="t-ne">Ne</span> / <span className="t-ni">Ni</span>
        </span>
      </div>
    </motion.section>
  )
}
