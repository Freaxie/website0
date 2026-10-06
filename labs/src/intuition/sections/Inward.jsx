import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { pointer } from '@shared/lib/pointer.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, ink, rng, TAU } from '@shared/lib/math.js'
import { blip, swell, tone } from '@shared/lib/audio.js'
import { ni, niDeep } from '../color.js'
import { converged, session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

// compound remote associates: one word forms a familiar compound or phrase with each of the three
export const TRIADS = [
  { w: ['COTTAGE', 'SWISS', 'CAKE'], a: 'CHEESE' },
  { w: ['CREAM', 'SKATE', 'WATER'], a: 'ICE' },
  { w: ['NIGHT', 'WRIST', 'STOP'], a: 'WATCH' },
  { w: ['DEW', 'COMB', 'BEE'], a: 'HONEY' },
  { w: ['SHOW', 'LIFE', 'ROW'], a: 'BOAT' },
]

export default function Inward() {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('ask') // ask | solved | felt | done
  const [wrong, setWrong] = useState(0)
  const [hint, setHint] = useState(false)
  const [canHint, setCanHint] = useState(false)
  const [results, setResults] = useState([]) // { triad, how }
  const [aside, setAside] = useState(null)
  const canvasRef = useRef(null)
  const live = useRef({ triad: TRIADS[0], solvedAt: 0 })
  const T = TRIADS[idx % TRIADS.length]
  live.current.triad = T

  useEffect(() => {
    setCanHint(false)
    setHint(false)
    const id = setTimeout(() => setCanHint(true), 15000)
    return () => clearTimeout(id)
  }, [idx])

  const submit = (e) => {
    e.preventDefault()
    const v = text.trim().toUpperCase()
    if (!v) return
    if (v === T.a || v === `${T.a}S`) {
      setStatus('solved')
      live.current.solvedAt = performance.now()
      converged(1)
      swell([98, 146.8, 196], 0.04, 4)
      setTimeout(() => tone(784, { dur: 3, gain: 0.025 }), 350)
    } else {
      setWrong((n) => n + 1)
      tone(140, { dur: 0.4, gain: 0.03, type: 'triangle' })
    }
  }

  const next = () => {
    blip(1300, 0.012)
    setText('')
    setWrong(0)
    live.current.solvedAt = 0
    const solvedCount = results.length
    if (solvedCount >= 3 || idx >= TRIADS.length - 1) setStatus('done')
    else {
      setIdx(idx + 1)
      setStatus('ask')
    }
  }

  const setItAside = () => {
    if (!session.incubating) session.incubating = T
    setAside(T)
    tone(220, { dur: 2, gain: 0.025 })
    setText('')
    setWrong(0)
    if (idx >= TRIADS.length - 1) setStatus('done')
    else setIdx(idx + 1)
  }

  const felt = (how) => {
    setResults((r) => [...r, { triad: T, how }])
    setStatus('felt')
  }

  useCanvas(canvasRef, (ctx, s) => {
    const r = rng(23)
    const parts = Array.from({ length: 540 }, (_, i) => ({
      g: i % 3,
      a: r() * TAU,
      d: Math.sqrt(r()),
      seed: r() * 100,
      x: 0,
      y: 0,
      init: false,
    }))
    let focus = 0
    let lastTriad = null
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        const m = Math.min(w, h)
        const cx = w / 2
        const cy = h / 2
        const solved = st.solvedAt > 0
        const sinceSolve = solved ? (performance.now() - st.solvedAt) / 1000 : 0
        if (st.triad !== lastTriad) {
          lastTriad = st.triad
          for (const p of parts) p.init = false
        }
        // holding still, or holding down, draws the clouds toward the middle
        const holding = s.inside && (pointer.down || performance.now() - pointer.lastMove > 1200)
        focus = approach(focus, solved ? 1 : holding ? 0.55 : 0, solved ? 5 : 0.8, dt)
        const anchors = [0, 1, 2].map((k) => {
          const a = -Math.PI / 2 + (k * TAU) / 3 + Math.PI / 3
          return [cx + Math.cos(a) * m * 0.33 * (w > h ? 1.25 : 1), cy + Math.sin(a) * m * 0.3]
        })
        ctx.fillStyle = 'rgba(4,4,4,0.35)'
        ctx.fillRect(0, 0, w, h)

        // threads between the words, tightening as they converge
        ctx.strokeStyle = ni(0.08 + focus * 0.3)
        ctx.beginPath()
        for (const [ax, ay] of anchors) {
          ctx.moveTo(ax, ay)
          ctx.lineTo(cx + (ax - cx) * (1 - focus) * 0.15, cy + (ay - cy) * (1 - focus) * 0.15)
        }
        ctx.stroke()

        for (const p of parts) {
          const [ax, ay] = anchors[p.g]
          const spread = m * 0.11 * (1 - focus * 0.7)
          const ox = Math.cos(p.a + t * 0.2 * (p.g - 1)) * p.d * spread + noise3(p.seed, t * 0.3, 0) * 8
          const oy = Math.sin(p.a + t * 0.2 * (p.g - 1)) * p.d * spread + noise3(p.seed, t * 0.3, 3) * 8
          const k = focus * (0.5 + 0.5 * p.d)
          const tx = ax + (cx - ax) * k + ox
          const ty = ay + (cy - ay) * k + oy
          if (!p.init) {
            p.x = tx
            p.y = ty
            p.init = true
          }
          p.x = approach(p.x, tx, solved ? 4 : 2.2, dt)
          p.y = approach(p.y, ty, solved ? 4 : 2.2, dt)
          ctx.fillStyle = ni(0.35 + focus * 0.5)
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
        }

        ctx.textAlign = 'center'
        ctx.font = `300 ${Math.round(Math.max(20, m * 0.05))}px "Archivo Variable", sans-serif`
        st.triad.w.forEach((word, k) => {
          const [ax, ay] = anchors[k]
          ctx.fillStyle = ink(0.92 - (solved ? Math.min(0.6, sinceSolve * 0.4) : 0))
          ctx.fillText(word, ax, ay + m * 0.012)
        })
        if (solved) {
          const a = Math.min(1, sinceSolve / 0.8)
          const R = m * (0.05 + 0.1 * a)
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3)
          g.addColorStop(0, ni(0.6 * a))
          g.addColorStop(0.4, niDeep(0.35 * a))
          g.addColorStop(1, niDeep(0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(cx, cy, R * 3, 0, TAU)
          ctx.fill()
          ctx.font = `400 ${Math.round(Math.max(30, m * 0.09))}px "Archivo Variable", sans-serif`
          ctx.fillStyle = `rgba(255,253,248,${a})`
          ctx.fillText(st.triad.a, cx, cy + m * 0.03)
        } else {
          ctx.strokeStyle = ni(0.25 + focus * 0.5)
          ctx.beginPath()
          ctx.arc(cx, cy, 6 + focus * 10 + Math.sin(t * 2) * 1.5, 0, TAU)
          ctx.stroke()
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = ni(0.6)
          ctx.fillText('?', cx, cy + 4)
        }
        ctx.textAlign = 'left'
      },
    }
  })

  const insight = results.filter((x) => x.how === 'insight').length

  return (
    <section id="inward" className="sec inw" data-section>
      <SectionHead n="04" title="Inward · Ni" motif="Convergence" />
      <div className="grid12">
        <Statement className="big inw__statement" text="Many things are often *one* thing." lens />
        <Reveal className="inw__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Type theorists describe introverted intuition as the opposite motion: impressions gathered inward until they
            fuse into a single pattern, a meaning, a direction.
          </p>
        </Reveal>
      </div>

      <div className="inw__lab">
        <div className="inw__stage">
          <canvas
            ref={canvasRef}
            aria-label="Three words, each with a cloud of points, drawn toward a single hidden word at the centre."
          />
          <p className="mono mono--dim inw__corner">
            Closed <span className="t-ni">{String(results.length).padStart(2, '0')}</span> · hold still to focus
          </p>
        </div>
        <div className="inw__controls" aria-live="polite">
          <AnimatePresence mode="wait">
            {status === 'ask' && (
              <motion.div
                key={`ask${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="mono mono--ink">One word goes with all three: {T.w.join(' · ')}</p>
                <form className="out__form" onSubmit={submit}>
                  <input
                    id="triad-answer"
                    className={`field ${wrong ? 'is-wrong' : ''}`}
                    key={wrong}
                    value={text}
                    onChange={(e) => setText(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                    placeholder="The hidden word…"
                    autoComplete="off"
                    aria-label="The word that goes with all three"
                  />
                  <button className="btn btn--ni" type="submit">
                    Converge
                  </button>
                </form>
                <div className="choice-row inw__help">
                  {canHint && !hint && (
                    <button className="btn btn--ghost" onClick={() => setHint(true)}>
                      Hint
                    </button>
                  )}
                  {hint && (
                    <span className="mono mono--dim">
                      It begins with <span className="t-ni">{T.a[0]}</span>, {T.a.length} letters
                    </span>
                  )}
                  <button className="btn btn--ghost" onClick={setItAside}>
                    Set it aside for now
                  </button>
                </div>
                {wrong > 0 && <p className="mono mono--dim">Not that one. Try another, or set it aside.</p>}
                {aside && aside !== T && (
                  <p className="mono mono--dim">
                    Set aside: {aside.w.join(' · ')}. It will come back at the end. Try not to think about it.
                  </p>
                )}
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div
                key="solved"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="mono mono--ink">
                  {T.w.map((x) => x.toLowerCase()).join(' · ')} → <span className="t-ni">{T.a.toLowerCase()}</span>
                </p>
                <p className="inw__ask">How did it arrive?</p>
                <div className="choice-row">
                  <button className="btn btn--ni" onClick={() => felt('insight')}>
                    All at once
                  </button>
                  <button className="btn" onClick={() => felt('analysis')}>
                    Step by step
                  </button>
                </div>
              </motion.div>
            )}
            {status === 'felt' && (
              <motion.div
                key="felt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="prose">
                  {results[results.length - 1]?.how === 'insight'
                    ? 'Researchers call that insight: the answer arrives whole, with a feeling of certainty, and the steps stay hidden from you.'
                    : 'That is analysis: you tried candidates and checked them. Both routes reach answers. They feel different from the inside.'}
                </p>
                <button className="btn" style={{ marginTop: 16 }} onClick={next}>
                  {results.length >= 3 || idx >= TRIADS.length - 1 ? 'Finish' : 'Next three words →'}
                </button>
              </motion.div>
            )}
            {status === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="big big--s">
                  {results.length} found{results.length ? `, ${insight} of them all at once.` : '.'}
                </p>
                <p className="prose" style={{ marginTop: 12 }}>
                  {session.incubating
                    ? `One is still out there: ${session.incubating.w.join(' · ')}. Leave it. It will come back at the end.`
                    : 'Each time, three directions became one point. Nothing new was added; something was noticed.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Claims>
        <Claim kind="empirical" cite="S. Mednick (1962); Bowden & Jung-Beeman (2003)">
          The Remote Associates Test asks for the one word that links three others. It is a standard measure of
          convergent thinking.
        </Claim>
        <Claim kind="empirical" cite="Jung-Beeman et al. (2004)" delay={0.1}>
          Solutions that people reported as sudden insights were preceded by a burst of high-frequency brain activity
          over the right anterior temporal lobe, stronger than before solutions reached step by step.
        </Claim>
        <Claim kind="empirical" cite="Salvi, Bricolo, Kounios, Bowden & Beeman (2016)" delay={0.2}>
          In their studies, answers that arrived as insight were more often correct than answers reached step by step.
        </Claim>
        <Claim kind="empirical" cite="Sio & Ormerod (2009), a meta-analysis" delay={0.3}>
          Incubation: setting a problem aside for a while improves the chance of solving it, on average.
        </Claim>
      </Claims>
    </section>
  )
}
