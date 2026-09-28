import { motion } from 'framer-motion'

const LINE_A = 'Being is what stays.'
const LINE_B = 'Becoming is how anything stays.'

export default function Finale() {
  let k = 0
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        {/* being: no letter-by-letter entrance; the line is simply there */}
        <h2 className="fin__being">{LINE_A}</h2>

        {/* becoming: every letter keeps changing its width and weight */}
        <motion.h2 className="fin__becoming" aria-label={LINE_B} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
          {LINE_B.split(' ').map((w, wi) => (
            <span className="fin__word" key={wi} aria-hidden="true">
              {w.split('').map((ch) => {
                const i = k++
                return (
                  <motion.span
                    key={i}
                    className="fin__bl"
                    style={{ '--i': i }}
                    variants={{ hidden: { opacity: 0, y: '30%' }, show: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.4 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] } } }}
                  >
                    {ch}
                  </motion.span>
                )
              })}
            </span>
          ))}
        </motion.h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Being &amp; Becoming: an exhibition in eight rooms, from Parmenides and Heraclitus to Whitehead.</p>
          <p>Fragments of Heraclitus and Parmenides are cited by their Diels–Kranz numbers, in common English translations. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
