import { motion } from 'framer-motion'
import { DOSSIERS } from '../lib/dossiers.js'

const show = (d) => ({ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, delay: d, ease: [0.2, 0.8, 0.2, 1] } } })

// The file behind each plate: an essay, a figure from myth, a lineage, and the archetype's habits and words.
export default function Dossier({ a }) {
  const d = DOSSIERS[a.id]
  if (!d) return null
  return (
    <motion.section className="dossier" aria-label={`The ${a.name.toLowerCase()}’s dossier`} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      <motion.header className="dossier__head mono" variants={show(0)}>
        <span>Dossier {a.no}</span>
        <span>{a.name}</span>
        <span>
          {d.lineage[0][1]} – {d.lineage.at(-1)[1]}
        </span>
      </motion.header>

      <div className="dossier__grid">
        <motion.div className="dossier__essay" variants={show(0.1)}>
          <p>{d.essay}</p>
          <p className="dossier__figure">
            <span className="mono">In myth</span>
            {d.figure}
          </p>
        </motion.div>

        <motion.div className="dossier__col" variants={show(0.2)}>
          <h4 className="mono">Lineage</h4>
          <ol className="dossier__line">
            {d.lineage.map(([year, label, text]) => (
              <li key={year}>
                <span className="mono">{label}</span>
                {text}
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div className="dossier__col" variants={show(0.3)}>
          <h4 className="mono">Lexicon</h4>
          <dl className="dossier__lex">
            {d.lexicon.map(([w, def]) => (
              <div key={w}>
                <dt>{w}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
          <h4 className="mono">Practice</h4>
          <ul className="dossier__list">
            {d.practice.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="dossier__col" variants={show(0.4)}>
          <h4 className="mono">Signs you are one</h4>
          <ul className="dossier__list dossier__signs">
            {d.signs.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h4 className="mono">Begin with</h4>
          <ul className="dossier__works">
            {d.works.map(([t, by]) => (
              <li key={t}>
                <cite>{t}</cite>
                <span className="mono">{by}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.section>
  )
}
