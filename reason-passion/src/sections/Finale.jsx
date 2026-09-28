import { motion } from 'framer-motion'

const LINE_R = 'Reason shows the way.'
const LINE_P = 'Passion makes us go.'

export default function Finale() {
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        {/* reason: typed, one character at a time, at an even rate */}
        <motion.h2 className="fin__r" aria-label={LINE_R} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.8 }}>
          {LINE_R.split('').map((ch, i) => (
            <motion.span key={i} aria-hidden="true" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01, delay: 0.3 + i * 0.07 } } }}>
              {ch}
            </motion.span>
          ))}
          <span className="fin__caret" aria-hidden="true" />
        </motion.h2>

        {/* passion: arrives all at once, and keeps beating */}
        <motion.h2
          className="fin__p"
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.2, delay: 1.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>{LINE_P}</span>
        </motion.h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Reason &amp; Passion: an exhibition in eight rooms, from Plato’s Republic to Kahneman and Nussbaum.</p>
          <p>Cyan and magenta are printing inks; where they overlap, they overprint. Set in JetBrains Mono, Instrument Serif and Archivo.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
