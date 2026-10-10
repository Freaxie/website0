import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import Glyph from '../components/Glyph.jsx'
import { ARCHETYPES, LINKS, ORDERS, byId, mark, onDark } from '../lib/archetypes.js'
import { ORDER_READING, QUESTIONS, REACT, RESULTS } from '../lib/quiz.js'
import { bus } from '../lib/bus.js'
import { TAU } from '../lib/geom.js'

const BUDGET = 30
const MAX = 5
const ING = { understand: 'understanding', build: 'building', overcome: 'overcoming', create: 'creating', question: 'questioning', discover: 'discovering', transcend: 'transcending', shape: 'shaping', experience: 'experiencing', disrupt: 'disrupting', frame: 'framing', tune: 'tuning', seize: 'seizing', optimise: 'optimising', polish: 'polishing', revere: 'revering', tend: 'tending', tell: 'telling', solve: 'solving', remember: 'remembering', heal: 'healing', teach: 'teaching', love: 'loving', refuse: 'refusing' }

function list(words) {
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
}

// Hidden: two archetypes that rarely share a life, held equally and above the rest, fuse.
const FUSIONS = {
  'monk+warrior': 'The Warrior-Monk',
  'philosopher+sovereign': 'The Philosopher-King',
  'artist+scientist': 'The Renaissance Mind',
  'engineer+trickster': 'The Hacker',
  'explorer+monk': 'The Pilgrim',
  'scientist+theologian': 'The Priest-Physicist',
  'gardener+scientist': 'The Naturalist Friar',
  'musician+scientist': 'The Pythagorean',
  'storyteller+warrior': 'The Bard',
  'cinephile+entrepreneur': 'The Mogul',
  'healer+philosopher': 'The Physician-Philosopher',
  'lover+theologian': 'The Mystic',
  'rebel+teacher': 'The Liberator',
}

// Eases a list of numbers toward their targets. (Animating the polygon's points attribute directly
// tweens it as a string, which produces malformed points mid-flight.)
function useEased(target) {
  const [shown, setShown] = useState(target)
  const cur = useRef(target)
  const key = target.join(',')
  useEffect(() => {
    let raf = 0
    const tick = () => {
      let moving = false
      cur.current = cur.current.map((v, i) => {
        const d = target[i] - v
        if (Math.abs(d) > 0.01) moving = true
        return Math.abs(d) > 0.01 ? v + d * 0.18 : target[i]
      })
      setShown(cur.current)
      if (moving) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key])
  return shown
}

const empty = () => Object.fromEntries(ARCHETYPES.map((a) => [a.id, 0]))
// each answer gives two points to its archetype and one to a second where it has one; the chart shows
// at most five per archetype, but the reading ranks by the full score so ties are rarer
const rawFrom = (answers) => {
  const p = empty()
  answers.forEach((k, q) => {
    const [, id, also] = QUESTIONS[q].a[k]
    p[id] += 2
    if (also) p[also] += 1
  })
  return p
}
const cap = (raw) => Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, Math.min(MAX, v)]))

// The reading: what the shape says, at length.
function Reading({ raw, ranked, fusion, onHand, onAgain, quiz }) {
  const top = ranked.slice(0, 3)
  const lead = top[0]
  const r = RESULTS[lead.id]
  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1
  const orders = ORDERS.map((o) => ({ ...o, v: o.ids.reduce((s, id) => s + raw[id], 0) })).sort((a, b) => b.v - a.v)
  const main = orders[0]
  const allies = LINKS.allies.filter(([p, q]) => p === lead.id || q === lead.id).map(([p, q, why]) => ({ other: byId[p === lead.id ? q : p], why }))
  const opposite = LINKS.opposites.find(([p, q]) => p === lead.id || q === lead.id)
  const opp = opposite && { other: byId[opposite[0] === lead.id ? opposite[1] : opposite[0]], why: opposite[2] }
  // the way hardly used: the lowest score in the order furthest from your own
  const far = orders.at(-1)
  const named = new Set([...top, ...allies.map((x) => x.other), opp?.other].filter(Boolean).map((x) => x.id))
  const pool = far.ids.filter((id) => !named.has(id))
  const unused = (pool.length ? pool : far.ids).map((id) => byId[id]).sort((a, b) => raw[a.id] - raw[b.id])[0]
  const others = top.slice(1).map((a) => `the ${a.name.toLowerCase()}`)
  return (
    <motion.section className="reading" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} aria-label="Your reading">
      <header className="reading__head">
        <span className="mono">{quiz ? 'Your reading · sixteen answers' : 'Your reading · by hand'}</span>
        <h3 className="reading__title">{fusion ? fusion.name : r.epithet}</h3>
        <p className="reading__sub">
          {fusion
            ? `${fusion.line} Your two strongest ways are tied, and they belong together.`
            : `Mostly the ${lead.name.toLowerCase()}${others.length ? `, with ${others.join(' and ')} close behind` : ''}.`}
        </p>
      </header>

      <ol className="reading__three">
        {top.map((a, i) => {
          const x = RESULTS[a.id]
          return (
            <motion.li key={a.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 + i * 0.15 }} style={{ '--c': onDark(a) }}>
              <div className="reading__rank">
                <span className="mono">{['First', 'Second', 'Third'][i]} · {raw[a.id]} pts</span>
                <span className="reading__sign" style={{ background: a.color, color: a.fg }}>
                  <Glyph d={a.glyph} width={6} />
                </span>
              </div>
              <h4>
                {a.name}
                <em>{x.epithet}</em>
              </h4>
              <p>{x.blurb}</p>
              <dl>
                <div>
                  <dt className="mono">Superpower</dt>
                  <dd>{x.power}</dd>
                </div>
                <div>
                  <dt className="mono">Blind spot</dt>
                  <dd>{x.blind}</dd>
                </div>
                <div>
                  <dt className="mono">At a party</dt>
                  <dd>{x.party}</dd>
                </div>
                <div>
                  <dt className="mono">Try this</dt>
                  <dd>{x.try}</dd>
                </div>
              </dl>
              <a className="reading__go mono" href={`#plate-${a.id}`}>
                Read the {a.name.toLowerCase()}’s entry →
              </a>
            </motion.li>
          )
        })}
      </ol>

      <div className="reading__more">
        <div>
          <h5 className="mono">Your orders</h5>
          <ul className="reading__bars">
            {orders.map((o) => (
              <li key={o.id}>
                <span>{o.name}</span>
                <i>
                  <motion.b initial={{ width: 0 }} animate={{ width: `${(o.v / total) * 100}%` }} transition={{ duration: 1, delay: 0.4 }} />
                </i>
                <span className="mono">{Math.round((o.v / total) * 100)}%</span>
              </li>
            ))}
          </ul>
          <p>{ORDER_READING[main.id]}</p>
        </div>
        <div>
          <h5 className="mono">Good company</h5>
          {allies.length ? (
            allies.slice(0, 3).map(({ other, why }) => (
              <p key={other.id}>
                <b>{other.name}.</b> {why}
              </p>
            ))
          ) : (
            <p>Nobody in particular, which may be the point.</p>
          )}
          {opp && (
            <>
              <h5 className="mono">Your opposite</h5>
              <p>
                <b>{opp.other.name}.</b> {opp.why} Opposites are where growth hides: borrow one of its habits for a week.
              </p>
            </>
          )}
        </div>
        <div>
          <h5 className="mono">The way you hardly use</h5>
          <p>
            <b>The {unused.name.toLowerCase()}</b>, from the order of {far.name.replace('The ', '')}, which attends to {far.object}. Its question, “{unused.question}”, may be the one you most need to ask.
          </p>
          <p className="reading__try">Try: {RESULTS[unused.id].try}</p>
          <h5 className="mono">In shadow</h5>
          <p>
            Every way has its shadow. Yours, the {lead.name.toLowerCase()}’s, is this: {lead.shadow.charAt(0).toLowerCase() + lead.shadow.slice(1)}
          </p>
        </div>
      </div>

      <div className="reading__btns">
        <button type="button" className="mono" onClick={onHand}>
          Adjust by hand
        </button>
        <button type="button" className="mono" onClick={onAgain}>
          {quiz ? 'Take the test again' : 'Clear and start again'}
        </button>
      </div>
    </motion.section>
  )
}

export default function Constellation() {
  const [mode, setMode] = useState('quiz')
  const [answers, setAnswers] = useState([])
  const [hand, setHand] = useState(empty)
  const raw = mode === 'quiz' ? rawFrom(answers) : hand
  const pts = mode === 'quiz' ? cap(raw) : hand
  const spent = Object.values(pts).reduce((s, v) => s + v, 0)
  const left = BUDGET - spent
  const set = (id, v) => setHand((p) => {
    const room = BUDGET - (spent - p[id])
    return { ...p, [id]: Math.max(0, Math.min(MAX, v, room)) }
  })
  const done = mode === 'quiz' ? answers.length === QUESTIONS.length : spent >= 12
  const q = QUESTIONS[answers.length]
  const lastPick = answers.length ? QUESTIONS[answers.length - 1].a[answers.at(-1)] : null
  const reaction = lastPick && REACT[lastPick[1]][answers.length % 2]

  const ranked = ARCHETYPES.filter((a) => raw[a.id] > 0).sort((a, b) => raw[b.id] - raw[a.id] || ARCHETYPES.indexOf(a) - ARCHETYPES.indexOf(b))
  const top = ranked.slice(0, 3)
  let title = 'Unwritten'
  let text = mode === 'quiz' ? `Sixteen small scenes. Answer honestly, not admirably, and your shape draws itself as you go.` : `You have ${BUDGET} points. Give them to the ways you actually meet the world, not the ones you admire.`
  if (ranked.length) {
    title = top.map((a) => a.name).join(' · ')
    text = `You meet reality chiefly by ${list(top.map((a) => `${ING[a.verb]} it`))}.`
    if (raw[ranked[0].id] / Math.max(1, Object.values(raw).reduce((s, v) => s + v, 0)) > 0.3 && spent >= 6) text += ` Mostly the ${ranked[0].name.toLowerCase()}: a specialist of one way.`
    else if (ranked.length >= 10) text += ' Spread across many of the twenty-four: a generalist of ways.'
    if (left > 0 && mode === 'hand') text += ` ${left} point${left === 1 ? '' : 's'} still to give.`
  }

  // a fusion needs its two halves tied at the top, with at least three points each
  let fusion = null
  if (ranked.length >= 2 && raw[ranked[0].id] === raw[ranked[1].id] && raw[ranked[0].id] >= 3 && (ranked.length === 2 || raw[ranked[2].id] < raw[ranked[0].id])) {
    const key = [ranked[0].id, ranked[1].id].sort().join('+')
    if (FUSIONS[key]) {
      const link = LINKS.unions.find(([p, q2]) => [p, q2].sort().join('+') === key)
      fusion = { name: FUSIONS[key], line: link ? link[2] : '', a: byId[key.split('+')[0]], b: byId[key.split('+')[1]] }
    }
  }
  useEffect(() => {
    if (fusion) bus.whisper(`fusion-${fusion.name}`, `A fusion: ${fusion.name}.`, fusion.a.color)
  }, [fusion?.name])

  const C = 170
  const vert = (i, v) => {
    const ang = (i / ARCHETYPES.length) * TAU - Math.PI / 2
    const r = (v / MAX) * C
    return [Math.cos(ang) * r, Math.sin(ang) * r]
  }
  const eased = useEased(ARCHETYPES.map((a) => pts[a.id]))
  const poly = ARCHETYPES.map((a, i) => vert(i, eased[i]).join(',')).join(' ')
  const toHand = () => {
    if (mode === 'quiz' && answers.length) setHand(cap(rawFrom(answers)))
    setMode('hand')
  }

  return (
    <section id="yours" className="con">
      <div className="con__top">
        <SectionHead no="07" title="Your Constellation" kicker="Everyone uses more than one. Take the test, sixteen small scenes from ordinary life, or spend thirty points by hand, and see the shape of how you meet the world." />
        <div className="con__verdict" aria-live="polite">
          <span className="mono">
            {mode === 'quiz' ? `${answers.length} of ${QUESTIONS.length} answered` : `${spent} of ${BUDGET} points given`}
          </span>
          <b>{fusion ? fusion.name : title}</b>
          <p>{fusion ? fusion.line : text}</p>
          {fusion && (
            <motion.svg className="con__fusion" viewBox="-60 -60 120 120" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }} aria-hidden="true">
              <motion.g animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
                <path d={fusion.a.glyph} transform="translate(-50 -50)" stroke={fusion.a.color} strokeWidth="5" fill="none" strokeLinecap="round" />
              </motion.g>
              <motion.g animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
                <path d={fusion.b.glyph} transform="translate(-50 -50)" stroke={fusion.b.color} strokeWidth="5" fill="none" strokeLinecap="round" />
              </motion.g>
            </motion.svg>
          )}
        </div>
      </div>

      <div className="con__body">
        <div className="con__left">
          <div className="con__modes" role="tablist" aria-label="How to draw your constellation">
            <button type="button" role="tab" aria-selected={mode === 'quiz'} className={mode === 'quiz' ? 'is-on' : ''} onClick={() => setMode('quiz')}>
              The test
            </button>
            <button type="button" role="tab" aria-selected={mode === 'hand'} className={mode === 'hand' ? 'is-on' : ''} onClick={toHand}>
              Set points by hand
            </button>
          </div>

          {mode === 'quiz' ? (
            <div className="con__quiz">
              <div className="con__steps" aria-hidden="true">
                {QUESTIONS.map((_, i) => (
                  <i key={i} style={{ background: answers[i] !== undefined ? mark(byId[QUESTIONS[i].a[answers[i]][1]]) : undefined }} className={i === answers.length ? 'is-now' : ''} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                {q ? (
                  <motion.div key={answers.length} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}>
                    {reaction && <p className="con__react">{reaction}</p>}
                    <span className="mono">
                      Question {answers.length + 1} of {QUESTIONS.length} · {q.tag}
                    </span>
                    <h3 className="con__q">{q.q}</h3>
                    <ul className="con__opts">
                      {q.a.map(([t, id], k) => (
                        <li key={t}>
                          <button type="button" style={{ '--c': mark(byId[id]), '--cf': byId[id].fg }} onClick={() => setAnswers((v) => [...v, k])}>
                            <span className="con__letter mono">{'ABCDEF'[k]}</span>
                            {t}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {answers.length > 0 && (
                      <button type="button" className="con__back mono" onClick={() => setAnswers((v) => v.slice(0, -1))}>
                        ← Previous question
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="done" className="con__done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {reaction && <p className="con__react">{reaction}</p>}
                    <span className="mono">All sixteen answered</span>
                    <h3 className="con__q">Your shape is drawn. Your reading is below.</h3>
                    <p>Every archetype was the answer to exactly four questions, so the shape is yours, not the test’s.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <ul className="con__rows">
              {ARCHETYPES.map((a) => (
                <li key={a.id} className="con__row">
                  <span className="con__sign" style={{ background: a.color, color: a.fg }}>
                    <Glyph d={a.glyph} width={7} />
                  </span>
                  <span className="con__name">
                    {a.name}
                    <em>{a.verb}</em>
                  </span>
                  <span className="con__pips" role="group" aria-label={`${a.name}: ${pts[a.id]} of ${MAX}`}>
                    {Array.from({ length: MAX }, (_, k) => (
                      <button
                        key={k}
                        type="button"
                        className={k < pts[a.id] ? 'is-on' : ''}
                        style={{ '--c': a.color }}
                        onClick={() => set(a.id, pts[a.id] === k + 1 ? k : k + 1)}
                        aria-label={`Give the ${a.name} ${k + 1}`}
                      />
                    ))}
                  </span>
                </li>
              ))}
              <li className="con__reset">
                <button type="button" className="mono" onClick={() => setHand(empty())}>
                  Clear
                </button>
              </li>
            </ul>
          )}
        </div>

        <div className="con__chart">
          <svg viewBox="-300 -270 600 540" role="img" aria-label={`Your constellation: ${ranked.map((a) => `${a.name} ${pts[a.id]}`).join(', ') || 'empty'}`}>
            {[1, 2, 3, 4, 5].map((k) => (
              <polygon key={k} points={ARCHETYPES.map((_, i) => vert(i, k).join(',')).join(' ')} className="con__web" />
            ))}
            {ARCHETYPES.map((a, i) => {
              const [x, y] = vert(i, MAX)
              const [lx, ly] = vert(i, MAX + 1.15)
              return (
                <g key={a.id}>
                  <line x1="0" y1="0" x2={x} y2={y} className="con__spoke" />
                  <circle cx={lx} cy={ly} r="7" fill={mark(a)} />
                  <text x={lx + (Math.abs(lx) < 20 ? 0 : Math.sign(lx) * 13)} y={ly + (Math.abs(lx) < 20 ? (ly > 0 ? 24 : -14) : 5)} textAnchor={Math.abs(lx) < 20 ? 'middle' : lx > 0 ? 'start' : 'end'} className="con__label">
                    {a.name}
                  </text>
                </g>
              )
            })}
            <polygon points={poly} className="con__shape" />
            {ARCHETYPES.map((a, i) => {
              const [x, y] = vert(i, eased[i])
              return pts[a.id] ? <circle key={a.id} cx={x} cy={y} r="6" fill={mark(a)} className="con__dot" /> : null
            })}
          </svg>
        </div>
      </div>

      {done && ranked.length > 0 && (
        <Reading
          raw={raw}
          ranked={ranked}
          fusion={fusion}
          quiz={mode === 'quiz'}
          onHand={toHand}
          onAgain={() => (mode === 'quiz' ? setAnswers([]) : setHand(empty()))}
        />
      )}
    </section>
  )
}
