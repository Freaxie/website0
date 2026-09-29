import { motion } from 'framer-motion'

const LINE_M = 'Materialism says: mind is something matter does.'
const LINE_I = 'Idealism says: matter is something mind finds.'

export default function Finale() {
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        {/* matter: each word drops and lands with weight */}
        <motion.h2 className="fin__m" aria-label={LINE_M} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
          {LINE_M.split(' ').map((w, i) => (
            <motion.span key={i} aria-hidden="true" variants={{ hidden: { y: -120, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 13, delay: 0.2 + i * 0.1 } } }}>
              {w}
            </motion.span>
          ))}
        </motion.h2>

        {/* mind: the line is there only as far as you attend to it; it comes up slowly out of nothing */}
        <motion.h2
          className="fin__i"
          initial={{ opacity: 0, filter: 'blur(20px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 2.4, delay: 1.2 }}
        >
          {LINE_I}
        </motion.h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Materialism &amp; Idealism: an exhibition in eight rooms, from Democritus’ atoms to Chalmers’ hard problem.</p>
          <p>The one true red in room 07 is deliberate. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
