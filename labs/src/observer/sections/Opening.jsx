import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { pointer } from '@shared/lib/pointer.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, rng, TAU } from '@shared/lib/math.js'
import { Typed } from '@shared/components/Text.jsx'
import { blip } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

export default function Opening({ onEnter }) {
  const [phase, setPhase] = useState(0)
  const [typedDone, setTypedDone] = useState(false)
  const canvasRef = useRef(null)
  const titleRef = useRef(null)
  const live = useRef({ active: 0, swell: 0, phase: 0 })

  useEffect(() => {
    document.body.classList.add('is-locked')
    document.documentElement.classList.add('is-opening')
    const t = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2100),
      setTimeout(() => setPhase(3), 3600),
      setTimeout(() => setPhase((p) => Math.max(p, 4)), 7200),
    ]
    return () => {
      t.forEach(clearTimeout)
      document.body.classList.remove('is-locked')
      document.documentElement.classList.remove('is-opening')
    }
  }, [])

  // once the light is awake, the first deliberate movement brings the next line
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
    const r = rng(7)
    const coarse = matchMedia('(pointer: coarse)').matches
    const N = coarse ? 160 : 320
    const dust = Array.from({ length: N }, () => ({
      x: r(),
      y: r(),
      z: 0.25 + r() * 0.75,
      ox: 0,
      oy: 0,
      seed: r() * 100,
    }))
    const L = { x: 0, y: 0, init: false }
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        st.active = approach(st.active, st.phase >= 3 ? 1 : 0, 1.4, dt)
        st.swell = approach(st.swell, 0, 3, dt)
        // where the light wants to be: the pointer, or a slow drift if there is none
        let tx = s.mx
        let ty = s.my
        if (!pointer.moved || pointer.type !== 'mouse') {
          if (!pointer.moved) {
            tx = w / 2 + Math.cos(t * 0.31) * w * 0.18
            ty = h * 0.62 + Math.sin(t * 0.47) * h * 0.08
          }
        }
        if (!L.init) {
          L.x = tx
          L.y = ty
          L.init = true
        }
        L.x = approach(L.x, tx, 6, dt)
        L.y = approach(L.y, ty, 6, dt)

        ctx.clearRect(0, 0, w, h)
        const sigma = 150 + st.swell * 260
        const a = st.active
        for (const p of dust) {
          const nx = noise3(p.x * 2.2, p.y * 2.2, t * 0.05 + p.seed)
          const ny = noise3(p.x * 2.2 + 40, p.y * 2.2, t * 0.05 + p.seed)
          p.x += nx * 0.0009 * p.z * dt * 60 * 0.4
          p.y += (ny * 0.0009 - 0.00012) * p.z * dt * 60 * 0.4
          if (p.y < -0.02) p.y = 1.02
          if (p.x < -0.02) p.x = 1.02
          if (p.x > 1.02) p.x = -0.02
          if (p.y > 1.02) p.y = -0.02
          let px = p.x * w
          let py = p.y * h
          const dx = px - L.x
          const dy = py - L.y
          const d2 = dx * dx + dy * dy
          const lit = Math.exp(-d2 / (2 * sigma * sigma)) * a
          // attention pushes the dust aside, a little
          const push = Math.exp(-d2 / (2 * 70 * 70)) * a * 26 * p.z
          const d = Math.sqrt(d2) || 1
          p.ox = approach(p.ox, (dx / d) * push, 4, dt)
          p.oy = approach(p.oy, (dy / d) * push, 4, dt)
          px += p.ox
          py += p.oy
          const alpha = 0.05 + lit * 0.75 * p.z
          ctx.fillStyle = `rgba(232,229,222,${alpha.toFixed(3)})`
          const sz = 0.5 + p.z * 1.1 + lit * 0.6
          ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz)
        }
        if (a > 0.01) {
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 120 + st.swell * 400)
          g.addColorStop(0, `rgba(232,229,222,${0.12 * a})`)
          g.addColorStop(1, 'rgba(232,229,222,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 120 + st.swell * 400, 0, TAU)
          ctx.fill()
          ctx.fillStyle = `rgba(255,253,248,${0.95 * a})`
          ctx.beginPath()
          ctx.arc(L.x, L.y, 1.6 + st.swell * 3, 0, TAU)
          ctx.fill()
        }
        // the headline is lit from where attention is
        const el = titleRef.current
        if (el) {
          const rr = el.getBoundingClientRect()
          el.style.setProperty('--lx', `${L.x + s.left - rr.left}px`)
          el.style.setProperty('--ly', `${L.y + s.top - rr.top}px`)
          el.style.setProperty('--la', a.toFixed(3))
        }
      },
    }
  })

  const enter = () => {
    live.current.swell = 1
    blip(660, 0.03, 0.4)
    onEnter()
  }

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
          animate={phase >= 1 ? { opacity: 1, filter: 'blur(0px)', letterSpacing: '0.06em' } : {}}
          transition={{ duration: 3.2, ease: EASE }}
        >
          You are aware.
        </motion.h1>
        <motion.p
          className="opening__q"
          initial={{ opacity: 0, y: 6 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2, ease: EASE }}
        >
          But what exactly is aware?
        </motion.p>
      </div>

      <div className="opening__foot">
        <p className="mono mono--dim opening__msg">
          <Typed
            start={phase >= 4}
            text="Your attention is already interacting with the system."
            speed={38}
            onDone={() => setTimeout(() => setTypedDone(true), 700)}
          />
        </p>
        <AnimatePresence>
          {typedDone && (
            <motion.button
              className="enter"
              onClick={enter}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: EASE }}
            >
              <span className="enter__ring" aria-hidden="true" />
              <span className="mono mono--ink">Enter the observer</span>
            </motion.button>
          )}
        </AnimatePresence>
        <p className="mono mono--dim opening__fine">
          Sound · headphones recommended · nothing you do leaves this device
        </p>
      </div>

      <div className="opening__marks mono mono--dim" aria-hidden="true">
        <span>OBS-00</span>
        <span>SUBJECT: PRESENT</span>
      </div>
    </motion.section>
  )
}
