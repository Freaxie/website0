import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { ink, rng, TAU } from '@shared/lib/math.js'
import { blip, tone } from '@shared/lib/audio.js'
import { converged, opened } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

/* ───────── Ni's overreach: a pattern where there is none ───────── */

const ORDER = [true, false, false, true, false, true]

function Noise() {
  const [trial, setTrial] = useState(-1)
  const [phase, setPhase] = useState('idle') // idle | show | ask | done
  const [answers, setAnswers] = useState([])
  const canvasRef = useRef(null)
  const live = useRef({ trial: -1, show: false, seed: 1 })

  const run = (i) => {
    live.current.trial = i
    live.current.seed = 1000 + i * 37 + Math.floor(performance.now() % 97)
    live.current.show = true
    setTrial(i)
    setPhase('show')
    blip(1500, 0.01, 0.05)
    setTimeout(() => {
      live.current.show = false
      setPhase('ask')
    }, 1700)
  }
  const answer = (yes) => {
    const next = [...answers, { signal: ORDER[trial], yes }]
    setAnswers(next)
    if (trial < ORDER.length - 1) run(trial + 1)
    else {
      setPhase('done')
      tone(330, { dur: 1.4, gain: 0.025 })
    }
  }

  useCanvas(canvasRef, (ctx, s) => {
    let drawnFor = null
    return {
      frame() {
        const { w, h } = s
        const st = live.current
        const key = `${st.show}-${st.seed}-${w}-${h}`
        if (key === drawnFor) return
        drawnFor = key
        ctx.clearRect(0, 0, w, h)
        if (!st.show) {
          ctx.strokeStyle = ink(0.12)
          ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
          return
        }
        const r = rng(st.seed)
        const m = Math.min(w, h)
        ctx.fillStyle = ink(0.75)
        for (let k = 0; k < 900; k++) ctx.fillRect(r() * w, r() * h, 1.6, 1.6)
        if (ORDER[st.trial]) {
          // a faint ring: a few dozen extra points along a circle
          const cx = w * (0.35 + r() * 0.3)
          const cy = h * (0.35 + r() * 0.3)
          for (let k = 0; k < 46; k++) {
            const a = r() * TAU
            const rr = m * 0.2 + (r() - 0.5) * m * 0.03
            ctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.6, 1.6)
          }
        }
      },
    }
  })

  const fa = answers.filter((a) => !a.signal && a.yes).length
  const miss = answers.filter((a) => a.signal && !a.yes).length
  const noiseN = ORDER.filter((x) => !x).length
  const sigN = ORDER.length - noiseN

  return (
    <div className="sh__panel">
      <p className="mono t-ni">Ni overreaching · a pattern too many</p>
      <p className="prose sh__lede">
        Points will flash for under two seconds. Some fields hide a faint ring. Some hide nothing.
      </p>
      <div className="sh__stage">
        <canvas ref={canvasRef} aria-label="A field of random points, sometimes with a faint ring hidden in it." />
        {phase === 'idle' && (
          <div className="sh__overlay">
            <button className="btn btn--ni" onClick={() => run(0)}>
              <span className="btn__dot" /> Begin · {ORDER.length} fields
            </button>
          </div>
        )}
        {phase === 'ask' && (
          <div className="sh__overlay">
            <p className="mono mono--ink">Was there a shape?</p>
            <div className="choice-row">
              <button className="btn" onClick={() => answer(true)}>
                Yes
              </button>
              <button className="btn" onClick={() => answer(false)}>
                No
              </button>
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="sh__overlay">
            <p className="big big--s">
              <span className="t-ni">{fa}</span> of {noiseN} empty fields held a shape for you.
            </p>
            <p className="mono mono--dim">
              Rings missed · {miss} of {sigN}
            </p>
            <p className="prose sh__verdict">
              {fa > 0
                ? 'You found a pattern where there was none. That is the price of a good pattern-finder.'
                : 'No false alarms. A stricter threshold usually costs some misses — check yours above.'}
            </p>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setAnswers([])
                setPhase('idle')
              }}
            >
              ↺ Again
            </button>
          </div>
        )}
      </div>
      <p className="mono mono--dim sh__count">
        Field {String(Math.max(0, trial) + (phase === 'done' ? 0 : 1)).padStart(2, '0')} /{' '}
        {String(ORDER.length).padStart(2, '0')}
      </p>
    </div>
  )
}

/* ───────── Ne's overreach: the door that never closes ───────── */

const START = ['the coast', 'the mountains', 'a city you have never seen']
const MODS = [
  'by train',
  'alone',
  'at night',
  'with an old friend',
  'without a phone',
  'on foot',
  'for one day only',
  'in the rain',
  'with no plan at all',
  'to learn one thing',
  'for a single view',
  'back by Sunday',
]

function Door() {
  const [opts, setOpts] = useState(() => START.map((t, i) => ({ id: i, t, from: null })))
  const [last, setLast] = useState(null)
  const [committed, setCommitted] = useState(null)
  const seq = useRef(START.length)
  const r = useRef(rng(5))

  const branch = (o) => {
    if (committed) return
    setLast(o.id)
    const parts = o.t.split(', ')
    const base = parts[0]
    const used = new Set(parts.slice(1))
    const fresh = MODS.filter((m) => !used.has(m))
    const make = () => {
      const m = fresh.splice(Math.floor(r.current() * fresh.length), 1)[0]
      const mods = [...parts.slice(1)].slice(-1)
      return [base, ...mods, m].join(', ')
    }
    const kids = [make(), make()].map((t) => ({ id: seq.current++, t, from: o.id }))
    setOpts((x) => {
      const i = x.findIndex((y) => y.id === o.id)
      return [...x.slice(0, i + 1), ...kids, ...x.slice(i + 1)]
    })
    opened(2)
    tone(660 + (seq.current % 6) * 110, { dur: 0.6, gain: 0.02, type: 'triangle' })
  }

  const commit = () => {
    const o = opts.find((x) => x.id === last) || opts[opts.length - 1]
    setCommitted(o)
    converged(1)
    tone(196, { dur: 3, gain: 0.04 })
  }

  return (
    <div className="sh__panel">
      <p className="mono t-ne">Ne overreaching · the door that never closes</p>
      <p className="prose sh__lede">Plan a weekend. Touch an option to consider it. Considering it opens two more.</p>
      <div className={`sh__door ${committed ? 'is-closed' : ''}`}>
        <AnimatePresence>
          {opts.map((o) =>
            committed && committed.id !== o.id ? null : (
              <motion.button
                layout
                key={o.id}
                className={`sh__opt ${o.id === last ? 'is-last' : ''} ${committed?.id === o.id ? 'is-chosen' : ''}`}
                onClick={() => branch(o)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {o.t}
              </motion.button>
            ),
          )}
        </AnimatePresence>
      </div>
      <div className="sh__doorbar">
        <span className="mono mono--dim">
          Options open <span className="t-ne">{String(committed ? 1 : opts.length).padStart(2, '0')}</span>
        </span>
        {!committed && opts.length >= 9 && (
          <button className="btn btn--ni" onClick={commit}>
            Commit to the last one you touched
          </button>
        )}
        {committed && (
          <button
            className="btn btn--ghost"
            onClick={() => {
              setCommitted(null)
              setOpts(START.map((t, i) => ({ id: i, t, from: null })))
              seq.current = START.length
              setLast(null)
            }}
          >
            ↺ Reopen
          </button>
        )}
      </div>
      <AnimatePresence>
        {committed && (
          <motion.p
            className="prose sh__verdict"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE }}
          >
            Outward found the options. Something had to close the field for any of them to happen.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Shadows() {
  return (
    <section id="shadows" className="sec sh" data-section>
      <SectionHead n="05" title="Shadows" motif="Noise · overload" />
      <div className="grid12">
        <Statement className="big sh__statement" text="Each direction has its own way of being *wrong.*" />
      </div>
      <div className="sh__panels">
        <Noise />
        <Door />
      </div>
      <Claims>
        <Claim kind="empirical" cite="e.g. Liu et al. (2014), Seeing Jesus in toast">
          Pareidolia: told that faces or letters may be hidden in pure noise, many people report seeing them, and their
          visual cortex responds as if they had.
        </Claim>
        <Claim kind="empirical" cite="R. Nickerson (1998), a review" delay={0.1}>
          Confirmation bias: once a pattern is held, people seek and weigh evidence that fits it more than evidence
          against it.
        </Claim>
        <Claim
          kind="empirical"
          cite="Scheibehenne, Greifeneder & Todd (2010); Chernev, Böckenholt & Goodman (2015)"
          delay={0.2}
        >
          Choice overload is real in some conditions, but meta-analyses find a small or near-zero effect on average.
          More options do not always paralyse.
        </Claim>
        <Claim kind="empirical" cite="P. Tetlock, Expert Political Judgment (2005)" delay={0.3}>
          Forecasters who drew on many ideas (“foxes”) predicted better, on average, than those who organised everything
          around one big idea (“hedgehogs”). These are thinking styles, not Jungian types; the parallel is ours.
        </Claim>
        <Claim kind="argument" delay={0.4}>
          A vision with no alternatives cannot be tested. A list of alternatives with no vision cannot be acted on.
        </Claim>
      </Claims>
    </section>
  )
}
