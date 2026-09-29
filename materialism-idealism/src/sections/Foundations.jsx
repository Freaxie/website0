import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Rows are counterparts: Atom faces Idea, Body faces Mind, Object faces Perception, Mechanism faces Meaning.
const M = [
  { word: 'Atom', gloss: 'The smallest piece. Everything else is arrangement.' },
  { word: 'Body', gloss: 'Mass, extension, chemistry. Thought is something a body does.' },
  { word: 'Object', gloss: 'It is there whether or not anyone looks.' },
  { word: 'Mechanism', gloss: 'Push and pull, cause and effect, all the way down.' },
]
const I = [
  { word: 'Idea', gloss: 'What is first is not a thing but a thought of one.' },
  { word: 'Mind', gloss: 'The one thing you meet directly. Everything else arrives through it.' },
  { word: 'Perception', gloss: 'What we call an object is a pattern of appearances.' },
  { word: 'Meaning', gloss: 'The world as a story, a reason, a spirit coming to know itself.' },
]

export default function Foundations() {
  const [hover, setHover] = useState(-1)
  return (
    <section id="foundations" className="fnd">
      <SectionHead
        no="02"
        title="Two Foundations"
        kicker="Everyone agrees there are stones and there are thoughts. The quarrel is over which one is basic, and which one is made out of the other."
      />

      {hover >= 0 && (
        <div className="fnd__pair mono" aria-hidden="true">
          {M[hover].word} <span>⟷</span> {I[hover].word}
        </div>
      )}

      <div className="fnd__grid">
        <motion.div className="fnd__m" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="fnd__label mono">
            <span>■</span> Materialism — <i>matter is basic</i>
          </div>
          {M.map((a, i) => (
            <motion.div
              key={a.word}
              className={`mrow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { y: -80, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 160, damping: 15, delay: 0.2 + (3 - i) * 0.12 } } }}
            >
              <span className="mrow__word">{a.word}</span>
              <p className="mrow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="fnd__i" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="fnd__label mono">
            <span>○</span> Idealism — <i>mind is basic</i>
          </div>
          {I.map((d, i) => (
            <motion.div
              key={d.word}
              className={`irow irow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { opacity: 0, filter: 'blur(18px)' }, show: { opacity: 1, filter: 'blur(0px)', transition: { duration: 2, delay: 0.3 + i * 0.25 } } }}
            >
              <span className="irow__word">{d.word}</span>
              <p className="irow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
