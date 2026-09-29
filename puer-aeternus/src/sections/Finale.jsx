import { motion } from 'framer-motion'

const LINE_P = 'The puer begins.'
const LINE_S = 'The senex keeps.'

export default function Finale() {
  return (
    <section id="coda" className="fin">
      <div className="fin__sky">
        <div className="fin__top mono">
          <span>07</span>
          <span>Coda</span>
        </div>
        {/* the parent observes; the letters follow by variant */}
        <motion.h2 className="fin__p" aria-label={LINE_P} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
          {LINE_P.split(' ').map((word, wi, words) => {
            const start = words.slice(0, wi).join(' ').length + (wi ? 1 : 0)
            return (
              <span key={wi} className="fin__p-w" aria-hidden="true">
                {word.split('').map((ch, j) => {
                  const i = start + j
                  return (
                    <motion.span
                      key={j}
                      className="fin__p-c"
                      variants={{ hidden: { opacity: 0, y: 80 }, show: { opacity: 1, y: 0, transition: { duration: 2, delay: 0.1 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] } } }}
                    >
                      <span className="fin__p-l" style={{ animationDelay: `${i * -0.37}s` }}>
                        {ch}
                      </span>
                    </motion.span>
                  )
                })}
              </span>
            )
          })}
        </motion.h2>
      </div>
      <div className="fin__ground">
        <motion.h2 className="fin__s" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
          <motion.span variants={{ hidden: { y: -140, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 15, mass: 3, delay: 1.2 } } }}>{LINE_S}</motion.span>
        </motion.h2>
        <motion.p className="fin__both" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.6, duration: 1.4 }}>
          It takes both to finish anything.
        </motion.p>
        <footer className="fin__foot">
          <div className="fin__colophon mono">
            <p>Puer Aeternus: an exhibition in seven rooms, after Ovid, Jung, Marie-Louise von Franz and James Hillman.</p>
            <p>The youth is set in light, wide letters and the colours of sky and sun; the old man in heavy, narrow ones and the colours of lead, stone and ochre. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
          </div>
          <a className="fin__return mono" href="#entrance">
            Return to the entrance <span>↑</span>
          </a>
        </footer>
      </div>
    </section>
  )
}
