import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, clamp, ink, lerp, rng, smooth, TAU } from '@shared/lib/math.js'
import { te, ti } from '../color.js'

const SHAPES = ['circle', 'square', 'triangle', 'bar']
const SIZES = ['large', 'medium', 'small']
const TONES = [0.95, 0.7, 0.45]

function buildPieces(copies) {
  const r = rng(53)
  const out = []
  SHAPES.forEach((shape, si) =>
    SIZES.forEach((size, zi) =>
      TONES.forEach((tone, ti_) => {
        for (let k = 0; k < copies; k++)
          out.push({ si, zi, ti: ti_, k, shape, tone, sx: r(), sy: r(), seed: r() * 100, lane: zi, phase: r() })
      }),
    ),
  )
  // spread each lane's pieces evenly along it
  ;[0, 1, 2].forEach((lane) => {
    const ps = out.filter((p) => p.lane === lane)
    ps.forEach((p, i) => (p.phase = i / ps.length))
  })
  return out
}

function drawPiece(ctx, shape, x, y, sz) {
  if (shape === 'circle') {
    ctx.beginPath()
    ctx.arc(x, y, sz * 0.55, 0, TAU)
    ctx.fill()
  } else if (shape === 'square') ctx.fillRect(x - sz * 0.48, y - sz * 0.48, sz * 0.96, sz * 0.96)
  else if (shape === 'triangle') {
    ctx.beginPath()
    ctx.moveTo(x, y - sz * 0.6)
    ctx.lineTo(x + sz * 0.6, y + sz * 0.45)
    ctx.lineTo(x - sz * 0.6, y + sz * 0.45)
    ctx.closePath()
    ctx.fill()
  } else ctx.fillRect(x - sz * 0.7, y - sz * 0.16, sz * 1.4, sz * 0.32)
}

export default function Orders() {
  const trackRef = useRef(null)
  const canvasRef = useRef(null)
  const tiPanelRef = useRef(null)
  const cohRef = useRef(null)
  const outRef = useRef(null)
  const { scrollYProgress: p } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const introO = useTransform(p, [0, 0.06, 0.11], [1, 1, 0])
  const tiO = useTransform(p, [0.13, 0.18, 0.42, 0.47], [0, 1, 1, 0])
  const tiY = useTransform(p, [0.13, 0.47], [24, -24])
  const teO = useTransform(p, [0.52, 0.57, 0.82, 0.87], [0, 1, 1, 0])
  const teY = useTransform(p, [0.52, 0.87], [24, -24])
  const outroO = useTransform(p, [0.9, 0.95], [0, 1])

  useCanvas(
    canvasRef,
    (ctx, s) => {
      const coarse = matchMedia('(pointer: coarse)').matches
      const copies = coarse ? 4 : 8
      const pieces = buildPieces(copies)
      let prog = 0
      let shipped = 0
      let rate = 0
      let lastShipT = 0
      let panelTop = 0
      let measuredAt = -1
      return {
        frame(dt) {
          const { w, h, t } = s
          const tr = trackRef.current?.getBoundingClientRect()
          if (!tr) return
          prog = approach(prog, clamp(-tr.top / Math.max(1, tr.height - h)), 6, dt)
          const a = smooth(0.1, 0.24, prog) // scatter → lattice
          const b = smooth(0.48, 0.62, prog) // lattice → line
          const c = smooth(0.86, 0.96, prog) // line → lattice that carries the work
          const narrow = w < 760
          // the Ti panel sits under the lattice; its height depends on the type, so look again now and then
          if (t - measuredAt > 1 || measuredAt < 0) {
            panelTop = tiPanelRef.current?.offsetTop || h * 0.75
            measuredAt = t
          }

          // the lattice: shape by column, size by row, tone by sub-column, ending above the panel and its caption
          const gx0 = narrow ? w * 0.15 : w * 0.2 // room on the left for the row labels
          const gw = narrow ? w * 0.8 : w * 0.6
          const gy0 = h * (narrow ? 0.26 : 0.22)
          const gh = clamp(panelTop - 56 - gy0, h * 0.28, h * (narrow ? 0.42 : 0.5))
          const cw = gw / 4
          const chh = gh / 3
          const lattice = (q) => {
            const sub = cw / 3
            const col = q.k % 2
            const row = Math.floor(q.k / 2)
            const rows = Math.ceil(copies / 2)
            const x = gx0 + q.si * cw + q.ti * sub + sub * (0.32 + col * 0.36)
            const y = gy0 + q.zi * chh + chh * (0.22 + (row / Math.max(1, rows - 1)) * 0.56)
            return [x, y]
          }

          // the line: one lane per size, everything moving toward a single bin
          const lx0 = w * (narrow ? 0.06 : 0.1)
          const lx1 = w * (narrow ? 0.78 : 0.82)
          const laneY = (lane) => h * (0.4 + lane * 0.1)
          const speed = 0.06
          const flow = (q) => {
            const u = (q.phase + t * speed * (1 + q.lane * 0.15)) % 1
            return [lx0 + u * (lx1 - lx0), laneY(q.lane) + Math.sin(u * TAU * 3 + q.seed) * 1.2, u]
          }

          ctx.fillStyle = '#040404'
          ctx.fillRect(0, 0, w, h)

          const latticeA = a * (1 - b) + c * 0.9
          const lineA = b * (1 - c * 0.6)

          // construction lines of the lattice
          if (latticeA > 0.01) {
            ctx.strokeStyle = ti(0.28 * latticeA)
            ctx.lineWidth = 1
            ctx.beginPath()
            for (let k = 0; k <= 4; k++) {
              ctx.moveTo(gx0 + k * cw, gy0)
              ctx.lineTo(gx0 + k * cw, gy0 + gh)
            }
            for (let k = 0; k <= 3; k++) {
              ctx.moveTo(gx0, gy0 + k * chh)
              ctx.lineTo(gx0 + gw, gy0 + k * chh)
            }
            ctx.stroke()
            // a tree above it: one root, four kinds
            const rootX = gx0 + gw / 2
            const rootY = gy0 - h * 0.12
            ctx.strokeStyle = ti(0.45 * latticeA)
            ctx.beginPath()
            for (let k = 0; k < 4; k++) {
              ctx.moveTo(rootX, rootY)
              ctx.lineTo(rootX, rootY + h * 0.05)
              ctx.lineTo(gx0 + (k + 0.5) * cw, rootY + h * 0.05)
              ctx.lineTo(gx0 + (k + 0.5) * cw, gy0)
            }
            ctx.stroke()
            ctx.fillStyle = ti(0.9 * latticeA)
            ctx.beginPath()
            ctx.arc(rootX, rootY, 3, 0, TAU)
            ctx.fill()
            ctx.font = '9.5px "JetBrains Mono Variable", monospace'
            ctx.textAlign = 'center'
            SHAPES.forEach((sh, k) => ctx.fillText(sh.toUpperCase(), gx0 + (k + 0.5) * cw, gy0 - 8))
            ctx.textAlign = 'right'
            SIZES.forEach((sz, k) => ctx.fillText(sz.toUpperCase(), gx0 - 8, gy0 + (k + 0.5) * chh + 3))
            ctx.textAlign = 'left'
            if (!narrow) ctx.fillText('EVERY PIECE IN EXACTLY ONE PLACE', gx0, gy0 + gh + 22)
          }

          // the line's tracks, chevrons and bin
          if (lineA > 0.01) {
            ctx.strokeStyle = te(0.35 * lineA)
            ctx.beginPath()
            for (let lane = 0; lane < 3; lane++) {
              ctx.moveTo(lx0, laneY(lane) + 10)
              ctx.lineTo(lx1, laneY(lane) + 10)
            }
            ctx.stroke()
            ctx.fillStyle = te(0.5 * lineA)
            ctx.font = '9.5px "JetBrains Mono Variable", monospace'
            for (let lane = 0; lane < 3; lane++) {
              for (let k = 0; k < 8; k++) {
                const u = (k / 8 + t * 0.08) % 1
                ctx.fillText('›', lx0 + u * (lx1 - lx0), laneY(lane) + 14)
              }
              ctx.fillText(['PRIORITY 1', 'PRIORITY 2', 'PRIORITY 3'][lane], lx0, laneY(lane) - 12)
            }
            const bx = lx1 + w * 0.03
            const by = laneY(0) - h * 0.05
            const bh = laneY(2) - laneY(0) + h * 0.1
            const bw = w * 0.07
            ctx.strokeStyle = te(0.7 * lineA)
            ctx.strokeRect(bx, by, bw, bh)
            // what was shipped piles up in the bin, which empties when it is full
            const cols = Math.max(1, Math.floor((bw - 8) / 8))
            const rows = Math.max(1, Math.floor((bh - 8) / 8))
            const n = shipped % (cols * rows)
            ctx.fillStyle = te(0.55 * lineA)
            for (let k = 0; k < n; k++)
              ctx.fillRect(bx + 5 + (k % cols) * 8, by + bh - 10 - Math.floor(k / cols) * 8, 5, 5)
            ctx.fillStyle = te(0.9 * lineA)
            ctx.fillText('SHIPPED', bx, by - 22)
            ctx.font = '400 18px "JetBrains Mono Variable", monospace'
            ctx.fillText(String(shipped).padStart(4, '0'), bx, by - 4)
            ctx.font = '9.5px "JetBrains Mono Variable", monospace'
            ctx.fillText(`${rate.toFixed(0)} / MIN`, bx, by + bh + 16)
          }

          // the pieces
          for (const q of pieces) {
            const [ax, ay] = [q.sx * w + noise3(q.seed, t * 0.1, 0) * 10, q.sy * h + noise3(q.seed, t * 0.1, 3) * 10]
            const [lx, ly] = lattice(q)
            const [fx, fy, u] = flow(q)
            let x = lerp(ax, lx, a)
            let y = lerp(ay, ly, a)
            x = lerp(x, fx, b)
            y = lerp(y, fy, b)
            // in the end the pieces return to the lattice, and the work runs through it
            x = lerp(x, lx, c)
            y = lerp(y, ly, c)
            if (b > 0.5 && c < 0.5 && u > 0.985 && !q.counted) {
              q.counted = true
              shipped++
              const now = t
              rate = approach(rate, 60 / Math.max(0.05, now - lastShipT), 0.08, 1)
              lastShipT = now
            }
            if (u < 0.5) q.counted = false
            const sz = [8, 6, 4][q.zi] * (narrow ? 0.85 : 1)
            const pulse = c > 0.5 ? Math.max(0, Math.sin((q.si / 4 + q.zi * 0.13 - t * 0.35) * TAU)) ** 8 : 0
            if (pulse > 0.05) ctx.fillStyle = te(0.5 + 0.5 * pulse)
            else if (b > 0.5 && c < 0.5) ctx.fillStyle = te(q.tone * clamp(Math.min(u / 0.04, (1 - u) / 0.06)))
            else if (a > 0.5) ctx.fillStyle = ti(q.tone)
            else ctx.fillStyle = ink(q.tone * 0.8)
            drawPiece(ctx, q.shape, x, y, sz)
          }

          if (cohRef.current) cohRef.current.textContent = latticeA.toFixed(2)
          if (outRef.current) outRef.current.textContent = (lineA + c * 0.4).toFixed(2)
        },
      }
    },
    { maxDpr: 1.75 },
  )

  return (
    <section id="orders" className="orders" data-section>
      <div ref={trackRef} className="orders__track">
        <div className="orders__sticky">
          <canvas
            ref={canvasRef}
            aria-label="The same pieces arranged twice: first into a classification table by what they are, then onto a production line by what they are for."
          />

          <motion.div className="orders__intro" style={{ opacity: introO }}>
            <p className="mono mono--ink">§02 · Two orders</p>
            <p className="big orders__title">
              Two ways to put <em>things in order.</em>
            </p>
            <p className="mono mono--dim">Scroll ↓</p>
          </motion.div>

          <motion.div ref={tiPanelRef} className="orders__panel orders__panel--ti" style={{ opacity: tiO, y: tiY }}>
            <p className="mono t-ti">Ti · Introverted thinking</p>
            <p className="orders__q">“Does it hold together?”</p>
            <p className="prose">
              It builds a framework inside and places each thing by what it is. Every piece has exactly one place, and a
              reason for being there.
            </p>
          </motion.div>

          <motion.div className="orders__panel orders__panel--te" style={{ opacity: teO, y: teY }}>
            <p className="mono t-te">Te · Extraverted thinking</p>
            <p className="orders__q">“Does it work?”</p>
            <p className="prose">
              It organises what is outside toward an end. Each thing is placed by what it is for and when it is needed.
              The measure is what comes out.
            </p>
          </motion.div>

          <motion.p className="orders__outro whisper" style={{ opacity: outroO }}>
            A structure that carries the work. Work that holds together.
          </motion.p>

          <div className="orders__meter mono mono--dim" aria-hidden="true">
            <span>
              <span className="t-ti">Coherence</span>{' '}
              <span ref={cohRef} className="mono--ink">
                0.00
              </span>
            </span>
            <span>
              <span className="t-te">Output</span>{' '}
              <span ref={outRef} className="mono--ink">
                0.00
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="sec orders__after">
        <Claims>
          <Claim kind="model" cite="C. G. Jung, Psychological Types (1921)">
            Jung described extraverted thinking as taking its standards from outside: facts, objective criteria, ideas
            held in common. Introverted thinking starts from inner ideas and pursues theory and insight, with facts in a
            supporting role.
          </Claim>
          <Claim kind="empirical" cite="L. Barsalou (1983), Ad hoc categories" delay={0.1}>
            People sort things in two ways: by what they are (taxonomic categories) and by what they serve (goal-derived
            categories, like “things to take from a burning house”). Both behave like real categories in experiments.
          </Claim>
          <Claim kind="argument" delay={0.2}>
            Reading Ti as the taxonomist and Te as the organiser of goals is our interpretation. The research above is
            about categories, not about types of people.
          </Claim>
        </Claims>
      </div>
    </section>
  )
}
