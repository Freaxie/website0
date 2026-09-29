import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { CHIPS } from '../lib/geom.js'

const FIELDS = ['Maths', 'Writing', 'Design', 'Music', 'Code', 'History', 'Biology', 'Cooking']
const MAX = 5
const PRESETS = {
  I: [0, 0, 0, 0, 5, 0, 0, 0],
  T: [1, 2, 1, 1, 5, 1, 1, 2],
  Comb: [0, 4, 1, 0, 5, 1, 4, 1],
  Dash: [2, 2, 2, 2, 2, 2, 2, 2],
}

function classify(d) {
  const broad = d.filter((x) => x > 0).length
  const deep = d.filter((x) => x >= 4).length
  if (broad === 0) return { name: 'Blank', text: 'Nothing yet. Click the columns to go deeper in a field.' }
  if (broad === 1 && deep === 1) return { name: 'I-shaped', text: 'One field, all the way down: the specialist.' }
  if (deep === 1 && broad >= 3) return { name: 'T-shaped', text: 'One deep field, and a working knowledge of several others.' }
  if (deep >= 2 && broad >= 3) return { name: 'Comb-shaped', text: 'Several deep fields joined by a broad bar. Rare, and often where new fields start.' }
  if (deep === 0 && broad >= 4) return { name: 'Dash-shaped', text: 'Broad and shallow: the generalist, who connects what others know.' }
  return { name: 'Still forming', text: 'Keep going. Most shapes take decades.' }
}

export default function YourShape() {
  const [d, setD] = useState(PRESETS.T)
  const bump = (i, by) => setD((v) => v.map((x, k) => (k === i ? (x + by + MAX + 1) % (MAX + 1) : x)))
  const c = classify(d)

  return (
    <section id="yours" className="ys">
      <div className="ys__top">
        <SectionHead no="07" title="Your Shape" kicker="Neither is the answer. Most useful people are a shape made of both. Draw yours: click a column to go deeper." />
        <div className="ys__verdict" aria-live="polite">
          <span className="mono">Your shape</span>
          <b>{c.name}</b>
          <p>{c.text}</p>
          <div className="ys__presets">
            {Object.keys(PRESETS).map((k) => (
              <button key={k} type="button" className="mono" onClick={() => setD(PRESETS[k])}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ys__board">
        <div className="ys__bar" aria-hidden="true" />
        {FIELDS.map((f, i) => (
          <div key={f} className="ys__col">
            <button type="button" className="ys__stem" onClick={() => bump(i, 1)} aria-label={`${f}: depth ${d[i]} of ${MAX}. Click to go deeper.`}>
              {Array.from({ length: MAX }, (_, k) => (
                <motion.span
                  key={k}
                  className="ys__cell"
                  animate={{ opacity: k < d[i] ? 1 : 0.08, scaleY: k < d[i] ? 1 : 0.6 }}
                  transition={{ duration: 0.35, delay: k * 0.03 }}
                  style={{ background: c.name === 'I-shaped' ? '#002fa7' : CHIPS[i % CHIPS.length] }}
                />
              ))}
            </button>
            <span className="ys__name mono">{f}</span>
            <span className="ys__adj">
              <button type="button" onClick={() => bump(i, -1)} aria-label={`Less ${f}`}>
                −
              </button>
              <b className="mono">{d[i]}</b>
              <button type="button" onClick={() => bump(i, 1)} aria-label={`More ${f}`}>
                +
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="ys__notes">
        <p>
          <span className="mono">For breadth</span>
          “A human being should be able to change a diaper, plan an invasion, butcher a hog … Specialization is for insects.” Robert Heinlein, 1973
        </p>
        <p>
          <span className="mono">Against narrowness</span>
          José Ortega y Gasset, 1930, warned of the “learned ignoramus”: expert in a sliver of the world, and confident about all the rest.
        </p>
        <p>
          <span className="mono">The T</span>
          “T-shaped” skills are usually traced to David Guest in 1991, and were popularised by the design firm IDEO: depth to be useful, breadth to work with others.
        </p>
      </div>
    </section>
  )
}
