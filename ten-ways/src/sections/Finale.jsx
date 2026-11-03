import { motion } from 'framer-motion'
import { ORDERS, byId, ink } from '../lib/archetypes.js'
import Convergence from '../components/Convergence.jsx'

const ease = [0.76, 0, 0.24, 1]

export default function Finale() {
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>09</span>
        <span>Coda</span>
      </div>

      {/* the parent observes; each imperative follows by variant, order by order */}
      <motion.div className="fin__orders" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
        {ORDERS.map((o, k) => (
          <section key={o.id} className="fin__order" aria-label={`Order ${o.no}: ${o.name}`}>
            <motion.p className="fin__oname mono" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.8, delay: k * 0.12 } } }}>
              <span>{o.no}</span>
              {o.name}
            </motion.p>
            <ol className="fin__verbs">
              {o.ids.map((id, i) => {
                const a = byId[id]
                return (
                  <li key={id} className="fin__clip">
                    <motion.span className={`fin__verb fin__verb--${id}`} style={{ color: ink(a) }} variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.9, delay: k * 0.12 + i * 0.08, ease } } }}>
                      {a.verb[0].toUpperCase() + a.verb.slice(1)} it.
                    </motion.span>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </motion.div>

      <motion.p className="fin__last" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.4, delay: 0.4 }}>
        Reality is large enough for all twenty-four.
      </motion.p>

      <Convergence />

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Twenty-Four Ways of Encountering Reality: an atlas in nine rooms. The positions, kinships and instruments are a curator’s interpretation, offered to be argued with.</p>
          <p>Each archetype keeps its own colour throughout, and lends a paper of its hue to its entry. Set in Archivo, Instrument Serif, Newsreader and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
