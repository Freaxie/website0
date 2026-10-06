import { motion } from 'framer-motion'
import { ENTRIES } from '../lib/encyclopedia.js'
import { LINKS, ORDERS, byId } from '../lib/archetypes.js'

const rise = (d = 0) => ({ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, delay: d, ease: [0.2, 0.8, 0.2, 1] } } })
const KIND = { allies: 'Ally', opposites: 'Opposite', unions: 'Union' }

// Each block observes the viewport itself, so a long entry reveals as it is read rather than all at once.
function Block({ className, children, d = 0, as = 'section' }) {
  const M = motion[as]
  return (
    <M className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} variants={rise(d)}>
      {children}
    </M>
  )
}

// The encyclopedia entry under each plate: headword, etymology and definition; a reading column of
// numbered sections; and a margin of lineage, figures, terms, reading and cross-references.
export default function Entry({ a }) {
  const e = ENTRIES[a.id]
  if (!e) return null
  const order = ORDERS.find((o) => o.id === a.order)
  const related = Object.entries(LINKS).flatMap(([kind, list]) =>
    list.filter(([p, q]) => p === a.id || q === a.id).map(([p, q, why]) => ({ kind, other: byId[p === a.id ? q : p], why })),
  )
  const sections = [
    ['Overview', e.overview],
    ['History', e.history],
  ]
  return (
    <section className="entry" aria-label={`Encyclopedia entry: ${a.name}`}>
      <Block className="entry__head" as="header">
        <p className="entry__crumb mono">
          <span>Entry {a.no} of XXIV</span>
          <span>
            Order {order.no} · {order.name}
          </span>
          <span>Attends to {order.object}</span>
        </p>
        <h4 className="entry__word">
          {a.name.toLowerCase()}
          <span className="entry__pos">noun</span>
        </h4>
        <p className="entry__etym">
          <span className="mono">Etymology</span>
          {e.etym}
        </p>
        <p className="entry__def">{e.def}</p>
      </Block>

      <div className="entry__body">
        <div className="entry__main">
          {sections.map(([title, paras], k) => (
            <Block key={title} className="entry__sec">
              <h5 className="entry__h mono">
                <span>§{k + 1}</span>
                {title}
              </h5>
              {paras.map((p, i) => (
                <p key={i} className={k === 0 && i === 0 ? 'entry__lead' : undefined}>
                  {p}
                </p>
              ))}
            </Block>
          ))}
          <Block className="entry__sec">
            <h5 className="entry__h mono">
              <span>§3</span>Distinctions
            </h5>
            <dl className="entry__dist">
              {e.distinctions.map(([t, x]) => (
                <div key={t}>
                  <dt>{t}</dt>
                  <dd>{x}</dd>
                </div>
              ))}
            </dl>
          </Block>
          <Block className="entry__sec">
            <h5 className="entry__h mono">
              <span>§4</span>Criticism
            </h5>
            <p>{e.critique}</p>
          </Block>
          <Block className="entry__sec">
            <h5 className="entry__h mono">
              <span>§5</span>Now
            </h5>
            <p>{e.now}</p>
          </Block>
        </div>

        <aside className="entry__side">
          <Block className="entry__box entry__myth" d={0.05}>
            <h5 className="entry__h mono">In myth</h5>
            <p>{e.figure}</p>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__h mono">Lineage · {e.lineage.length} moments</h5>
            <ol className="entry__line">
              {e.lineage.map(([y, label, text]) => (
                <li key={y}>
                  <span className="mono">{label}</span>
                  {text}
                </li>
              ))}
            </ol>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__h mono">Figures</h5>
            <ul className="entry__figs">
              {e.figures.map(([n, dates, line]) => (
                <li key={n}>
                  <b>{n}</b>
                  <span className="mono">{dates}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__h mono">Terms</h5>
            <dl className="entry__lex">
              {e.lexicon.map(([w, d]) => (
                <div key={w}>
                  <dt>{w}</dt>
                  <dd>{d}</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block className="entry__box entry__pair" d={0.1}>
            <div>
              <h5 className="entry__h mono">Practice</h5>
              <ul className="entry__dash">
                {e.practice.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="entry__h mono">Signs you are one</h5>
              <ul className="entry__dash entry__signs">
                {e.signs.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__h mono">Further reading</h5>
            <ul className="entry__read">
              {e.reading.map(([t, by]) => (
                <li key={t}>
                  <cite>{t}</cite>
                  <span className="mono">{by}</span>
                </li>
              ))}
            </ul>
          </Block>

          {related.length > 0 && (
            <Block className="entry__box" d={0.1}>
              <h5 className="entry__h mono">See also</h5>
              <ul className="entry__see">
                {related.map(({ kind, other, why }) => (
                  <li key={kind + other.id}>
                    <a href={`#plate-${other.id}`}>
                      <i style={{ background: other.color }} />
                      <span className="mono">{KIND[kind]}</span>
                      <b>{other.name}</b>
                    </a>
                    <span>{why}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </aside>
      </div>
    </section>
  )
}
