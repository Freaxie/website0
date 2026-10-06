import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, clamp, ink, TAU } from '@shared/lib/math.js'
import { blip, tone } from '@shared/lib/audio.js'
import { ne } from '../color.js'
import { opened } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const SECONDS = 60
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5]

// ways of pushing an idea sideways; each opens three example uses
const MOVES = [
  { k: 'Make it huge', uses: ['a sculpture you can walk through', 'a bike rack', 'a climbing frame'] },
  { k: 'Make it tiny', uses: ['a hook for one eyelash', 'a spring in a watch', 'a stent for a vein'] },
  {
    k: 'Give it to a child',
    uses: ['a fishing hook for bath toys', 'a phone antenna, pretend', 'a letter of the alphabet'],
  },
  { k: 'Take it to space', uses: ['a tether clip', 'a tiny anchor for floating notes', 'a radio aerial'] },
  { k: 'Make it of light', uses: ['a neon sign', 'a glowing bookmark', 'a drawing in the air'] },
  { k: 'Break it', uses: ['a lock pick', 'two tiny hooks', 'a needle to clear a nozzle'] },
]

function drawClip(ctx, x, y, s, rot) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(-0.08, 0.25)
  ctx.lineTo(-0.08, -0.4)
  ctx.arc(0, -0.4, 0.08, Math.PI, 0)
  ctx.lineTo(0.08, 0.5)
  ctx.arc(-0.02, 0.5, 0.1, 0, Math.PI)
  ctx.lineTo(-0.12, -0.55)
  ctx.arc(0.01, -0.55, 0.13, Math.PI, 0)
  ctx.lineTo(0.14, 0.3)
  ctx.restore()
  ctx.stroke()
}

export default function Outward() {
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const [uses, setUses] = useState([])
  const [moves, setMoves] = useState([])
  const [text, setText] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [left, setLeft] = useState(SECONDS)
  const [ended, setEnded] = useState(false)
  const live = useRef({ nodes: [] })

  const addNode = (node) => live.current.nodes.push({ ...node, born: performance.now() })

  const submit = (e) => {
    e.preventDefault()
    const v = text.trim().replace(/\s+/g, ' ')
    if (!v) return
    if (!startedAt) setStartedAt(performance.now())
    const k = live.current.nodes.filter((n) => n.kind === 'use').length
    addNode({
      kind: 'use',
      label: v.length > 34 ? v.slice(0, 33) + '…' : v,
      angle: k * GOLDEN - Math.PI / 2,
      ring: k % 3,
    })
    setUses((u) => [...u, v])
    setText('')
    opened(1)
    tone(PENTA[k % PENTA.length], { dur: 1.2, gain: 0.035, type: 'triangle', pan: Math.cos(k * GOLDEN) * 0.6 })
  }

  const provoke = (m) => {
    if (moves.includes(m.k)) return
    if (!startedAt) setStartedAt(performance.now())
    const k = moves.length
    const angle = k * GOLDEN * 1.7 + Math.PI / 5
    addNode({ kind: 'move', label: m.k.toUpperCase(), angle, ring: 0, children: m.uses })
    setMoves((x) => [...x, m.k])
    opened(4)
    m.uses.forEach((_, i) =>
      setTimeout(() => tone(PENTA[(k + i * 2) % PENTA.length] * 2, { dur: 0.9, gain: 0.02 }), 260 + i * 160),
    )
  }

  useEffect(() => {
    if (!startedAt || ended) return
    const id = setInterval(() => {
      const l = Math.max(0, SECONDS - Math.floor((performance.now() - startedAt) / 1000))
      setLeft(l)
      if (l === 0) {
        setEnded(true)
        blip(880, 0.02, 0.5)
      }
    }, 250)
    return () => clearInterval(id)
  }, [startedAt, ended])

  useCanvas(canvasRef, (ctx, s) => {
    let glow = 0
    let lastCount = 0
    const sparks = []
    return {
      frame(dt) {
        const { w, h, t } = s
        const nodes = live.current.nodes
        const cx = w / 2
        const cy = h / 2
        const m = Math.min(w, h)
        const now = performance.now()
        if (nodes.length !== lastCount) {
          glow = 1
          lastCount = nodes.length
        }
        glow = approach(glow, 0, 2, dt)
        ctx.clearRect(0, 0, w, h)

        // faint polar field
        ctx.strokeStyle = ink(0.05)
        for (let k = 1; k <= 4; k++) {
          ctx.beginPath()
          ctx.arc(cx, cy, m * 0.11 * k, 0, TAU)
          ctx.stroke()
        }

        const tip = (n, r) => [cx + Math.cos(n.angle) * r * 1.25, cy + Math.sin(n.angle) * r * 0.82]
        ctx.font = '11px "JetBrains Mono Variable", monospace'
        for (const n of nodes) {
          const f = clamp((now - n.born) / 900)
          const ease = 1 - Math.pow(1 - f, 3)
          const r = m * (n.kind === 'move' ? 0.21 : 0.27 + n.ring * 0.06)
          const [tx, ty] = tip(n, r)
          const sx = cx + Math.cos(n.angle) * m * 0.07
          const sy = cy + Math.sin(n.angle) * m * 0.07
          const bend = noise3(n.angle * 3, 0, 0) * 40
          const mx = (sx + tx) / 2 - Math.sin(n.angle) * bend
          const my = (sy + ty) / 2 + Math.cos(n.angle) * bend
          ctx.strokeStyle = n.kind === 'move' ? ink(0.45) : ne(0.6)
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          // grow along the curve
          const steps = 24
          for (let i = 1; i <= steps * ease; i++) {
            const u = i / steps
            const x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * tx
            const y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * ty
            ctx.lineTo(x, y)
          }
          ctx.stroke()
          if (f < 1) continue
          const left = Math.cos(n.angle) < -0.2
          ctx.textAlign = left ? 'right' : 'left'
          ctx.fillStyle = n.kind === 'move' ? ink(0.85) : ne(0.95)
          ctx.beginPath()
          ctx.arc(tx, ty, 2.4, 0, TAU)
          ctx.fill()
          ctx.fillText(n.label, tx + (left ? -8 : 8), ty + 4)
          // a provocation forks into three
          if (n.children) {
            n.children.forEach((c, i) => {
              const g = clamp((now - n.born - 600 - i * 180) / 700)
              if (g <= 0) return
              const a = n.angle + (i - 1) * 0.32
              const r2 = r + m * 0.13
              const cx2 = cx + Math.cos(a) * r2 * 1.25
              const cy2 = cy + Math.sin(a) * r2 * 0.82
              ctx.setLineDash([2, 4])
              ctx.strokeStyle = ne(0.4 * g)
              ctx.beginPath()
              ctx.moveTo(tx, ty)
              ctx.lineTo(tx + (cx2 - tx) * g, ty + (cy2 - ty) * g)
              ctx.stroke()
              ctx.setLineDash([])
              if (g >= 1) {
                const l2 = Math.cos(a) < -0.2
                ctx.textAlign = l2 ? 'right' : 'left'
                ctx.fillStyle = ne(0.6)
                ctx.fillText(c, cx2 + (l2 ? -7 : 7), cy2 + 4)
                ctx.beginPath()
                ctx.arc(cx2, cy2, 1.8, 0, TAU)
                ctx.fill()
              }
            })
          }
          // now and then something travels outward along a branch
          if (Math.random() < dt * 0.5) sparks.push({ n, u: 0, sx, sy, mx, my, tx, ty })
        }
        ctx.textAlign = 'left'
        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i]
          sp.u += dt * 0.7
          if (sp.u >= 1) {
            sparks.splice(i, 1)
            continue
          }
          const u = sp.u
          const x = (1 - u) * (1 - u) * sp.sx + 2 * (1 - u) * u * sp.mx + u * u * sp.tx
          const y = (1 - u) * (1 - u) * sp.sy + 2 * (1 - u) * u * sp.my + u * u * sp.ty
          ctx.fillStyle = ne(0.9 * (1 - u))
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
        }

        // the object
        const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * 0.12)
        gg.addColorStop(0, ne(0.08 + glow * 0.2))
        gg.addColorStop(1, ne(0))
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.arc(cx, cy, m * 0.12, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = ink(0.95)
        ctx.lineWidth = 1.6
        ctx.lineJoin = 'round'
        drawClip(ctx, cx, cy, m * 0.13, 0.5 + Math.sin(t * 0.4) * 0.05)
        ctx.lineWidth = 1
        if (!nodes.length) {
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = ink(0.5)
          ctx.textAlign = 'center'
          ctx.fillText('ONE PAPERCLIP', cx, cy + m * 0.13)
          ctx.textAlign = 'left'
        }
      },
    }
  })

  const total = uses.length + moves.length * 3
  return (
    <section id="outward" className="sec out" data-section>
      <SectionHead n="03" title="Outward · Ne" motif="Branching" />
      <div className="grid12">
        <Statement className="big out__statement" text="One thing is *never* only one thing." lens />
        <Reveal className="out__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Type theorists describe extraverted intuition as a scan of the world for possibilities: what this could
            become, what it connects to, what nobody has tried yet.
          </p>
        </Reveal>
      </div>

      <div className="out__lab">
        <div className="out__stage">
          <canvas ref={canvasRef} aria-label="A paperclip. Each use you name grows as a branch from it." />
          <div className="out__corner mono mono--dim">
            <span>
              Open <span className="t-ne">{String(total).padStart(2, '0')}</span>
            </span>
            <span>Closed 00</span>
            <span>{startedAt ? (ended ? 'Time' : `${String(left).padStart(2, '0')} s`) : `${SECONDS} s`}</span>
          </div>
        </div>
        <div className="out__controls">
          <p className="mono mono--ink">What could a paperclip be for? Name as many uses as you can in a minute.</p>
          <form className="out__form" onSubmit={submit}>
            <input
              ref={inputRef}
              id="paperclip-use"
              className="field"
              value={text}
              maxLength={60}
              onChange={(e) => setText(e.target.value)}
              placeholder="A use for a paperclip…"
              autoComplete="off"
              aria-label="A use for a paperclip"
            />
            <button className="btn btn--ne" type="submit">
              + Branch
            </button>
          </form>
          <p className="mono mono--dim out__moves-head">Stuck? Push it sideways</p>
          <div className="choice-row">
            {MOVES.map((m) => (
              <button key={m.k} className="btn btn--ne" onClick={() => provoke(m)} disabled={moves.includes(m.k)}>
                {m.k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(ended || uses.length >= 8) && uses.length > 0 && (
          <motion.div
            className="out__reflect"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <p className="big big--s">
              {uses.length} {uses.length === 1 ? 'use' : 'uses'}
              {moves.length ? `, and ${moves.length * 3} more by pushing sideways.` : '.'} Nothing was closed.
            </p>
            {uses.length >= 2 && (
              <div className="out__firstlast">
                <p>
                  <span className="mono mono--dim">Your first</span>
                  <span className="out__quote">“{uses[0]}”</span>
                </p>
                <p>
                  <span className="mono mono--dim">Your latest</span>
                  <span className="out__quote t-ne">“{uses[uses.length - 1]}”</span>
                </p>
              </div>
            )}
            <p className="prose">
              Was the later one stranger? It usually is. The obvious uses arrive first and clear the way for the others.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Claims>
        <Claim kind="empirical" cite="J. P. Guilford (1967); E. P. Torrance (1966); K. H. Kim (2008)">
          The Alternative Uses Task measures divergent thinking: how many ideas (fluency), of how many kinds
          (flexibility), and how unusual (originality). Scores predict creative achievement, modestly.
        </Claim>
        <Claim kind="empirical" cite="Christensen, Guilford & Wilson (1957); Beaty & Silvia (2012)" delay={0.1}>
          The serial order effect: ideas produced later in a session tend to be more original than the first ones.
        </Claim>
        <Claim kind="empirical" cite="R. R. McCrae (1987)" delay={0.2}>
          Divergent-thinking scores correlate with the personality trait openness to experience.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Is extraverted intuition the same thing as divergent thinking, or a preference for using it? The tests measure
          ability on demand; type describes what a person tends to do unprompted.
        </Claim>
      </Claims>
    </section>
  )
}
