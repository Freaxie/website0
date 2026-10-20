import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { approach, clamp, TAU } from '@shared/lib/math.js'
import { getState } from '@shared/lib/store.js'
import { blip, swell, thump, tone } from '@shared/lib/audio.js'
import { te, ti } from '../color.js'
import { session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]
const SCRIPT = [
  [0.8, 'Ti asks whether it holds together.'],
  [5, 'Te asks whether it works.'],
  [9.2, null], // filled in from what the visitor did
]
function summary({ ti: a, te: b }) {
  if (a && b) return 'You weighed both today.'
  if (b) return 'Today the scale tipped toward results.'
  if (a) return 'Today the scale tipped toward reasons.'
  return 'Both pans are empty. Move to work; rest to think.'
}
const FREE_AT = 3
const CALLBACK_AT = 13.5
const MAX = 64

export default function Balance({ onRestart }) {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const [t0, setT0] = useState(0)
  const [now, setNow] = useState(0)
  const [counts, setCounts] = useState({ ti: 0, te: 0 })
  const [memory, setMemory] = useState({ zipper: null, rule: null })
  const live = useRef({ t0: 0, seeded: false })
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
    setCounts({ ti: session.ti, te: session.te })
    setMemory({ zipper: session.zipper, rule: session.rule })
    const id = setInterval(() => setNow((performance.now() - t0) / 1000), 200)
    const cues = [setTimeout(() => tone(659.25, { dur: 2.5, gain: 0.02 }), 800), setTimeout(() => thump(0.08), 5000)]
    return () => {
      clearInterval(id)
      cues.forEach(clearTimeout)
    }
  }, [t0])

  // a beam built as a lattice, on a fulcrum: moving loads the right pan, resting builds on the left
  useCanvas(canvasRef, (ctx, s) => {
    const left = [] // structure: lattice nodes
    const right = [] // output: units
    let angle = 0
    let vel = 0
    let still = 0
    let free = 0
    let lastX = 0
    let lastY = 0
    let moveAcc = 0
    let restAcc = 0
    let balancedFor = 0
    let chimed = false
    const L = { x: 0, y: 0, init: false }
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        const el = st.t0 ? (performance.now() - st.t0) / 1000 : 0
        free = approach(free, el > FREE_AT ? 1 : 0, 1.2, dt)
        // the pans start with what you did on this page
        if (st.t0 && !st.seeded) {
          st.seeded = true
          for (let k = 0; k < Math.min(MAX, session.ti * 4); k++) left.push({ born: -10 })
          for (let k = 0; k < Math.min(MAX, session.te * 4); k++) right.push({ born: -10 })
        }
        if (!L.init) {
          L.x = w / 2
          L.y = h / 2
          lastX = L.x
          lastY = L.y
          L.init = true
        }
        if (s.inside) {
          L.x = approach(L.x, s.mx, 14, dt)
          L.y = approach(L.y, s.my, 14, dt)
        }
        const moved = Math.hypot(L.x - lastX, L.y - lastY)
        lastX = L.x
        lastY = L.y
        if (free > 0.5 && s.inside && moved > 0.8) {
          still = 0
          moveAcc += moved
          if (moveAcc > 42) {
            moveAcc = 0
            if (right.length >= MAX) right.shift()
            right.push({ born: t })
            blip(1700 + Math.random() * 300, 0.006, 0.04)
          }
        } else if (free > 0.5 && s.inside) {
          still += dt
          if (still > 0.7) {
            restAcc += dt
            if (restAcc > 0.22) {
              restAcc = 0
              if (left.length >= MAX) left.shift()
              left.push({ born: t })
              blip(880 + (left.length % 5) * 110, 0.006, 0.08)
            }
          }
        }
        // the beam tips toward the heavier pan, and settles
        const target = clamp((right.length - left.length) * 0.005, -0.12, 0.12)
        vel += ((target - angle) * 9 - vel * 3.2) * dt
        angle += vel * dt
        const balanced = Math.abs(right.length - left.length) <= 2 && left.length + right.length > 6
        balancedFor = balanced ? balancedFor + dt : 0
        if (balancedFor > 0.8 && !chimed) {
          chimed = true
          swell([196, 293.66, 392], 0.03, 3.5)
        }
        if (!balanced) chimed = false

        ctx.fillStyle = 'rgba(0,0,0,0.42)'
        ctx.fillRect(0, 0, w, h)
        const cx = w / 2
        const cy = h * (w < 560 ? 0.56 : 0.58)
        const half = Math.min(w * 0.36, 440)
        const c = Math.cos(angle)
        const sn = Math.sin(angle)
        const at = (u, v = 0) => [cx + c * u - sn * v, cy - 18 + sn * u + c * v]
        // fulcrum
        ctx.strokeStyle = 'rgba(232,229,222,0.55)'
        ctx.beginPath()
        ctx.moveTo(cx, cy - 18)
        ctx.lineTo(cx - 22, cy + 26)
        ctx.lineTo(cx + 22, cy + 26)
        ctx.closePath()
        ctx.stroke()
        // the beam is a truss: two chords and their diagonals
        const n = 16
        ctx.strokeStyle = ti(0.55)
        ctx.beginPath()
        for (const v of [-6, 6]) {
          const [x0, y0] = at(-half, v)
          const [x1, y1] = at(half, v)
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        }
        for (let k = 0; k < n; k++) {
          const u0 = -half + (k / n) * half * 2
          const u1 = -half + ((k + 1) / n) * half * 2
          const [ax, ay] = at(u0, k % 2 ? -6 : 6)
          const [bx, by] = at(u1, k % 2 ? 6 : -6)
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
        }
        ctx.stroke()
        // the pans hang straight down from the ends
        const pan = (u) => {
          const [ex, ey] = at(u)
          return [ex, ey + 84]
        }
        const [lx, ly] = pan(-half)
        const [rx, ry] = pan(half)
        ctx.strokeStyle = 'rgba(232,229,222,0.3)'
        ctx.beginPath()
        const [elx, ely] = at(-half)
        const [erx, ery] = at(half)
        ctx.moveTo(elx, ely)
        ctx.lineTo(lx - 34, ly)
        ctx.moveTo(elx, ely)
        ctx.lineTo(lx + 34, ly)
        ctx.moveTo(erx, ery)
        ctx.lineTo(rx - 34, ry)
        ctx.moveTo(erx, ery)
        ctx.lineTo(rx + 34, ry)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(lx - 40, ly)
        ctx.lineTo(lx + 40, ly)
        ctx.moveTo(rx - 40, ry)
        ctx.lineTo(rx + 40, ry)
        ctx.stroke()
        // left pan: a crystal, every node tied to its neighbours
        const cols = 8
        const node = (k) => [lx - 31 + (k % cols) * 9, ly - 7 - Math.floor(k / cols) * 9]
        ctx.strokeStyle = ti(0.45)
        ctx.beginPath()
        for (let k = 0; k < left.length; k++) {
          const [x, y] = node(k)
          if (k % cols) {
            const [px, py] = node(k - 1)
            ctx.moveTo(px, py)
            ctx.lineTo(x, y)
          }
          if (k >= cols) {
            const [qx, qy] = node(k - cols)
            ctx.moveTo(qx, qy)
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        for (let k = 0; k < left.length; k++) {
          const [x, y] = node(k)
          const a = clamp((t - left[k].born) / 0.4)
          ctx.fillStyle = ti(0.6 + 0.4 * a)
          ctx.beginPath()
          ctx.arc(x, y, 1.8, 0, TAU)
          ctx.fill()
        }
        // right pan: a pile of finished units
        for (let k = 0; k < right.length; k++) {
          const a = clamp((t - right[k].born) / 0.3)
          const x = rx - 31 + (k % cols) * 9
          const y = ry - 8 - Math.floor(k / cols) * 9 - (1 - a) * 30
          ctx.fillStyle = te(0.55 + 0.45 * a)
          ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
        }
        ctx.font = '10px "JetBrains Mono Variable", monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = ti(0.9)
        ctx.fillText(`TI · STRUCTURE ${String(left.length).padStart(2, '0')}`, lx, ly + 20)
        ctx.fillStyle = te(0.9)
        ctx.fillText(`TE · OUTPUT ${String(right.length).padStart(2, '0')}`, rx, ry + 20)
        if (balancedFor > 0.8) {
          ctx.fillStyle = `rgba(232,229,222,${clamp(balancedFor - 0.8)})`
          ctx.fillText('IN BALANCE', cx, cy + 46)
        }
        ctx.textAlign = 'left'
        // you, as a point of light
        if (free > 0.01 && s.inside) {
          const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 46)
          g.addColorStop(0, `rgba(232,229,222,${0.14 * free})`)
          g.addColorStop(1, 'rgba(232,229,222,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(L.x, L.y, 46, 0, TAU)
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
  const hasMemory = memory.zipper || memory.rule
  const lastAt = hasMemory ? CALLBACK_AT + 4.5 : CALLBACK_AT
  const st = getState()
  const minutes = st.entered ? Math.max(1, Math.round((performance.now() - st.entered) / 60000)) : 1

  return (
    <section id="balance" ref={sectionRef} className={`bal ${now > FREE_AT ? 'is-free' : ''}`} data-section>
      <canvas
        ref={canvasRef}
        aria-label="A balance built as a lattice. Moving the pointer adds units to the right pan; resting adds structure to the left."
      />
      <div className="bal__top" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && (
            <motion.p
              key={line[1]}
              className="bal__line"
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
          className="mono mono--dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: now >= 9.8 ? 1 : 0 }}
          transition={{ duration: 1.4 }}
        >
          <span className="t-ti">{counts.ti}</span> reasons checked · <span className="t-te">{counts.te}</span> results
          pushed
        </motion.p>
        <motion.p
          className="mono mono--dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: now > FREE_AT + 1 && now < 12.5 ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          Move to work · rest to think
        </motion.p>
      </div>

      <AnimatePresence>
        {hasMemory && now >= CALLBACK_AT && (
          <motion.div
            className="bal__memory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE }}
          >
            {memory.zipper && (
              <p>
                You rated your grasp of a zipper <span className="t-ti">{memory.zipper.before}</span>, then{' '}
                <span className="t-ti">{memory.zipper.after}</span>.
              </p>
            )}
            {memory.rule && (
              <p>
                {memory.rule.right ? (
                  <>You found the rule behind 2 · 4 · 6.</>
                ) : memory.rule.consistent ? (
                  <>
                    You were sure the rule was “{memory.rule.t.toLowerCase()}”. It fitted every test you ran, and it was
                    still wrong: {memory.rule.counter} fits the real rule and not yours.
                  </>
                ) : (
                  <>
                    You were sure the rule was “{memory.rule.t.toLowerCase()}”, though one of your own tests had already
                    said otherwise.
                  </>
                )}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        className="bal__last"
        initial={{ opacity: 0 }}
        animate={{ opacity: now >= lastAt ? 1 : 0 }}
        transition={{ duration: 2.4, ease: EASE }}
      >
        It <span className="t-ti">holds together</span>. It <span className="t-te">works</span>. Every good answer has
        to pass both.
      </motion.p>

      <motion.footer
        className="bal__foot"
        initial={{ opacity: 0 }}
        animate={{ opacity: now >= lastAt + 3 ? 1 : 0 }}
        transition={{ duration: 2 }}
        style={{ pointerEvents: now >= lastAt + 3 ? 'auto' : 'none' }}
      >
        <p className="mono mono--dim">
          {minutes} {minutes === 1 ? 'minute' : 'minutes'} inside · nothing you did left this device
        </p>
        <button className="btn btn--ghost bal__again" onClick={onRestart}>
          ↺ Begin again
        </button>
        <p className="mono mono--dim bal__credit">
          Proof &amp; Lever — a laboratory for thinking, inward and outward · procedural graphics · synthesised sound
        </p>
      </motion.footer>
    </section>
  )
}
