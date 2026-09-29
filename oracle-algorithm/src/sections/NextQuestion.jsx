import { useEffect, useMemo, useState } from 'react'
import { animate, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { GLYPHS, glyphPath } from '../lib/glyphs.js'
import { hash, rng } from '../lib/geom.js'

const PRESETS = ['Will it rain tomorrow?', 'Should I take the job?', 'Will this city still be here in a thousand years?', 'Is there life on other planets?', 'Will they come back?']
const STOP = new Set(['will', 'should', 'there', 'this', 'that', 'what', 'when', 'where', 'with', 'from', 'have', 'they', 'them', 'your', 'into', 'about', 'would', 'could', 'still'])
const POS = ['Root', 'Crossing', 'Outcome']

// Both answers come from the same place: a hash of the words you typed.
function consult(q) {
  const key = q.trim().toLowerCase().replace(/\s+/g, ' ')
  const r = rng(hash(key) || 1)
  const pick = []
  while (pick.length < 3) {
    const k = Math.floor(r() * GLYPHS.length)
    if (!pick.includes(k)) pick.push(k)
  }
  const oracle = pick.map((k, i) => ({ g: GLYPHS[k], text: GLYPHS[k][['root', 'cross', 'end'][i]] }))

  const p = 0.06 + r() * 0.88
  const n = Math.round(400 + r() * 24000)
  const words = [...new Set(key.replace(/[^a-z\s']/g, '').split(' ').filter((w) => w.length > 3 && !STOP.has(w)))].slice(0, 3)
  const features = [...words.map((w) => `“${w}”`), 'base rate', 'recency', 'season'].slice(0, 5).map((f) => ({ f, w: (r() - 0.5) * 0.6 }))
  const k = Math.min(400, 20 + n / 60)
  const half = 1.96 * Math.sqrt((p * (1 - p)) / k)
  return { oracle, p, n, lo: Math.max(0, p - half), hi: Math.min(1, p + half), a: p * k + 1, b: (1 - p) * k + 1, features }
}

function Curve({ a, b, lo, hi }) {
  const W = 400
  const H = 120
  const xs = Array.from({ length: 161 }, (_, i) => 0.001 + (i / 160) * 0.998)
  const lp = xs.map((x) => (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x))
  const mx = Math.max(...lp)
  const ys = lp.map((v) => Math.exp(v - mx))
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${(x * W).toFixed(1)} ${(H - ys[i] * (H - 6)).toFixed(1)}`).join('')
  return (
    <svg viewBox={`0 -4 ${W} ${H + 24}`} className="nq__curve" aria-hidden="true">
      <rect x={lo * W} y="0" width={(hi - lo) * W} height={H} className="nq__ci" />
      <motion.path d={`${d}L${W} ${H}L0 ${H}Z`} className="nq__area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
      <motion.path d={d} className="nq__line" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
      <line x1="0" x2={W} y1={H + 0.5} y2={H + 0.5} className="nq__axis" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text key={t} x={t * W} y={H + 16} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'} className="nq__tick">
          {t.toFixed(2)}
        </text>
      ))}
    </svg>
  )
}

export default function NextQuestion() {
  const [draft, setDraft] = useState(PRESETS[0])
  const [asked, setAsked] = useState({ q: PRESETS[0], n: 0 })
  const res = useMemo(() => consult(asked.q), [asked.q])
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const c = animate(0, res.p, { duration: 1.6, ease: [0.2, 0.8, 0.2, 1], onUpdate: setShown })
    return () => c.stop()
  }, [res, asked.n])

  const ask = (q) => {
    const text = (q ?? draft).trim()
    if (!text) return
    setDraft(text)
    setAsked((s) => ({ q: text, n: s.n + 1 }))
  }

  return (
    <section id="next" className="nq">
      <div className="nq__top">
        <SectionHead no="04" title="What Happens Next?" kicker="Ask one question. The oracle answers with signs, the algorithm with a number. Neither says yes or no." />
        <form
          className="nq__form"
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}
        >
          <label htmlFor="nq-q" className="mono">
            Your question
          </label>
          <div className="nq__field">
            <input id="nq-q" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={120} autoComplete="off" />
            <button type="submit" className="mono">
              Consult both
            </button>
          </div>
          <div className="nq__presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" className={`mono ${asked.q === p ? 'is-on' : ''}`} onClick={() => ask(p)}>
                {p}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="nq__stage" key={`${asked.q}-${asked.n}`}>
        <article className="nq__o" aria-live="polite">
          <header className="mono">
            <span>The oracle reads</span>
            <span>Three signs, drawn</span>
          </header>
          <div className="nq__signs">
            {res.oracle.map(({ g }, i) => (
              <div key={g.id} className="nq__sign">
                <svg viewBox="-10 -10 120 120" aria-hidden="true">
                  <motion.circle cx="50" cy="50" r="58" className="nq__halo" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 + i * 0.5 }} />
                  <motion.path d={glyphPath(g.prims)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4 + i * 0.5, ease: 'easeInOut' }} />
                </svg>
                <span className="mono">{POS[i]}</span>
                <b>{g.name}</b>
              </div>
            ))}
          </div>
          <div className="nq__reading">
            {res.oracle.map(({ text }, i) => (
              <motion.p key={i} initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.2, delay: 1.4 + i * 0.6 }}>
                {text}
              </motion.p>
            ))}
          </div>
          <footer className="mono">It asks: what does this mean?</footer>
        </article>

        <article className="nq__a" aria-live="polite">
          <header className="mono">
            <span>The algorithm predicts</span>
            <span>n = {res.n.toLocaleString('en-US')} comparable cases</span>
          </header>
          <div className="nq__p">
            <span className="mono">P(yes)</span>
            <b>{shown.toFixed(2)}</b>
            <span className="mono">
              95% interval {res.lo.toFixed(2)}–{res.hi.toFixed(2)}
            </span>
          </div>
          <Curve a={res.a} b={res.b} lo={res.lo} hi={res.hi} />
          <ul className="nq__feats">
            {res.features.map(({ f, w }, i) => (
              <li key={f}>
                <span className="mono">{f}</span>
                <i>
                  <motion.b
                    className={w < 0 ? 'is-neg' : ''}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.8 + i * 0.08 }}
                    style={{ width: `${Math.abs(w) * 83}%`, [w < 0 ? 'right' : 'left']: '50%' }}
                  />
                </i>
                <span className="mono">{(w >= 0 ? '+' : '−') + Math.abs(w).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <footer className="mono">It asks: how often does this happen?</footer>
        </article>
      </div>

      <p className="nq__note">
        <span className="mono">A confession</span>
        Both answers on this wall are generated from the letters of your question, by the same simple rule. The signs and the numbers are equally made up. What differs is only the form an answer takes, and what each form invites you to do with it.
      </p>
    </section>
  )
}
