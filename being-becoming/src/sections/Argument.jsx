import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Each entry sits where it leans: left toward being, right toward becoming, centre for those who hold both.
const ENTRIES = [
  {
    year: 'c. 500 BCE',
    who: 'Heraclitus',
    lean: 'becoming',
    idea: 'All things are in flux, held together by strife and by a hidden measure, the logos.',
    quote: '“This world-order… was ever and is and shall be: an ever-living fire, kindling in measures and going out in measures.”',
  },
  {
    year: 'c. 475 BCE',
    who: 'Parmenides',
    lean: 'being',
    idea: 'Reason shows that what is cannot come to be or perish, cannot be divided or moved. Change and plurality belong to the way of mere opinion.',
    quote: '“…it is, ungenerated and imperishable, whole, single-limbed, unshaken, complete.”',
  },
  {
    year: 'c. 450 BCE',
    who: 'Zeno of Elea',
    lean: 'being',
    idea: 'Paradoxes of the arrow, of Achilles and the tortoise, of the halves, all built to show that motion leads to contradiction.',
  },
  {
    year: 'c. 360 BCE',
    who: 'Plato',
    lean: 'both',
    idea: 'Two realms. The Forms truly are and never change; the world of the senses is always becoming and never fully is.',
    quote: '“What is that which always is and has no becoming, and what is that which is always becoming and never is?”',
  },
  {
    year: 'c. 350 BCE',
    who: 'Aristotle',
    lean: 'both',
    idea: 'Change is real and intelligible: something that is potentially (the acorn) becomes actually what it could be (the oak). Being comes in degrees of actuality.',
  },
  {
    year: '1812',
    who: 'G. W. F. Hegel',
    lean: 'becoming',
    idea: 'Science of Logic. Pure being, thought through, is empty, indistinguishable from nothing; each passes into the other. The truth of both is becoming.',
  },
  {
    year: '1888',
    who: 'Friedrich Nietzsche',
    lean: 'becoming',
    idea: 'Twilight of the Idols. Philosophers “mummify” becoming into lifeless concepts. He sides with Heraclitus: being is an empty fiction.',
  },
  {
    year: '1929',
    who: 'A. N. Whitehead',
    lean: 'becoming',
    idea: 'Process and Reality. The world is made of events, not static things. How an actual entity becomes is what that entity is.',
  },
  {
    year: '1955',
    who: 'Albert Einstein',
    lean: 'being',
    idea: 'In relativity all of spacetime is laid out at once, a “block”. Writing after a friend’s death, he called the distinction between past, present and future “only a stubbornly persistent illusion”.',
  },
]

export default function Argument() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.7', 'end 0.6'] })
  const spine = useTransform(scrollYProgress, (p) => Math.max(0, Math.min(1, p)))

  return (
    <section id="argument" className="arg" ref={ref}>
      <SectionHead no="06" title="The Long Argument" kicker="Twenty-five centuries of the same question. Being on the left, becoming on the right; the ones who hold both, in the middle." />

      <div className="arg__axis mono" aria-hidden="true">
        <span>← Being</span>
        <span>Both</span>
        <span>Becoming →</span>
      </div>

      <div className="arg__body">
        <motion.div className="arg__spine" style={{ scaleY: spine }} aria-hidden="true" />
        <ol className="arg__list">
          {ENTRIES.map((e) => (
            <motion.li
              key={e.who + e.year}
              className={`arg__item arg__item--${e.lean}`}
              initial={{ opacity: 0, x: e.lean === 'being' ? 0 : e.lean === 'both' ? 0 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: e.lean === 'being' ? 1.6 : 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="arg__dot" aria-hidden="true" />
              <div className="arg__year">{e.year}</div>
              <h3>{e.who}</h3>
              <p className="arg__idea">{e.idea}</p>
              {e.quote && <blockquote>{e.quote}</blockquote>}
              <span className="arg__lean mono">{e.lean === 'both' ? 'Holds both' : `Leans toward ${e.lean}`}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
