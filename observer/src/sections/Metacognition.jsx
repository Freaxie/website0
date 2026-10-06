import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { Reveal, Statement } from '../components/Text.jsx'
import { Claim, Claims, Tag } from '../components/Claim.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { noise3 } from '../lib/noise.js'
import { approach, clamp, cool, ink, rng, signal, TAU } from '../lib/math.js'
import { blip, tone } from '../lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

const NODES = [
  {
    id: 'perception',
    name: 'Perception',
    line: 'Information enters the system.',
    sub: 'Before any thought there is a selection. Of everything that reaches the senses, only some of it is taken in.',
    kind: 'empirical',
    claim:
      'Perception fills in what it does not receive: each eye has a blind spot where the optic nerve leaves, and you do not see a hole there.',
    cite: 'The physiological blind spot; see e.g. Ramachandran (1992)',
  },
  {
    id: 'thought',
    name: 'Thought',
    line: 'The system constructs an internal representation.',
    sub: 'A representation is not the thing. It is the system’s working version of the thing, built to be useful rather than complete.',
    kind: 'model',
    claim:
      'Global workspace theory: a representation becomes conscious when it is broadcast widely enough for many processes to use it at once.',
    cite: 'Baars (1988); Dehaene & Naccache (2001)',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    line: 'The system represents its own internal state.',
    sub: 'Not “it is raining” but “I believe it is raining”. The object of thought is now the thinking itself.',
    kind: 'empirical',
    claim:
      'Tip of the tongue: you can know that you know a word while being unable to retrieve it. The monitor reports on the store, not its contents.',
    cite: 'Brown & McNeill (1966)',
  },
  {
    id: 'evaluation',
    name: 'Evaluation',
    line: 'The system evaluates the reliability of that representation.',
    sub: 'Confidence is a second-order judgement. It can be well calibrated, or entirely sure and entirely wrong.',
    kind: 'empirical',
    claim:
      'How well confidence tracks accuracy differs between people, and has been linked to structure in the anterior prefrontal cortex.',
    cite: 'Fleming, Weil, Nagy, Dolan & Rees (2010)',
  },
  {
    id: 'control',
    name: 'Control',
    line: 'The system modifies its future behavior.',
    sub: 'Feel unsure, then slow down, look again, ask, study longer. Monitoring is only useful because it can steer.',
    kind: 'model',
    claim:
      'A meta-level monitors an object-level and controls it in return: information flows up as monitoring and down as control.',
    cite: 'Nelson & Narens (1990)',
  },
]

const NY = (i) => 80 + i * 150
const NX = 110

function Diagram({ active, setActive }) {
  return (
    <svg className="mc-diagram" viewBox="0 0 420 760" role="group" aria-label="Metacognition diagram">
      <defs>
        <path id="mc-spine" d={`M${NX} ${NY(0)} L${NX} ${NY(4)}`} />
        <path id="mc-loop" d={`M${NX + 30} ${NY(4)} C 380 ${NY(4)}, 380 ${NY(1)}, ${NX + 30} ${NY(1)}`} />
        <path id="mc-loop2" d={`M${NX + 30} ${NY(4)} C 412 ${NY(4) + 30}, 412 ${NY(0) - 30}, ${NX + 30} ${NY(0)}`} />
      </defs>
      <line x1="20" x2="410" y1="305" y2="305" className="mc-boundary" />
      <text x="410" y="294" textAnchor="end" className="mc-small">
        OBJECT LEVEL
      </text>
      <text x="410" y="322" textAnchor="end" className="mc-small">
        META LEVEL
      </text>
      <use href="#mc-spine" className="mc-spine" />
      <use href="#mc-loop" className="mc-loop" />
      <use href="#mc-loop2" className="mc-loop mc-loop--faint" />
      <text
        className="mc-small"
        x="372"
        y={(NY(1) + NY(4)) / 2}
        textAnchor="middle"
        transform={`rotate(-90 372 ${(NY(1) + NY(4)) / 2})`}
      >
        CONTROL →
      </text>
      <text className="mc-small" x={NX - 22} y={NY(1) + 44} textAnchor="end">
        MONITORING ↓
      </text>
      {[0, 1, 2, 3].map((i) => (
        <circle key={`s${i}`} r="2.2" className="mc-pulse">
          <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${-i * 0.8}s`}>
            <mpath href="#mc-spine" />
          </animateMotion>
        </circle>
      ))}
      {[0, 1].map((i) => (
        <circle key={`l${i}`} r="2.2" className="mc-pulse mc-pulse--signal">
          <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${-i * 1.3}s`}>
            <mpath href="#mc-loop" />
          </animateMotion>
        </circle>
      ))}
      <circle r="1.6" className="mc-pulse mc-pulse--signal" opacity="0.5">
        <animateMotion dur="4.4s" repeatCount="indefinite">
          <mpath href="#mc-loop2" />
        </animateMotion>
      </circle>
      {NODES.map((n, i) => {
        const on = active === i
        return (
          <g
            key={n.id}
            className={`mc-node ${on ? 'is-on' : ''}`}
            transform={`translate(${NX} ${NY(i)})`}
            onClick={() => {
              setActive(i)
              tone(330 * Math.pow(2, i / 5), { dur: 1.2, gain: 0.03 })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setActive(i)
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={on}
            aria-label={n.name}
          >
            <circle r="44" className="mc-hit" />
            <circle r="30" className="mc-ring1" />
            <circle r="19" className="mc-ring2" />
            <circle r="4.5" className="mc-core" />
            {on && <line x1="34" x2="300" y1="0" y2="0" className="mc-connector" />}
            <text x="50" y="-6" className="mc-idx">
              0{i + 1}
            </text>
            <text x="50" y="12" className="mc-name">
              {n.name.toUpperCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// a small instrument per stage of the diagram
function MicroVis({ kind }) {
  const ref = useRef(null)
  useCanvas(
    ref,
    (ctx, s) => {
      const r = rng(5)
      const pts = Array.from({ length: 170 }, () => ({ x: r(), y: r(), a: r() * TAU, k: r() }))
      const lens = { x: 0.5, y: 0.5 }
      let ghost = []
      const target = (i, t, w, h) => {
        // a ring that slowly becomes a triangle and back
        const m = (Math.sin(t * 0.5) + 1) / 2
        const a = (i / 170) * TAU
        const cx = w / 2
        const cy = h / 2
        const R = Math.min(w, h) * 0.3
        const tri = (() => {
          const seg = Math.floor((i / 170) * 3)
          const f = ((i / 170) * 3) % 1
          const A = (seg / 3) * TAU - Math.PI / 2
          const B = ((seg + 1) / 3) * TAU - Math.PI / 2
          return [Math.cos(A) + (Math.cos(B) - Math.cos(A)) * f, Math.sin(A) + (Math.sin(B) - Math.sin(A)) * f]
        })()
        return [cx + R * (Math.cos(a) * (1 - m) + tri[0] * m), cy + R * (Math.sin(a) * (1 - m) + tri[1] * m)]
      }
      return {
        frame(dt) {
          const { w, h, t } = s
          ctx.clearRect(0, 0, w, h)
          if (kind === 'perception') {
            const tx = s.inside ? s.mx / w : 0.5 + Math.cos(t * 0.6) * 0.3
            const ty = s.inside ? s.my / h : 0.5 + Math.sin(t * 0.9) * 0.25
            lens.x = approach(lens.x, tx, 5, dt)
            lens.y = approach(lens.y, ty, 5, dt)
            const lx = lens.x * w
            const ly = lens.y * h
            const R = Math.min(w, h) * 0.32
            const step = 14
            for (let y = step / 2; y < h; y += step)
              for (let x = step / 2; x < w; x += step) {
                const dx = x - lx
                const dy = y - ly
                const d = Math.hypot(dx, dy)
                let px = x
                let py = y
                let a = 0.14
                if (d < R) {
                  const k = 1 - d / R
                  const m = 1 + k * k * 0.9
                  px = lx + dx * m * (1 - k * 0.55)
                  py = ly + dy * m * (1 - k * 0.55)
                  a = 0.14 + k * 0.7
                }
                ctx.fillStyle = ink(a)
                ctx.fillRect(px - 0.75, py - 0.75, 1.5, 1.5)
              }
            ctx.strokeStyle = ink(0.4)
            ctx.beginPath()
            ctx.arc(lx, ly, R, 0, TAU)
            ctx.stroke()
          } else if (kind === 'thought' || kind === 'monitoring') {
            if (!ghost.length) ghost = pts.map((p) => ({ x: p.x * w, y: p.y * h }))
            pts.forEach((p, i) => {
              const [tx, ty] = target(i, t, w, h)
              const n = noise3(i * 0.3, t * 0.6, 0) * 10
              p.cx = approach(p.cx ?? p.x * w, tx + n, 2.2, dt)
              p.cy = approach(p.cy ?? p.y * h, ty + noise3(i * 0.3, t * 0.6, 4) * 10, 2.2, dt)
              ctx.fillStyle = ink(0.75)
              ctx.fillRect(p.cx - 1, p.cy - 1, 2, 2)
              if (kind === 'monitoring') {
                const g = ghost[i]
                g.x = approach(g.x, p.cx + 26, 1.1, dt)
                g.y = approach(g.y, p.cy - 18, 1.1, dt)
                ctx.fillStyle = cool(0.55)
                ctx.fillRect(g.x - 0.8, g.y - 0.8, 1.6, 1.6)
              }
            })
            if (kind === 'monitoring') {
              ctx.font = '10px "JetBrains Mono Variable", monospace'
              ctx.fillStyle = cool(0.8)
              ctx.fillText('MODEL OF STATE', w * 0.72, h * 0.18)
              ctx.fillStyle = ink(0.5)
              ctx.fillText('STATE', w * 0.12, h * 0.88)
            }
          } else if (kind === 'evaluation') {
            const sigma = 0.08 + (noise3(t * 0.3, 2, 0) + 1) * 0.07
            const mu = 0.5 + noise3(t * 0.2, 9, 0) * 0.18
            ctx.strokeStyle = ink(0.12)
            ctx.beginPath()
            ctx.moveTo(20, h - 30)
            ctx.lineTo(w - 20, h - 30)
            ctx.stroke()
            ctx.beginPath()
            for (let i = 0; i <= 200; i++) {
              const x = i / 200
              const y = Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))
              const px = 20 + x * (w - 40)
              const py = h - 30 - y * (h - 70)
              i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
            }
            ctx.strokeStyle = ink(0.8)
            ctx.stroke()
            ctx.fillStyle = ink(0.05)
            ctx.fillRect(20 + (mu - sigma) * (w - 40), 30, sigma * 2 * (w - 40), h - 60)
            const conf = clamp(1 - (sigma - 0.08) / 0.14)
            ctx.font = '10px "JetBrains Mono Variable", monospace'
            ctx.fillStyle = ink(0.7)
            ctx.fillText(`CONFIDENCE ${conf.toFixed(2)}`, 20, 20)
            ctx.fillStyle = signal(0.9)
            const truth = 0.5 + Math.sin(t * 0.13) * 0.28
            ctx.fillRect(20 + truth * (w - 40) - 0.5, 30, 1, h - 60)
            ctx.fillText('TRUE VALUE', 24 + truth * (w - 40), 42)
          } else if (kind === 'control') {
            const cx = w * 0.82
            const cy = h * 0.5
            ctx.strokeStyle = ink(0.5)
            ctx.beginPath()
            ctx.arc(cx, cy, 10, 0, TAU)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(cx, cy, 2, 0, TAU)
            ctx.stroke()
            const cycle = (t % 5) / 5
            const err = Math.sin(Math.floor(t / 5) * 2.3) * h * 0.32
            ctx.beginPath()
            for (let i = 0; i <= 120; i++) {
              const f = i / 120
              if (f > cycle) break
              const x = w * 0.12 + f * (cx - w * 0.12)
              const drift = err * Math.min(f, 0.45) * 2
              const correct = f > 0.45 ? err * 0.9 * ((f - 0.45) / 0.55) : 0
              const y = cy + drift - correct * 2
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
            }
            ctx.strokeStyle = ink(0.85)
            ctx.stroke()
            if (cycle > 0.45 && cycle < 0.6) {
              ctx.font = '10px "JetBrains Mono Variable", monospace'
              ctx.fillStyle = signal(0.9)
              ctx.fillText('ERROR DETECTED → ADJUST', w * 0.12, 20)
            }
          }
        },
      }
    },
    { deps: [kind] },
  )
  return <canvas ref={ref} className="mc-micro" aria-hidden="true" />
}

/* ───────── a small metacognition experiment ───────── */

const TRIALS = 6
const CONF = [
  { v: 0.5, label: 'Guess' },
  { v: 0.65, label: 'Unsure' },
  { v: 0.8, label: 'Fairly sure' },
  { v: 0.95, label: 'Certain' },
]

function makeTrial(seed) {
  const r = rng(seed * 97 + 13)
  const base = 34 + Math.floor(r() * 10)
  const more = r() < 0.5 ? 'left' : 'right'
  const extra = 5 + Math.floor(r() * 3)
  const nL = more === 'left' ? base + extra : base
  const nR = more === 'right' ? base + extra : base
  const cloud = (n) => {
    const pts = []
    let guard = 0
    while (pts.length < n && guard++ < 5000) {
      const a = r() * TAU
      const d = Math.sqrt(r()) * 0.42
      const x = 0.5 + Math.cos(a) * d
      const y = 0.5 + Math.sin(a) * d
      if (pts.every((p) => Math.hypot(p[0] - x, p[1] - y) > 0.045)) pts.push([x, y])
    }
    return pts
  }
  return { more, L: cloud(nL), R: cloud(nR), nL, nR }
}

function Trial() {
  const [phase, setPhase] = useState('idle') // idle | show | choose | conf | done
  const [i, setI] = useState(0)
  const [results, setResults] = useState([])
  const [choice, setChoice] = useState(null)
  const canvasRef = useRef(null)
  const live = useRef({ trial: null, view: 'blank', viewAt: 0 })

  const run = (idx) => {
    const tr = makeTrial(idx + Math.floor(performance.now() % 1000))
    live.current.trial = tr
    live.current.view = 'fix'
    live.current.viewAt = performance.now()
    setPhase('show')
    setTimeout(() => {
      live.current.view = 'stim'
      blip(1400, 0.01, 0.05)
    }, 650)
    setTimeout(() => (live.current.view = 'mask'), 650 + 420)
    setTimeout(
      () => {
        live.current.view = 'blank'
        setPhase('choose')
      },
      650 + 420 + 260,
    )
  }

  const choose = (side) => {
    if (phase !== 'choose') return
    blip(1000, 0.012)
    setChoice(side)
    setPhase('conf')
  }

  const rate = (c) => {
    const tr = live.current.trial
    const correct = choice === tr.more
    const next = [...results, { correct, conf: c }]
    setResults(next)
    tone(correct ? 660 : 440, { dur: 0.5, gain: 0.015 })
    if (next.length >= TRIALS) {
      setPhase('done')
      live.current.view = 'blank'
    } else {
      setI(i + 1)
      run(i + 1)
    }
  }

  useEffect(() => {
    const key = (e) => {
      if (phase === 'choose' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        choose(e.key === 'ArrowLeft' ? 'left' : 'right')
      }
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  })

  useCanvas(canvasRef, (ctx, s) => {
    return {
      frame() {
        const { w, h } = s
        const st = live.current
        ctx.clearRect(0, 0, w, h)
        const bw = Math.min(w * 0.42, h * 0.95)
        const boxes = [
          [w * 0.25 - bw / 2, (h - bw) / 2],
          [w * 0.75 - bw / 2, (h - bw) / 2],
        ]
        ctx.strokeStyle = ink(0.16)
        boxes.forEach(([x, y]) => ctx.strokeRect(x + 0.5, y + 0.5, bw, bw))
        if (st.view === 'fix') {
          ctx.fillStyle = ink(0.9)
          ctx.fillRect(w / 2 - 6, h / 2 - 0.5, 12, 1)
          ctx.fillRect(w / 2 - 0.5, h / 2 - 6, 1, 12)
        }
        if (st.view === 'stim' && st.trial) {
          ctx.fillStyle = ink(0.95)
          ;[st.trial.L, st.trial.R].forEach((pts, k) => {
            const [bx, by] = boxes[k]
            for (const [x, y] of pts) {
              ctx.beginPath()
              ctx.arc(bx + x * bw, by + y * bw, Math.max(1.6, bw * 0.011), 0, TAU)
              ctx.fill()
            }
          })
        }
        if (st.view === 'mask') {
          boxes.forEach(([bx, by]) => {
            for (let k = 0; k < 500; k++) {
              ctx.fillStyle = ink(Math.random() * 0.6)
              ctx.fillRect(bx + Math.random() * bw, by + Math.random() * bw, 2, 2)
            }
          })
        }
      },
    }
  })

  const right = results.filter((r) => r.correct)
  const wrong = results.filter((r) => !r.correct)
  const mean = (a) => (a.length ? a.reduce((s, r) => s + r.conf, 0) / a.length : null)
  const mr = mean(right)
  const mw = mean(wrong)
  let verdict = ''
  if (phase === 'done') {
    if (!wrong.length) verdict = 'You were right every time. Did you feel it, or were you surprised just now?'
    else if (!right.length) verdict = 'You were wrong every time — and you had a feeling about each answer anyway.'
    else if (mr > mw + 0.04)
      verdict =
        'Your confidence carried information about your accuracy. That is metacognitive sensitivity: a mind measuring itself, and getting a signal.'
    else
      verdict =
        'Your confidence did not track your accuracy this time. Something in you was watching the decision — and it could not tell either.'
  }

  return (
    <div className="trial">
      <div className="trial__head">
        <p className="mono mono--ink">Trial 02.1 — monitor yourself</p>
        <p className="prose trial__lede">
          Two clouds of points will flash for less than half a second. Decide which side had more. Then say how sure you
          are. The second judgement is the one under study.
        </p>
      </div>
      <div className="trial__stage">
        <canvas ref={canvasRef} aria-label="Two clouds of points, shown briefly." />
        {phase === 'idle' && (
          <div className="trial__overlay">
            <button
              className="btn"
              onClick={() => {
                setResults([])
                setI(0)
                run(0)
              }}
            >
              <span className="btn__dot" /> Begin · {TRIALS} trials
            </button>
          </div>
        )}
        {phase === 'done' && (
          <div className="trial__overlay trial__result">
            <svg
              viewBox="0 0 300 120"
              className="trial__plot"
              aria-label="Your confidence on each trial, filled when correct"
            >
              {[0.5, 0.65, 0.8, 0.95].map((c) => (
                <g key={c}>
                  <line
                    x1="30"
                    x2="290"
                    y1={110 - (c - 0.45) * 190}
                    y2={110 - (c - 0.45) * 190}
                    className="trial__grid"
                  />
                  <text x="0" y={113 - (c - 0.45) * 190} className="mc-small">
                    {Math.round(c * 100)}%
                  </text>
                </g>
              ))}
              {results.map((r, k) => (
                <circle
                  key={k}
                  cx={50 + k * 44}
                  cy={110 - (r.conf - 0.45) * 190}
                  r="5"
                  className={r.correct ? 'trial__dot is-right' : 'trial__dot is-wrong'}
                />
              ))}
            </svg>
            <p className="mono mono--dim">
              ● correct ○ wrong · confidence when right {mr != null ? `${Math.round(mr * 100)}%` : '—'} · when wrong{' '}
              {mw != null ? `${Math.round(mw * 100)}%` : '—'}
            </p>
            <p className="prose">{verdict}</p>
            <button className="btn btn--ghost" onClick={() => setPhase('idle')}>
              ↺ Again
            </button>
          </div>
        )}
      </div>
      <div className="trial__controls">
        <span className="mono mono--dim">
          {phase === 'done'
            ? 'Complete'
            : `Trial ${String(Math.min(i + 1, TRIALS)).padStart(2, '0')} / ${String(TRIALS).padStart(2, '0')}`}
        </span>
        {phase === 'choose' && (
          <div className="choice-row">
            <button className="btn" onClick={() => choose('left')}>
              ← Left had more
            </button>
            <button className="btn" onClick={() => choose('right')}>
              Right had more →
            </button>
          </div>
        )}
        {phase === 'conf' && (
          <div className="choice-row">
            <span className="mono mono--ink trial__ask">How sure?</span>
            {CONF.map((c) => (
              <button key={c.v} className="btn" onClick={() => rate(c.v)}>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Metacognition() {
  const [active, setActive] = useState(0)
  const n = NODES[active]
  return (
    <section id="metacognition" className="sec mc" data-section>
      <SectionHead n="02" title="Metacognition" motif="Monitoring · control" />
      <div className="grid12">
        <Statement
          className="big big--m mc__statement"
          text="A thought can arrive with a *second signal:* how far to trust it."
        />
      </div>

      <div className="mc__body">
        <Reveal className="mc__diagram-wrap">
          <Diagram active={active} setActive={setActive} />
          <p className="mono mono--dim mc__hint">Select a stage</p>
        </Reveal>
        <div className="mc__panel" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 24, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -12, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <p className="mono mono--dim">Stage 0{active + 1} / 05</p>
              <h3 className="big big--s mc__name">{n.name}</h3>
              <p className="mc__line">“{n.line}”</p>
              <MicroVis kind={n.id} />
              <p className="prose">{n.sub}</p>
              <div className="mc__claim">
                <Tag kind={n.kind} />
                <p className="claim__text">{n.claim}</p>
                <p className="claim__cite">{n.cite}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Trial />

      <Claims>
        <Claim kind="empirical" cite="e.g. Smith, Shields & Washburn (2003)">
          Some animals, including monkeys and dolphins, use an “uncertain” response more on difficult trials, much as
          people do. Whether that reflects metacognition or a simpler strategy is still argued.
        </Claim>
        <Claim kind="open" delay={0.1}>
          Is metacognition necessary for consciousness, or only for knowing that you are conscious? A mind might
          experience without ever representing that it does.
        </Claim>
      </Claims>
    </section>
  )
}
