import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Glyph from '../components/Glyph.jsx'
import { ARCHETYPES } from '../lib/archetypes.js'
import { TAU } from '../lib/geom.js'

const BUDGET = 15
const MAX = 5
const ING = { understand: 'understanding', build: 'building', overcome: 'overcoming', create: 'creating', question: 'questioning', discover: 'discovering', transcend: 'transcending', shape: 'shaping', experience: 'experiencing', disrupt: 'disrupting' }

function list(words) {
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
}

export default function Constellation() {
  const [pts, setPts] = useState(() => Object.fromEntries(ARCHETYPES.map((a) => [a.id, 0])))
  const spent = Object.values(pts).reduce((s, v) => s + v, 0)
  const left = BUDGET - spent
  const set = (id, v) => setPts((p) => {
    const room = BUDGET - (spent - p[id])
    return { ...p, [id]: Math.max(0, Math.min(MAX, v, room)) }
  })

  const ranked = ARCHETYPES.filter((a) => pts[a.id] > 0).sort((a, b) => pts[b.id] - pts[a.id])
  const top = ranked.slice(0, 3)
  let title = 'Unwritten'
  let text = `You have ${BUDGET} points. Give them to the ways you actually meet the world, not the ones you admire.`
  if (ranked.length) {
    title = top.map((a) => a.name).join(' · ')
    text = `You meet reality chiefly by ${list(top.map((a) => `${ING[a.verb]} it`))}.`
    if (pts[ranked[0].id] / Math.max(1, spent) > 0.45 && spent >= 6) text += ` Mostly the ${ranked[0].name.toLowerCase()}: a specialist of one way.`
    else if (ranked.length >= 7) text += ' Spread across most of the ten: a generalist of ways.'
    if (left > 0) text += ` ${left} point${left === 1 ? '' : 's'} still to give.`
  }

  const C = 170
  const vert = (i, v) => {
    const ang = (i / 10) * TAU - Math.PI / 2
    const r = (v / MAX) * C
    return [Math.cos(ang) * r, Math.sin(ang) * r]
  }
  const poly = ARCHETYPES.map((a, i) => vert(i, pts[a.id]).join(',')).join(' ')

  return (
    <section id="yours" className="con">
      <div className="con__top">
        <SectionHead no="05" title="Your Constellation" kicker="Everyone uses more than one. Spend fifteen points across the ten and see the shape of how you meet the world." />
        <div className="con__verdict" aria-live="polite">
          <span className="mono">
            {spent} of {BUDGET} points given
          </span>
          <b>{title}</b>
          <p>{text}</p>
        </div>
      </div>

      <div className="con__body">
        <ul className="con__rows">
          {ARCHETYPES.map((a) => (
            <li key={a.id} className="con__row">
              <span className="con__sign" style={{ background: a.color, color: a.fg }}>
                <Glyph d={a.glyph} width={7} />
              </span>
              <span className="con__name">
                {a.name}
                <em>{a.verb}</em>
              </span>
              <span className="con__pips" role="group" aria-label={`${a.name}: ${pts[a.id]} of ${MAX}`}>
                {Array.from({ length: MAX }, (_, k) => (
                  <button
                    key={k}
                    type="button"
                    className={k < pts[a.id] ? 'is-on' : ''}
                    style={{ '--c': a.color }}
                    onClick={() => set(a.id, pts[a.id] === k + 1 ? k : k + 1)}
                    aria-label={`Give the ${a.name} ${k + 1}`}
                  />
                ))}
              </span>
            </li>
          ))}
          <li className="con__reset">
            <button type="button" className="mono" onClick={() => setPts(Object.fromEntries(ARCHETYPES.map((a) => [a.id, 0])))}>
              Clear
            </button>
          </li>
        </ul>

        <div className="con__chart">
          <svg viewBox="-240 -240 480 480" role="img" aria-label={`Your constellation: ${ranked.map((a) => `${a.name} ${pts[a.id]}`).join(', ') || 'empty'}`}>
            {[1, 2, 3, 4, 5].map((k) => (
              <polygon key={k} points={ARCHETYPES.map((_, i) => vert(i, k).join(',')).join(' ')} className="con__web" />
            ))}
            {ARCHETYPES.map((a, i) => {
              const [x, y] = vert(i, MAX)
              const [lx, ly] = vert(i, MAX + 1.15)
              return (
                <g key={a.id}>
                  <line x1="0" y1="0" x2={x} y2={y} className="con__spoke" />
                  <circle cx={lx} cy={ly} r="9" fill={a.color} />
                  <text x={lx} y={ly + (ly > 0 ? 26 : -16)} textAnchor="middle" className="con__label">
                    {a.name}
                  </text>
                </g>
              )
            })}
            <motion.polygon points={poly} className="con__shape" initial={false} animate={{ points: poly }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} />
            {ARCHETYPES.map((a, i) => {
              const [x, y] = vert(i, pts[a.id])
              return pts[a.id] ? <circle key={a.id} cx={x} cy={y} r="6" fill={a.color} className="con__dot" /> : null
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}
