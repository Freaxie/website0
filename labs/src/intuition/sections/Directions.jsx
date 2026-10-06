import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, clamp, ink, rng, smooth, TAU } from '@shared/lib/math.js'
import { ne, ni, niDeep } from '../color.js'

const C = [0.5, 0.52]

// a field of scattered details, and a tree that reaches every one of them from the centre
function buildField(n) {
  const r = rng(91)
  const pts = []
  let guard = 0
  const minD = 0.6 / Math.sqrt(n)
  while (pts.length < n && guard++ < n * 40) {
    const x = r()
    const y = r()
    if (pts.some((p) => Math.abs(p.x - x) < minD && Math.abs(p.y - y) < minD)) continue
    pts.push({ x, y, seed: r() * 100 })
  }
  for (const p of pts) {
    p.d = Math.hypot(p.x - C[0], (p.y - C[1]) * 0.7)
    p.a = Math.atan2(p.y - C[1], p.x - C[0])
  }
  pts.sort((a, b) => a.d - b.d)
  const maxD = pts[pts.length - 1].d
  pts.forEach((p) => (p.dn = p.d / maxD))
  // each detail hangs from the nearest detail that is already closer to the centre
  pts[0].parent = -1
  for (let i = 1; i < pts.length; i++) {
    let best = 0
    let bd = Infinity
    for (let j = Math.max(0, i - 260); j < i; j++) {
      const dd = (pts[j].x - pts[i].x) ** 2 + (pts[j].y - pts[i].y) ** 2
      if (dd < bd) {
        bd = dd
        best = j
      }
    }
    pts[i].parent = best
  }
  return pts
}

export default function Directions() {
  const trackRef = useRef(null)
  const canvasRef = useRef(null)
  const outRef = useRef(null)
  const inRef = useRef(null)
  const { scrollYProgress: p } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const introO = useTransform(p, [0, 0.06, 0.11], [1, 1, 0])
  const neO = useTransform(p, [0.13, 0.18, 0.42, 0.47], [0, 1, 1, 0])
  const neY = useTransform(p, [0.13, 0.47], [24, -24])
  const niO = useTransform(p, [0.52, 0.57, 0.82, 0.87], [0, 1, 1, 0])
  const niY = useTransform(p, [0.52, 0.87], [24, -24])
  const outroO = useTransform(p, [0.91, 0.96], [0, 1])

  useCanvas(
    canvasRef,
    (ctx, s) => {
      const coarse = matchMedia('(pointer: coarse)').matches
      const pts = buildField(coarse ? 700 : 1300)
      let prog = 0
      return {
        frame(dt) {
          const { w, h, t } = s
          const tr = trackRef.current?.getBoundingClientRect()
          if (!tr) return
          const target = clamp(-tr.top / Math.max(1, tr.height - h))
          prog = approach(prog, target, 6, dt)
          const g = smooth(0.12, 0.4, prog) // outward growth
          const e = smooth(0.5, 0.78, prog) // inward convergence
          const b = smooth(0.89, 0.99, prog) // and out again
          const cx = C[0] * w
          const cy = C[1] * h

          ctx.fillStyle = '#040404'
          ctx.fillRect(0, 0, w, h)

          // positions for this moment
          for (const q of pts) {
            const hx = q.x * w + noise3(q.seed, t * 0.12, 0) * 6
            const hy = q.y * h + noise3(q.seed, t * 0.12, 4) * 6
            let x = hx
            let y = hy
            if (b > 0) {
              // unwind from the point back out to where each detail lives
              const k = 1 - Math.pow(1 - b, 3)
              const rot = (1 - k) * 1.4
              const dx = hx - cx
              const dy = hy - cy
              x = cx + (dx * Math.cos(rot) - dy * Math.sin(rot)) * k
              y = cy + (dx * Math.sin(rot) + dy * Math.cos(rot)) * k
            } else if (e > 0) {
              const k = Math.pow(e, 1.25)
              const dx = hx - cx
              const dy = hy - cy
              const r0 = Math.hypot(dx, dy)
              const a0 = Math.atan2(dy, dx)
              const rr = r0 * Math.pow(1 - k, 1.5)
              const phi = a0 + k * (2.4 + 3 * (1 - q.dn))
              x = cx + Math.cos(phi) * rr
              y = cy + Math.sin(phi) * rr
            }
            q.px = x
            q.py = y
          }

          // outward: the branching, from one detail to all the others
          if (g > 0 && e < 1) {
            const fade = 1 - e
            ctx.strokeStyle = ne(0.32 * fade)
            ctx.lineWidth = 1
            ctx.beginPath()
            for (let i = 1; i < pts.length; i++) {
              const q = pts[i]
              const f = clamp((g * 1.08 - q.dn) / 0.05)
              if (f <= 0) continue
              const par = pts[q.parent]
              ctx.moveTo(par.px, par.py)
              ctx.lineTo(par.px + (q.px - par.px) * f, par.py + (q.py - par.py) * f)
            }
            ctx.stroke()
          }

          // the details themselves
          for (let i = 0; i < pts.length; i++) {
            const q = pts[i]
            const reached = g * 1.08 > q.dn
            let col
            if (b > 0) col = b < 0.5 ? ne(0.9) : ink(0.35 + 0.5 * (1 - b))
            else if (e > 0.02) col = ni(0.35 + 0.6 * e)
            else col = reached ? ne(0.9) : ink(0.32)
            ctx.fillStyle = col
            const sz = reached && e < 0.02 && b === 0 ? 2 : 1.5
            ctx.fillRect(q.px - sz / 2, q.py - sz / 2, sz, sz)
          }

          // inward: everything arrives at one point
          if (e > 0.3 && b < 1) {
            const a = smooth(0.3, 1, e) * (1 - b)
            const R = 30 + 90 * a + Math.sin(t * 2) * 4
            const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2)
            gr.addColorStop(0, ni(0.55 * a))
            gr.addColorStop(0.35, niDeep(0.35 * a))
            gr.addColorStop(1, niDeep(0))
            ctx.fillStyle = gr
            ctx.beginPath()
            ctx.arc(cx, cy, R * 2.2, 0, TAU)
            ctx.fill()
            ctx.fillStyle = `rgba(255,253,248,${a})`
            ctx.beginPath()
            ctx.arc(cx, cy, 2.5 + a * 2, 0, TAU)
            ctx.fill()
          }
          // the seed, before anything happens
          if (g < 0.05 && e === 0) {
            const a = 1 - g / 0.05
            ctx.strokeStyle = ink(0.6 * a)
            ctx.beginPath()
            ctx.arc(pts[0].px, pts[0].py, 9 + Math.sin(t * 2) * 1.5, 0, TAU)
            ctx.stroke()
            ctx.font = '10px "JetBrains Mono Variable", monospace'
            ctx.fillStyle = ink(0.6 * a)
            ctx.fillText('ONE DETAIL', pts[0].px + 16, pts[0].py + 4)
          }
          // rays as it opens again
          if (b > 0 && b < 1) {
            ctx.strokeStyle = ne(0.25 * (1 - b))
            ctx.beginPath()
            for (let i = 0; i < pts.length; i += 3) {
              ctx.moveTo(cx, cy)
              ctx.lineTo(pts[i].px, pts[i].py)
            }
            ctx.stroke()
          }

          if (outRef.current) outRef.current.textContent = (g * (1 - e)).toFixed(2)
          if (inRef.current) inRef.current.textContent = (e * (1 - b)).toFixed(2)
        },
      }
    },
    { maxDpr: 1.75 },
  )

  return (
    <section id="directions" className="dirs" data-section>
      <div ref={trackRef} className="dirs__track">
        <div className="dirs__sticky">
          <canvas
            ref={canvasRef}
            aria-label="A field of details. First a branching spreads outward from one of them; then everything spirals inward to one point."
          />

          <motion.div className="dirs__intro" style={{ opacity: introO }}>
            <p className="mono mono--ink">§02 · Two directions</p>
            <p className="big dirs__title">
              Intuition can leap <em>two ways.</em>
            </p>
            <p className="mono mono--dim">Scroll ↓</p>
          </motion.div>

          <motion.div className="dirs__panel dirs__panel--ne" style={{ opacity: neO, y: neY }}>
            <p className="mono t-ne">Ne · Extraverted intuition</p>
            <p className="dirs__q">“What else could this be?”</p>
            <p className="prose">
              It works on the world outside you. One thing suggests another, and another; the field keeps widening and
              nothing has to be ruled out.
            </p>
          </motion.div>

          <motion.div className="dirs__panel dirs__panel--ni" style={{ opacity: niO, y: niY }}>
            <p className="mono t-ni">Ni · Introverted intuition</p>
            <p className="dirs__q">“What is this really about?”</p>
            <p className="prose">
              It works on images inside you. Impressions sink, combine and come back as one meaning, often without
              visible steps. The field narrows to a point.
            </p>
          </motion.div>

          <motion.p className="dirs__outro whisper" style={{ opacity: outroO }}>
            And from the point, it opens again.
          </motion.p>

          <div className="dirs__meter mono mono--dim" aria-hidden="true">
            <span>
              <span className="t-ne">Outward</span>{' '}
              <span ref={outRef} className="mono--ink">
                0.00
              </span>
            </span>
            <span>
              <span className="t-ni">Inward</span>{' '}
              <span ref={inRef} className="mono--ink">
                0.00
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="sec dirs__after">
        <Claims>
          <Claim kind="model" cite="C. G. Jung, Psychological Types (1921)">
            Jung described intuition as one of two perceiving functions, alongside sensation, and held that each
            function takes an extraverted or introverted attitude: turned toward outer objects, or toward inner images.
          </Claim>
          <Claim
            kind="model"
            cite="e.g. I. Briggs Myers; J. Beebe, Energies and Patterns in Psychological Type (2017)"
            delay={0.1}
          >
            The “eight cognitive functions” — Ne, Ni and the rest — are later elaborations of Jung by type theorists.
            Schools disagree about what each function is and how they combine.
          </Claim>
          <Claim kind="argument" cite="J. P. Guilford, The Nature of Human Intelligence (1967)" delay={0.2}>
            Divergent and convergent thinking are measurable cognitive processes. Reading Ne as divergence and Ni as
            convergence is an interpretation laid over them, not a finding.
          </Claim>
        </Claims>
      </div>
    </section>
  )
}
