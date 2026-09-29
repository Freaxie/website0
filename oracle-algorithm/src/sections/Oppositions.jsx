import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { GLYPHS, glyphPath } from '../lib/glyphs.js'
import { rng } from '../lib/geom.js'

// Each row is a pair of counterparts. Neither column is the correct one.
const ROWS = [
  {
    o: { word: 'Intuition', gloss: 'A judgement that arrives before its reasons, and sometimes never finds them.' },
    a: { word: 'Computation', gloss: 'A result that exists only as the end of its steps. Every step can be checked.' },
    glyph: 'eye',
  },
  {
    o: { word: 'Interpretation', gloss: 'The answer is a meaning. It changes with who is asking, and that is the point.' },
    a: { word: 'Prediction', gloss: 'The answer is a number. It should not change with who is asking.' },
    glyph: 'mirror',
  },
  {
    o: { word: 'Mystery', gloss: 'What is left over after every explanation, treated as the most important part.' },
    a: { word: 'Measurement', gloss: 'What can be counted, treated as the part you can act on.' },
    glyph: 'lantern',
  },
  {
    o: { word: 'Symbol', gloss: 'One sign, many meanings. It gathers what it touches.' },
    a: { word: 'Data', gloss: 'Many signs, one meaning each. It separates what it touches.' },
    glyph: 'knot',
  },
  {
    o: { word: 'Ritual', gloss: 'The same act, repeated until it holds attention in place.' },
    a: { word: 'Procedure', gloss: 'The same act, repeated until it gives the same result.' },
    glyph: 'ladder',
  },
]

function Bars({ seed }) {
  const r = rng(seed)
  const vals = Array.from({ length: 14 }, (_, i) => Math.exp(-((i - 4 - r() * 6) ** 2) / 12) * 0.8 + r() * 0.2)
  return (
    <svg viewBox="0 0 140 60" className="opp__bars" aria-hidden="true">
      {vals.map((v, i) => (
        <rect key={i} x={i * 10} y={60 - v * 58} width="7" height={v * 58} />
      ))}
      <line x1="0" x2="140" y1="59.5" y2="59.5" />
    </svg>
  )
}

export default function Oppositions() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="oppositions" className="opp">
      <div className="opp__head">
        <SectionHead no="02" title="Oppositions" tone="bone" kicker="Two ways of facing what you don't know yet: read it, or reckon it. Five pairs, facing each other across the room." />
      </div>

      <div className="opp__cols mono" aria-hidden="true">
        <span>Oracle · reads</span>
        <span>Algorithm · reckons</span>
      </div>

      <ol className="opp__list">
        {ROWS.map((row, i) => {
          const g = GLYPHS.find((x) => x.id === row.glyph)
          const cls = hover === i ? 'is-active' : hover >= 0 ? 'is-dim' : ''
          return (
            <motion.li
              key={row.o.word}
              className={`opp__row ${cls}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
            >
              <motion.div className="opp__o" variants={{ hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0, transition: { duration: 1.1, ease } } }}>
                <svg viewBox="0 0 100 100" className="opp__glyph" aria-hidden="true">
                  <motion.path d={glyphPath(g.prims)} variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 1.6, delay: 0.3 } } }} />
                </svg>
                <div>
                  <h3>{row.o.word}</h3>
                  <p>{row.o.gloss}</p>
                </div>
              </motion.div>
              <div className="opp__seam" aria-hidden="true">
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <motion.div className="opp__a" variants={{ hidden: { opacity: 0, x: 60 }, show: { opacity: 1, x: 0, transition: { duration: 1.1, ease } } }}>
                <div>
                  <h3>{row.a.word}</h3>
                  <p>{row.a.gloss}</p>
                </div>
                <Bars seed={i * 31 + 7} />
              </motion.div>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
