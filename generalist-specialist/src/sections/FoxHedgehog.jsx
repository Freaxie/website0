import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Isaiah Berlin's own sorting, in "The Hedgehog and the Fox" (1953).
const WRITERS = [
  { name: 'Dante', berlin: 'hedgehog' },
  { name: 'Shakespeare', berlin: 'fox' },
  { name: 'Plato', berlin: 'hedgehog' },
  { name: 'Montaigne', berlin: 'fox' },
  { name: 'Dostoevsky', berlin: 'hedgehog' },
  { name: 'Goethe', berlin: 'fox' },
  { name: 'Pascal', berlin: 'hedgehog' },
  { name: 'Aristotle', berlin: 'fox' },
  { name: 'Nietzsche', berlin: 'hedgehog' },
  { name: 'Joyce', berlin: 'fox' },
  { name: 'Hegel', berlin: 'hedgehog' },
  { name: 'Pushkin', berlin: 'fox' },
  { name: 'Tolstoy', berlin: 'both' },
]

export default function FoxHedgehog() {
  const [guess, setGuess] = useState({})
  const [all, setAll] = useState(false)
  const answered = Object.keys(guess).length
  const agree = WRITERS.filter((w) => guess[w.name] && (w.berlin === guess[w.name] || w.berlin === 'both')).length

  return (
    <section id="fox" className="fox">
      <div className="fox__top">
        <SectionHead no="03" title="The Fox & the Hedgehog" kicker="Sort the writers the way Isaiah Berlin did in 1953. Does each one pursue many ends, or see everything through one idea?" />
        <figure className="fox__frag">
          <blockquote>“The fox knows many things, but the hedgehog knows one big thing.”</blockquote>
          <figcaption className="mono">Archilochus, 7th century BCE</figcaption>
        </figure>
      </div>

      <div className="fox__score mono" aria-live="polite">
        <span>
          {answered} of {WRITERS.length} sorted
        </span>
        <span>{answered ? `You agree with Berlin on ${agree}` : 'Choose for each name'}</span>
        <button type="button" onClick={() => setAll((v) => !v)}>
          {all ? 'Hide Berlin’s answers' : 'Show all of Berlin’s answers'}
        </button>
      </div>

      <ol className="fox__grid">
        {WRITERS.map((w, i) => {
          const g = guess[w.name]
          const show = all || g
          const verdict = w.berlin === 'both' ? 'Both' : w.berlin === 'fox' ? 'Fox' : 'Hedgehog'
          return (
            <motion.li
              key={w.name}
              className={`fcard fcard--${show ? w.berlin : 'open'}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.06 }}
            >
              <span className="fcard__name">{w.name}</span>
              {!g && (
                <div className="fcard__btns">
                  <button type="button" className="mono" onClick={() => setGuess((s) => ({ ...s, [w.name]: 'fox' }))}>
                    Fox
                  </button>
                  <button type="button" className="mono" onClick={() => setGuess((s) => ({ ...s, [w.name]: 'hedgehog' }))}>
                    Hedgehog
                  </button>
                </div>
              )}
              <AnimatePresence>
                {show && (
                  <motion.div className="fcard__verdict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <span className="mono">Berlin: {verdict}</span>
                    {g && <span className="mono fcard__you">{w.berlin === g || w.berlin === 'both' ? 'you agree' : `you said ${g}`}</span>}
                    {w.berlin === 'both' && <p>By nature a fox, Berlin argued, who believed in being a hedgehog. The whole essay is about him.</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </ol>

      <div className="fox__notes">
        <p>
          <span className="mono">Berlin, 1953</span>
          Hedgehogs “relate everything to a single central vision”; foxes “pursue many ends, often unrelated and even contradictory”. He meant it half as a game, and said so.
        </p>
        <p>
          <span className="mono">Tetlock, 2005</span>
          Philip Tetlock tracked thousands of predictions by political experts over two decades. The ones who thought like foxes, drawing on many ideas and doubting their own, forecast better than the hedgehogs with one big theory.
        </p>
      </div>
    </section>
  )
}
