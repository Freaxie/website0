import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { ARCHETYPES, DIMS } from '../lib/archetypes.js'

const W = 900
const H = 620
const PAD = 70

export default function Atlas() {
  const [xd, setXd] = useState('act')
  const [yd, setYd] = useState('order')
  const [hover, setHover] = useState(null)
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
  // a little inset, so nothing sits on the frame
  const px = (v) => PAD + ((v * 0.88 + 1) / 2) * (W - 2 * PAD)
  const py = (v) => H - PAD - ((v * 0.84 + 1) / 2) * (H - 2 * PAD)
  const h = hover && ARCHETYPES.find((a) => a.id === hover)

  return (
    <section id="atlas" className="atl">
      <div className="atl__top">
        <SectionHead no="02" title="The Atlas" kicker="A map of the ten. Choose what runs across and what runs up, and watch them move. Click any of them to visit its plate." />
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
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`The ten archetypes placed from ${X.lo} to ${X.hi} across, and from ${Y.lo} to ${Y.hi} upward`}>
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
          {ARCHETYPES.map((a, i) => (
            <motion.g
              key={a.id}
              initial={false}
              animate={{ x: px(a.at[xd]), y: py(a.at[yd]) }}
              transition={{ type: 'spring', stiffness: 70, damping: 14, delay: i * 0.03 }}
              className={`atl__pt ${hover && hover !== a.id ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(a.id)}
              onPointerLeave={() => setHover(null)}
            >
              <a href={`#plate-${a.id}`} aria-label={`${a.name}: ${X.lo}–${X.hi} ${a.at[xd].toFixed(1)}, ${Y.lo}–${Y.hi} ${a.at[yd].toFixed(1)}`} onFocus={() => setHover(a.id)} onBlur={() => setHover(null)}>
                <circle r="26" fill={a.color} />
                <path d={a.glyph} transform="translate(-13 -13) scale(0.26)" stroke={a.fg} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text y="44" textAnchor="middle" className="atl__name">
                  {a.name}
                </text>
              </a>
            </motion.g>
          ))}
        </svg>
        {h && (
          <div className="atl__card" style={{ left: `${(px(h.at[xd]) / W) * 100}%`, top: `${(py(h.at[yd]) / H) * 100}%`, borderColor: h.color }}>
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
