import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Shane Frederick's Cognitive Reflection Test (2005): each question has a quick answer that feels right.
const QS = [
  {
    q: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
    unit: 'cents',
    gut: 10,
    right: 5,
    why: 'If the ball were 10¢, the bat would be $1.10 and the pair $1.20. Ball 5¢ + bat $1.05 = $1.10.',
  },
  {
    q: 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?',
    unit: 'minutes',
    gut: 100,
    right: 5,
    why: 'Each machine makes one widget in 5 minutes. A hundred machines make a hundred widgets in the same 5 minutes.',
  },
  {
    q: 'In a lake there is a patch of lily pads. Every day it doubles in size. If it takes 48 days to cover the whole lake, how long would it take to cover half of it?',
    unit: 'days',
    gut: 24,
    right: 47,
    why: 'It doubles every day, so the day before the lake is covered, it was half covered: day 47.',
  },
]

const parse = (s) => {
  const m = String(s).replace(',', '.').match(/-?\d+(\.\d+)?/)
  if (!m) return null
  let v = parseFloat(m[0])
  if (/\$|dollar/i.test(s) || (v > 0 && v < 1)) v = Math.round(v * 100)
  return v
}

export default function FastSlow() {
  const ref = useRef(null)
  const input = useRef(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [i, setI] = useState(0)
  const [val, setVal] = useState('')
  const [results, setResults] = useState([])
  const [start, setStart] = useState(null)
  const [now, setNow] = useState(0)
  const answered = results[i]
  const done = results.length === QS.length && i === QS.length - 1 && answered

  useEffect(() => {
    if (inView && start === null) setStart(performance.now())
  }, [inView, start])
  useEffect(() => {
    if (answered || start === null) return
    const id = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(id)
  }, [answered, start])

  const submit = (e) => {
    e.preventDefault()
    const v = parse(val)
    if (v === null) return
    const secs = (performance.now() - (start ?? performance.now())) / 1000
    const q = QS[i]
    setResults((r) => {
      const next = [...r]
      next[i] = { v, secs, kind: v === q.right ? 'right' : v === q.gut ? 'gut' : 'other' }
      return next
    })
  }
  const next = () => {
    setI((k) => k + 1)
    setVal('')
    setStart(performance.now())
    setTimeout(() => input.current?.focus(), 50)
  }
  const reset = () => {
    setI(0)
    setVal('')
    setResults([])
    setStart(performance.now())
  }

  const q = QS[i]
  const elapsed = answered ? answered.secs : start ? Math.max(0, (now - start) / 1000) : 0
  const gutCount = results.filter((r) => r?.kind === 'gut').length
  const rightCount = results.filter((r) => r?.kind === 'right').length

  return (
    <section id="fastslow" className="fs" ref={ref}>
      <div className="fs__top">
        <SectionHead no="04" title="Fast & Slow" kicker="Three questions. Answer the way you normally would. Each one has a quick answer that feels right." />
        <div className="fs__clock mono" aria-hidden="true">
          <span>Time on this question</span>
          <b>{elapsed.toFixed(1)}s</b>
        </div>
      </div>

      <div className="fs__body">
        <ol className="fs__dots mono" aria-label="Progress">
          {QS.map((_, k) => (
            <li key={k} className={`${k === i ? 'is-on' : ''} ${results[k] ? `is-${results[k].kind}` : ''}`}>
              {k + 1}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={i} className="fs__card" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
            <p className="fs__q">{q.q}</p>
            <form className="fs__form" onSubmit={submit}>
              <label htmlFor={`fs-${i}`} className="mono">
                Your answer, in {q.unit}
              </label>
              <div className="fs__row">
                <input id={`fs-${i}`} ref={input} value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" autoComplete="off" disabled={!!answered} />
                <span className="mono">{q.unit}</span>
                {!answered && (
                  <button type="submit" className="fs__btn mono" disabled={parse(val) === null}>
                    Answer
                  </button>
                )}
              </div>
            </form>

            {answered && (
              <motion.div className="fs__reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} aria-live="polite">
                <div className="fs__cols">
                  <div className="fs__col fs__col--gut">
                    <span className="mono">The quick answer</span>
                    <b>
                      {q.gut} <small>{q.unit}</small>
                    </b>
                  </div>
                  <div className="fs__col fs__col--right">
                    <span className="mono">The worked answer</span>
                    <b>
                      {q.right} <small>{q.unit}</small>
                    </b>
                  </div>
                </div>
                <p className="fs__verdict">
                  {answered.kind === 'right' && <>You answered {answered.v}: the slow answer, in {answered.secs.toFixed(1)} seconds.</>}
                  {answered.kind === 'gut' && <>You answered {answered.v}: the fast one. It is the answer most people reach first.</>}
                  {answered.kind === 'other' && <>You answered {answered.v}, which is neither.</>}
                </p>
                <p className="fs__why">{q.why}</p>
                {i < QS.length - 1 ? (
                  <button type="button" className="fs__btn mono" onClick={next}>
                    Next question →
                  </button>
                ) : (
                  <button type="button" className="fs__btn fs__btn--ghost mono" onClick={reset}>
                    Start again
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {done && (
        <motion.p className="fs__summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {rightCount} worked {rightCount === 1 ? 'answer' : 'answers'}, {gutCount} quick {gutCount === 1 ? 'one' : 'ones'}. Many people, including students at leading universities, give at least one of the quick answers.
        </motion.p>
      )}

      <div className="fs__notes">
        <p>
          <span className="mono">Two systems</span>
          Daniel Kahneman, Thinking, Fast and Slow (2011): a fast, automatic mode that answers at once, and a slow, effortful mode that checks. The fast one is usually right, which is why we trust it.
        </p>
        <p>
          <span className="mono">A caution</span>
          Fast intuition is not the same thing as passion. But the quick answer arrives with a feeling attached, the feeling that it is obviously right, and that feeling is what the slow system has to overrule.
        </p>
      </div>
    </section>
  )
}
