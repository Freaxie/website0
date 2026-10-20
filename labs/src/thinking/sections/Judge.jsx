import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { blip, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

// valid × believable, two of each, in an order that mixes them
const ITEMS = [
  {
    p: ['All roses are flowers.', 'Some flowers fade quickly.'],
    c: 'So some roses fade quickly.',
    valid: false,
    believable: true,
    form: 'some',
    t: { s: 'roses', m: 'flowers', p: 'fading' },
  },
  {
    p: ['All birds have feathers.', 'A robin is a bird.'],
    c: 'So a robin has feathers.',
    valid: true,
    believable: true,
    form: 'all',
    t: { s: 'robins', m: 'birds', p: 'feathered' },
  },
  {
    p: ['All mammals can fly.', 'A horse is a mammal.'],
    c: 'So a horse can fly.',
    valid: true,
    believable: false,
    form: 'all',
    t: { s: 'horses', m: 'mammals', p: 'fliers' },
  },
  {
    p: ['All flowers are plants.', 'Some plants are trees.'],
    c: 'So some flowers are trees.',
    valid: false,
    believable: false,
    form: 'some',
    t: { s: 'flowers', m: 'plants', p: 'trees' },
  },
  {
    p: ['All poodles are dogs.', 'Some dogs bark loudly.'],
    c: 'So some poodles bark loudly.',
    valid: false,
    believable: true,
    form: 'some',
    t: { s: 'poodles', m: 'dogs', p: 'loud' },
  },
  {
    p: ['No birds can fly.', 'All eagles are birds.'],
    c: 'So no eagles can fly.',
    valid: true,
    believable: false,
    form: 'none',
    t: { s: 'eagles', m: 'birds', p: 'fliers' },
  },
  {
    p: ['No fish are mammals.', 'All sharks are fish.'],
    c: 'So no sharks are mammals.',
    valid: true,
    believable: true,
    form: 'none',
    t: { s: 'sharks', m: 'fish', p: 'mammals' },
  },
  {
    p: ['All whales are mammals.', 'Some mammals live in trees.'],
    c: 'So some whales live in trees.',
    valid: false,
    believable: false,
    form: 'some',
    t: { s: 'whales', m: 'mammals', p: 'in trees' },
  },
]

// Euler circles: for a valid form, the only way the premises can be true; for an invalid one, a counterexample
function Euler({ item }) {
  const { s, m, p } = item.t
  const lab = (x, y, text, cls = '') => (
    <text x={x} y={y} className={`judge__eul-lab ${cls}`} textAnchor="middle">
      {text}
    </text>
  )
  return (
    <svg viewBox="0 0 240 132" className="judge__euler" aria-hidden="true">
      {item.form === 'all' && (
        <>
          <circle cx="120" cy="66" r="58" className="judge__eul judge__eul--p" />
          <circle cx="120" cy="74" r="38" className="judge__eul" />
          <circle cx="120" cy="86" r="20" className="judge__eul judge__eul--s" />
          {lab(120, 20, p, 'is-p')}
          {lab(120, 50, m)}
          {lab(120, 90, s, 'is-s')}
        </>
      )}
      {item.form === 'none' && (
        <>
          <circle cx="78" cy="66" r="50" className="judge__eul" />
          <circle cx="78" cy="78" r="20" className="judge__eul judge__eul--s" />
          <circle cx="186" cy="66" r="40" className="judge__eul judge__eul--p" />
          {lab(78, 34, m)}
          {lab(78, 82, s, 'is-s')}
          {lab(186, 70, p, 'is-p')}
        </>
      )}
      {item.form === 'some' && (
        <>
          <circle cx="104" cy="66" r="56" className="judge__eul" />
          <circle cx="74" cy="72" r="24" className="judge__eul judge__eul--s" />
          <circle cx="170" cy="66" r="40" className="judge__eul judge__eul--p judge__eul--x" />
          {lab(96, 24, m)}
          {lab(74, 76, s, 'is-s')}
          {lab(184, 70, p, 'is-p')}
        </>
      )}
    </svg>
  )
}

function why(item) {
  if (item.valid) return 'If both premises were true, the conclusion would have to be. Valid, whatever the words mean.'
  return 'Both premises can be true while the conclusion is false: the overlap need not include them. Invalid.'
}

export default function Judge() {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState([])
  const done = answers.length === ITEMS.length
  const item = ITEMS[Math.min(i, ITEMS.length - 1)]

  const answer = (follows) => {
    blip(follows ? 1300 : 900, 0.014)
    const next = [...answers, follows]
    setAnswers(next)
    if (next.length < ITEMS.length) setI(i + 1)
    else tone(392, { dur: 2.2, gain: 0.03 })
  }

  const correct = (k) => answers[k] === ITEMS[k].valid
  const conflict = ITEMS.map((it, k) => k).filter((k) => ITEMS[k].valid !== ITEMS[k].believable)
  const agree = ITEMS.map((it, k) => k).filter((k) => ITEMS[k].valid === ITEMS[k].believable)
  const acc = (ks) => ks.filter(correct).length
  let verdict = ''
  if (done) {
    const a = acc(agree)
    const c = acc(conflict)
    if (a + c === ITEMS.length)
      verdict = 'You kept form and content apart every time. That separation is the discipline thinking is named for.'
    else if (c < a)
      verdict =
        'Your beliefs voted. Where the conclusion sounded right, or sounded absurd, logic had a harder time being heard.'
    else verdict = 'Your mistakes did not follow your beliefs this time. Most people’s do.'
  }

  return (
    <section id="judge" className="sec judge" data-section>
      <SectionHead n="01" title="The Judge" motif="Validity" />
      <div className="grid12">
        <Statement className="big judge__statement" text="Valid is not the same as *true.*" lens />
        <Reveal className="judge__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Jung counted thinking among the judging functions: it decides by logical criteria. Its first discipline is
            to judge the shape of an argument apart from whether you like where it ends.
          </p>
          <p className="mono mono--dim" style={{ marginTop: 12 }}>
            After C. G. Jung, Psychological Types (1921)
          </p>
        </Reveal>
      </div>

      <div className="judge__bench">
        <div className="judge__head mono mono--dim">
          <span>
            Argument {String(Math.min(answers.length + 1, ITEMS.length)).padStart(2, '0')} /{' '}
            {String(ITEMS.length).padStart(2, '0')}
          </span>
          <span>Judge the form only. Does the conclusion follow from the premises?</span>
        </div>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={i}
              className="judge__arg"
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {item.p.map((line, k) => (
                <motion.p
                  key={k}
                  className="judge__premise"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + k * 0.35, ease: EASE }}
                >
                  <span className="mono mono--dim">P{k + 1}</span> {line}
                </motion.p>
              ))}
              <motion.p
                className="judge__conclusion"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.95 }}
              >
                {item.c}
              </motion.p>
              <div className="choice-row judge__choices">
                <button className="btn btn--ti" onClick={() => answer(true)}>
                  It follows
                </button>
                <button className="btn" onClick={() => answer(false)}>
                  It does not follow
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              className="judge__result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
            >
              <div className="judge__matrix" role="table" aria-label="Your accuracy by kind of argument">
                <span />
                <span className="mono mono--dim">Believable conclusion</span>
                <span className="mono mono--dim">Unbelievable conclusion</span>
                {[true, false].map((valid) => (
                  <div key={String(valid)} className="judge__mrow" role="row">
                    <span className="mono mono--dim">{valid ? 'Valid' : 'Invalid'}</span>
                    {[true, false].map((bel) => {
                      const ks = ITEMS.map((it, k) => k).filter(
                        (k) => ITEMS[k].valid === valid && ITEMS[k].believable === bel,
                      )
                      const clash = valid !== bel
                      return (
                        <span key={String(bel)} className={`judge__cell ${clash ? 'is-clash' : ''}`} role="cell">
                          {ks.map((k) => (
                            <i key={k} className={correct(k) ? 'is-right' : 'is-wrong'} />
                          ))}
                          <em className="mono">{clash ? 'belief and logic disagree' : 'belief and logic agree'}</em>
                        </span>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="judge__read">
                <p className="big big--s">
                  {acc(agree) + acc(conflict)} of {ITEMS.length} judged correctly.
                </p>
                <p className="mono mono--dim">
                  Where belief and logic agreed · {acc(agree)} / {agree.length} &nbsp; Where they disagreed ·{' '}
                  <span className="t-ti">{acc(conflict)}</span> / {conflict.length}
                </p>
                <p className="prose">{verdict}</p>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setAnswers([])
                    setI(0)
                  }}
                >
                  ↺ Judge again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {done && (
        <div className="judge__review">
          {ITEMS.map((it, k) => (
            <Reveal key={k} className={`judge__card ${correct(k) ? '' : 'is-missed'}`} delay={k * 0.06}>
              <p className="mono mono--dim">
                {String(k + 1).padStart(2, '0')} · {it.valid ? 'valid' : 'invalid'} ·{' '}
                {correct(k) ? (
                  <span className="t-ti">you judged it right</span>
                ) : (
                  <span className="t-te">you judged it wrong</span>
                )}
              </p>
              <p className="judge__mini">
                {it.p.join(' ')} <strong>{it.c}</strong>
              </p>
              <Euler item={it} />
              <p className="judge__why">{why(it)}</p>
            </Reveal>
          ))}
        </div>
      )}

      <Claims>
        <Claim kind="empirical" cite="Evans, Barston & Pollard (1983)">
          Belief bias: in the classic study, 71% of people accepted an invalid argument when its conclusion was
          believable, and only 10% when it was not. The form was the same; the content decided.
        </Claim>
        <Claim kind="model" cite="e.g. Evans & Stanovich (2013)" delay={0.1}>
          Dual-process accounts explain this as a fast, belief-based response competing with slower analysis of form.
          How separate the two processes really are is debated.
        </Claim>
        <Claim kind="model" cite="C. G. Jung, Psychological Types (1921)" delay={0.2}>
          For Jung, both kinds of thinking judge by criteria. They differ in where the criteria come from: inner ideas
          and principles for introverted thinking, outer facts and standards for extraverted thinking.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Do people who prefer “thinking” on type questionnaires reason more validly? There is little direct evidence
          either way.
        </Claim>
      </Claims>
    </section>
  )
}
