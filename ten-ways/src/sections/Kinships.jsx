import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { ARCHETYPES, LINKS, byId } from '../lib/archetypes.js'
import { TAU } from '../lib/geom.js'

const MODES = [
  { id: 'allies', name: 'Allies', note: 'Ways that work well together.' },
  { id: 'opposites', name: 'Opposites', note: 'Ways that pull in contrary directions.' },
  { id: 'unions', name: 'Unlikely unions', note: 'Opposites, or near-strangers, joined in one life.' },
]
const R = 220
const pos = (id) => {
  const i = ARCHETYPES.findIndex((a) => a.id === id)
  const ang = (i / ARCHETYPES.length) * TAU - Math.PI / 2
  return [Math.cos(ang) * R, Math.sin(ang) * R, ang]
}

export default function Kinships() {
  const [mode, setMode] = useState('allies')
  const [focus, setFocus] = useState(null)
  const links = LINKS[mode]
  const shown = focus ? links.filter(([a, b]) => a === focus || b === focus) : links

  return (
    <section id="kinships" className="kin">
      <div className="kin__top">
        <SectionHead no="05" title="Kinships" kicker="No way of being lives alone. Some are allies, some are opposites, and a few rare lives have joined two that should not fit." />
        <div className="kin__modes" role="radiogroup" aria-label="Kind of relation">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'is-on' : ''} onClick={() => setMode(m.id)}>
              <b>{m.name}</b>
              <span>{m.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="kin__body">
        <div className="kin__ring">
          <svg viewBox="-370 -290 740 580" role="img" aria-label={`${MODES.find((m) => m.id === mode).name} among the twenty archetypes`}>
            <circle r={R} className="kin__circle" />
            <AnimatePresence>
              {shown.map(([a, b]) => {
                const [x1, y1] = pos(a)
                const [x2, y2] = pos(b)
                return (
                  <motion.path
                    key={`${mode}-${a}-${b}`}
                    d={`M${x1} ${y1}Q0 0 ${x2} ${y2}`}
                    className={`kin__link kin__link--${mode}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                  />
                )
              })}
            </AnimatePresence>
            {ARCHETYPES.map((a) => {
              const [x, y, ang] = pos(a.id)
              const dim = focus && focus !== a.id && !shown.some(([p, q]) => p === a.id || q === a.id)
              return (
                <g
                  key={a.id}
                  transform={`translate(${x} ${y})`}
                  className={`kin__node ${dim ? 'is-dim' : ''}`}
                  tabIndex="0"
                  role="button"
                  aria-label={`Show only the ${a.name}’s relations`}
                  aria-pressed={focus === a.id}
                  onClick={() => setFocus((f) => (f === a.id ? null : a.id))}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setFocus((f) => (f === a.id ? null : a.id)))}
                >
                  <circle r={focus === a.id ? 24 : 18} fill={a.color} />
                  <path d={a.glyph} transform="translate(-9 -9) scale(0.18)" stroke={a.fg} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <text x={Math.cos(ang) * 32} y={Math.sin(ang) * 32 + 4} textAnchor={Math.cos(ang) > 0.3 ? 'start' : Math.cos(ang) < -0.3 ? 'end' : 'middle'} className="kin__label">
                    {a.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <ol className="kin__list" aria-live="polite">
          {shown.map(([a, b, why]) => (
            <motion.li key={`${mode}-${a}-${b}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <span className="kin__pair">
                <i style={{ background: byId[a].color }} />
                {byId[a].name}
                <span className="mono">{mode === 'opposites' ? '⇄' : mode === 'unions' ? '∞' : '+'}</span>
                <i style={{ background: byId[b].color }} />
                {byId[b].name}
              </span>
              <p>{why}</p>
            </motion.li>
          ))}
          {focus && (
            <li className="kin__clear">
              <button type="button" className="mono" onClick={() => setFocus(null)}>
                Show all of them
              </button>
            </li>
          )}
          {!shown.length && <li className="kin__none">None listed for the {byId[focus].name} here. Try another kind of relation.</li>}
        </ol>
      </div>
    </section>
  )
}
