import { motion } from 'framer-motion'

const LINE_S = 'Space gives everything a place.'
const LINE_T = 'Time gives everything a turn.'

export default function Finale() {
  const ease = [0.83, 0, 0.17, 1]
  let k = 0

  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      <div className="fin__lines">
        {/* space: every letter arrives at once, each in its own cell */}
        <motion.h2 className="fin__s" aria-label={LINE_S} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.8 }}>
          <motion.span className="fin__rule" variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.2, ease } } }} />
          {LINE_S.split(' ').map((w, wi) => (
            <span className="fin__word" key={wi} aria-hidden="true">
              {w.split('').map((ch, i) => (
                <span className="fin__cell" key={i}>
                  <motion.span variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.9, delay: 0.2, ease } } }}>{ch}</motion.span>
                </span>
              ))}
            </span>
          ))}
        </motion.h2>

        {/* time: strictly one after another, each letter leaving an afterimage */}
        <motion.h2 className="fin__t" aria-label={LINE_T} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6 }}>
          {LINE_T.split(' ').map((w, wi) => {
            const letters = w.split('').map((ch) => {
              const i = k++
              return (
                <motion.span
                  key={i}
                  className="fin__tl"
                  variants={{
                    hidden: { opacity: 0, x: '-0.5em' },
                    show: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 1.3 + i * 0.09, ease: [0.2, 0.8, 0.2, 1] } },
                  }}
                >
                  {ch}
                </motion.span>
              )
            })
            return (
              <span className="fin__tword" key={wi} aria-hidden="true">
                {letters}
              </span>
            )
          })}
        </motion.h2>
      </div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Space &amp; Time: an exhibition in eight rooms, from Augustine’s Confessions to Einstein’s general relativity.</p>
          <p>The numbers in room 04 are computed from the Lorentz factor, not illustrated. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
