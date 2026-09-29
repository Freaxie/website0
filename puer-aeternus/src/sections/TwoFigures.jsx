import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Counterparts, row by row. The youth's words float; the old man's words land.
const ROWS = [
  { p: ['Not yet', 'Real life is about to begin. This is only the rehearsal.'], s: ['Already', 'It has begun, and a good deal of it is behind you.'] },
  { p: ['Possibility', 'Every door still open, none of them walked through.'], s: ['Limit', 'The walls that make a room a room.'] },
  { p: ['Flight', 'Height, distance, the view from above.'], s: ['Ground', 'Weight and footing: what holds when you stand on it.'] },
  { p: ['Inspiration', 'It arrives all at once, from nowhere.'], s: ['Discipline', 'It arrives a little each day, from somewhere.'] },
  { p: ['Beginning', 'The first page, and the thrill of the first page.'], s: ['Duration', 'Every page after it.'] },
]

export default function TwoFigures() {
  const [hover, setHover] = useState(-1)
  return (
    <section id="figures" className="fig">
      <div className="fig__head">
        <SectionHead no="02" title="Two Figures" kicker="The eternal youth and the old man: two ways of standing in time. One lives toward what might be, the other from what has been." />
      </div>

      <div className="fig__cols mono" aria-hidden="true">
        <span>Puer · the youth</span>
        <span>Senex · the old man</span>
      </div>

      <ol className="fig__list">
        {ROWS.map((row, i) => (
          <motion.li
            key={row.p[0]}
            className={`fig__row ${hover === i ? 'is-active' : ''}`}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(-1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            <div className="fig__p">
              <motion.h3 variants={{ hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0, transition: { duration: 1.8, ease: [0.2, 0.8, 0.2, 1] } } }}>
                <span className="fig__float" style={{ animationDelay: `${i * -1.3}s` }}>
                  {row.p[0]}
                </span>
              </motion.h3>
              <p>{row.p[1]}</p>
            </div>
            <div className="fig__s">
              <motion.h3 variants={{ hidden: { y: -90, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 16, mass: 2.4, delay: 0.3 } } }}>
                <span className="fig__weight">{row.s[0]}</span>
              </motion.h3>
              <p>{row.s[1]}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
