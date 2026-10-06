import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Claim, Claims } from '../components/Claim.jsx'
import { Statement } from '../components/Text.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { noise3 } from '../lib/noise.js'
import { approach, clamp, cool, corrupt, ink, rng, signal, smooth, TAU } from '../lib/math.js'

const LABELS = [
  'SELF',
  'MODEL OF SELF',
  'MODEL OF MODEL OF SELF',
  'MODEL OF MODEL OF MODEL OF SELF',
  'SELF',
  'MODEL',
  'OBSERVER',
  'OBSERVED',
  'MODEL',
  'SELF',
  '???',
]
const CYCLE = LABELS.length // 11: the deepest level is the first one again
const DEPTH = CYCLE
const K = 0.4 // each model is drawn at 0.4 of the size of what it models
const OFF = 0.2

const instability = (i) => {
  const j = i % CYCLE
  return j <= 3 ? j * 0.1 : Math.min(1, 0.3 + (j - 3) * 0.1)
}

function buildLevels(n) {
  const levels = []
  let cx = 0
  let cy = 0
  let R = 1
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const a = (i % CYCLE) * 2.1 + 0.6
      cx += Math.cos(a) * levels[i - 1].R * OFF
      cy += Math.sin(a) * levels[i - 1].R * OFF
      R *= K
    }
    levels.push({ cx, cy, R })
  }
  // texture inside each ring, kept clear of the ring it contains
  const r = rng(31)
  const tex = []
  for (let j = 0; j < CYCLE; j++) {
    const ca = (j + 1) * 2.1 + 0.6
    const ccx = Math.cos(ca) * OFF
    const ccy = Math.sin(ca) * OFF
    const pts = []
    let guard = 0
    while (pts.length < 54 && guard++ < 4000) {
      const a = r() * TAU
      const d = Math.sqrt(r()) * 0.86
      const x = Math.cos(a) * d
      const y = Math.sin(a) * d
      if (Math.hypot(x - ccx, y - ccy) < K + 0.07) continue
      pts.push([x, y, r()])
    }
    const links = []
    pts.forEach((p, a) => {
      const near = pts
        .map((q, b) => [b, Math.hypot(p[0] - q[0], p[1] - q[1])])
        .filter(([b]) => b !== a)
        .sort((x, y) => x[1] - y[1])
        .slice(0, 2)
      near.forEach(([b, d]) => d < 0.32 && a < b && links.push([a, b]))
    })
    tex.push({ pts, links })
  }
  return { levels, tex }
}

export default function StrangeLoop() {
  const trackRef = useRef(null)
  const canvasRef = useRef(null)
  const depthRef = useRef(null)
  const labelRef = useRef(null)
  const markRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const introOpacity = useTransform(scrollYProgress, [0, 0.05, 0.1], [1, 1, 0])
  const introBlur = useTransform(scrollYProgress, [0.04, 0.1], ['blur(0px)', 'blur(14px)'])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0])
  const outroOpacity = useTransform(scrollYProgress, [0.9, 0.96], [0, 1])
  const outroBlur = useTransform(scrollYProgress, [0.9, 0.96], ['blur(16px)', 'blur(0px)'])

  useCanvas(
    canvasRef,
    (ctx, s) => {
      const { levels, tex } = buildLevels(DEPTH + 9)
      let z = 0
      let px = 0
      let py = 0
      const path = (cx, cy, r, i, u, t) => {
        const p = new Path2D()
        const N = r > 400 ? 240 : 140
        let pen = false
        for (let k = 0; k <= N; k++) {
          const a = (k / N) * TAU
          const ca = Math.cos(a)
          const sa = Math.sin(a)
          if (u > 0.45 && noise3(ca * 2 + i * 5, sa * 2, t * 0.35) > 1.15 - u * 0.75) {
            pen = false
            continue
          }
          const rr = r * (1 + u * 0.075 * noise3(ca * 1.4 + i * 7, sa * 1.4, t * 0.5))
          const x = cx + ca * rr
          const y = cy + sa * rr
          if (pen) p.lineTo(x, y)
          else p.moveTo(x, y)
          pen = true
        }
        return p
      }
      return {
        frame(dt) {
          const { w, h, t } = s
          const track = trackRef.current
          if (!track) return
          const tr = track.getBoundingClientRect()
          const prog = clamp(-tr.top / Math.max(1, tr.height - h))
          const target = clamp((prog - 0.05) / 0.85) * DEPTH
          z = approach(z, target, 5, dt)
          px = approach(px, s.inside ? (s.mx - w / 2) / w : 0, 3, dt)
          py = approach(py, s.inside ? (s.my - h / 2) / h : 0, 3, dt)

          const i0 = Math.floor(z)
          const f = z - i0
          const a = levels[i0]
          const b = levels[i0 + 1]
          const sf = smooth(0, 1, f)
          const Cx = a.cx + (b.cx - a.cx) * sf
          const Cy = a.cy + (b.cy - a.cy) * sf
          const Rz = Math.pow(K, z)
          const base = Math.min(w, h) * 0.37
          const S = base / Rz
          const rot = (-z * TAU) / DEPTH // one full turn on the way down, so the bottom lines up with the top
          const cr = Math.cos(rot)
          const sr = Math.sin(rot)
          const uz = instability(Math.round(z))

          ctx.fillStyle = '#040404'
          ctx.fillRect(0, 0, w, h)
          const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
          g.addColorStop(0, 'rgba(232,229,222,0.035)')
          g.addColorStop(1, 'rgba(232,229,222,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, 0, w, h)

          const diag = Math.hypot(w, h)
          const rrand = rng(Math.floor(t * 6) + 1)
          for (let i = Math.max(0, i0 - 1); i < Math.min(levels.length, i0 + 7); i++) {
            const L = levels[i]
            const r = L.R * S
            if (r < 5 || r > diag * 1.4) continue
            const dx = L.cx - Cx
            const dy = L.cy - Cy
            const depthPar = (i - z) * 0.018
            const cx = w / 2 + (dx * cr - dy * sr) * S + px * w * depthPar * 6
            const cy = h / 2 + (dx * sr + dy * cr) * S + py * h * depthPar * 6
            const u = instability(i)
            const fade = smooth(5, 34, r) * (1 - smooth(diag * 0.75, diag * 1.35, r))
            if (fade <= 0.001) continue
            const jit = u > 0.5 ? (rrand() - 0.5) * u * 3 : 0
            const ring = path(cx + jit, cy, r, i, u, t)

            // texture: a small nervous system between this ring and the next
            if (r > 110) {
              const T = tex[i % CYCLE]
              const ta = fade * 0.9
              ctx.save()
              ctx.translate(cx, cy)
              ctx.rotate(rot)
              ctx.strokeStyle = ink(0.09 * ta)
              ctx.beginPath()
              const P = T.pts.map(([x, y, q]) => {
                const n = u * 0.03
                return [(x + noise3(q * 9, t * 0.4, i) * n) * r, (y + noise3(q * 9, t * 0.4, i + 3) * n) * r]
              })
              for (const [A, B] of T.links) {
                ctx.moveTo(P[A][0], P[A][1])
                ctx.lineTo(P[B][0], P[B][1])
              }
              ctx.stroke()
              ctx.fillStyle = ink(0.4 * ta)
              for (const [x, y] of P) ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
              ctx.restore()
            }

            if (u > 0.25) {
              const off = u * 2.6
              ctx.save()
              ctx.translate(off, 0)
              ctx.strokeStyle = signal(0.32 * fade)
              ctx.stroke(ring)
              ctx.translate(-2 * off, 0)
              ctx.strokeStyle = cool(0.32 * fade)
              ctx.stroke(ring)
              ctx.restore()
            }
            ctx.lineWidth = i % CYCLE === 0 ? 1.4 : 1
            ctx.strokeStyle = ink(0.82 * fade)
            ctx.stroke(ring)
            ctx.lineWidth = 1

            // instrument ticks
            if (r > 70) {
              ctx.save()
              ctx.translate(cx, cy)
              ctx.rotate(rot)
              ctx.strokeStyle = ink(0.22 * fade)
              ctx.beginPath()
              for (let k = 0; k < 72; k++) {
                if (u > 0.6 && rrand() < u * 0.3) continue
                const aa = (k / 72) * TAU
                const len = k % 6 === 0 ? r * 0.045 : r * 0.018
                ctx.moveTo(Math.cos(aa) * (r * 1.02), Math.sin(aa) * (r * 1.02))
                ctx.lineTo(Math.cos(aa) * (r * 1.02 + len), Math.sin(aa) * (r * 1.02 + len))
              }
              ctx.stroke()
              ctx.restore()
            }

            // centre mark
            ctx.strokeStyle = ink(0.3 * fade)
            ctx.beginPath()
            ctx.moveTo(cx - 4, cy)
            ctx.lineTo(cx + 4, cy)
            ctx.moveTo(cx, cy - 4)
            ctx.lineTo(cx, cy + 4)
            ctx.stroke()

            // the label, set along the top of the ring
            if (r > 40) {
              const label = corrupt(LABELS[i % CYCLE], u > 0.45 ? (u - 0.35) * 0.35 : 0, rrand)
              const fs = Math.max(9, Math.min(24, r * 0.052))
              ctx.font = `450 ${fs.toFixed(1)}px "JetBrains Mono Variable", monospace`
              const cw = fs * 0.6 + fs * 0.32
              const rt = r * 0.91
              const span = (label.length * cw) / rt
              ctx.fillStyle = i % CYCLE === CYCLE - 1 ? signal(0.95 * fade) : ink(0.92 * fade)
              for (let k = 0; k < label.length; k++) {
                const phi = -span / 2 + (k + 0.5) * (span / label.length)
                ctx.save()
                ctx.translate(cx, cy)
                ctx.rotate(rot + phi + (u > 0.7 ? (rrand() - 0.5) * 0.05 * u : 0))
                ctx.fillText(label[k], -fs * 0.3, -rt + fs * 0.35)
                ctx.restore()
              }
              // annotation on the right flank
              if (r > 90 && r < Math.min(w, h) * 1.2) {
                const fid = i % CYCLE === CYCLE - 1 ? '???' : Math.pow(0.86, i % CYCLE).toFixed(2)
                const note =
                  i >= CYCLE
                    ? `L${String(i).padStart(2, '0')} ≡ L${String(i - CYCLE).padStart(2, '0')}`
                    : `L${String(i).padStart(2, '0')} · FIDELITY ${fid}`
                ctx.font = '400 10px "JetBrains Mono Variable", monospace'
                ctx.fillStyle = ink(0.5 * fade)
                const ax = cx + Math.cos(rot + 0.35) * r * 1.08
                const ay = cy + Math.sin(rot + 0.35) * r * 1.08
                ctx.fillText(note, ax + 6, ay)
                ctx.fillRect(ax - 2, ay - 3.5, 4, 1)
              }
            }
          }

          // at the unstable depths the signal itself starts to fail
          if (uz > 0.55) {
            const n = Math.floor((uz - 0.5) * 10)
            for (let k = 0; k < n; k++) {
              if (rrand() > 0.5) continue
              const y = rrand() * h
              const hh = 1 + rrand() * 3
              ctx.drawImage(ctx.canvas, 0, y * s.dpr, w * s.dpr, hh * s.dpr, (rrand() - 0.5) * 22 * uz, y, w, hh)
            }
          }

          // readouts
          if (depthRef.current) depthRef.current.textContent = z.toFixed(2).padStart(5, '0')
          if (labelRef.current) labelRef.current.textContent = LABELS[Math.round(z) % CYCLE]
          if (markRef.current) markRef.current.style.transform = `translateY(${(z / DEPTH) * 100}%)`
        },
      }
    },
    { maxDpr: 1.75 },
  )

  return (
    <section id="loop" className="loop" data-section>
      <div ref={trackRef} className="loop__track">
        <div className="loop__sticky">
          <canvas
            ref={canvasRef}
            aria-label="Nested circles: a self, a model of the self, a model of that model, and so on."
          />

          <motion.div className="loop__intro" style={{ opacity: introOpacity, filter: introBlur }}>
            <p className="mono mono--ink loop__kicker">§03 · The strange loop · self-reference</p>
            <Statement as="h2" className="big loop__title" text="The mind can represent the *mind.*" />
          </motion.div>
          <motion.p className="mono mono--dim loop__hint" style={{ opacity: hintOpacity }}>
            Scroll to descend ↓
          </motion.p>

          <div className="loop__meter mono mono--dim" aria-hidden="true">
            <span>Depth</span>
            <span ref={depthRef} className="mono--ink loop__depth">
              00.00
            </span>
            <div className="loop__ruler">
              {Array.from({ length: DEPTH + 1 }, (_, i) => (
                <i key={i} />
              ))}
              <b ref={markRef} />
            </div>
            <span ref={labelRef} className="mono--ink loop__label">
              SELF
            </span>
          </div>

          <motion.div className="loop__outro" style={{ opacity: outroOpacity, filter: outroBlur }}>
            <p className="big big--m">
              Who is observing <em>whom?</em>
            </p>
            <p className="mono mono--dim">Level 11 is level 0. The deepest model was the first one, seen again.</p>
          </motion.div>
        </div>
      </div>

      <div className="sec loop__after">
        <Claims>
          <Claim kind="argument" cite="D. Hofstadter, Gödel, Escher, Bach (1979); I Am a Strange Loop (2007)">
            A “strange loop”: a self arises when a system’s symbols come to stand for the system itself, so that moving
            up through its levels brings you back to where you started.
          </Claim>
          <Claim kind="model" cite="T. Metzinger, Being No One (2003)" delay={0.1}>
            Self-model theory: the self is a model the brain builds and cannot recognise as a model. Because it is
            transparent, you look through it rather than at it.
          </Claim>
          <Claim kind="empirical" cite="M. Gazzaniga, the left-hemisphere “interpreter”" delay={0.2}>
            In split-brain patients, the speaking hemisphere readily explains actions started by the other one, without
            noticing that its explanation is invented.
          </Claim>
          <Claim kind="open" delay={0.3}>
            Is self-reference what makes a system conscious, or only what lets it say that it is?
          </Claim>
        </Claims>
      </div>
    </section>
  )
}
