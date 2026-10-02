import { motion } from 'framer-motion'
import { ARCHETYPES } from '../lib/archetypes.js'

const ease = [0.76, 0, 0.24, 1]

export default function Finale() {
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>06</span>
        <span>Coda</span>
      </div>

      {/* the parent observes; each imperative follows by variant */}
      <motion.ol className="fin__verbs" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
        {ARCHETYPES.map((a, i) => (
          <li key={a.id} className="fin__clip">
            <motion.span className={`fin__verb fin__verb--${a.id}`} style={{ color: a.color }} variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.9, delay: i * 0.12, ease } } }}>
              {a.verb[0].toUpperCase() + a.verb.slice(1)} it.
            </motion.span>
          </li>
        ))}
      </motion.ol>

      <motion.p className="fin__last" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.4, delay: 0.4 }}>
        Reality is large enough for all ten.
      </motion.p>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Ten Ways of Encountering Reality: an atlas in six rooms. The positions, kinships and instruments are a curator’s interpretation, offered to be argued with.</p>
          <p>Each archetype keeps its own colour throughout. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
