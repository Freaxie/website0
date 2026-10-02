import { useEffect, useState } from 'react'
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
  // the shadow side: the same plate with its colours turned inside out
  const [shadow, setShadow] = useState(false)
  const c = shadow ? a.fg : a.color
  const fg = shadow ? a.color : a.fg
  return (
    <motion.article id={`plate-${a.id}`} className={`plate plate--${a.id} ${shadow ? 'is-shadow' : ''}`} style={{ '--c': c, '--fg': fg }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
      <Glyph d={a.glyph} className="plate__mark" width={1.2} />
      <header className="plate__bar mono">
        <span>
          Plate {a.no} of X
        </span>
        <button type="button" className="plate__shadow mono" aria-pressed={shadow} onClick={() => setShadow((v) => !v)}>
          <i aria-hidden="true" />
          {shadow ? 'Back to the light' : 'See the shadow'}
        </button>
        <nav aria-label="Neighbouring plates">
          {prev && <a href={`#plate-${prev.id}`}>← {prev.name}</a>}
          {next ? <a href={`#plate-${next.id}`}>{next.name} →</a> : <a href="#encounters">Encounters →</a>}
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
          <span className="plate__mirror" aria-hidden="true">
            {a.name}
          </span>
          <motion.p className="plate__verb" variants={fade(0.35)} aria-live="polite">
            {shadow ? (
              <>
                <span className="mono">In shadow</span> {a.shadow}
              </>
            ) : (
              <>
                To <em>{a.verb}</em> reality.
              </>
            )}
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
            <div className="plate__shadow-fact">
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
          <Instrument kind={a.id} fg={fg} bg={c} label={`The ${a.name.toLowerCase()}’s instrument. ${a.play}`} />
          <p className="plate__play mono">
            <span>Instrument {a.no}</span>
            {a.play}
          </p>
        </motion.div>
      </div>
    </motion.article>
  )
}

// A band of the ten colours that rides along the top while you walk the plates.
function Spectrum() {
  const [on, setOn] = useState(0)
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setOn(ARCHETYPES.findIndex((a) => `plate-${a.id}` === e.target.id))
        }),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    ARCHETYPES.forEach((a) => {
      const el = document.getElementById(`plate-${a.id}`)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])
  return (
    <nav className="spectrum" aria-label="The ten plates">
      {ARCHETYPES.map((a, i) => (
        <a key={a.id} href={`#plate-${a.id}`} className={i === on ? 'is-on' : ''} style={{ background: a.color, color: a.fg }} aria-current={i === on ? 'true' : undefined}>
          <span className="mono">
            {a.no} {a.name}
          </span>
        </a>
      ))}
    </nav>
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
      <div className="ten__plates">
        <Spectrum />
        {ARCHETYPES.map((a, i) => (
          <Plate key={a.id} a={a} i={i} />
        ))}
      </div>
    </section>
  )
}
