import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { pointer } from '@shared/lib/pointer.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, clamp, rng, TAU } from '@shared/lib/math.js'
import { Typed } from '@shared/components/Text.jsx'
import { blip } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]
const LATTICE = Math.PI / 4 // the angle the needles agree on

// turn by the shortest way round
const turn = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

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
    let needles = []
    let active = 0
    let still = 0
    let rest = { x: 0, y: 0 }
    let agree = 0 // how far the agreement has spread from where the pointer came to rest, in px
    let lastMove = 0
    const L = { x: 0, y: 0, init: false }
    const build = (w, h) => {
      const r = rng(29)
      const step = w < 700 ? 30 : 26
      needles = []
      for (let y = step / 2; y < h + step; y += step)
        for (let x = step / 2; x < w + step; x += step) {
          needles.push({
            x: x + (r() - 0.5) * step * 0.35,
            y: y + (r() - 0.5) * step * 0.35,
            a: r() * TAU,
            seed: r() * 100,
            len: step * (0.32 + r() * 0.12),
            heat: 0,
          })
        }
    }
    return {
      resize(w, h) {
        build(w, h)
      },
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        active = approach(active, st.phase >= 3 ? 1 : 0, 1.3, dt)
        const tx = pointer.moved ? s.mx : w / 2 + Math.cos(t * 0.3) * w * 0.25
        const ty = pointer.moved ? s.my : h * 0.6 + Math.sin(t * 0.45) * h * 0.12
        if (!L.init) {
          L.x = tx
          L.y = ty
          L.init = true
        }
        const moved = Math.hypot(tx - L.x, ty - L.y)
        L.x = approach(L.x, tx, 10, dt)
        L.y = approach(L.y, ty, 10, dt)
        const moving = active > 0.5 && (moved > 1.5 || performance.now() - pointer.lastMove < 250)
        if (moving) {
          still = 0
          agree = 0
          lastMove = t
          rest = { x: L.x, y: L.y }
        } else still += dt
        // agreement spreads outward from the point of rest, at walking pace
        if (active > 0.5 && still > 0.5) agree += dt * 520
        const aimMix = active * clamp(1 - (t - lastMove) / 1.4) // pointing fades once you stop

        ctx.clearRect(0, 0, w, h)
        ctx.lineCap = 'round'
        for (const n of needles) {
          const dx = L.x - n.x
          const dy = L.y - n.y
          const d = Math.hypot(dx, dy) || 1
          const wander = noise3(n.seed, t * 0.08, 0) * Math.PI
          const reach = clamp((agree - Math.hypot(n.x - rest.x, n.y - rest.y)) / 140)
          let target = wander
          let rate = 0.6
          let heatT = 0
          let hue = 0 // −1 blue (agree), +1 orange (aim)
          if (reach > 0) {
            target = LATTICE
            rate = 3 + reach * 3
            heatT = reach
            hue = -1
          } else if (aimMix > 0.02) {
            target = Math.atan2(dy, dx)
            const near = clamp(1 - d / (Math.max(w, h) * 0.75))
            rate = 2 + near * 8
            heatT = aimMix * (0.25 + 0.75 * near)
            hue = 1
          }
          n.a = turn(n.a, target, Math.min(1, dt * rate))
          n.heat = approach(n.heat, heatT, 3, dt)
          n.hue = hue || n.hue || 0
          const c = Math.cos(n.a) * n.len
          const sn = Math.sin(n.a) * n.len
          const base = 0.14 + n.heat * 0.6
          ctx.strokeStyle =
            n.heat > 0.05
              ? n.hue < 0
                ? `rgba(104,128,255,${base})`
                : `rgba(240,106,46,${base})`
              : `rgba(232,229,222,${0.1 + 0.08 * active})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(n.x - c * 0.5, n.y - sn * 0.5)
          ctx.lineTo(n.x + c * 0.5, n.y + sn * 0.5)
          ctx.stroke()
          // the head of each needle, so pointing reads as pointing
          if (n.heat > 0.05 && n.hue > 0) {
            ctx.fillStyle = `rgba(240,106,46,${base})`
            ctx.fillRect(n.x + c * 0.5 - 1, n.y + sn * 0.5 - 1, 2, 2)
          }
        }
        if (active > 0.01) {
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 110)
          g.addColorStop(0, `rgba(232,229,222,${0.09 * active})`)
          g.addColorStop(1, 'rgba(232,229,222,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 110, 0, TAU)
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
          There are two ways to be right.
        </motion.h1>
        <motion.p
          className="opening__q"
          initial={{ opacity: 0, y: 6 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2, ease: EASE }}
        >
          And you already trust one of them more.
        </motion.p>
      </div>

      <div className="opening__foot">
        <p className="mono mono--dim opening__msg">
          <Typed
            start={phase >= 4}
            text="Hold still and they agree with each other. Move and they all point at you."
            speed={34}
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
              <span className="mono mono--ink">Enter the workshop</span>
            </motion.button>
          )}
        </AnimatePresence>
        <p className="mono mono--dim opening__fine">
          Sound · headphones recommended · nothing you do leaves this device
        </p>
      </div>

      <div className="opening__marks mono mono--dim" aria-hidden="true">
        <span>THK-00</span>
        <span>
          <span className="t-ti">Ti</span> / <span className="t-te">Te</span>
        </span>
      </div>
    </motion.section>
  )
}
