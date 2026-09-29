import { motion } from 'framer-motion'
import { CHIPS } from '../lib/geom.js'
import { STYLES } from './Hero.jsx'

const LINE_G = 'The generalist sees how things connect.'
const LINE_S = 'The specialist sees how one thing works.'

export default function Finale() {
  let k = 0
  return (
    <section id="coda" className="fin">
      <div className="fin__top mono">
        <span>08</span>
        <span>Coda</span>
      </div>

      {/* the parent observes: the clipped specialist line cannot see itself enter */}
      <motion.div className="fin__lines" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
        {/* the generalist: every letter in a different voice, and the line runs wide */}
        <motion.h2 className="fin__g" aria-label={LINE_G}>
          {LINE_G.split(' ').map((w, wi) => (
            <span key={wi} className="fin__word" aria-hidden="true">
              {w.split('').map((ch) => {
                const i = k++
                return (
                  <motion.span
                    key={i}
                    className={`gl gl--${STYLES[(i * 7) % STYLES.length]}`}
                    style={{ color: CHIPS[(i * 5) % CHIPS.length] }}
                    variants={{ hidden: { opacity: 0, y: (i % 2 ? -1 : 1) * 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 + (i % 9) * 0.05 } } }}
                  >
                    {ch}
                  </motion.span>
                )
              })}
            </span>
          ))}
        </motion.h2>

        {/* the specialist: one voice, one colour, drilled straight down into place */}
        <motion.h2 className="fin__s" variants={{ hidden: { clipPath: 'inset(0 0 100% 0)' }, show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.4, delay: 0.9, ease: [0.76, 0, 0.24, 1] } } }}>
          {LINE_S}
        </motion.h2>
      </motion.div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Generalist &amp; Specialist: an exhibition in eight rooms, from Archilochus’ fox and hedgehog to Tetlock’s forecasters.</p>
          <p>The generalist speaks in eight colours and five typefaces; the specialist in one blue, close to Yves Klein’s, and one face. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
