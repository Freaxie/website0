import { motion } from 'framer-motion'
import { rng } from '../lib/geom.js'

const LINE_A = 'Apollo gives chaos a form.'
const LINE_D = 'Dionysus reminds form that it is alive.'
const r = rng(8)
const drift = LINE_D.split('').map(() => ({ d: -r() * 6, a: 0.05 + r() * 0.12, rot: (r() - 0.5) * 14, hx: (r() - 0.5) * 60, hy: -20 - r() * 50, del: r() * 0.8 }))

export default function Finale() {
  const ease = [0.83, 0, 0.17, 1]
  const words = LINE_D.split(' ')
  let idx = 0

  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        <motion.h2 className="fin__a" aria-label={LINE_A} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.8 }}>
          <motion.span className="fin__rule" variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.2, ease } } }} />
          {LINE_A.split(' ').map((w, wi) => (
            <span className="fin__word" key={wi} aria-hidden="true">
              {w.split('').map((ch, i) => (
                <span className="fin__cell" key={i}>
                  <motion.span
                    variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.8, delay: 0.2 + (wi * 6 + i) * 0.035, ease } } }}
                  >
                    {ch}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </motion.h2>

        <h2 className="fin__d" aria-label={LINE_D}>
          {words.map((w, wi) => {
            const letters = w.split('').map((ch) => {
              const k = idx++
              const f = drift[k]
              return (
                <motion.span
                  key={k}
                  className="fin__dl"
                  style={{ '--d': `${f.d}s`, '--a': `${f.a}em`, '--r': `${f.rot}deg` }}
                  initial={{ opacity: 0, filter: 'blur(12px)', y: 40 }}
                  whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.8, delay: 1 + f.del, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.span className="fin__hov" whileHover={{ x: f.hx, y: f.hy, rotate: f.rot * 3 }} transition={{ type: 'spring', stiffness: 120, damping: 8 }}>
                    <span>{ch}</span>
                  </motion.span>
                </motion.span>
              )
            })
            idx++
            return (
              <span className="fin__dword" key={wi} aria-hidden="true">
                {letters}
              </span>
            )
          })}
        </h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Apollonian vs Dionysian — an exhibition in eight rooms after Friedrich Nietzsche, <i>Die Geburt der Tragödie</i> (1872).</p>
          <p>Quotations in English after Walter Kaufmann’s translation. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
