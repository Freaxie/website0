import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { approach, clamp, TAU } from '@shared/lib/math.js'
import { getState } from '@shared/lib/store.js'
import { swell, tone } from '@shared/lib/audio.js'
import { ne, ni, niDeep } from '../color.js'
import { session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]
// [seconds after arrival, line]
const SCRIPT = [
  [0.8, 'Outward, one thing becomes many.'],
  [5, 'Inward, many things become one.'],
  [9.2, null], // filled in from what the visitor did
]
function summary({ opened, converged }) {
  if (opened && converged) return 'You did both today.'
  if (opened) return 'Today you mostly went outward.'
  if (converged) return 'Today you mostly went inward.'
  return 'You can do both. Try it here.'
}
const FREE_AT = 3 // when the pointer starts to draw
const INCUBATE_AT = 13.5
const LAST_AT = 15

export default function Return({ onRestart }) {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [t0, setT0] = useState(0)
  const [now, setNow] = useState(0)
  const [guess, setGuess] = useState('')
  const [verdict, setVerdict] = useState(null) // 'yes' | 'no' | 'shown'
  const [inc, setInc] = useState(null)
  const [counts, setCounts] = useState({ opened: 0, converged: 0 })
  const live = useRef({ t0: 0 })
  live.current.t0 = t0

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
    setCounts({ opened: session.opened, converged: session.converged })
    setInc(session.incubating)
    const id = setInterval(() => setNow((performance.now() - t0) / 1000), 200)
    const cues = [
      setTimeout(() => tone(659.25, { dur: 2.5, gain: 0.02 }), 800),
      setTimeout(() => tone(164.8, { dur: 4, gain: 0.035 }), 5000),
    ]
    return () => {
      clearInterval(id)
      cues.forEach(clearTimeout)
    }
  }, [t0])

  // outward when you move, inward when you rest
  useCanvas(canvasRef, (ctx, s) => {
    const segs = []
    const seed = { x: 0, y: 0, e: 0 }
    let last = { x: 0, y: 0 }
    let still = 0
    let free = 0
    let burstReady = false
    const L = { x: 0, y: 0, init: false }
    const spawn = (x, y, a, len, depth, k = 1) => {
      if (depth > 3 || segs.length > 900) return
      const x2 = x + Math.cos(a) * len
      const y2 = y + Math.sin(a) * len
      segs.push({ x1: x, y1: y, x2, y2, born: performance.now(), c: 0, depth })
      if (Math.random() < 0.85 * k) spawn(x2, y2, a + 0.5 + Math.random() * 0.3, len * 0.7, depth + 1, k)
      if (Math.random() < 0.85 * k) spawn(x2, y2, a - 0.5 - Math.random() * 0.3, len * 0.7, depth + 1, k)
    }
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const el = st.t0 ? (performance.now() - st.t0) / 1000 : 0
        free = approach(free, el > FREE_AT ? 1 : 0, 1.2, dt)
        if (!L.init) {
          L.x = w / 2
          L.y = h / 2
          last = { x: L.x, y: L.y }
          L.init = true
        }
        if (s.inside) {
          L.x = approach(L.x, s.mx, 14, dt)
          L.y = approach(L.y, s.my, 14, dt)
        }
        const moved = Math.hypot(L.x - last.x, L.y - last.y)
        const nowMs = performance.now()
        if (free > 0.5 && moved > 26) {
          // moving: the trail forks outward
          const a = Math.atan2(L.y - last.y, L.x - last.x)
          spawn(
            last.x,
            last.y,
            a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5),
            22 + Math.random() * 18,
            0,
            0.7,
          )
          if (burstReady && seed.e > 0.4) {
            for (let k = 0; k < 9; k++) spawn(seed.x, seed.y, (k / 9) * TAU, 40 + Math.random() * 30, 0, 0.9)
            swell([392, 587.3, 784], 0.02, 2.5)
            burstReady = false
          }
          last = { x: L.x, y: L.y }
          still = 0
        } else still += dt
        // resting: everything drawn so far is pulled into one point
        const resting = free > 0.5 && still > 0.7
        if (resting && seed.e < 0.05) {
          seed.x = L.x
          seed.y = L.y
        }
        seed.e = approach(seed.e, resting && segs.length ? 1 : 0, resting ? 0.9 : 3, dt)
        if (seed.e > 0.6) burstReady = true

        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(0, 0, w, h)
        for (let i = segs.length - 1; i >= 0; i--) {
          const g = segs[i]
          const age = (nowMs - g.born) / 1000
          if (resting) {
            const k = 1 - Math.exp(-dt * 1.6)
            g.x1 += (seed.x - g.x1) * k
            g.y1 += (seed.y - g.y1) * k
            g.x2 += (seed.x - g.x2) * k
            g.y2 += (seed.y - g.y2) * k
            g.c = approach(g.c, 1, 2, dt)
          }
          const life = clamp(1 - age / 9)
          const near = Math.hypot(g.x2 - seed.x, g.y2 - seed.y)
          if (life <= 0 || (resting && near < 3)) {
            segs.splice(i, 1)
            continue
          }
          const f = clamp(age / 0.35)
          ctx.strokeStyle = g.c > 0.5 ? ni(0.7 * life) : ne(0.75 * life * (1 - g.c))
          ctx.beginPath()
          ctx.moveTo(g.x1, g.y1)
          ctx.lineTo(g.x1 + (g.x2 - g.x1) * f, g.y1 + (g.y2 - g.y1) * f)
          ctx.stroke()
        }
        if (seed.e > 0.01) {
          const R = 20 + 60 * seed.e
          const gr = ctx.createRadialGradient(seed.x, seed.y, 0, seed.x, seed.y, R)
          gr.addColorStop(0, ni(0.6 * seed.e))
          gr.addColorStop(0.5, niDeep(0.3 * seed.e))
          gr.addColorStop(1, niDeep(0))
          ctx.fillStyle = gr
          ctx.beginPath()
          ctx.arc(seed.x, seed.y, R, 0, TAU)
          ctx.fill()
        }
        // you, as a point of light
        if (free > 0.01 && s.inside) {
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 50)
          g.addColorStop(0, `rgba(232,229,222,${0.14 * free})`)
          g.addColorStop(1, 'rgba(232,229,222,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 50, 0, TAU)
          ctx.fill()
          ctx.fillStyle = `rgba(255,253,248,${free})`
          ctx.beginPath()
          ctx.arc(L.x, L.y, 2, 0, TAU)
          ctx.fill()
        }
      },
    }
  })

  const found = [...SCRIPT].reverse().find(([at]) => now >= at)
  const line = found && [found[0], found[1] ?? summary(counts)]
  const showInc = inc && now >= INCUBATE_AT
  const lastAt = inc ? INCUBATE_AT + 5 : LAST_AT
  const st = getState()
  const minutes = st.entered ? Math.max(1, Math.round((performance.now() - st.entered) / 60000)) : 1

  const check = (e) => {
    e.preventDefault()
    const v = guess.trim().toUpperCase()
    if (!v) return
    const ok = v === inc.a || v === `${inc.a}S`
    setVerdict(ok ? 'yes' : 'no')
    if (ok) swell([98, 146.8, 196, 293.7], 0.04, 5)
    else tone(140, { dur: 0.5, gain: 0.03, type: 'triangle' })
  }

  return (
    <section id="return" ref={sectionRef} className={`ret ${now > FREE_AT ? 'is-free' : ''}`} data-section>
      <canvas
        ref={canvasRef}
        aria-label="Moving draws branching lines; resting pulls them into a single glowing point."
      />
      <div className="ret__top" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && (
            <motion.p
              key={line[1]}
              className="ret__line"
              initial={{ opacity: 0, filter: 'blur(16px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(12px)' }}
              transition={{ duration: 1.6, ease: EASE }}
            >
              {line[1]}
            </motion.p>
          )}
        </AnimatePresence>
        <motion.p
          className="mono mono--dim ret__counts"
          initial={{ opacity: 0 }}
          animate={{ opacity: now >= 9.8 ? 1 : 0 }}
          transition={{ duration: 1.4 }}
        >
          <span className="t-ne">{counts.opened}</span> possibilities opened ·{' '}
          <span className="t-ni">{counts.converged}</span> patterns closed
        </motion.p>
        <motion.p
          className="mono mono--dim ret__hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: now > FREE_AT + 1 && now < 12 ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          Move to branch · rest to converge
        </motion.p>
      </div>

      <AnimatePresence>
        {showInc && (
          <motion.div
            className="ret__inc"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE }}
          >
            <p className="mono mono--dim">Earlier you set this aside</p>
            <p className="ret__triad">{inc.w.join(' · ')}</p>
            {!verdict || verdict === 'no' ? (
              <form className="ret__form" onSubmit={check}>
                <input
                  id="incubated-answer"
                  className="field"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="Has it arrived?"
                  autoComplete="off"
                  aria-label="The word that goes with all three"
                />
                <button className="btn btn--ni" type="submit">
                  Converge
                </button>
                {verdict === 'no' && (
                  <button type="button" className="btn btn--ghost" onClick={() => setVerdict('shown')}>
                    Show me
                  </button>
                )}
              </form>
            ) : (
              <p className="prose">
                {verdict === 'yes' ? (
                  <>
                    <span className="t-ni">{inc.a.toLowerCase()}</span>. It surfaced while you were looking elsewhere.
                    That is incubation.
                  </>
                ) : (
                  <>
                    <span className="t-ni">{inc.a.toLowerCase()}</span>. Not every problem returns solved. Most of the
                    work happens where you cannot watch it.
                  </>
                )}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="ret__last"
        initial={{ opacity: 0 }}
        animate={{ opacity: now >= lastAt ? 1 : 0 }}
        transition={{ duration: 2.4, ease: EASE }}
      >
        Intuition never shows you what is here. Only what is <span className="t-ne">possible</span>, and what it{' '}
        <span className="t-ni">means</span>.
      </motion.p>

      <motion.footer
        className="ret__foot"
        initial={{ opacity: 0 }}
        animate={{ opacity: now >= lastAt + 3 ? 1 : 0 }}
        transition={{ duration: 2 }}
        style={{ pointerEvents: now >= lastAt + 3 ? 'auto' : 'none' }}
      >
        <p className="mono mono--dim">
          {minutes} {minutes === 1 ? 'minute' : 'minutes'} inside · nothing you did left this device
        </p>
        <button className="btn btn--ghost ret__again" onClick={onRestart}>
          ↺ Begin again
        </button>
        <p className="mono mono--dim ret__credit">
          The Leap — a laboratory for intuition, outward and inward · procedural graphics · synthesised sound
        </p>
      </motion.footer>
    </section>
  )
}
