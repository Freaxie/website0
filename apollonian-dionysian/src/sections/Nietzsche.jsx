import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { range } from '../lib/geom.js'

const TERMS = [
  { de: 'Traum', en: 'Dream', side: 'a', text: 'Apollo’s realm. The luminous world of images, where everything appears with calm, clear contours: sculpture, epic, the beautiful appearance (Schein).' },
  { de: 'Rausch', en: 'Intoxication', side: 'd', text: 'Dionysus’ realm. Spring, wine, song, the festival crowd: the state in which the individual forgets itself. Its art is music.' },
  { de: 'principium individuationis', en: 'The principle of individuation', side: 'a', text: 'Borrowed from Schopenhauer: what separates the world into distinct, bounded things. Nietzsche makes Apollo its god.' },
  { de: 'das Ur-Eine', en: 'The primordial unity', side: 'd', text: 'The one underlying life, full of contradiction and pain, that the Dionysian state lets us feel beneath the surface of individual things.' },
]

const BLOCKS = [
  {
    h: 'A philologist’s wager',
    p: 'In 1872 Friedrich Nietzsche, a 27-year-old professor of classical philology at Basel, published his first book: The Birth of Tragedy out of the Spirit of Music. His question: how did the Greeks, a people who felt the terror of existence so keenly, make an art that could face it?',
  },
  {
    h: 'Two art-drives',
    p: 'His answer is a pair of Kunsttriebe, artistic energies that burst out of nature itself, named for two gods. Apollo: dream, image, measure, the individual. Dionysus: intoxication, music, the dissolving of the individual into the whole. They are rivals, and they are kin.',
  },
  {
    h: 'Their child is tragedy',
    p: 'Attic tragedy was born from the Dionysian chorus. In Nietzsche’s account, that chorus “discharges itself over and over again in an Apollonian world of images”: the stage, the hero, the dialogue. The truth comes from Dionysus; Apollo lets us look at it without being destroyed.',
  },
  {
    h: 'And its death',
    p: 'With Euripides and Socrates came what Nietzsche calls aesthetic Socratism: “to be beautiful, everything must be intelligible.” Optimistic reason drove the music out, and tragedy died of it. The book ends by hoping for a rebirth, which he then pinned on Wagner and later regretted.',
  },
]

export default function Nietzsche() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const yearY = useTransform(scrollYProgress, (p) => `${range(0, 1, 12, -18)(p)}%`)
  const qx = useTransform(scrollYProgress, (p) => `${range(0.45, 0.95, 8, -22)(p)}%`)
  const ease = [0.76, 0, 0.24, 1]

  return (
    <section id="nietzsche" className="nz" ref={ref}>
      <SectionHead no="05" title="Nietzsche, 1872" kicker="Where the two names come from, and what they were for." />

      <div className="nz__grid">
        <aside className="nz__aside">
          <motion.div className="nz__year" style={{ y: yearY }} aria-hidden="true">
            18<br />72
          </motion.div>
          <p className="nz__book">
            <i>Die Geburt der Tragödie</i>
            <br />
            <i>aus dem Geiste der Musik</i>
          </p>
          <p className="mono nz__meta">Leipzig: E. W. Fritzsch, 1872<br />2nd ed. 1886, with “An Attempt at Self-Criticism”</p>
        </aside>

        <div className="nz__body">
          {BLOCKS.map((b, i) => (
            <motion.article
              key={b.h}
              className="nz__block"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1, ease, delay: 0.05 }}
            >
              <span className="mono">§ {String(i + 1).padStart(2, '0')}</span>
              <h3>{b.h}</h3>
              <p>{b.p}</p>
            </motion.article>
          ))}
        </div>
      </div>

      <motion.div className="nz__terms" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
        {TERMS.map((t, i) => (
          <motion.div
            key={t.de}
            className={`term term--${t.side}`}
            variants={{
              hidden: { clipPath: 'inset(100% 0 0 0)' },
              show: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 1.1, ease, delay: i * 0.1 } },
            }}
            tabIndex={0}
          >
            <span className="mono">{t.side === 'a' ? 'Apollonian' : 'Dionysian'}</span>
            <strong>{t.de}</strong>
            <em>{t.en}</em>
            <p>{t.text}</p>
          </motion.div>
        ))}
      </motion.div>

      <figure className="nz__quote">
        <motion.blockquote style={{ x: qx }}>“…only as an aesthetic phenomenon are existence and the world eternally justified.”</motion.blockquote>
        <figcaption className="mono">The Birth of Tragedy, § 5</figcaption>
      </figure>
    </section>
  )
}
