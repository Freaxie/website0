import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Rows are counterparts: Deliberation faces Impulse, Principle faces Desire, and so on.
const R = [
  { word: 'Deliberation', sign: '∴', gloss: 'Stop. Weigh the reasons. Then act.' },
  { word: 'Principle', sign: '∀', gloss: 'A rule that holds for anyone, in any case like this.' },
  { word: 'Clarity', sign: '=', gloss: 'Seeing a thing as it is, not as you wish it were.' },
  { word: 'Distance', sign: '⟷', gloss: 'The step back that lets you judge your own case fairly.' },
]
const P = [
  { word: 'Impulse', gloss: 'Moved before you have finished thinking, sometimes rightly.' },
  { word: 'Desire', gloss: 'Wanting this, not just anything of its kind.' },
  { word: 'Intensity', gloss: 'The world in high contrast: this matters more than that.' },
  { word: 'Attachment', gloss: 'Nearness. Caring about someone because they are yours.' },
]

export default function Faculties() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="faculties" className="fac">
      <SectionHead
        no="02"
        title="Two Faculties"
        kicker="Not a cold head against a warm heart. Two ways a mind takes hold of the world, each blind in its own way without the other."
      />

      {hover >= 0 && (
        <div className="fac__pair mono" aria-hidden="true">
          {R[hover].word} <span>⟷</span> {P[hover].word}
        </div>
      )}

      <div className="fac__grid">
        <motion.div className="fac__r" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="fac__label mono">
            <span>C</span> Reason — <i>the cyan plate</i>
          </div>
          {R.map((a, i) => (
            <motion.div
              key={a.word}
              className={`rrow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { clipPath: 'inset(0 100% 0 0)' }, show: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.9, 0, 0.1, 1] } } }}
            >
              <span className="rrow__sign" aria-hidden="true">
                {a.sign}
              </span>
              <span className="rrow__word">{a.word}</span>
              <p className="rrow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="fac__p" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="fac__label mono">
            <span>M</span> Passion — <i>the magenta plate</i>
          </div>
          {P.map((d, i) => (
            <motion.div
              key={d.word}
              className={`prow prow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { opacity: 0, scale: 0.8, filter: 'blur(12px)' }, show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1.4, delay: 0.3 + i * 0.15, ease } } }}
            >
              <span className="prow__word" style={{ '--i': i }}>
                {d.word}
              </span>
              <p className="prow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
