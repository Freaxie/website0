import { useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { CHIPS } from '../lib/geom.js'

// A toy model with invented numbers, to show the shape of the argument, not to measure anything.
// Problem type 0 is the one the specialist trained for. In a kind world it is nearly always type 0.
const SPEC = (type) => (type === 0 ? 0.95 : 0.25)
const GEN = () => 0.7
const WINDOW = 160

export default function KindWicked() {
  const wrap = useRef(null)
  const [w, setW] = useState(0.15)
  const wRef = useRef(w)
  wRef.current = w
  const hist = useRef([])
  const acc = useRef(0)
  const [view, setView] = useState({ spec: 0, gen: 0, recent: [] })

  useLoop(wrap, (_t, dt) => {
    acc.current += dt
    let changed = false
    while (acc.current > 0.12) {
      acc.current -= 0.12
      const k = wRef.current
      const type = Math.random() < 1 - 0.85 * k ? 0 : 1 + Math.floor(Math.random() * 6)
      hist.current.push({ type, s: Math.random() < SPEC(type), g: Math.random() < GEN(type) })
      if (hist.current.length > WINDOW) hist.current.shift()
      changed = true
    }
    if (!changed) return
    const h = hist.current
    setView({
      spec: h.filter((x) => x.s).length / h.length,
      gen: h.filter((x) => x.g).length / h.length,
      recent: h.slice(-28),
    })
  })

  const pA = 1 - 0.85 * w
  const expSpec = pA * 0.95 + (1 - pA) * 0.25
  const expGen = 0.7
  const label = w < 0.3 ? 'Kind' : w < 0.6 ? 'Mixed' : 'Wicked'
  const example = w < 0.3 ? 'Chess, golf, a well-drilled procedure: the same patterns, quick and honest feedback.' : w < 0.6 ? 'Most jobs: familiar cases, with surprises mixed in.' : 'Forecasting, new markets, research at the edge: the rules shift and feedback is late or misleading.'

  return (
    <section id="worlds" className="kw" ref={wrap}>
      <div className="kw__top">
        <SectionHead no="05" title="Kind & Wicked" kicker="Which wins depends on the world. Slide from a stable world to a changing one and watch two solvers work." />
        <div className="kw__world">
          <span className="mono">World</span>
          <b>{label}</b>
          <p>{example}</p>
        </div>
      </div>

      <div className="kw__slider">
        <span className="mono">Kind · stable rules</span>
        <input id="kw-w" type="range" min="0" max="100" value={Math.round(w * 100)} onChange={(e) => setW(Number(e.target.value) / 100)} aria-label="How much the world changes" />
        <span className="mono">Wicked · shifting rules</span>
      </div>

      <div className="kw__stream" aria-hidden="true">
        {view.recent.map((p, i) => (
          <div key={i} className="kw__prob">
            <span className="kw__tile" style={{ background: p.type === 0 ? '#002fa7' : CHIPS[p.type] }} />
            <i className={p.s ? 'kw__hit kw__hit--s' : 'kw__miss'} />
            <i className={p.g ? 'kw__hit kw__hit--g' : 'kw__miss'} />
          </div>
        ))}
      </div>

      <div className="kw__bars" aria-live="polite">
        <div className="kw__bar kw__bar--s">
          <span className="mono">Specialist · 95% on the problem it trained for, 25% on anything else</span>
          <div>
            <i style={{ width: `${view.spec * 100}%` }} />
          </div>
          <b>{Math.round(view.spec * 100)}%</b>
          <small className="mono">expected {Math.round(expSpec * 100)}%</small>
        </div>
        <div className="kw__bar kw__bar--g">
          <span className="mono">Generalist · 70% on everything</span>
          <div>
            <i style={{ width: `${view.gen * 100}%` }} />
          </div>
          <b>{Math.round(view.gen * 100)}%</b>
          <small className="mono">expected {Math.round(expGen * 100)}%</small>
        </div>
      </div>

      <div className="kw__notes">
        <p>
          <span className="mono">Kind and wicked</span>
          The psychologist Robin Hogarth called learning environments “kind” when feedback is quick and accurate, and “wicked” when it is not. David Epstein’s Range (2019) argued that early specialisation pays off in kind worlds, and breadth in wicked ones.
        </p>
        <p>
          <span className="mono">About this model</span>
          The percentages are invented to show the shape of the argument. The crossing point moves if you change them; the pattern, that the value of depth depends on how stable the world is, is the point.
        </p>
      </div>
    </section>
  )
}
