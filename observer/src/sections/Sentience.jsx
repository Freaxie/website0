import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { Reveal, Statement } from '../components/Text.jsx'
import { Claim, Claims, Tag } from '../components/Claim.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { pointer } from '../lib/pointer.js'
import { noise3 } from '../lib/noise.js'
import { approach, clamp, cool, ink, rng, signal, TAU, warm } from '../lib/math.js'
import { blip, harsh, swell, tone } from '../lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]
const SIZES = [6, 9, 13, 18, 24, 32]

/* ───────── specimen A: solves, and shows nothing ───────── */

function makeMaze(n, seed) {
  const G = 2 * n + 1
  const g = new Uint8Array(G * G).fill(1) // 1 = wall
  const r = rng(seed)
  const stack = [[0, 0]]
  const seen = new Uint8Array(n * n)
  seen[0] = 1
  g[1 * G + 1] = 0
  while (stack.length) {
    const [x, y] = stack[stack.length - 1]
    const opts = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(([dx, dy]) => {
      const nx = x + dx
      const ny = y + dy
      return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx]
    })
    if (!opts.length) {
      stack.pop()
      continue
    }
    const [dx, dy] = opts[Math.floor(r() * opts.length)]
    const nx = x + dx
    const ny = y + dy
    seen[ny * n + nx] = 1
    g[(2 * y + 1 + dy) * G + (2 * x + 1 + dx)] = 0
    g[(2 * ny + 1) * G + (2 * nx + 1)] = 0
    stack.push([nx, ny])
  }
  // a few extra openings, so there is more than one way through
  for (let k = 0; k < n; k++) {
    const x = 1 + Math.floor(r() * (G - 2))
    const y = 1 + Math.floor(r() * (G - 2))
    if ((x + y) % 2 === 1) g[y * G + x] = 0
  }
  return { G, g }
}

function solve({ G, g }) {
  const start = G + 1
  const end = (G - 2) * G + (G - 2)
  const prev = new Int32Array(G * G).fill(-1)
  const order = [start]
  prev[start] = start
  for (let h = 0; h < order.length; h++) {
    const c = order[h]
    if (c === end) break
    for (const d of [1, -1, G, -G]) {
      const nb = c + d
      if (!g[nb] && prev[nb] < 0) {
        prev[nb] = c
        order.push(nb)
      }
    }
  }
  const path = []
  if (prev[end] >= 0) for (let c = end; c !== start; c = prev[c]) path.push(c)
  path.push(start)
  return { order, path: prev[end] >= 0 ? path.reverse() : [] }
}

function Solver({ onPoke }) {
  const ref = useRef(null)
  const stats = useRef(null)
  const log = useRef(null)
  useCanvas(ref, (ctx, s, canvas) => {
    let level = 0
    let seed = 1
    let maze = null
    let sol = null
    let t0 = 0
    let solved = 0
    let ms = 0
    let replan = 0
    const next = () => {
      const n = SIZES[Math.min(level, SIZES.length - 1)]
      maze = makeMaze(n, seed++)
      const a = performance.now()
      sol = solve(maze)
      ms = performance.now() - a
      t0 = s.t
      level++
    }
    next()
    const geom = () => {
      const { w, h } = s
      const size = Math.min(w - 40, h - 120)
      const cell = size / maze.G
      return { x0: (w - size) / 2, y0: 56 + (h - 120 - size) / 2, cell }
    }
    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const { x0, y0, cell } = geom()
      const cx = Math.floor((e.clientX - rect.left - x0) / cell)
      const cy = Math.floor((e.clientY - rect.top - y0) / cell)
      const { G, g } = maze
      if (cx <= 0 || cy <= 0 || cx >= G - 1 || cy >= G - 1) return
      const i = cy * G + cx
      if (i === G + 1 || i === (G - 2) * G + G - 2) return
      g[i] = g[i] ? 0 : 1
      const a = performance.now()
      sol = solve(maze)
      ms = performance.now() - a
      t0 = s.t - 10 // show the new plan at once
      replan = s.t
      blip(2400, 0.012, 0.03)
      onPoke()
      if (log.current)
        log.current.textContent = `Stimulus (${cx},${cy}) → ${g[i] ? 'wall' : 'opening'} → ${sol.path.length ? `replanned in ${ms.toFixed(2)} ms` : 'no path'}`
    }
    canvas.addEventListener('pointerdown', onDown)
    return {
      frame() {
        const { w, h, t } = s
        ctx.clearRect(0, 0, w, h)
        const { x0, y0, cell } = geom()
        const { G, g } = maze
        const el = t - t0
        const explore = clamp(el / 1.4)
        const draw = clamp((el - 1.4) / 0.7)
        // walls: faint mass, crisp edges where they meet a corridor
        ctx.fillStyle = ink(0.035)
        ctx.strokeStyle = ink(0.42)
        ctx.beginPath()
        for (let y = 0; y < G; y++)
          for (let x = 0; x < G; x++) {
            if (!g[y * G + x]) continue
            const px = x0 + x * cell
            const py = y0 + y * cell
            ctx.fillRect(px, py, cell + 0.4, cell + 0.4)
            if (x + 1 < G && !g[y * G + x + 1]) {
              ctx.moveTo(px + cell, py)
              ctx.lineTo(px + cell, py + cell)
            }
            if (x > 0 && !g[y * G + x - 1]) {
              ctx.moveTo(px, py)
              ctx.lineTo(px, py + cell)
            }
            if (y + 1 < G && !g[(y + 1) * G + x]) {
              ctx.moveTo(px, py + cell)
              ctx.lineTo(px + cell, py + cell)
            }
            if (y > 0 && !g[(y - 1) * G + x]) {
              ctx.moveTo(px, py)
              ctx.lineTo(px + cell, py)
            }
          }
        ctx.stroke()
        // the search frontier
        const k = Math.floor(sol.order.length * explore)
        ctx.fillStyle = cool(0.35)
        for (let i = 0; i < k; i++) {
          const c = sol.order[i]
          ctx.fillRect(
            x0 + (c % G) * cell + cell * 0.3,
            y0 + Math.floor(c / G) * cell + cell * 0.3,
            cell * 0.4,
            cell * 0.4,
          )
        }
        // the answer
        if (draw > 0 && sol.path.length) {
          ctx.strokeStyle = ink(0.95)
          ctx.lineWidth = Math.max(1.2, cell * 0.28)
          ctx.lineJoin = 'round'
          ctx.beginPath()
          const m = Math.max(1, Math.floor(sol.path.length * draw))
          for (let i = 0; i < m; i++) {
            const c = sol.path[i]
            const px = x0 + (c % G) * cell + cell / 2
            const py = y0 + Math.floor(c / G) * cell + cell / 2
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
          }
          ctx.stroke()
          ctx.lineWidth = 1
        }
        ctx.fillStyle = ink(1)
        ctx.fillRect(x0 + cell, y0 + cell, cell, cell)
        ctx.strokeStyle = ink(1)
        ctx.strokeRect(x0 + (G - 2) * cell + 0.5, y0 + (G - 2) * cell + 0.5, cell - 1, cell - 1)
        if (t - replan < 0.4) {
          ctx.strokeStyle = cool(0.6 * (1 - (t - replan) / 0.4))
          ctx.strokeRect(x0 - 4, y0 - 4, G * cell + 8, G * cell + 8)
        }

        // inner-state channel: flat, because there is nothing it was built to show
        const yb = h - 30
        ctx.strokeStyle = ink(0.12)
        ctx.beginPath()
        ctx.moveTo(20, yb)
        ctx.lineTo(w - 20, yb)
        ctx.stroke()
        ctx.font = '9.5px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = ink(0.4)
        ctx.fillText('SUBJECTIVE-STATE CHANNEL', 20, yb - 8)
        ctx.fillText('—', w - 30, yb - 8)

        if (el > 3.2 && draw >= 1) {
          if (sol.path.length) solved++
          next()
        }
        if (stats.current)
          stats.current.textContent = `Solved ${String(solved).padStart(3, '0')} · ${maze.G}×${maze.G} · expanded ${sol.order.length} · ${ms.toFixed(2)} ms`
      },
      dispose() {
        canvas.removeEventListener('pointerdown', onDown)
      },
    }
  })
  return (
    <div className="spec">
      <div className="spec__head">
        <p className="mono mono--ink">Specimen A</p>
        <p className="mono mono--dim">Solves problems · shows no inside</p>
      </div>
      <div className="spec__stage">
        <canvas ref={ref} aria-label="A maze solver: it searches each maze and draws the shortest path." />
        <p ref={stats} className="mono mono--dim spec__stats" />
      </div>
      <p className="mono mono--dim spec__how">Click a corridor to block it</p>
      <p ref={log} className="mono spec__log" aria-live="polite">
        Awaiting stimulus
      </p>
    </div>
  )
}

/* ───────── specimen B: solves nothing, and shows an inside ───────── */

function Feeler({ onPoke }) {
  const ref = useRef(null)
  const vRef = useRef(null)
  const aRef = useRef(null)
  useCanvas(ref, (ctx, s, canvas) => {
    const st = {
      v: 0.05,
      a: 0.15,
      c: 0,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      phase: 0,
      warmth: 0,
      imps: [],
      trace: [],
      lastWarm: 0,
    }
    const N = 120
    const shape = new Float32Array(N + 1)
    const center = () => [s.w / 2 + st.ox, s.h * 0.45 + st.oy]
    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const [cx, cy] = center()
      const R0 = Math.min(s.w, s.h) * 0.2
      const d = Math.hypot(x - cx, y - cy)
      if (d > R0 * 1.3) return
      st.v = Math.max(-1, st.v - 0.38)
      st.a = Math.min(1, st.a + 0.55)
      st.c = 1
      st.imps.push({ x: (x - cx) / R0, y: (y - cy) / R0, t: s.t, kind: 'harsh' })
      const k = 260 / Math.max(10, d)
      st.vx -= ((x - cx) / Math.max(10, d)) * 180 * Math.min(2, k)
      st.vy -= ((y - cy) / Math.max(10, d)) * 180 * Math.min(2, k)
      harsh(0.035, 0.22)
      tone(98, { dur: 0.9, gain: 0.05, type: 'triangle' })
      onPoke('harsh')
    }
    canvas.addEventListener('pointerdown', onDown)
    return {
      frame(dt) {
        const { w, h, t } = s
        const R0 = Math.min(w, h) * 0.2
        let [cx, cy] = center()
        const dx = s.mx - cx
        const dy = s.my - cy
        const d = Math.hypot(dx, dy)
        const near = s.inside ? clamp(1 - d / (R0 * 2.2)) : 0

        // gentle presence warms it; fast movement startles it
        if (near > 0) {
          const calm = clamp(1 - pointer.speed / 1600)
          st.v = Math.min(1, st.v + dt * 0.22 * near * calm * (st.v < -0.3 ? 0.35 : 1))
          st.warmth = Math.min(1, st.warmth + dt * 0.5 * near * calm)
          st.a = approach(st.a, 0.3 + (1 - calm) * 0.6, 1.2 * near, dt)
          if (calm > 0.6 && near > 0.4 && t - st.lastWarm > 4) {
            st.lastWarm = t
            swell([130.8, 196, 261.6], 0.016, 3)
            onPoke('warm')
          }
        }
        st.warmth = approach(st.warmth, 0, 0.35, dt)
        st.v = approach(st.v, 0, 0.06, dt)
        st.a = approach(st.a, 0.15, 0.35, dt)
        st.c = approach(st.c, 0, 1.6, dt)

        // approach when things are good, withdraw when they are not
        const want = near > 0 ? (st.v > 0.15 ? 0.22 : st.v < -0.15 ? -0.9 : 0) : 0
        let tx = d > 1 ? (dx / d) * R0 * want * near : 0
        let ty = d > 1 ? (dy / d) * R0 * want * near : 0
        tx = clamp(tx, -w * 0.28, w * 0.28)
        ty = clamp(ty, -h * 0.2, h * 0.2)
        st.vx += ((tx - st.ox) * 3 - st.vx * 2.6) * dt
        st.vy += ((ty - st.oy) * 3 - st.vy * 2.6) * dt
        st.ox += st.vx * dt
        st.oy += st.vy * dt
        st.ox = clamp(st.ox, -w * 0.3, w * 0.3)
        st.oy = clamp(st.oy, -h * 0.22, h * 0.2)
        ;[cx, cy] = center()

        const rate = 0.28 + st.a * 1.5
        st.phase += dt * rate * TAU
        const pulse = Math.sin(st.phase)
        const R = R0 * (1 - 0.2 * st.c) * (1 + 0.035 * pulse)
        const cang = Math.atan2(dy, dx)
        st.imps = st.imps.filter((m) => t - m.t < 7)

        for (let k = 0; k <= N; k++) {
          const th = (k / N) * TAU
          const c = Math.cos(th)
          const sn = Math.sin(th)
          let r = 1 + 0.07 * noise3(c * 1.2, sn * 1.2, t * 0.35) * (1 + st.a * 1.6)
          r += st.a > 0.55 ? 0.025 * noise3(c * 6, sn * 6, t * 6) * st.a : 0
          if (st.v > 0.1 && near > 0) {
            const da = Math.atan2(Math.sin(th - cang), Math.cos(th - cang))
            r += 0.22 * st.v * near * Math.exp(-(da * da) / 0.18)
          }
          for (const m of st.imps) {
            const ia = Math.atan2(m.y, m.x)
            const da = Math.atan2(Math.sin(th - ia), Math.cos(th - ia))
            r -= 0.16 * Math.exp(-(t - m.t) * 1.2) * Math.exp(-(da * da) / 0.06)
          }
          shape[k] = r * R
        }
        const body = new Path2D()
        for (let k = 0; k <= N; k++) {
          const th = (k / N) * TAU
          const x = cx + Math.cos(th) * shape[k]
          const y = cy + Math.sin(th) * shape[k]
          k ? body.lineTo(x, y) : body.moveTo(x, y)
        }
        body.closePath()

        ctx.clearRect(0, 0, w, h)
        // the inner field
        ctx.save()
        ctx.clip(body)
        const v = st.v
        const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25)
        if (v >= 0) {
          base.addColorStop(0, warm(0.12 + 0.55 * v + st.warmth * 0.2))
          base.addColorStop(0.6, warm(0.05 + 0.18 * v))
          base.addColorStop(1, 'rgba(226,180,138,0)')
        } else {
          base.addColorStop(0, signal(0.1 + 0.45 * -v))
          base.addColorStop(0.7, signal(0.04 + 0.12 * -v))
          base.addColorStop(1, 'rgba(255,77,46,0)')
        }
        ctx.fillStyle = base
        ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3)
        if (st.warmth > 0.02 && near > 0) {
          const hx = cx + Math.cos(cang) * R * 0.55
          const hy = cy + Math.sin(cang) * R * 0.55
          const gw = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.9)
          gw.addColorStop(0, warm(0.4 * st.warmth))
          gw.addColorStop(1, 'rgba(226,180,138,0)')
          ctx.fillStyle = gw
          ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3)
        }
        // isolines that breathe
        for (let k = 1; k <= 6; k++) {
          const f = k / 7 + 0.02 * Math.sin(st.phase - k * 0.7)
          ctx.save()
          ctx.translate(cx, cy)
          ctx.scale(f, f)
          ctx.translate(-cx, -cy)
          ctx.strokeStyle = v < -0.1 ? signal(0.1 + 0.06 * k * -v) : ink(0.06 + 0.02 * k)
          ctx.lineWidth = 1 / f
          ctx.stroke(body)
          ctx.restore()
        }
        // impressions left by being struck
        for (const m of st.imps) {
          const age = t - m.t
          const ix = cx + m.x * R0
          const iy = cy + m.y * R0
          for (let k = 0; k < 3; k++) {
            const rr = (age * 70 + k * 16) % (R * 2)
            ctx.strokeStyle = signal(Math.max(0, 0.7 - age * 0.12) * (1 - rr / (R * 2)))
            ctx.beginPath()
            ctx.arc(ix, iy, rr, 0, TAU)
            ctx.stroke()
          }
          ctx.fillStyle = `rgba(255,240,230,${Math.max(0, 0.9 - age * 1.4)})`
          ctx.beginPath()
          ctx.arc(ix, iy, 3, 0, TAU)
          ctx.fill()
        }
        ctx.restore()
        ctx.strokeStyle = ink(0.75)
        ctx.stroke(body)
        // nucleus
        ctx.fillStyle = ink(0.8)
        ctx.beginPath()
        ctx.arc(cx + Math.cos(t * 0.4) * R * 0.08, cy + Math.sin(t * 0.5) * R * 0.08, 2.5 + st.a * 2, 0, TAU)
        ctx.fill()

        // trace of the inner field
        st.trace.push(v * 0.7 + pulse * (0.12 + st.a * 0.25))
        if (st.trace.length > 240) st.trace.shift()
        const yb = h - 30
        ctx.font = '9.5px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = ink(0.4)
        ctx.fillText('SUBJECTIVE-STATE CHANNEL', 20, yb - 22)
        ctx.strokeStyle = v < 0 ? signal(0.8) : ink(0.8)
        ctx.beginPath()
        st.trace.forEach((q, i) => {
          const x = w - 20 - (st.trace.length - 1 - i) * ((w - 40) / 240)
          const y = yb - q * 14
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        })
        ctx.stroke()

        const vi = vRef.current?.firstChild
        if (vi) {
          vi.style.left = `${50 + Math.min(0, st.v) * 50}%`
          vi.style.width = `${Math.abs(st.v) * 50}%`
          vi.style.background = st.v < 0 ? 'var(--signal)' : 'var(--warm)'
        }
        const ai = aRef.current?.firstChild
        if (ai) ai.style.width = `${st.a * 100}%`
      },
      dispose() {
        canvas.removeEventListener('pointerdown', onDown)
      },
    }
  })
  return (
    <div className="spec">
      <div className="spec__head">
        <p className="mono mono--ink">Specimen B</p>
        <p className="mono mono--dim">Solves nothing · shows an inside</p>
      </div>
      <div className="spec__stage spec__stage--b">
        <canvas
          ref={ref}
          aria-label="A soft organism with a visible inner field. It warms when approached gently and recoils when struck."
        />
        <div className="spec__meters mono mono--dim">
          <span>Valence</span>
          <span ref={vRef} className="meter meter--v">
            <i />
          </span>
          <span>Arousal</span>
          <span ref={aRef} className="meter meter--a">
            <i />
          </span>
          <span>Solved 000</span>
        </div>
      </div>
      <p className="mono mono--dim spec__how">Rest near it to warm it · click to strike it</p>
    </div>
  )
}

export default function Sentience() {
  const [pokes, setPokes] = useState({ a: 0, harsh: 0, warm: 0 })
  const pokeA = useCallback(() => setPokes((p) => ({ ...p, a: p.a + 1 })), [])
  const pokeB = useCallback((k) => setPokes((p) => ({ ...p, [k]: p[k] + 1 })), [])
  const both = pokes.a > 0 && pokes.harsh + pokes.warm > 0

  let aside = null
  if (pokes.harsh >= 4) aside = 'It cannot solve anything. Yet hurting it may have felt different from blocking a maze.'
  else if (pokes.harsh >= 2) aside = 'Did you hesitate before clicking again?'

  return (
    <section id="sentience" className="sec sen" data-section>
      <SectionHead n="04" title="Sentience" motif="Organic fields" />

      <div className="grid12">
        <Statement className="big sen__statement" text="Intelligence is not necessarily *experience.*" lens />
      </div>

      <div className="sen__hinge">
        <Reveal className="sen__word">
          <p className="big big--m">Consciousness</p>
        </Reveal>
        <Reveal className="sen__gloss" delay={0.2}>
          <p className="whisper">The fact that something is happening from the inside.</p>
          <p className="mono mono--dim sen__q">
            <Tag kind="open" /> &nbsp;But why should information processing produce an inside at all?
          </p>
        </Reveal>
      </div>

      <div className="sen__defs">
        <Reveal className="sen__def">
          <p className="mono mono--dim">Concept A</p>
          <h3 className="big big--s">Intelligence</h3>
          <p className="whisper">“Can the system solve problems?”</p>
          <p className="mono mono--dim sen__measure">Measured from the outside · by behaviour</p>
        </Reveal>
        <div className="sen__vs mono mono--dim" aria-hidden="true">
          ≠ ?
        </div>
        <Reveal className="sen__def" delay={0.15}>
          <p className="mono mono--dim">Concept B</p>
          <h3 className="big big--s">Sentience</h3>
          <p className="whisper">“Is there something it is like to be the system?”</p>
          <p className="mono mono--dim sen__measure">
            After T. Nagel, What Is It Like to Be a Bat? (1974) · no outside measure known
          </p>
        </Reveal>
      </div>

      <div className="sen__specimens">
        <Solver onPoke={pokeA} />
        <Feeler onPoke={pokeB} />
      </div>

      <div className="sen__after">
        <AnimatePresence mode="wait">
          {aside && (
            <motion.p
              key={aside}
              className="whisper sen__aside"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: EASE }}
            >
              {aside}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {both && (
            <motion.div
              className="sen__reveal"
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: EASE, delay: 0.6 }}
            >
              <p className="big big--s">You read an inside into one of them.</p>
              <p className="prose">
                Both specimens are a few hundred lines of code running on the same processor. Specimen B’s “inner field”
                is a drawing of three numbers. Nothing on this page is claimed to feel anything. If an impulse to
                protect it appeared, it appeared in you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Claims>
        <Claim kind="empirical" cite="Heider & Simmel (1944)">
          People readily attribute intentions and feelings to simple moving shapes. Behaviour that looks like wanting is
          enough to trigger the attribution.
        </Claim>
        <Claim kind="empirical" cite="e.g. Weiskrantz (1986), Blindsight" delay={0.1}>
          After damage to primary visual cortex, some people can point to or discriminate objects they report not seeing
          at all. Processing and experience can come apart.
        </Claim>
        <Claim kind="argument" cite="D. Chalmers, The Conscious Mind (1996)" delay={0.2}>
          The philosophical zombie: a being physically and behaviourally identical to you, with no experience. If it is
          conceivable, some argue, experience is not fixed by function. Many reject that step.
        </Claim>
        <Claim kind="open" cite="New York Declaration on Animal Consciousness (2024)" delay={0.3}>
          Which animals are sentient? A 2024 declaration by researchers held that there is at least a realistic
          possibility of conscious experience in all vertebrates and many invertebrates, including insects and
          octopuses.
        </Claim>
      </Claims>
    </section>
  )
}
