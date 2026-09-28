import { motion } from 'framer-motion'

const LINE_T = 'Transcendence says: there is more than this.'
const LINE_I = 'Immanence says: there is more in this.'

export default function Finale() {
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        {/* transcendence: each word a step higher than the last, climbing off the line */}
        <motion.h2 className="fin__t" aria-label={LINE_T} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
          {LINE_T.split(' ').map((w, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              style={{ '--step': i }}
              variants={{ hidden: { opacity: 0, y: 80 }, show: { opacity: 1, y: 0, transition: { duration: 1.4, delay: 0.2 + i * 0.14, ease } } }}
            >
              {w}
            </motion.span>
          ))}
        </motion.h2>

        {/* immanence: every letter lands on the same ground */}
        <motion.h2 className="fin__i" aria-label={LINE_I} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
          {LINE_I.split(' ').map((w, wi) => (
            <span className="fin__word" key={wi} aria-hidden="true">
              {w.split('').map((ch, i) => (
                <motion.span
                  key={i}
                  variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.7, delay: 1.2 + (wi * 5 + i) * 0.025, ease } } }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Transcendence &amp; Immanence: an exhibition in eight rooms, from Plato’s Good “beyond being” to Deleuze’s plane of immanence.</p>
          <p>Presented as positions people have held, not verdicts. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
