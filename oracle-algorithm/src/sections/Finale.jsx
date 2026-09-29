import { motion } from 'framer-motion'
import { GLYPHS, glyphPath } from '../lib/glyphs.js'

const ease = [0.76, 0, 0.24, 1]
const line = (delay) => ({ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 1.2, delay, ease } } })

export default function Finale() {
  return (
    <section id="reality" className="fin">
      <div className="fin__top mono">
        <span>07</span>
        <span>Reality Decides</span>
      </div>

      {/* the parent observes: clipped lines cannot see themselves enter */}
      <motion.div className="fin__lines" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
        <div className="fin__row fin__row--o">
          <svg viewBox="0 0 100 100" className="fin__glyph" aria-hidden="true">
            <motion.path d={glyphPath(GLYPHS[0].prims)} variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 2, delay: 0.2 } } }} />
          </svg>
          <h2 className="fin__clip">
            <motion.span variants={line(0.1)}>Oracle interprets.</motion.span>
          </h2>
        </div>
        <div className="fin__row fin__row--a">
          <h2 className="fin__clip">
            <motion.span variants={line(0.7)}>Algorithm calculates.</motion.span>
          </h2>
        </div>
        <div className="fin__row fin__row--r">
          <h2 className="fin__clip">
            <motion.span variants={line(1.6)}>Reality decides.</motion.span>
          </h2>
          <motion.span className="fin__rule" variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.6, delay: 2.2, ease } } }} />
        </div>
      </motion.div>

      <footer className="fin__foot">
        <div className="fin__colophon mono">
          <p>Oracle vs Algorithm: an exhibition in seven rooms, from Shang oracle bones to models that predict the next word.</p>
          <p>The twelve signs were invented for this exhibition and belong to no tradition. Every reading and prediction in it is generated on the page. Set in Archivo, Instrument Serif and JetBrains Mono.</p>
        </div>
        <a className="fin__return mono" href="#entrance">
          Return to the entrance <span>↑</span>
        </a>
      </footer>
    </section>
  )
}
