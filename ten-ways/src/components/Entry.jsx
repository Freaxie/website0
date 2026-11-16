import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'framer-motion'
import { ENTRIES } from '../lib/encyclopedia.js'
import { ARCHETYPES, LINKS, ORDERS, byId } from '../lib/archetypes.js'
import { toneVars } from '../lib/tones.js'
import Painting from './Painting.jsx'
import Glyph from './Glyph.jsx'

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

export const slug = (t) => t.toLowerCase().replace(/[^a-z]+/g, '-')

function Head({ n, id, children }) {
  return (
    <h5 className="entry__h" id={`s-${id}-${slug(children)}`} data-sec={children}>
      <span className="entry__hn mono">§{n}</span>
      <span className="entry__ht">{children}</span>
    </h5>
  )
}

// The entry's own contents: it rides along the top of the page while the entry is being read, and
// marks the section under the eye.
function Contents({ a }) {
  const ref = useRef(null)
  const [secs, setSecs] = useState([])
  const [on, setOn] = useState(null)
  useEffect(() => {
    const heads = [...ref.current.closest('.entry').querySelectorAll('.entry__h')]
    setSecs(heads.map((h) => ({ id: h.id, name: h.dataset.sec })))
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setOn(e.target.id)), { rootMargin: '-15% 0px -70% 0px' })
    heads.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [])
  return (
    <nav className="entry__toc" ref={ref} aria-label={`Sections of the ${a.name.toLowerCase()}’s entry`}>
      <b>{a.name}</b>
      <ol>
        {secs.map((x, i) => (
          <li key={x.id}>
            <a href={`#${x.id}`} className={x.id === on ? 'is-on' : ''} aria-current={x.id === on ? 'true' : undefined}>
              <span className="mono">§{i + 1}</span>
              {x.name}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// A rule with the archetype's sign at its centre.
function Ornament({ a }) {
  return (
    <div className="entry__orn" aria-hidden="true">
      <i />
      <Glyph d={a.glyph} width={4} />
      <i />
    </div>
  )
}

// The encyclopedia entry under each plate, set as a page of its own: a paper faintly of the
// archetype's hue, a headword, a reading column of numbered sections, and a margin that opens with a
// painting of its myth.
// The twenty-four entries are most of the page. They are mounted a few at a time after the first
// paint, so the entrance opens at once; any jump to an anchor mounts the rest first, so it lands true.
const waiting = new Set()
let started = false
export function flushAll() {
  if (!waiting.size) return
  const all = [...waiting]
  waiting.clear()
  flushSync(() => all.forEach((go) => go()))
}
function pump() {
  const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 60))
  idle(
    () => {
      const next = [...waiting].slice(0, 2)
      next.forEach((go) => {
        waiting.delete(go)
        go()
      })
      if (waiting.size) pump()
    },
    { timeout: 400 },
  )
}
function start() {
  if (started) return
  started = true
  addEventListener('click', (e) => e.target.closest?.('a[href^="#"]') && flushAll(), true)
  addEventListener('hashchange', flushAll)
  addEventListener('keydown', (e) => (e.key === 'End' || ((e.metaKey || e.ctrlKey) && e.key === 'f')) && flushAll(), true)
  // arriving with an anchor: mount everything, then go to it
  if (location.hash.length > 1)
    setTimeout(() => {
      flushAll()
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }))
    }, 0)
  setTimeout(pump, 900)
}

export default function Entry({ a }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    waiting.add(go)
    start()
    return () => waiting.delete(go)
  }, [])
  if (!ready) return <section className="entry entry--wait" style={toneVars(a)} aria-hidden="true" />
  return <EntryPage a={a} />
}

function EntryPage({ a }) {
  const e = ENTRIES[a.id]
  if (!e) return null
  const order = ORDERS.find((o) => o.id === a.order)
  const next = ARCHETYPES[ARCHETYPES.indexOf(a) + 1]
  const related = Object.entries(LINKS).flatMap(([kind, list]) =>
    list.filter(([p, q]) => p === a.id || q === a.id).map(([p, q, why]) => ({ kind, other: byId[p === a.id ? q : p], why })),
  )
  const prose = (paras, lead) =>
    paras.map((p, i) => (
      <p key={i} className={lead && i === 0 ? 'entry__lead' : undefined}>
        {p}
      </p>
    ))
  let n = 0
  return (
    <section className="entry" style={toneVars(a)} aria-label={`Encyclopedia entry: ${a.name}`}>
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
        <dl className="entry__defs">
          <div className="entry__etym">
            <dt className="mono">Etymology</dt>
            <dd>{e.etym}</dd>
          </div>
          <div className="entry__def">
            <dt className="mono">Definition</dt>
            <dd>{e.def}</dd>
          </div>
        </dl>
        <Ornament a={a} />
      </Block>

      <Contents a={a} />
      <div className="entry__body">
        <div className="entry__main">
          <Block className="entry__sec">
            <Head n={++n} id={a.id}>Overview</Head>
            {prose(e.overview, true)}
          </Block>
          <Block className="entry__sec">
            <Head n={++n} id={a.id}>History</Head>
            {prose(e.history)}
          </Block>
          {e.scene && (
            <Block className="entry__sec entry__scene">
              <Head n={++n} id={a.id}>A scene</Head>
              <p className="entry__place mono">{e.scene.place}</p>
              <h6 className="entry__stitle">{e.scene.title}</h6>
              {prose(e.scene.text, true)}
            </Block>
          )}
          <Block className="entry__sec">
            <Head n={++n} id={a.id}>Distinctions</Head>
            <dl className="entry__dist">
              {e.distinctions.map(([t, x]) => (
                <div key={t}>
                  <dt>{t}</dt>
                  <dd>{x}</dd>
                </div>
              ))}
            </dl>
          </Block>
          {e.myths && (
            <Block className="entry__sec">
              <Head n={++n} id={a.id}>Myths and facts</Head>
              <ul className="entry__myths">
                {e.myths.map(([myth, fact]) => (
                  <li key={myth}>
                    <p className="entry__myth-q">
                      <span className="mono">Myth</span>
                      <s>{myth}</s>
                    </p>
                    <p className="entry__myth-a">
                      <span className="mono">In fact</span>
                      {fact}
                    </p>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {e.curiosities && (
            <Block className="entry__sec">
              <Head n={++n} id={a.id}>Curiosities</Head>
              <ol className="entry__cur">
                {e.curiosities.map((c, i) => (
                  <li key={i}>
                    <span className="entry__num">{String(i + 1).padStart(2, '0')}</span>
                    <p>{c}</p>
                  </li>
                ))}
              </ol>
            </Block>
          )}
          {e.day && (
            <Block className="entry__sec entry__day">
              <Head n={++n} id={a.id}>A day in the life</Head>
              <ol className="entry__hours">
                {e.day.map(([time, text]) => (
                  <li key={time}>
                    <time className="mono">{time}</time>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </Block>
          )}
          <Block className="entry__sec">
            <Head n={++n} id={a.id}>Criticism</Head>
            <p>{e.critique}</p>
          </Block>
          <Block className="entry__sec">
            <Head n={++n} id={a.id}>Now</Head>
            <p>{e.now}</p>
          </Block>
        </div>

        <aside className="entry__side">
          <Block className="entry__box entry__myth" d={0.05}>
            <h5 className="entry__label mono">In myth</h5>
            <Painting a={a} />
            <p className="entry__myth-line">{e.figure}</p>
          </Block>

          {e.field && (
            <Block className="entry__box entry__field" d={0.08}>
              <h5 className="entry__label mono">Field guide · how to spot one</h5>
              <p className="entry__latin">
                {a.name} <i>vulgaris</i>
              </p>
              <dl>
                {e.field.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Block>
          )}

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__label mono">Lineage · {e.lineage.length} moments</h5>
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
            <h5 className="entry__label mono">Figures</h5>
            <ul className="entry__figs">
              {e.figures.map(([nm, dates, line]) => (
                <li key={nm}>
                  <b>{nm}</b>
                  <span className="mono">{dates}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__label mono">Terms</h5>
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
              <h5 className="entry__label mono">Practice</h5>
              <ul className="entry__dash">
                {e.practice.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="entry__label mono">Signs you are one</h5>
              <ul className="entry__dash entry__signs">
                {e.signs.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Block>

          <Block className="entry__box" d={0.1}>
            <h5 className="entry__label mono">Further reading</h5>
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
              <h5 className="entry__label mono">See also</h5>
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

      <Block className="entry__end" as="footer">
        <Ornament a={a} />
        <nav className="entry__onward" aria-label="Onward">
          <a href={`#letter-${a.id}`}>
            <span className="mono">In the Letters room</span>
            <em>A letter to a young {a.name.toLowerCase()}</em>
          </a>
          {next ? (
            <a href={`#plate-${next.id}`}>
              <span className="mono">Plate {next.no}</span>
              <em>{next.name} →</em>
            </a>
          ) : (
            <a href="#encounters">
              <span className="mono">Room 04</span>
              <em>One world, twenty-four encounters →</em>
            </a>
          )}
        </nav>
      </Block>
    </section>
  )
}
