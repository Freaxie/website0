import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { CHIPS } from '../lib/geom.js'
import { STYLES } from './Hero.jsx'

// Rows are counterparts: Range faces Focus, Connection faces Precision, Analogy faces Method, Adaptability faces Authority.
const G = [
  { word: 'Range', gloss: 'Many fields, many kinds of problem, none of them for very long.' },
  { word: 'Connection', gloss: 'Noticing that a problem here was already solved over there.' },
  { word: 'Analogy', gloss: 'Borrowing a shape of thought from one field to open another.' },
  { word: 'Adaptability', gloss: 'When the rules change, starting again is not a disaster.' },
]
const S = [
  { word: 'Focus', gloss: 'Years on one question, until it gives way.' },
  { word: 'Precision', gloss: 'Knowing the exceptions, and the exceptions to the exceptions.' },
  { word: 'Method', gloss: 'A craft refined by thousands of repetitions.' },
  { word: 'Authority', gloss: 'When it matters, you want someone who has seen this exact case before.' },
]

export default function Knowing() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="knowing" className="kn">
      <SectionHead
        no="02"
        title="Two Kinds of Knowing"
        kicker="Not smart against narrow. Two ways of spending a lifetime of attention: spread it across the world, or pour it into one place."
      />

      {hover >= 0 && (
        <div className="kn__pair mono" aria-hidden="true">
          {G[hover].word} <span>⟷</span> {S[hover].word}
        </div>
      )}

      <div className="kn__grid">
        <motion.div className="kn__g" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="kn__label mono">
            <span>—</span> Generalist — <i>breadth</i>
          </div>
          {G.map((a, i) => (
            <motion.div
              key={a.word}
              className={`grow grow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { opacity: 0, x: (i % 2 ? 1 : -1) * 80, rotate: (i % 2 ? 3 : -3) }, show: { opacity: 1, x: 0, rotate: 0, transition: { duration: 1, delay: 0.2 + i * 0.1, ease } } }}
            >
              <span className="grow__word">
                {a.word.split('').map((ch, k) => (
                  <span key={k} className={`gl gl--${STYLES[(k + i) % STYLES.length]}`} style={{ color: CHIPS[(k * 3 + i) % CHIPS.length] }}>
                    {ch}
                  </span>
                ))}
              </span>
              <p className="grow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="kn__s" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="kn__label mono">
            <span>|</span> Specialist — <i>depth</i>
          </div>
          {S.map((d, i) => (
            <motion.div
              key={d.word}
              className={`srow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { clipPath: 'inset(0 0 100% 0)' }, show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.9, delay: 0.2 + i * 0.14, ease } } }}
            >
              <span className="srow__word">{d.word}</span>
              <p className="srow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
