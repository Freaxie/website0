import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { blip, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

/* ───────── fragment 1: a sequence ───────── */

const SEQ = {
  16: 'Doubling. The rule most people see first.',
  14: 'Add 2, then 4, then 6. It fits everything you were shown.',
  10: 'A rule that turns at 8. Strange, but nothing you were shown rules it out.',
}

function Sequence({ onDone }) {
  const [pick, setPick] = useState(null)
  const xs = [30, 90, 150, 210]
  const y = (v) => 150 - v * 7
  return (
    <div className="gap__frag">
      <p className="mono mono--dim">Fragment A · a sequence</p>
      <p className="gap__seq mono">
        2 · 4 · 8 · {pick ? <span className="mono--ink">{pick}</span> : <span className="gap__hole">?</span>}
      </p>
      <svg className="gap__plot" viewBox="0 0 240 160" aria-hidden="true">
        <line x1="10" x2="230" y1="150" y2="150" className="gap__axis" />
        {[2, 4, 8].map((v, i) => (
          <circle key={v} cx={xs[i]} cy={y(v)} r="3" className="gap__pt" />
        ))}
        {pick &&
          [16, 14, 10].map((v) => (
            <motion.line
              key={v}
              x1={xs[2]}
              y1={y(8)}
              x2={xs[3]}
              y2={y(v)}
              className={String(v) === pick ? 'gap__branch is-pick' : 'gap__branch'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: EASE }}
            />
          ))}
        {pick &&
          [16, 14, 10].map((v) => (
            <circle key={`p${v}`} cx={xs[3]} cy={y(v)} r="2.5" className="gap__pt gap__pt--ne" />
          ))}
      </svg>
      {!pick ? (
        <div className="choice-row">
          {['16', '14', '10'].map((v) => (
            <button
              key={v}
              className="btn"
              onClick={() => {
                setPick(v)
                blip(1200, 0.015)
                onDone()
              }}
            >
              {v}
            </button>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <p className="prose gap__say">{SEQ[pick]}</p>
          <p className="gap__note">
            Any finite sequence fits endlessly many rules. You had chosen one before you checked any.
          </p>
        </motion.div>
      )}
    </div>
  )
}

/* ───────── fragment 2: a phrase that stops ───────── */

const PHRASE = [523.25, 659.25, 783.99, 698.46, 659.25, 587.33]
const ENDINGS = [
  { k: 'home', label: 'Return home', f: 523.25 },
  { k: 'up', label: 'Climb higher', f: 880 },
  { k: 'out', label: 'Step outside the key', f: 739.99 },
]

function Phrase({ onDone }) {
  const [state, setState] = useState('idle') // idle | playing | waiting | ended
  const [ending, setEnding] = useState(null)
  const [lit, setLit] = useState(-1)
  const timers = useRef([])
  const play = (end) => {
    timers.current.forEach(clearTimeout)
    setState('playing')
    const notes = end ? [...PHRASE, end.f] : PHRASE
    timers.current = notes.map((f, i) =>
      setTimeout(() => {
        tone(f, { dur: i === notes.length - 1 && end ? 2.4 : 0.9, gain: 0.05, type: 'triangle' })
        setLit(i)
      }, i * 380),
    )
    timers.current.push(
      setTimeout(
        () => {
          setLit(-1)
          setState(end ? 'ended' : 'waiting')
        },
        notes.length * 380 + 200,
      ),
    )
  }
  const pitches = PHRASE.map((f) => Math.log2(f / 500))
  const y = (p) => 130 - p * 110
  return (
    <div className="gap__frag">
      <p className="mono mono--dim">Fragment B · a phrase</p>
      <svg className="gap__plot" viewBox="0 0 240 160" aria-hidden="true">
        {[40, 70, 100, 130].map((yy) => (
          <line key={yy} x1="10" x2="230" y1={yy} y2={yy} className="gap__axis" />
        ))}
        {pitches.map((p, i) => (
          <circle key={i} cx={22 + i * 30} cy={y(p)} r={lit === i ? 5 : 3.2} className="gap__pt" />
        ))}
        {ending ? (
          <circle
            cx={22 + 6 * 30}
            cy={y(Math.log2(ending.f / 500))}
            r={lit === 6 ? 5 : 3.2}
            className="gap__pt gap__pt--ne"
          />
        ) : (
          <circle cx={22 + 6 * 30} cy={y(Math.log2(523.25 / 500))} r="5" className="gap__ghost" />
        )}
      </svg>
      {state === 'idle' && (
        <button className="btn" onClick={() => play(null)}>
          ▶ Play the phrase
        </button>
      )}
      {state === 'playing' && <p className="mono mono--dim">Listening…</p>}
      {state === 'waiting' && (
        <div className="choice-row">
          {ENDINGS.map((e) => (
            <button
              key={e.k}
              className="btn"
              onClick={() => {
                setEnding(e)
                play(e)
                onDone()
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
      )}
      {state === 'ended' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <p className="prose gap__say">
            {ending.k === 'home'
              ? 'The ending that felt owed. You heard it before it was played.'
              : 'You chose against the pull. Did you feel the pull anyway?'}
          </p>
          <p className="gap__note">
            That pull is learned: years of listening have built a model of which note follows which.
          </p>
          <button className="btn btn--ghost" onClick={() => play(ending)}>
            ↺ Hear it again
          </button>
        </motion.div>
      )}
    </div>
  )
}

/* ───────── fragment 3: a sentence ───────── */

function Sentence({ onDone }) {
  const [pick, setPick] = useState(null)
  return (
    <div className="gap__frag">
      <p className="mono mono--dim">Fragment C · a sentence</p>
      <p className="gap__sentence">
        She unlocked the door with her{' '}
        {pick ? (
          <span className={pick === 'key' ? 'gap__word' : 'gap__word is-odd'}>{pick}.</span>
        ) : (
          <span className="gap__hole">____</span>
        )}
      </p>
      {!pick ? (
        <div className="choice-row">
          {['key', 'card', 'voice', 'elbow'].map((w) => (
            <button
              key={w}
              className="btn"
              onClick={() => {
                setPick(w)
                blip(w === 'key' ? 1000 : 600, 0.015)
                onDone()
              }}
            >
              {w}
            </button>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <p className="prose gap__say">
            {pick === 'key'
              ? 'The word was waiting before the sentence ended.'
              : 'You reached past the word that was waiting.'}
          </p>
          <p className="gap__note">
            When a sentence ends on an unexpected word, the brain produces a measurable response about 400 ms later.
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default function Gap() {
  const [done, setDone] = useState(0)
  const mark = () => setDone((d) => d + 1)
  return (
    <section id="gap" className="sec gap" data-section>
      <SectionHead n="01" title="The Gap" motif="Completion" />
      <div className="grid12">
        <Statement className="big gap__statement" text="Intuition is perception of what is *not there.*" lens />
        <Reveal className="gap__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Every mind completes. Given a fragment, it supplies the rest before it is asked to. Jung called the function
            that does this intuition: perception by way of the unconscious.
          </p>
          <p className="mono mono--dim" style={{ marginTop: 12 }}>
            After C. G. Jung, Psychological Types (1921)
          </p>
        </Reveal>
      </div>

      <div className="gap__frags">
        <Sequence onDone={mark} />
        <Phrase onDone={mark} />
        <Sentence onDone={mark} />
      </div>

      <AnimatePresence>
        {done >= 2 && (
          <motion.p
            className="gap__leap"
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.8, ease: EASE }}
          >
            You didn’t calculate any of these. <span className="t-ne">You leapt.</span>
          </motion.p>
        )}
      </AnimatePresence>

      <Claims>
        <Claim kind="empirical" cite="G. Kanizsa (1955); the Gestalt law of closure">
          The visual system completes incomplete figures: three notched discs, arranged just so, produce a bright
          triangle that is not drawn anywhere.
        </Claim>
        <Claim kind="empirical" cite="Kutas & Hillyard (1980); D. Huron, Sweet Anticipation (2006)" delay={0.1}>
          Expectation can be measured. Unexpected words evoke the N400 brain response, and what listeners expect a
          melody to do next can be predicted from the music they have heard before.
        </Claim>
        <Claim
          kind="argument"
          cite="L. Wittgenstein, Philosophical Investigations §185 (1953); S. Kripke (1982)"
          delay={0.2}
        >
          No finite run of examples fixes how to go on. Something other than the examples decides which continuation
          feels obvious.
        </Claim>
        <Claim kind="open" cite="cf. D. Kahneman, Thinking, Fast and Slow (2011)" delay={0.3}>
          Is Jung’s “intuition” the same thing psychologists now call fast, automatic judgement? They overlap, but
          nobody has shown that they are one process.
        </Claim>
      </Claims>
    </section>
  )
}
