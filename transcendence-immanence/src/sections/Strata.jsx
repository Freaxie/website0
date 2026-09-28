import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Height encodes the claim: how far above the world each thinker places what matters most.
const ENTRIES = [
  {
    h: 0.95,
    year: 'c. 375 BCE',
    who: 'Plato',
    idea: 'The Form of the Good is the source of all being and knowing, yet it is not itself a being.',
    quote: '“…beyond being, exceeding it in dignity and power.” Republic 509b',
  },
  { h: 0.87, year: 'c. 250', who: 'Plotinus', idea: 'The One lies beyond all things. Everything flows from it, level by level, and everything longs to return to it.' },
  {
    h: 0.78,
    year: 'c. 500',
    who: 'Pseudo-Dionysius',
    idea: 'God is beyond every name we could give. We draw near by unsaying: the way of negation, the “divine darkness”.',
  },
  {
    h: 0.64,
    year: '1961',
    who: 'Emmanuel Levinas',
    idea: 'Totality and Infinity. Transcendence is not above but across: in the face of another person, who always exceeds my idea of them.',
  },
  {
    h: 0.5,
    year: '1781',
    who: 'Immanuel Kant',
    idea: 'Things as they are in themselves lie beyond any possible experience. Note the word: transcendental means the conditions of experience; transcendent, what lies past it.',
  },
  { h: 0.3, year: 'c. 300 BCE', who: 'The Stoics', idea: 'God is reason and fiery breath, pneuma, running through all matter. The ordered cosmos is itself divine.' },
  {
    h: 0.22,
    year: '1883',
    who: 'Friedrich Nietzsche',
    idea: 'Thus Spoke Zarathustra. Against every “other world”:',
    quote: '“Remain faithful to the earth.”',
  },
  {
    h: 0.09,
    year: '1677',
    who: 'Baruch Spinoza',
    idea: 'Ethics. There is one substance, God or Nature, and everything is in it.',
    quote: '“God is the immanent, not the transitive, cause of all things.” I, P18',
  },
  {
    h: 0.03,
    year: '1991',
    who: 'Gilles Deleuze',
    idea: 'With Félix Guattari, What Is Philosophy?: thought lays out a “plane of immanence”, immanent to nothing but itself. No outside, no above.',
  },
]

export default function Strata() {
  return (
    <section id="strata" className="str">
      <SectionHead no="06" title="Heights" kicker="Where each thinker places what matters most. The higher on this wall, the further beyond the world." />

      <div className="str__field">
        <div className="str__scale mono" aria-hidden="true">
          <span>↑ Beyond</span>
          <span>Within ·</span>
        </div>
        {ENTRIES.map((e, i) => (
          <motion.article
            key={e.who}
            className={`str__item ${i % 2 ? 'str__item--r' : ''} ${e.h < 0.12 ? 'is-ground' : ''}`}
            style={{ '--h': e.h }}
            initial={{ opacity: 0, y: e.h > 0.5 ? -50 : 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="str__level mono">{Math.round(e.h * 100)}</span>
            <div className="str__year">{e.year}</div>
            <h3>{e.who}</h3>
            <p className="str__idea">{e.idea}</p>
            {e.quote && <blockquote>{e.quote}</blockquote>}
          </motion.article>
        ))}
        <div className="str__ground mono" aria-hidden="true">
          The ground: this world
        </div>
      </div>
    </section>
  )
}
