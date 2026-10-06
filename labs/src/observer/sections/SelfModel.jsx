import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, cool, ink, rng, TAU } from '@shared/lib/math.js'
import { hiss, swell, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

const COMPONENTS = [
  { id: 'memory', name: 'Memory', gloss: 'Rebuilt each time it is recalled.' },
  { id: 'body', name: 'Body', gloss: 'A model the brain keeps of where you end.' },
  { id: 'name', name: 'Name', gloss: 'A sound other people use to point at you.' },
  { id: 'goals', name: 'Goals', gloss: 'Futures you are steering toward.' },
  { id: 'fears', name: 'Fears', gloss: 'Futures you are steering away from.' },
  { id: 'preferences', name: 'Preferences', gloss: 'Patterns of approach and avoidance.' },
  { id: 'role', name: 'Social role', gloss: 'Who you are inside other minds.' },
  { id: 'history', name: 'Personal history', gloss: 'The events you count as yours.' },
  { id: 'expectations', name: 'Expectations', gloss: 'Predictions about what you will do next.' },
  { id: 'narrative', name: 'Narrative', gloss: 'The story that binds the rest together.' },
]
// the order "remove self" takes them in; the story goes last
const ORDER = [
  'name',
  'role',
  'preferences',
  'goals',
  'fears',
  'expectations',
  'history',
  'memory',
  'body',
  'narrative',
]

const MW = 360
const MH = 480

function buildSilhouette(count) {
  const c = document.createElement('canvas')
  c.width = MW
  c.height = MH
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.beginPath()
  g.ellipse(180, 122, 60, 76, 0, 0, TAU)
  g.fill()
  g.beginPath()
  g.moveTo(154, 180)
  g.lineTo(206, 180)
  g.lineTo(212, 238)
  g.lineTo(148, 238)
  g.closePath()
  g.fill()
  g.beginPath()
  g.moveTo(150, 226)
  g.bezierCurveTo(128, 258, 74, 266, 44, 312)
  g.bezierCurveTo(22, 350, 16, 420, 14, 480)
  g.lineTo(346, 480)
  g.bezierCurveTo(344, 420, 338, 350, 316, 312)
  g.bezierCurveTo(286, 266, 232, 258, 210, 226)
  g.closePath()
  g.fill()
  const data = g.getImageData(0, 0, MW, MH).data
  const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && data[(y * MW + x) * 4] > 128
  const r = rng(23)
  const pts = []
  const nEdge = Math.round(count * 0.28)
  let guard = 0
  while (pts.length < nEdge && guard++ < 200000) {
    const x = Math.floor(r() * MW)
    const y = Math.floor(r() * (MH - 4))
    if (!inside(x, y)) continue
    if (inside(x + 3, y) && inside(x - 3, y) && inside(x, y + 3) && inside(x, y - 3)) continue
    pts.push({ hx: x, hy: y, edge: true })
  }
  guard = 0
  while (pts.length < count && guard++ < 200000) {
    const x = r() * MW
    const y = r() * (MH - 4)
    if (!inside(Math.floor(x), Math.floor(y))) continue
    pts.push({ hx: x, hy: y, edge: false })
  }
  // components are patchy: each owns a few regions scattered through the figure
  const seeds = []
  COMPONENTS.forEach((_, ci) => {
    let n = 0
    while (n < 3) {
      const x = r() * MW
      const y = r() * MH
      if (inside(Math.floor(x), Math.floor(y))) {
        seeds.push([x, y, ci])
        n++
      }
    }
  })
  for (const p of pts) {
    if (p.edge || r() < 0.035) {
      p.comp = -1 // the residue: what is left when every component is gone
      continue
    }
    let best = 0
    let bd = Infinity
    for (const [x, y, ci] of seeds) {
      const d = (x - p.hx) ** 2 + (y - p.hy) ** 2
      if (d < bd) {
        bd = d
        best = ci
      }
    }
    p.comp = best
  }
  return pts.map((p) => ({ ...p, x: 0, y: 0, vx: 0, vy: 0, a: 0, init: false, seed: r() * 100, size: 0.9 + r() * 1.1 }))
}

export default function SelfModel() {
  const [removed, setRemoved] = useState(() => new Set())
  const [hover, setHover] = useState(null)
  const [auto, setAuto] = useState(false)
  const canvasRef = useRef(null)
  const live = useRef({ removed, hover, toggle: null })
  const [counts, setCounts] = useState([])
  live.current.removed = removed
  live.current.hover = hover
  const allGone = removed.size === COMPONENTS.length

  const toggle = useCallback((id) => {
    const next = new Set(live.current.removed)
    if (next.has(id)) {
      next.delete(id)
      tone(392, { dur: 1.2, gain: 0.025 })
    } else {
      next.add(id)
      hiss(0.025, 0.9, 2400)
      tone(196 - next.size * 9, { dur: 2.4, gain: 0.03, type: 'triangle' })
    }
    live.current.removed = next
    setRemoved(next)
  }, [])
  live.current.toggle = toggle

  // remove self: one component at a time, the narrative last
  useEffect(() => {
    if (!auto) return
    const nextId = ORDER.find((id) => !removed.has(id))
    if (!nextId) {
      setAuto(false)
      return
    }
    const t = setTimeout(() => toggle(nextId), removed.size === 0 ? 200 : 750)
    return () => clearTimeout(t)
  }, [auto, removed, toggle])

  useEffect(() => {
    if (allGone) swell([82.4, 123.5, 164.8], 0.035, 6)
  }, [allGone])

  useCanvas(canvasRef, (ctx, s, canvas) => {
    const coarse = matchMedia('(pointer: coarse)').matches
    const pts = buildSilhouette(coarse ? 1300 : 2600)
    const counts = COMPONENTS.map((_, ci) => pts.filter((p) => p.comp === ci).length)
    setCounts(counts)
    let geo = { k: 1, ox: 0, oy: 0 }
    let breath = 0
    const resize = (w, h) => {
      const k = Math.min((w * 0.86) / MW, (h * 0.9) / MH)
      geo = { k, ox: (w - MW * k) / 2, oy: h - MH * k }
    }
    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      let best = null
      let bd = 16 * 16
      for (const p of pts) {
        if (p.comp < 0 || live.current.removed.has(COMPONENTS[p.comp].id)) continue
        const d = (p.x - x) ** 2 + (p.y - y) ** 2
        if (d < bd) {
          bd = d
          best = p
        }
      }
      if (best) live.current.toggle(COMPONENTS[best.comp].id)
    }
    canvas.addEventListener('pointerdown', onDown)
    return {
      resize,
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        const gone = st.removed
        const n = gone.size
        const bodyGone = gone.has('body')
        const storyGone = gone.has('narrative')
        breath = approach(breath, bodyGone ? 0 : 1, 0.8, dt)
        const br = 1 + 0.012 * Math.sin(t * 1.3) * breath
        const shrink = 1 - n * 0.008
        const cxm = MW / 2
        const cym = MH * 0.55
        const hoverIdx = st.hover == null ? -1 : COMPONENTS.findIndex((c) => c.id === st.hover)
        const jitter = (storyGone ? 3 : 0) + n * 0.25

        ctx.clearRect(0, 0, w, h)
        const lone = n === COMPONENTS.length
        for (const p of pts) {
          const comp = p.comp
          const detached = comp >= 0 && gone.has(COMPONENTS[comp].id)
          const hx = geo.ox + (cxm + (p.hx - cxm) * br * shrink) * geo.k
          const hy = geo.oy + (cym + (p.hy - cym) * br * shrink) * geo.k
          if (!p.init) {
            p.x = hx
            p.y = hy
            p.init = true
          }
          if (detached) {
            // drift away as fragments, slowly, and keep drifting
            const nx = noise3(p.seed, t * 0.15, 0)
            const ny = noise3(p.seed, t * 0.15, 5)
            if (p.a > 0.98) {
              const dx = p.x - (geo.ox + cxm * geo.k)
              const dy = p.y - (geo.oy + cym * geo.k)
              const d = Math.hypot(dx, dy) || 1
              p.vx += (dx / d) * (40 + p.seed) + nx * 60
              p.vy += (dy / d) * (40 + p.seed) - 30
            }
            p.vx += nx * 18 * dt
            p.vy += (ny * 18 - 4) * dt
            p.vx *= 1 - 0.9 * dt
            p.vy *= 1 - 0.9 * dt
            p.a = approach(p.a, 0, 0.9, dt)
          } else {
            const jx = jitter ? noise3(p.seed, t * 1.5, 1) * jitter : 0
            const jy = jitter ? noise3(p.seed, t * 1.5, 2) * jitter : 0
            p.vx += ((hx + jx - p.x) * 14 - p.vx * 5.5) * dt
            p.vy += ((hy + jy - p.y) * 14 - p.vy * 5.5) * dt
            p.a = approach(p.a, 1, 1.6, dt)
          }
          if (s.inside) {
            const dx = p.x - s.mx
            const dy = p.y - s.my
            const d2 = dx * dx + dy * dy
            if (d2 < 3600) {
              const d = Math.sqrt(d2) || 1
              const f = (1 - d / 60) * 260
              p.vx += (dx / d) * f * dt
              p.vy += (dy / d) * f * dt
            }
          }
          p.x += p.vx * dt
          p.y += p.vy * dt

          let alpha
          let sz = p.size
          if (comp < 0) {
            alpha = lone ? 0.62 + 0.3 * Math.sin(t * 1.1 + p.hy * 0.02) : 0.5
            ctx.fillStyle = lone ? ink(alpha) : cool(alpha)
          } else {
            alpha = detached ? 0.1 + 0.6 * p.a : 0.84
            if (hoverIdx >= 0 && !detached) {
              if (comp === hoverIdx) {
                alpha = 1
                sz *= 1.6
              } else alpha = 0.28
            }
            ctx.fillStyle = ink(alpha)
          }
          ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz)
        }

        // the hovered component names itself
        if (hoverIdx >= 0 && !gone.has(COMPONENTS[hoverIdx].id)) {
          let mx = 0
          let my = 0
          let c = 0
          for (const p of pts)
            if (p.comp === hoverIdx) {
              mx += p.x
              my += p.y
              c++
            }
          if (c) {
            mx /= c
            my /= c
            ctx.strokeStyle = ink(0.5)
            ctx.beginPath()
            ctx.arc(mx, my, 4, 0, TAU)
            ctx.moveTo(mx + 4, my)
            ctx.lineTo(mx + 40, my - 30)
            ctx.lineTo(mx + 120, my - 30)
            ctx.stroke()
            ctx.font = '10px "JetBrains Mono Variable", monospace'
            ctx.fillStyle = ink(0.95)
            ctx.fillText(COMPONENTS[hoverIdx].name.toUpperCase(), mx + 44, my - 36)
          }
        }
      },
      dispose() {
        canvas.removeEventListener('pointerdown', onDown)
      },
    }
  })

  const integrity = Math.round(100 * (1 - removed.size / COMPONENTS.length))

  return (
    <section id="self" className="sec self" data-section>
      <SectionHead n="06" title="The Self Model" motif="Concentric structures · fragments" />
      <div className="grid12">
        <Statement className="big self__statement" text="You are not a thing. You may be a *model* of one." />
        <Reveal className="self__aside" delay={0.3}>
          <p className="prose">
            Each point below stands for something you take to be part of you. Remove them, one kind at a time, and watch
            what the figure does.
          </p>
        </Reveal>
      </div>

      <div className="self__lab">
        <div className="self__stage">
          <canvas
            ref={canvasRef}
            aria-label="A human silhouette made of particles, each belonging to a component of the self."
          />
          <div className="self__readout mono mono--dim">
            <span>
              Subject · <span className="mono--ink">{removed.has('name') ? '—' : 'You'}</span>
            </span>
            <span>
              Integrity <span className="mono--ink">{String(integrity).padStart(3, '0')}%</span>
            </span>
          </div>
          <AnimatePresence>
            {allGone && (
              <motion.div
                className="self__final"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
              >
                <motion.p
                  className="mono mono--dim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.2, delay: 1.6 }}
                >
                  The silhouette remains.
                </motion.p>
                <motion.p
                  className="self__q"
                  initial={{ opacity: 0, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 2, delay: 3.2, ease: EASE }}
                >
                  What remains when the narrative disappears?
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="self__list">
          <p className="mono mono--dim self__list-head">Components of a self · select to remove</p>
          <ul>
            {COMPONENTS.map((c, i) => {
              const off = removed.has(c.id)
              return (
                <li key={c.id}>
                  <button
                    className={`self__item ${off ? 'is-off' : ''}`}
                    onClick={() => toggle(c.id)}
                    onPointerEnter={() => setHover(c.id)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(c.id)}
                    onBlur={() => setHover(null)}
                    aria-pressed={off}
                  >
                    <span className="mono mono--dim self__idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="self__name">
                      <span className="mono">{c.name}</span>
                      <span className="self__gloss">{c.gloss}</span>
                    </span>
                    <span className="mono mono--dim self__count">{off ? 'removed' : (counts[i] ?? '')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="choice-row self__actions">
            {!allGone ? (
              <button className="btn" onClick={() => setAuto(true)} disabled={auto}>
                <span className="btn__dot" /> {auto ? 'Removing…' : 'Remove self'}
              </button>
            ) : null}
            {removed.size > 0 && (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setAuto(false)
                  setRemoved(new Set())
                  tone(523, { dur: 2, gain: 0.025 })
                }}
              >
                ↺ Restore
              </button>
            )}
          </div>
        </div>
      </div>

      <Claims>
        <Claim kind="model" cite="S. Gallagher (2000), Philosophical conceptions of the self">
          A distinction: the minimal self, the bare sense that this experience is mine, now; and the narrative self, the
          story extended across time. They may be separable.
        </Claim>
        <Claim kind="argument" cite="D. Hume, A Treatise of Human Nature (1739)" delay={0.1}>
          “When I enter most intimately into what I call myself, I always stumble on some particular perception or
          other… I never can catch myself at any time without a perception.”
        </Claim>
        <Claim kind="empirical" cite="Botvinick & Cohen (1998)" delay={0.2}>
          The rubber hand illusion: when a visible rubber hand is stroked in time with your hidden hand, within minutes
          many people feel the rubber hand as their own. The body in the model can move.
        </Claim>
        <Claim kind="empirical" cite="e.g. Bartlett (1932); Loftus & Palmer (1974)" delay={0.3}>
          Memory is reconstructive. Recalling an event rebuilds it, and the rebuilt version can be changed by the words
          used to ask about it.
        </Claim>
        <Claim kind="open" delay={0.4}>
          Is the outline that remains a self, or only the shape of where one used to be?
        </Claim>
      </Claims>
    </section>
  )
}
