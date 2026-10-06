import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '../lib/useCanvas.js'
import { pointer } from '../lib/pointer.js'
import { approach, clamp, cool, ink, TAU } from '../lib/math.js'
import { getState } from '../lib/store.js'
import { blip, tone } from '../lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]
// [seconds after arrival, line, style]
const SCRIPT = [
  [0.8, 'You have spent the entire experience observing a system.', 'caps'],
  [5.6, 'The system was you.', 'caps'],
  [9.6, 'Or was it?', 'caps'],
  [15, 'Who is looking?', 'caps'],
]
const POINT_AT = 13
const CODA = [
  [19.5, 'There is no final answer.'],
  [22, 'Only another thought.'],
]
const END_AT = 25.5
const DELAY = 0.35 // the reflection is always a little late

export default function Mirror({ onRestart }) {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [t0, setT0] = useState(0)
  const [now, setNow] = useState(0)
  const live = useRef({ t0: 0 })
  live.current.t0 = t0

  // the sequence begins once, when the mirror is mostly in view
  useEffect(() => {
    const el = sectionRef.current
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.6) setT0((v) => v || performance.now())
      },
      { threshold: [0, 0.6, 0.9] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!t0) return
    const id = setInterval(() => setNow((performance.now() - t0) / 1000), 200)
    return () => clearInterval(id)
  }, [t0])

  useEffect(() => {
    if (!t0) return
    const cues = [
      [5.6, () => tone(196, { dur: 4, gain: 0.04 })],
      [9.6, () => tone(185, { dur: 3, gain: 0.03, detune: 12 })],
      [POINT_AT, () => blip(2600, 0.012, 0.3)],
      [15, () => tone(130.8, { dur: 6, gain: 0.04, type: 'triangle' })],
      [22, () => tone(523.3, { dur: 5, gain: 0.015 })],
    ].map(([at, fn]) => setTimeout(fn, at * 1000))
    return () => cues.forEach(clearTimeout)
  }, [t0])

  useCanvas(canvasRef, (ctx, s) => {
    const hist = []
    let ring = 0
    let lightA = 0
    const L = { x: 0, y: 0, init: false }
    let traceImg = null
    let traceSize = ''
    const buildTrace = (cx, cy, R) => {
      const c = document.createElement('canvas')
      c.width = Math.ceil(R * 2 * s.dpr)
      c.height = Math.ceil(R * 2 * s.dpr)
      const g = c.getContext('2d')
      g.scale(s.dpr, s.dpr)
      g.strokeStyle = 'rgba(232,229,222,0.09)'
      g.lineWidth = 0.6
      g.beginPath()
      const tr = pointer.trail
      for (let i = 0; i < tr.length; i++) {
        const x = R + (tr[i][0] - 0.5) * R * 1.6
        const y = R + (tr[i][1] - 0.5) * R * 1.6
        i ? g.lineTo(x, y) : g.moveTo(x, y)
      }
      g.stroke()
      return c
    }
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const el = st.t0 ? (performance.now() - st.t0) / 1000 : 0
        const cx = w / 2
        const cy = h / 2
        const R = Math.min(w, h) * 0.24
        ring = approach(ring, st.t0 ? 1 : 0, 0.8, dt)
        lightA = approach(lightA, el > POINT_AT ? 1 : 0, 1.5, dt)
        ctx.clearRect(0, 0, w, h)

        // the faint circle
        ctx.strokeStyle = ink(0.16 + 0.1 * ring * Math.sin(el * 0.8) ** 2)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, R * (0.98 + 0.02 * ring), 0, TAU)
        ctx.stroke()

        if (lightA > 0.01) {
          // where your attention went, the whole time
          const key = `${w}x${h}x${pointer.trail.length > 0}`
          if (!traceImg || traceSize !== key) {
            traceImg = buildTrace(cx, cy, R)
            traceSize = key
          }
          ctx.save()
          ctx.globalAlpha = lightA
          ctx.beginPath()
          ctx.arc(cx, cy, R, 0, TAU)
          ctx.clip()
          ctx.drawImage(traceImg, cx - R, cy - R, R * 2, R * 2)
          ctx.restore()

          if (!L.init) {
            L.x = s.mx
            L.y = s.my
            L.init = true
          }
          L.x = approach(L.x, s.inside ? s.mx : L.x, 16, dt)
          L.y = approach(L.y, s.inside ? s.my : L.y, 16, dt)
          hist.push([performance.now(), L.x, L.y])
          while (hist.length && performance.now() - hist[0][0] > 2000) hist.shift()
          // the reflection: mirrored, made small, and late
          const target = performance.now() - DELAY * 1000
          let past = hist[0]
          for (const p of hist) {
            if (p[0] > target) break
            past = p
          }
          if (past) {
            const rx = cx - ((past[1] - cx) / (w / 2)) * R * 0.85
            const ry = cy + ((past[2] - cy) / (h / 2)) * R * 0.85
            const d = Math.hypot(rx - cx, ry - cy)
            if (d < R) {
              const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 18)
              g.addColorStop(0, cool(0.35 * lightA))
              g.addColorStop(1, cool(0))
              ctx.fillStyle = g
              ctx.beginPath()
              ctx.arc(rx, ry, 18, 0, TAU)
              ctx.fill()
              ctx.fillStyle = cool(0.9 * lightA)
              ctx.beginPath()
              ctx.arc(rx, ry, 1.6, 0, TAU)
              ctx.fill()
            }
          }
          // you, as a point of light
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 60)
          g.addColorStop(0, ink(0.16 * lightA))
          g.addColorStop(1, ink(0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 60, 0, TAU)
          ctx.fill()
          ctx.fillStyle = `rgba(255,253,248,${lightA})`
          ctx.beginPath()
          ctx.arc(L.x, L.y, 2, 0, TAU)
          ctx.fill()
          ctx.font = '9.5px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = cool(0.45 * lightA * clamp((el - POINT_AT - 2) / 2))
          ctx.fillText(`REFLECTION · −${DELAY.toFixed(2)} s`, cx + R * 0.74, cy - R * 0.74)
        }
      },
    }
  })

  const line = [...SCRIPT].reverse().find(([at]) => now >= at)
  const pointMode = now > POINT_AT
  const st = getState()
  const minutes = st.entered ? Math.max(1, Math.round((performance.now() - st.entered) / 60000)) : 1
  const metres = ((pointer.travel / 96) * 0.0254).toFixed(1)

  return (
    <section id="mirror" ref={sectionRef} className={`mirror ${pointMode ? 'is-point' : ''}`} data-section>
      <canvas
        ref={canvasRef}
        aria-label="A faint circle in the dark. Inside it, a delayed reflection of your pointer."
      />
      <div className="mirror__text" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && (
            <motion.p
              key={line[1]}
              className={`mirror__line ${line[1] === 'Who is looking?' ? 'is-final' : ''}`}
              initial={{ opacity: 0, filter: 'blur(16px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(12px)' }}
              transition={{ duration: 1.8, ease: EASE }}
            >
              {line[1]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="mirror__coda">
        {CODA.map(([at, text]) => (
          <motion.p
            key={text}
            className="whisper"
            initial={{ opacity: 0 }}
            animate={{ opacity: now >= at ? 1 : 0 }}
            transition={{ duration: 2, ease: EASE }}
          >
            {text}
          </motion.p>
        ))}
      </div>
      <motion.footer
        className="mirror__foot"
        initial={{ opacity: 0 }}
        animate={{ opacity: now >= END_AT ? 1 : 0 }}
        transition={{ duration: 2 }}
        style={{ pointerEvents: now >= END_AT ? 'auto' : 'none' }}
      >
        <p className="mono mono--dim">
          {minutes} {minutes === 1 ? 'minute' : 'minutes'} inside · your attention travelled {metres} m across this
          screen · nothing you did left this device
        </p>
        <button className="btn btn--ghost mirror__again" onClick={onRestart}>
          ↺ Begin again
        </button>
        <p className="mono mono--dim mirror__credit">
          The Observer — a laboratory for a mind that knows it is a mind · procedural graphics · synthesised sound
        </p>
      </motion.footer>
    </section>
  )
}
