import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Scramble, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Glyph, KINDS } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { clamp, cool, corrupt, ink, rng, signal, TAU } from '@shared/lib/math.js'
import { blip, tone } from '@shared/lib/audio.js'

const MAX = 18

function labelFor(k) {
  if (k === 0) return 'THOUGHT'
  if (k <= 3) return 'META-'.repeat(k) + 'THOUGHT'
  return `META×${k}-THOUGHT`
}

function message(L, fled) {
  if (L === 1)
    return fled < 2
      ? 'A thought. Try to look at it directly.'
      : 'It slips away when attended. Let something else watch it.'
  if (L === 2) return 'A meta-thought: a thought about the thought.'
  if (L === 3) return 'Awareness of being aware.'
  if (L === 4) return 'Each observer can itself be observed.'
  if (L === 5) return `And you, outside the frame, are layer ${L + 1}.`
  if (L <= 7) return 'The labels are starting to slip.'
  if (L <= 10) return 'Each layer is less sure what it is looking at.'
  if (L < 14) return 'The regress has closed into a loop. Nothing is outside it — except, perhaps, you.'
  return 'There is no top. There is only the next layer.'
}

function Legend() {
  return (
    <div className="legend">
      <Reveal className="legend__lede">
        <p className="mono mono--dim">Key</p>
        <p className="prose">
          This laboratory marks four kinds of statement. Keep them apart: most confusion about consciousness begins when
          they blur.
        </p>
      </Reveal>
      <div className="legend__items">
        {Object.entries(KINDS).map(([k, v], i) => (
          <Reveal key={k} className="legend__item" delay={0.12 * i}>
            <span className="mono mono--ink legend__label">
              <Glyph kind={k} size={10} /> {v.label}
            </span>
            <span className="legend__gloss">{v.gloss}</span>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default function Observer() {
  const [layers, setLayers] = useState(1)
  const [fled, setFled] = useState(0)
  const canvasRef = useRef(null)
  const live = useRef({ layers: 1, fled: 0, spawn: null, onFlee: null })

  live.current.layers = layers
  live.current.fled = fled
  live.current.onFlee = useCallback(() => setFled((f) => f + 1), [])

  const add = useCallback((at) => {
    const k = live.current.layers
    if (k >= MAX) return
    live.current.layers = k + 1
    live.current.spawn = at || null
    tone(196 * Math.pow(2, (k * 5) / 12 / 2), {
      dur: 1.8,
      gain: 0.035,
      type: k > 6 ? 'triangle' : 'sine',
      detune: k > 5 ? (Math.random() - 0.5) * k * 6 : 0,
      pan: at ? (at.x / innerWidth) * 2 - 1 : 0,
    })
    setLayers(k + 1)
  }, [])

  // a few seconds of watching unlock the first observer, even if the thought never fled
  useEffect(() => {
    const id = setTimeout(() => setFled((f) => Math.max(f, 2)), 9000)
    return () => clearTimeout(id)
  }, [])

  useCanvas(canvasRef, (ctx, s, canvas) => {
    const nodes = []
    let lastFlee = 0
    const r = rng(11)
    const mk = (x, y) => ({ x, y, vx: 0, vy: 0, born: s.t, seed: r() * 50 })
    const onDown = (e) => {
      const st = live.current
      if (st.layers < 2 && st.fled < 2) return
      const rect = canvas.getBoundingClientRect()
      add({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
    canvas.addEventListener('pointerdown', onDown)
    return {
      resize(w, h) {
        if (!nodes.length) nodes.push(mk(w * 0.5, h * 0.5))
      },
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        // grow / shrink to the requested number of layers
        while (nodes.length < st.layers) {
          const prev = nodes[nodes.length - 1]
          const at = st.spawn
          nodes.push(mk(at ? at.x : prev.x + 80, at ? at.y : prev.y - 60))
          st.spawn = null
        }
        if (nodes.length > st.layers) nodes.length = st.layers
        const n = nodes.length
        const u = clamp((n - 4) / 8)
        const loop = n >= 11

        for (let k = 0; k < n; k++) {
          const p = nodes[k]
          let tx
          let ty
          let K = 2.4
          if (k === 0 && !loop) {
            tx = w * 0.5 + noise3(t * 0.06, 1.3, 0) * w * 0.3
            ty = h * 0.5 + noise3(t * 0.06, 7.1, 0) * h * 0.3
            K = 1.1
          } else {
            const o = k === 0 ? nodes[n - 1] : nodes[k - 1]
            const dir = k % 2 ? 1 : -1
            const ang = t * (0.32 + 0.04 * k) * dir + k * 1.7
            const rad = Math.min(60 + 21 * k, Math.min(w, h) * 0.36)
            tx = o.x + Math.cos(ang) * rad
            ty = o.y + Math.sin(ang) * rad * 0.72
          }
          let ax = (tx - p.x) * K - p.vx * 2.3
          let ay = (ty - p.y) * K - p.vy * 2.3
          if (s.inside) {
            const dx = p.x - s.mx
            const dy = p.y - s.my
            const d = Math.hypot(dx, dy) || 1
            const R = k === 0 ? 180 : k === n - 1 ? 140 : 90
            if (d < R) {
              const f = (1 - d / R) ** 2 * (k === 0 ? 5200 : 2400)
              ax += (dx / d) * f
              ay += (dy / d) * f
              if (k === 0 && d < R * 0.7 && t - lastFlee > 0.9) {
                lastFlee = t
                st.onFlee?.()
                blip(1320 + Math.random() * 200, 0.006, 0.08)
              }
            }
          }
          if (u > 0) {
            ax += noise3(p.seed, t * 2.6, 0) * u * 1400
            ay += noise3(p.seed, t * 2.6, 9) * u * 1400
          }
          p.vx += ax * dt
          p.vy += ay * dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          const m = 36
          if (p.x < m) p.vx += (m - p.x) * 12 * dt
          if (p.x > w - m) p.vx -= (p.x - w + m) * 12 * dt
          if (p.y < m) p.vy += (m - p.y) * 12 * dt
          if (p.y > h - m) p.vy -= (p.y - h + m) * 12 * dt
        }

        // the more layers, the more each frame remembers the last
        if (u > 0.05) {
          ctx.fillStyle = `rgba(5,5,5,${(0.4 - u * 0.18).toFixed(3)})`
          ctx.fillRect(0, 0, w, h)
        } else ctx.clearRect(0, 0, w, h)

        // recursion: the whole constellation, watching itself, smaller
        if (u > 0.45) {
          let cx = 0
          let cy = 0
          for (const p of nodes) {
            cx += p.x
            cy += p.y
          }
          cx /= n
          cy /= n
          const ea = (u - 0.45) * 0.5
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(t * 0.12)
          ctx.scale(0.42, 0.42)
          ctx.translate(-cx, -cy)
          ctx.strokeStyle = ink(ea)
          ctx.beginPath()
          for (let k = 0; k < n; k++) {
            const a = nodes[k]
            const b = k === 0 ? (loop ? nodes[n - 1] : null) : nodes[k - 1]
            if (!b) continue
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
          }
          ctx.stroke()
          ctx.restore()
        }

        // lines of sight
        ctx.lineWidth = 1
        for (let k = 0; k < n; k++) {
          const a = nodes[k]
          const b = k === 0 ? (loop ? nodes[n - 1] : null) : nodes[k - 1]
          if (!b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 1
          const px = -dy / d
          const py = dx / d
          const spread = 7 + k * 0.8
          ctx.strokeStyle = ink(0.07)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x + px * spread, b.y + py * spread)
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x - px * spread, b.y - py * spread)
          ctx.stroke()
          ctx.setLineDash([2, 5])
          ctx.strokeStyle = k === 0 ? signal(0.55) : ink(0.32)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.strokeStyle = ink(0.22)
          ctx.beginPath()
          ctx.arc(b.x, b.y, 10 + k * 1.2, 0, TAU)
          ctx.stroke()
        }

        // the visitor is the observer of the topmost observer
        if (s.inside && n >= 2) {
          const top = nodes[n - 1]
          ctx.setLineDash([1, 6])
          ctx.strokeStyle = ink(0.3)
          ctx.beginPath()
          ctx.moveTo(s.mx, s.my)
          ctx.lineTo(top.x, top.y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.font = '500 9.5px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = signal(0.85)
          ctx.fillText(`YOU · LAYER ${n + 1}`, s.mx + 12, s.my + 18)
        }

        // the observers
        const shift = loop ? Math.floor(t / 1.3) : 0
        const rr = rng(Math.floor(t * 7) + 3)
        ctx.font = '450 10px "JetBrains Mono Variable", monospace'
        for (let k = 0; k < n; k++) {
          const p = nodes[k]
          const age = clamp((t - p.born) / 0.8)
          if (k === 0) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 34)
            g.addColorStop(0, ink(0.32))
            g.addColorStop(1, ink(0))
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(p.x, p.y, 34, 0, TAU)
            ctx.fill()
            ctx.fillStyle = '#fffdf8'
            ctx.beginPath()
            ctx.arc(p.x, p.y, 3.2, 0, TAU)
            ctx.fill()
            ctx.strokeStyle = ink(0.4)
            ctx.beginPath()
            ctx.arc(p.x, p.y, 9 + Math.sin(t * 2.2) * 2, 0, TAU)
            ctx.stroke()
          } else {
            const o = nodes[k - 1]
            const dx = o.x - p.x
            const dy = o.y - p.y
            const d = Math.hypot(dx, dy) || 1
            const R = 6 * age
            if (u > 0.2) {
              const off = u * 3.2
              ctx.strokeStyle = signal(0.45)
              ctx.beginPath()
              ctx.arc(p.x + off, p.y, R, 0, TAU)
              ctx.stroke()
              ctx.strokeStyle = cool(0.45)
              ctx.beginPath()
              ctx.arc(p.x - off, p.y, R, 0, TAU)
              ctx.stroke()
            }
            ctx.strokeStyle = ink(0.85)
            ctx.beginPath()
            ctx.arc(p.x, p.y, R, 0, TAU)
            ctx.stroke()
            ctx.fillStyle = ink(0.95)
            ctx.beginPath()
            ctx.arc(p.x + (dx / d) * 2.6 * age, p.y + (dy / d) * 2.6 * age, 1.9 * age, 0, TAU)
            ctx.fill()
          }
          const li = loop ? (k + shift) % n : k
          const label = corrupt(labelFor(li), n >= 7 ? u * 0.22 : 0, rr)
          const lx = p.x + 14
          const ly = p.y - 12
          ctx.strokeStyle = ink(0.25)
          ctx.beginPath()
          ctx.moveTo(p.x + 5, p.y - 4)
          ctx.lineTo(lx - 3, ly + 3)
          ctx.stroke()
          ctx.fillStyle = ink(0.85 * age)
          ctx.fillText(label, lx, ly)
          ctx.fillStyle = ink(0.32 * age)
          ctx.fillText(`${(p.x / w).toFixed(2)} ${(p.y / h).toFixed(2)}`, lx, ly + 12)
        }
      },
      dispose() {
        canvas.removeEventListener('pointerdown', onDown)
      },
    }
  })

  const big =
    layers >= 6 && layers <= 7
      ? 'How many observers are there?'
      : layers >= 8 && layers <= 10
        ? 'Where is the original observer?'
        : null
  const canAdd = fled >= 2 || layers > 1

  return (
    <section id="observer" className="sec obs" data-section>
      <SectionHead n="01" title="The Observer" motif="Recursion" />
      <div className="grid12">
        <Statement
          className="big obs__statement"
          text="Thinking is not the same as knowing that you are *thinking.*"
          lens
        />
        <Reveal className="obs__aside" delay={0.4}>
          <p className="prose">
            Metacognition is cognition about cognition: a mind representing, monitoring and steering its own processes.
            You are doing it now, if you notice that you are reading.
          </p>
          <p className="mono mono--dim" style={{ marginTop: 14 }}>
            Term introduced by J. H. Flavell, 1979
          </p>
        </Reveal>
      </div>

      <Legend />

      <div className="stage full-bleed obs__stage">
        <canvas
          ref={canvasRef}
          aria-label="A point of light representing a thought, and the observers you add to watch it."
        />
        <div className="stage__corner stage__corner--tl">
          <p className="mono mono--dim">Specimen 01 · a thought</p>
          <p className="mono mono--ink obs__msg">
            <Scramble text={message(layers, fled).toUpperCase()} duration={700} />
          </p>
        </div>
        <div className="stage__corner stage__corner--tr mono mono--dim">
          <div>
            Layers <span className="mono--ink">{String(layers).padStart(2, '0')}</span>
          </div>
          <div>Observers {String(layers - 1).padStart(2, '0')}</div>
          <div>Stability {Math.round((1 - clamp((layers - 4) / 8)) * 100)}%</div>
        </div>
        <AnimatePresence mode="wait">
          {big && (
            <motion.p
              key={big}
              className="obs__big"
              initial={{ opacity: 0, filter: 'blur(14px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(14px)' }}
              transition={{ duration: 1.6, ease: [0.2, 0.7, 0.1, 1] }}
            >
              {big}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="stage__corner stage__corner--bl obs__controls">
          <AnimatePresence>
            {canAdd && (
              <motion.div
                className="choice-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                <button className="btn" onClick={() => add(null)} disabled={layers >= MAX}>
                  <span aria-hidden="true">+</span>{' '}
                  {layers >= MAX
                    ? 'The instrument cannot hold more'
                    : layers === 1
                      ? 'Add an observer'
                      : 'Observe the observer'}
                </button>
                {layers > 1 && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => {
                      blip(500, 0.02, 0.3)
                      setLayers(1)
                    }}
                  >
                    ↺ Release
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="stage__corner stage__corner--br mono mono--dim obs__hint">
          {canAdd ? 'Click anywhere to add a layer' : 'Move toward the light'}
        </div>
      </div>

      <Claims>
        <Claim kind="argument" cite="See e.g. D. Dennett, Consciousness Explained (1991)">
          The homunculus problem: if seeing needed a little observer inside the head, what would that observer see with?
          Explaining an observer with another observer starts a regress.
        </Claim>
        <Claim kind="empirical" cite="Fleming & Lau (2014), How to measure metacognition" delay={0.1}>
          People can report how confident they are in their own perceptual decisions. Those reports track accuracy, but
          not perfectly, and the gap can be measured.
        </Claim>
        <Claim kind="model" cite="Rosenthal (2005); Lau & Rosenthal (2011)" delay={0.2}>
          Higher-order theories propose that a state becomes conscious when the mind represents itself as being in it.
          On that view, one layer of observation is enough, not an infinite number.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Does awareness need an observer at all? Or is “the observer” something the system’s model of itself adds
          afterwards?
        </Claim>
      </Claims>
    </section>
  )
}
