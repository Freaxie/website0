import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { blip, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

const TASKS = [
  {
    key: 'abstract',
    tone: 'ti',
    kicker: 'Version A · in the abstract',
    rule: 'If a card has a vowel on one side, it has an even number on the other.',
    ask: 'Each card has a letter on one side and a number on the other. Which cards must you turn over to find out whether the rule is broken? Turn no more than you need.',
    cards: [
      { front: 'E', back: '2', breaks: false },
      { front: 'K', back: '5', breaks: false },
      { front: '4', back: 'U', breaks: false },
      { front: '7', back: 'A', breaks: true },
    ],
    right: [0, 3],
  },
  {
    key: 'social',
    tone: 'te',
    kicker: 'Version B · in a bar',
    rule: 'If a person is drinking beer, they must be over 18.',
    ask: 'Each card is a person: what they are drinking on one side, their age on the other. Which cards must you turn over to find out whether the rule is broken?',
    cards: [
      { front: 'Beer', back: 'Age 32', breaks: false },
      { front: 'Cola', back: 'Age 15', breaks: false },
      { front: 'Age 25', back: 'Cola', breaks: false },
      { front: 'Age 16', back: 'Beer', breaks: true },
    ],
    right: [0, 3],
  },
]

function Task({ task, onDone, done }) {
  const [sel, setSel] = useState([])
  const [turned, setTurned] = useState(false)
  const toggle = (i) => {
    if (turned) return
    blip(1200, 0.012)
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort()))
  }
  const turn = () => {
    setTurned(true)
    const ok = sel.length === task.right.length && sel.every((x, k) => x === task.right[k])
    tone(ok ? 659.25 : 220, { dur: 1.6, gain: 0.03, type: ok ? 'sine' : 'triangle' })
    onDone({ picked: sel, ok })
  }
  return (
    <div className={`wason__task wason__task--${task.tone}`}>
      <p className={`mono t-${task.tone}`}>{task.kicker}</p>
      <p className="wason__rule">“{task.rule}”</p>
      <p className="prose wason__ask">{task.ask}</p>
      <div className="wason__cards">
        {task.cards.map((c, i) => {
          const picked = sel.includes(i)
          const must = task.right.includes(i)
          return (
            <button
              key={i}
              className={`wason__card ${picked ? 'is-picked' : ''} ${turned ? 'is-turned' : ''} ${turned && must ? 'is-must' : ''}`}
              onClick={() => toggle(i)}
              aria-pressed={picked}
              aria-label={turned ? `${c.front}, other side ${c.back}` : c.front}
            >
              <span className="wason__inner">
                <span className="wason__face wason__face--front">{c.front}</span>
                <span className={`wason__face wason__face--back ${c.breaks ? 'is-breaks' : ''}`}>
                  {c.back}
                  {c.breaks && <em className="mono">breaks the rule</em>}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {!turned && !done ? (
        <button className={`btn btn--${task.tone}`} onClick={turn} disabled={!sel.length}>
          Turn {sel.length ? `${sel.length} card${sel.length > 1 ? 's' : ''}` : 'the cards you chose'}
        </button>
      ) : (
        <p className="mono mono--dim wason__key">
          Needed: {task.right.map((i) => task.cards[i].front).join(' and ')} · you chose{' '}
          {sel.length ? sel.map((i) => task.cards[i].front).join(' and ') : 'none'}
        </p>
      )}
    </div>
  )
}

export default function Wason() {
  const [results, setResults] = useState([])
  const [stage, setStage] = useState(0)

  const finish = (k) => (r) => {
    setResults((x) => {
      const next = x.slice()
      next[k] = r
      return next
    })
    if (k === 0) setTimeout(() => setStage(1), 1800)
  }

  const a = results[0]
  const b = results[1]
  let verdict = null
  if (a && b) {
    if (!a.ok && b.ok)
      verdict = [
        'Like most people: wrong in the abstract, right in the bar.',
        'The logic did not change. The world gave it something to hold on to.',
      ]
    else if (a.ok && b.ok)
      verdict = ['Right both times.', 'Only around one person in ten gets the abstract version right.']
    else if (a.ok && !b.ok)
      verdict = ['Right in the abstract, wrong in the bar.', 'That is the reverse of the usual pattern.']
    else verdict = ['Wrong both times.', 'The rule is hard to see in either costume.']
  }

  return (
    <section id="wason" className="sec wason" data-section>
      <SectionHead n="05" title="Same Logic" motif="Two worlds" />
      <div className="grid12">
        <Statement className="big wason__statement" text="The same rule is easier in the *world.*" />
        <Reveal className="wason__aside" delay={0.3}>
          <p className="prose">
            Two puzzles. Solve the first and the second appears. It is the comparison between your two answers that
            matters.
          </p>
        </Reveal>
      </div>

      <div className="wason__tasks">
        <Task task={TASKS[0]} onDone={finish(0)} done={!!a} />
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, ease: EASE }}
            >
              <Task task={TASKS[1]} onDone={finish(1)} done={!!b} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {a && b && (
          <motion.div
            className="wason__reflect"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.6 }}
          >
            <p className="big big--s">{verdict[0]}</p>
            <p className="whisper">{verdict[1]}</p>
            <p className="prose">
              Both are the same rule: if P, then Q. It is broken only by a card with P and not-Q, so you turn every P
              (the vowel, the beer) and every not-Q (the odd number, the sixteen-year-old). Nothing on the other cards
              can break it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Claims>
        <Claim kind="empirical" cite="P. C. Wason (1966; 1968)">
          In the abstract selection task, typically fewer than one person in ten turns exactly the right cards. Most
          choose the vowel and the even number.
        </Claim>
        <Claim kind="empirical" cite="Griggs & Cox (1982)" delay={0.1}>
          Recast as a drinking-age rule, the same task is solved by around three quarters of people.
        </Claim>
        <Claim kind="model" cite="L. Cosmides (1989); Cheng & Holyoak (1985)" delay={0.2}>
          Why the difference? One theory: minds are tuned to catch people breaking social rules. A rival: we have
          learned schemas for permissions and obligations. The question is still argued.
        </Claim>
        <Claim kind="argument" delay={0.3}>
          Type theory casts introverted thinking as most at home in abstraction and extraverted thinking in rules that
          govern conduct in the world. On this task, most minds of any type find the second far easier.
        </Claim>
      </Claims>
    </section>
  )
}
