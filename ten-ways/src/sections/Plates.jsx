import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Glyph from '../components/Glyph.jsx'
import Instrument from '../components/Instrument.jsx'
import { ARCHETYPES } from '../lib/archetypes.js'

const ease = [0.76, 0, 0.24, 1]
const rise = (delay = 0) => ({ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 1, delay, ease } } })
const fade = (delay = 0) => ({ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, delay } } })

function Plate({ a, i }) {
  const prev = ARCHETYPES[i - 1]
  const next = ARCHETYPES[i + 1]
  return (
    <motion.article id={`plate-${a.id}`} className={`plate plate--${a.id}`} style={{ '--c': a.color, '--fg': a.fg }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
      <header className="plate__bar mono">
        <span>
          Plate {a.no} of X
        </span>
        <nav aria-label="Neighbouring plates">
          {prev && <a href={`#plate-${prev.id}`}>← {prev.name}</a>}
          {next ? <a href={`#plate-${next.id}`}>{next.name} →</a> : <a href="#kinships">Kinships →</a>}
        </nav>
      </header>

      <div className="plate__body">
        <div className="plate__text">
          <motion.div variants={fade(0.1)}>
            <Glyph d={a.glyph} className="plate__glyph" width={4} />
          </motion.div>
          <h3 className="plate__name">
            <motion.span variants={rise(0.05)}>{a.name}</motion.span>
          </h3>
          <motion.p className="plate__verb" variants={fade(0.35)}>
            To <em>{a.verb}</em> reality.
          </motion.p>

          <motion.dl className="plate__facts" variants={fade(0.5)}>
            <div>
              <dt className="mono">Asks</dt>
              <dd className="plate__q">{a.question}</dd>
            </div>
            <div>
              <dt className="mono">Instrument</dt>
              <dd>{a.instrument}</dd>
            </div>
            <div>
              <dt className="mono">Gift</dt>
              <dd>{a.gift}</dd>
            </div>
            <div>
              <dt className="mono">Shadow</dt>
              <dd>{a.shadow}</dd>
            </div>
            <div>
              <dt className="mono">Exemplars</dt>
              <dd>{a.exemplars.join(' · ')}</dd>
            </div>
          </motion.dl>

          <motion.figure className="plate__quote" variants={fade(0.7)}>
            <blockquote>“{a.quote[0]}”</blockquote>
            <figcaption className="mono">{a.quote[1]}</figcaption>
          </motion.figure>
        </div>

        <motion.div className="plate__stage" variants={fade(0.3)}>
          <Instrument kind={a.id} fg={a.fg} bg={a.color} label={`The ${a.name.toLowerCase()}’s instrument. ${a.play}`} />
          <p className="plate__play mono">
            <span>Instrument {a.no}</span>
            {a.play}
          </p>
        </motion.div>
      </div>
    </motion.article>
  )
}

export default function Plates() {
  return (
    <section id="ten" className="ten">
      <div className="ten__head">
        <SectionHead no="03" title="The Ten" kicker="Ten plates, one for each way of meeting the world. Each has its question, its gift, its shadow, and an instrument you can use." />
        <ol className="ten__index">
          {ARCHETYPES.map((a) => (
            <li key={a.id}>
              <a href={`#plate-${a.id}`} style={{ '--c': a.color }}>
                <span className="mono">{a.no}</span>
                {a.name}
                <em>{a.verb}</em>
              </a>
            </li>
          ))}
        </ol>
      </div>
      {ARCHETYPES.map((a, i) => (
        <Plate key={a.id} a={a} i={i} />
      ))}
    </section>
  )
}
