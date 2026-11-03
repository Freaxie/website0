import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { ARCHETYPES, DIMS } from '../lib/archetypes.js'

const W = 900
const H = 620
const PAD = 70
// a little inset, so nothing sits on the frame
const px = (v) => PAD + ((v * 0.88 + 1) / 2) * (W - 2 * PAD)
const py = (v) => H - PAD - ((v * 0.84 + 1) / 2) * (H - 2 * PAD)

// Where each sign is drawn: its true place, nudged until no sign or name sits on another. Each sign
// is a box as wide as its name and as tall as the disc and the name together.
function settle(xd, yd) {
  const pts = ARCHETYPES.map((a) => ({ x: px(a.at[xd]), y: py(a.at[yd]), w: Math.max(48, a.name.length * 7.9 + 10) }))
  for (let it = 0; it < 160; it++) {
    let moved = false
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const A = pts[i]
        const B = pts[j]
        const dx = B.x - A.x
        const dy = B.y - A.y
        const needX = (A.w + B.w) / 2 + 6
        const needY = 68
        const ox = needX - Math.abs(dx)
        const oy = needY - Math.abs(dy)
        if (ox <= 0 || oy <= 0) continue
        moved = true
        // part along whichever way frees them sooner
        if (ox / needX < oy / needY) {
          const s = ((dx >= 0 ? 1 : -1) * Math.min(ox, 12)) / 2
          A.x -= s
          B.x += s
        } else {
          const s = ((dy >= 0 ? 1 : -1) * Math.min(oy, 12)) / 2
          A.y -= s
          B.y += s
        }
      }
    for (const q of pts) {
      q.x = Math.min(W - PAD - q.w / 2 + 20, Math.max(PAD + q.w / 2 - 20, q.x))
      q.y = Math.min(H - PAD - 20, Math.max(PAD + 26, q.y))
    }
    if (!moved) break
  }
  return Object.fromEntries(ARCHETYPES.map((a, i) => [a.id, pts[i]]))
}

export default function Atlas() {
  const [xd, setXd] = useState('act')
  const [yd, setYd] = useState('order')
  const [hover, setHover] = useState(null)
  // the visitor's own position on the map, in map units
  const [you, setYou] = useState({ x: W / 2, y: H / 2 })
  const svg = useRef(null)
  const dragging = useRef(false)
  const toMap = (e) => {
    const pt = svg.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const q = pt.matrixTransform(svg.current.getScreenCTM().inverse())
    return { x: Math.min(W - PAD, Math.max(PAD, q.x)), y: Math.min(H - PAD, Math.max(PAD, q.y)) }
  }
  const X = DIMS.find((d) => d.id === xd)
  const Y = DIMS.find((d) => d.id === yd)

  // choosing the dimension already on the other axis swaps the two
  const pick = (axis, id) => {
    if (axis === 'x') {
      if (id === yd) setYd(xd)
      setXd(id)
    } else {
      if (id === xd) setXd(yd)
      setYd(id)
    }
  }
  const at = useMemo(() => settle(xd, yd), [xd, yd])
  const h = hover && ARCHETYPES.find((a) => a.id === hover)
  const near = ARCHETYPES.reduce((best, a) => {
    const d = Math.hypot(at[a.id].x - you.x, at[a.id].y - you.y)
    return d < best.d ? { a, d } : best
  }, { a: null, d: Infinity }).a

  return (
    <section id="atlas" className="atl">
      <div className="atl__top">
        <SectionHead no="02" title="The Atlas" kicker="A map of the twenty-four. Choose what runs across and what runs up, and watch them move. Click any of them to visit its plate." />
        <div className="atl__pickers">
          {[
            ['x', 'Across', xd],
            ['y', 'Up', yd],
          ].map(([axis, label, cur]) => (
            <div key={axis} className="atl__pick" role="radiogroup" aria-label={`${label} axis`}>
              <span className="mono">{label}</span>
              {DIMS.map((d) => (
                <button key={d.id} type="button" role="radio" aria-checked={cur === d.id} className={cur === d.id ? 'is-on' : ''} onClick={() => pick(axis, d.id)}>
                  {d.lo} – {d.hi}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="atl__map">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          onPointerDown={(e) => {
            if (e.target.closest('a')) return
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            setYou(toMap(e))
          }}
          onPointerMove={(e) => dragging.current && setYou(toMap(e))}
          onPointerUp={() => (dragging.current = false)}
          role="img" aria-label={`The twenty-four archetypes placed from ${X.lo} to ${X.hi} across, and from ${Y.lo} to ${Y.hi} upward`}>
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} className="atl__grid">
              <line x1={PAD + (i / 8) * (W - 2 * PAD)} x2={PAD + (i / 8) * (W - 2 * PAD)} y1={PAD} y2={H - PAD} />
              <line y1={PAD + (i / 8) * (H - 2 * PAD)} y2={PAD + (i / 8) * (H - 2 * PAD)} x1={PAD} x2={W - PAD} />
            </g>
          ))}
          <line x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} className="atl__axis" />
          <line y1={PAD} y2={H - PAD} x1={W / 2} x2={W / 2} className="atl__axis" />
          <text x={PAD} y={H - PAD + 30} className="atl__end">
            ← {X.lo}
          </text>
          <text x={W - PAD} y={H - PAD + 30} textAnchor="end" className="atl__end">
            {X.hi} →
          </text>
          <text x={W / 2 + 12} y={PAD - 18} className="atl__end">
            ↑ {Y.hi}
          </text>
          <text x={W / 2 + 12} y={H - PAD + 30} className="atl__end">
            ↓ {Y.lo}
          </text>
          <motion.line x1={you.x} y1={you.y} initial={false} animate={{ x2: at[near.id].x, y2: at[near.id].y }} transition={{ duration: 0.4 }} stroke={near.color} className="atl__tie" />
          <motion.circle r="30" fill="none" stroke={near.color} strokeWidth="3" initial={false} animate={{ cx: at[near.id].x, cy: at[near.id].y }} transition={{ type: 'spring', stiffness: 70, damping: 14 }} />
          {ARCHETYPES.map((a, i) => (
            <motion.g
              key={a.id}
              initial={false}
              animate={{ x: at[a.id].x, y: at[a.id].y }}
              transition={{ type: 'spring', stiffness: 70, damping: 14, delay: i * 0.03 }}
              className={`atl__pt ${hover && hover !== a.id ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(a.id)}
              onPointerLeave={() => setHover(null)}
            >
              <a href={`#plate-${a.id}`} aria-label={`${a.name}: ${X.lo}–${X.hi} ${a.at[xd].toFixed(1)}, ${Y.lo}–${Y.hi} ${a.at[yd].toFixed(1)}`} onFocus={() => setHover(a.id)} onBlur={() => setHover(null)}>
                <circle r="21" fill={a.color} />
                <path d={a.glyph} transform="translate(-10.5 -10.5) scale(0.21)" stroke={a.fg} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text y="38" textAnchor="middle" className="atl__name">
                  {a.name}
                </text>
              </a>
            </motion.g>
          ))}
          <g transform={`translate(${you.x} ${you.y})`} className="atl__you-mark">
            <circle r="18" />
            <text y="4" textAnchor="middle">
              YOU
            </text>
          </g>
        </svg>
        {h && (
          <div className="atl__card" style={{ left: `${(at[h.id].x / W) * 100}%`, top: `${(at[h.id].y / H) * 100}%`, borderColor: h.color }}>
            <span className="mono" style={{ color: h.color }}>
              {h.no} · {h.name}
            </span>
            <b>To {h.verb} reality</b>
            <span className="mono">
              {X.hi} {h.at[xd] >= 0 ? '+' : '−'}
              {Math.abs(h.at[xd]).toFixed(1)} · {Y.hi} {h.at[yd] >= 0 ? '+' : '−'}
              {Math.abs(h.at[yd]).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <p className="atl__you" aria-live="polite">
        <span className="mono">Drag the black marker, or click anywhere on the map, to place yourself.</span>
        <span>
          You are nearest the <b style={{ color: near.color }}>{near.name}</b>: to {near.verb} reality.
        </span>
      </p>

      <div className="atl__legend">
        {DIMS.map((d) => (
          <p key={d.id}>
            <span className="mono">
              {d.lo} – {d.hi}
            </span>
            Whether a way of being {d.note}.
          </p>
        ))}
        <p>
          <span className="mono">A caution</span>
          These positions are a curator’s sketch, not a measurement. Move the axes and argue with them.
        </p>
      </div>
    </section>
  )
}
