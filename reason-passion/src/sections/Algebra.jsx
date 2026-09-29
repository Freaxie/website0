import { useEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useSpring } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

let uid = 100
const START = [
  { id: 1, side: 'pro', text: 'A better job', w: 4, kind: 'reason' },
  { id: 2, side: 'pro', text: 'Living by the sea', w: 2, kind: 'feeling' },
  { id: 3, side: 'pro', text: 'A fresh start', w: 3, kind: 'feeling' },
  { id: 4, side: 'con', text: 'Leaving my friends', w: 4, kind: 'feeling' },
  { id: 5, side: 'con', text: 'Higher rent', w: 3, kind: 'reason' },
  { id: 6, side: 'con', text: 'The work of moving', w: 1, kind: 'reason' },
]

// Franklin's rule: where a reason on one side equals one on the other, strike them both out.
function strike(items) {
  const pros = items.filter((x) => x.side === 'pro')
  const cons = items.filter((x) => x.side === 'con')
  const out = new Set()
  for (const p of pros) {
    const c = cons.find((c) => !out.has(c.id) && c.w === p.w)
    if (c) {
      out.add(p.id)
      out.add(c.id)
    }
  }
  return out
}

export default function Algebra() {
  const [title, setTitle] = useState('Should I move to a new city?')
  const [items, setItems] = useState(START)
  const [struck, setStruck] = useState(new Set())
  const [noFeel, setNoFeel] = useState(false)
  const [draft, setDraft] = useState({ text: '', side: 'pro', kind: 'reason' })

  const live = items.filter((x) => !struck.has(x.id) && !(noFeel && x.kind === 'feeling'))
  const pro = live.filter((x) => x.side === 'pro').reduce((s, x) => s + x.w, 0)
  const con = live.filter((x) => x.side === 'con').reduce((s, x) => s + x.w, 0)
  const tilt = Math.max(-18, Math.min(18, (con - pro) * 2.4))
  const verdict = pro === con ? 'In balance. Sleep on it.' : pro > con ? `Leaning yes, by ${pro - con}.` : `Leaning no, by ${con - pro}.`

  const update = (id, patch) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const remove = (id) => setItems((xs) => xs.filter((x) => x.id !== id))
  const add = (e) => {
    e.preventDefault()
    if (!draft.text.trim()) return
    setItems((xs) => [...xs, { id: uid++, side: draft.side, text: draft.text.trim(), w: 3, kind: draft.kind }])
    setDraft((d) => ({ ...d, text: '' }))
    setStruck(new Set())
  }

  const blocks = { pro: live.filter((x) => x.side === 'pro'), con: live.filter((x) => x.side === 'con') }
  // the beam swings on a spring; the pans counter-rotate so they always hang level
  const spring = useSpring(0, { stiffness: 60, damping: 10 })
  useEffect(() => spring.set(tilt), [tilt, spring])
  // written straight to the SVG attributes: a motion value bound to `transform` on an SVG group is not applied
  const beam = useRef(null)
  const panL = useRef(null)
  const panR = useRef(null)
  useMotionValueEvent(spring, 'change', (a) => {
    beam.current?.setAttribute('transform', `rotate(${a} 200 110)`)
    panL.current?.setAttribute('transform', `rotate(${-a} 60 110)`)
    panR.current?.setAttribute('transform', `rotate(${-a} 340 110)`)
  })

  const column = (side) => (
    <div className={`alg__col alg__col--${side}`}>
      <h3 className="mono">{side === 'pro' ? 'Pro' : 'Con'}</h3>
      <ul>
        {items
          .filter((x) => x.side === side)
          .map((x) => {
            const off = struck.has(x.id) || (noFeel && x.kind === 'feeling')
            return (
              <li key={x.id} className={`alg__item alg__item--${x.kind} ${off ? 'is-off' : ''}`}>
                <button type="button" className="alg__kind mono" onClick={() => update(x.id, { kind: x.kind === 'reason' ? 'feeling' : 'reason' })} aria-label={`Marked as ${x.kind}. Switch`}>
                  {x.kind === 'reason' ? 'R' : 'F'}
                </button>
                <span className="alg__text">{x.text}</span>
                <span className="alg__w">
                  <button type="button" onClick={() => update(x.id, { w: Math.max(1, x.w - 1) })} aria-label="Less weight">
                    −
                  </button>
                  <b className="mono">{x.w}</b>
                  <button type="button" onClick={() => update(x.id, { w: Math.min(5, x.w + 1) })} aria-label="More weight">
                    +
                  </button>
                </span>
                <button type="button" className="alg__del" onClick={() => remove(x.id)} aria-label={`Remove ${x.text}`}>
                  ×
                </button>
              </li>
            )
          })}
      </ul>
    </div>
  )

  const stack = (list, x0) => {
    let y = 0
    return list.map((b) => {
      const h = b.w * 9
      y += h + 2
      return <rect key={b.id} x={x0 - (40 + b.w * 8) / 2} y={-y} width={40 + b.w * 8} height={h} className={`alg__block alg__block--${b.kind}`} />
    })
  }

  return (
    <section id="algebra" className="alg">
      <div className="alg__top">
        <SectionHead
          no="05"
          title="Prudential Algebra"
          kicker="Benjamin Franklin’s method for hard choices, from a letter of 1772: list the pros and cons, weigh each, and strike out the ones that cancel. Try it on the example, or on your own."
        />
        <label className="alg__title">
          <span className="mono">The question</span>
          <input id="alg-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>

      <div className="alg__body">
        {column('pro')}

        <div className="alg__scale">
          <svg viewBox="0 0 400 300" role="img" aria-label={`Pros weigh ${pro}, cons weigh ${con}. ${verdict}`}>
            <path d="M200 280V110M150 290H250" className="alg__stand" />
            <g ref={beam}>
              <path d="M40 110H360" className="alg__beam" />
              <circle cx="200" cy="110" r="6" className="alg__pivot" />
              <g ref={panL}>
                <path d="M60 110L20 200H100Z" className="alg__string" />
                <path d="M10 200H110" className="alg__pan" />
                <g transform="translate(60 198)">{stack(blocks.pro, 0)}</g>
              </g>
              <g ref={panR}>
                <path d="M340 110L300 200H380Z" className="alg__string" />
                <path d="M290 200H390" className="alg__pan" />
                <g transform="translate(340 198)">{stack(blocks.con, 0)}</g>
              </g>
            </g>
          </svg>
          <div className="alg__totals mono" aria-live="polite">
            <span>Pro {pro}</span>
            <b>{verdict}</b>
            <span>Con {con}</span>
          </div>
          <div className="alg__actions">
            <button type="button" className="alg__btn mono" onClick={() => setStruck(struck.size ? new Set() : strike(items))}>
              {struck.size ? 'Restore struck items' : 'Strike out equal weights'}
            </button>
            <button type="button" className={`alg__btn alg__btn--m mono ${noFeel ? 'is-on' : ''}`} onClick={() => setNoFeel((v) => !v)} aria-pressed={noFeel}>
              {noFeel ? 'Put the feelings back' : 'Weigh without feelings'}
            </button>
          </div>
        </div>

        {column('con')}
      </div>

      <form className="alg__add" onSubmit={add}>
        <label htmlFor="alg-new" className="mono">
          Add a consideration
        </label>
        <input id="alg-new" value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} placeholder="e.g. My family is here" />
        <select id="alg-side" value={draft.side} onChange={(e) => setDraft((d) => ({ ...d, side: e.target.value }))} aria-label="Side">
          <option value="pro">Pro</option>
          <option value="con">Con</option>
        </select>
        <select id="alg-kind" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))} aria-label="Kind">
          <option value="reason">Reason</option>
          <option value="feeling">Feeling</option>
        </select>
        <button type="submit" className="alg__btn mono">
          Add
        </button>
      </form>

      <div className="alg__notes">
        <p>
          <span className="mono">Franklin, 1772</span>
          “…where I find one on each side that seem equal, I strike them both out.” After a few days of this, he wrote to Joseph Priestley, you can see where the balance lies.
        </p>
        <p>
          <span className="mono">Without feelings</span>
          {noFeel
            ? 'Look at what is left. And ask why even the “reasons” weigh anything: a better job matters only because you care about something it brings.'
            : 'Try weighing without feelings. The neurologist Antonio Damasio described patients whose emotional life had been damaged by injury to the frontal lobes: they reasoned normally on tests, yet struggled to make everyday decisions.'}
        </p>
      </div>
    </section>
  )
}
