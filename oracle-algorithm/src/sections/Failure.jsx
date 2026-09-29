import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { rng } from '../lib/geom.js'

// ── the oracle's failure: a pattern where there is none ─────────────────────────────

const NAMES = ['The Weaver', 'The Broken Key', 'The Sleeping Hound', 'The Second Door', 'The Ladder Without Rungs', 'The Drowned Crown', 'The Two Rivers', 'The Hand That Waits', 'The Lamp Turned Down', 'The Open Gate', 'The Serpent’s Knot', 'The Unlit Tower']
const OMENS = ['Something returns by another road.', 'A choice made long ago comes due.', 'What is lost is only moved.', 'Patience is being asked of you.', 'The small thing is the large thing.', 'A door closes so that you will turn around.']

function sky(seed) {
  const r = rng(seed)
  // uniform and independent: no structure at all
  return Array.from({ length: 70 }, () => ({ x: 3 + r() * 94, y: 3 + r() * 69, m: r() }))
}

// The brightest stars, joined by a minimum spanning tree: the shortest set of lines that connects them.
function constellation(stars) {
  const pick = stars
    .map((s, i) => ({ ...s, i }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 8)
  const inT = [pick[0]]
  const rest = pick.slice(1)
  const edges = []
  while (rest.length) {
    let best = null
    for (const a of inT)
      for (const b of rest) {
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (!best || d < best.d) best = { a, b, d }
      }
    edges.push(best)
    inT.push(best.b)
    rest.splice(rest.indexOf(best.b), 1)
  }
  return { pick, edges }
}

function Apophenia() {
  const [seed, setSeed] = useState(3)
  const [read, setRead] = useState(false)
  const [count, setCount] = useState(0)
  const stars = useMemo(() => sky(seed), [seed])
  const fig = useMemo(() => constellation(stars), [stars])
  const r = rng(seed * 7 + 1)
  const name = NAMES[Math.floor(r() * NAMES.length)]
  const omen = OMENS[Math.floor(r() * OMENS.length)]

  return (
    <div className="fm__panel fm__panel--o">
      <header>
        <span className="mono">Oracle · failure mode</span>
        <h3>Pattern where there is none</h3>
      </header>
      <div className="fm__sky">
        <svg viewBox="0 0 100 75" aria-label={read ? `A random sky, read as the constellation ${name}` : 'A random sky of seventy stars'} role="img">
          {stars.map((s, i) => (
            <circle key={`${seed}-${i}`} cx={s.x} cy={s.y} r={0.35 + s.m * 0.75} className="fm__star" />
          ))}
          {read &&
            fig.edges.map((e, i) => (
              <motion.line
                key={`${seed}-${i}`}
                x1={e.a.x}
                y1={e.a.y}
                x2={e.b.x}
                y2={e.b.y}
                className="fm__edge"
                vectorEffect="non-scaling-stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.2 }}
              />
            ))}
        </svg>
        <AnimatePresence>
          {read && (
            <motion.div className="fm__name" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 1.6, duration: 0.8 }}>
              <b>{name}</b>
              <span>{omen}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="fm__controls">
        {!read ? (
          <button
            type="button"
            className="mono"
            onClick={() => {
              setRead(true)
              setCount((c) => c + 1)
            }}
          >
            Read the sky
          </button>
        ) : (
          <button
            type="button"
            className="mono"
            onClick={() => {
              setRead(false)
              setSeed((s) => s + 1)
            }}
          >
            New random sky
          </button>
        )}
        <span className="mono">
          Skies read: {count} · figures found: {count}
        </span>
      </div>
      <p className="fm__text">
        These stars are scattered at random: every position independent of every other. The oracle finds a figure in every sky, because there is always one to find. Clumps and lines are what randomness looks like. The psychiatrist Klaus Conrad called the urge to see meaning in unrelated things <em>apophenia</em> (1958).
      </p>
    </div>
  )
}

// ── the algorithm's failure: a prediction without understanding ─────────────────────

const END = 730
function Chicken() {
  const [day, setDay] = useState(0)
  const [run, setRun] = useState(false)
  useEffect(() => {
    if (!run) return
    const id = setInterval(() => setDay((d) => (d >= END ? d : Math.min(END, d + 6))), 30)
    return () => clearInterval(id)
  }, [run])
  useEffect(() => {
    if (day >= END) setRun(false)
  }, [day])

  const fed = Math.min(day, END - 1)
  // Laplace's rule of succession: after n successes in n trials, expect the next with probability (n+1)/(n+2)
  const conf = (fed + 1) / (fed + 2)
  const done = day >= END
  const W = 600
  const H = 220
  const xOf = (d) => (d / END) * W
  const yOf = (c) => H - ((c - 0.5) / 0.5) * (H - 10)
  const pts = []
  for (let d = 0; d <= fed; d += Math.max(1, Math.floor(fed / 160))) pts.push(`${xOf(d).toFixed(1)},${yOf((d + 1) / (d + 2)).toFixed(1)}`)
  pts.push(`${xOf(fed).toFixed(1)},${yOf(conf).toFixed(1)}`)

  return (
    <div className="fm__panel fm__panel--a">
      <header>
        <span className="mono">Algorithm · failure mode</span>
        <h3>Prediction without understanding</h3>
      </header>
      <div className="fm__chart">
        <div className="fm__readout">
          <span className="mono">Day {Math.min(day, END).toLocaleString('en-US')}</span>
          <b className={done ? 'is-wrong' : ''}>{done ? 'No.' : conf.toFixed(4)}</b>
          <span className="mono">{done ? 'The farmer came with an axe' : 'P(fed tomorrow)'}</span>
        </div>
        <svg viewBox={`0 -12 ${W} ${H + 36}`} role="img" aria-label="The model's confidence that it will be fed tomorrow, rising day after day">
          {[0.5, 0.75, 1].map((c) => (
            <g key={c}>
              <line x1="0" x2={W} y1={yOf(c)} y2={yOf(c)} className="fm__rule" />
              <text x={W} y={yOf(c) - 4} textAnchor="end" className="fm__tick">
                {c.toFixed(2)}
              </text>
            </g>
          ))}
          <polyline points={pts.join(' ')} className="fm__conf" />
          {done && (
            <>
              <line x1={xOf(END)} x2={xOf(END)} y1={yOf(1) - 8} y2={H + 8} className="fm__break" />
              <text x={xOf(END)} y={H + 22} textAnchor="end" className="fm__tick fm__tick--x">
                day {END}
              </text>
            </>
          )}
          <text x="0" y={H + 22} className="fm__tick">
            day 0
          </text>
        </svg>
      </div>
      <div className="fm__controls">
        <button type="button" className="mono" onClick={() => setDay((d) => Math.min(END, d + 1))} disabled={done}>
          Next day
        </button>
        <button type="button" className="mono" onClick={() => setRun(true)} disabled={done || run}>
          Run
        </button>
        <button
          type="button"
          className="mono"
          onClick={() => {
            setRun(false)
            setDay(0)
          }}
        >
          Reset
        </button>
      </div>
      <p className="fm__text">
        A model fed every morning, updating on every morning, grows more certain every day. Its arithmetic is correct and its confidence is honest, and it has no idea why the food comes.
        <span className="fm__quote">
          “The man who has fed the chicken every day throughout its life at last wrings its neck instead.” Bertrand Russell, <em>The Problems of Philosophy</em>, 1912
        </span>
      </p>
    </div>
  )
}

export default function Failure() {
  return (
    <section id="failure" className="fm">
      <SectionHead no="06" title="Failure Modes" tone="bone" kicker="Each way of knowing fails in its own way. The oracle sees too much meaning; the algorithm sees none at all." />
      <div className="fm__grid">
        <Apophenia />
        <Chicken />
      </div>
    </section>
  )
}
