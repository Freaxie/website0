import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// p = the youth's line, s = the old man's, b = the writers who held both
const ITEMS = [
  { side: 's', when: 'Antiquity', who: 'Kronos / Saturn', text: 'The old god of time swallows his children so that none of them can replace him: the senex’s shadow, the old order that cannot let the new begin.' },
  { side: 'p', when: 'c. 8 CE', who: 'Ovid, Metamorphoses IV', text: '“Tu puer aeternus”: you, the eternal boy. The poet is addressing Bacchus, a god who never grows old. The phrase starts here.' },
  { side: 's', when: '1514', who: 'Dürer, Melencolia I', text: 'The saturnine temperament in one image: a winged figure who does not fly, sitting heavy among tools she is not using.' },
  { side: 'p', when: '1904', who: 'J. M. Barrie, Peter Pan', text: 'The play’s subtitle says it: The Boy Who Wouldn’t Grow Up. He can fly, and he forgets.' },
  { side: 'p', when: '1912', who: 'C. G. Jung', text: 'In Wandlungen und Symbole der Libido, later Symbols of Transformation, Jung takes up the puer aeternus as a figure of the psyche: renewal, and the refusal to be bound.' },
  { side: 'p', when: '1943', who: 'Antoine de Saint-Exupéry, The Little Prince', text: 'A pilot meets a boy from a small planet in the desert. A year later Saint-Exupéry disappeared on a reconnaissance flight.' },
  { side: 'b', when: '1959–60, 1970', who: 'Marie-Louise von Franz', text: 'Lectures in Zurich, later The Problem of the Puer Aeternus: the provisional life, the fear of being pinned down, and a close reading of The Little Prince.' },
  { side: 'b', when: '1967', who: 'James Hillman, “Senex and Puer”', text: 'An Eranos lecture that puts the two back together: not youth against age, but one archetype whose halves need each other.' },
]

export default function Lineage() {
  const ease = [0.2, 0.8, 0.2, 1]
  return (
    <section id="lineage" className="lin">
      <SectionHead no="06" title="Lineage" kicker="Two thousand years of the eternal boy and the old man. The youth’s entries rise into place; the old man’s settle." />
      <ol className="lin__list">
        {ITEMS.map((it) => (
          <motion.li
            key={it.who}
            className={`lin__item lin__item--${it.side}`}
            initial={{ opacity: 0, y: it.side === 's' ? -70 : it.side === 'p' ? 90 : 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={it.side === 's' ? { type: 'spring', stiffness: 220, damping: 18, mass: 2 } : { duration: 1.6, ease }}
          >
            <span className="lin__dot" aria-hidden="true" />
            <div className="lin__card">
              <span className="mono lin__when">{it.when}</span>
              <h3>{it.who}</h3>
              <p>{it.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
