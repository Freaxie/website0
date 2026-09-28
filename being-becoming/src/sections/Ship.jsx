import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, easeInOut, lerp, rng, smooth } from '../lib/geom.js'

const CX = 730
const CY = 480

// The ship, part by part: hull planks, mast, a square sail, oars. Each part has a centre, a size and an angle.
function buildShip() {
  const r = rng(1655)
  const parts = []
  for (let row = 0; row < 5; row++) {
    const y = 560 + row * 34
    const left = 330 + row * 30 + row * row * 5
    const right = 1130 - row * 36 - row * row * 11
    let x = left
    while (x < right - 20) {
      const len = Math.min(right - x, 70 + r() * 50)
      parts.push({ cx: x + len / 2, cy: y, w: len - 4, h: 28, rot: 0 })
      x += len
    }
  }
  for (let k = 0; k < 5; k++) parts.push({ cx: 740, cy: 180 + k * 76 + 36, w: 14, h: 72, rot: 0 })
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) parts.push({ cx: 620 + i * 60 + 30, cy: 210 + j * 62 + 31, w: 56, h: 58, rot: 0 })
  for (let k = 0; k < 8; k++) parts.push({ cx: 470 + k * 70, cy: 760, w: 6, h: 130, rot: 28 })
  const order = parts.map((_, i) => i).sort(() => r() - 0.5)
  order.forEach((idx, rank) => (parts[idx].at = 0.1 + (0.58 * rank) / parts.length))
  parts.forEach((p, i) => {
    p.pile = { x: 1230 + (i % 9) * 30, y: 930 - Math.floor(i / 9) * 16, rot: (r() - 0.5) * 50 }
  })
  return parts
}

const STEPS = [
  {
    k: 'I',
    h: 'The Ship',
    p: 'Plutarch tells how the Athenians kept the ship of Theseus for centuries, taking away old planks as they decayed and putting new timber in their place.',
  },
  {
    k: 'II',
    h: 'Plank by Plank',
    p: 'The philosophers, he says, used it as their example of a thing that grows: some held that it stayed the same ship, others that it did not. At which plank would it stop being itself?',
  },
  {
    k: 'III',
    h: 'Two Ships',
    p: 'Thomas Hobbes, in 1655, added a twist: suppose someone kept every old plank and rebuilt them in the same order. Now there are two ships. Which one is the ship of Theseus?',
  },
]

function Stage({ progress, parts }) {
  const ref = useRef(null)
  const fresh = useRef([])
  const old = useRef([])
  const sea = useRef(null)
  const labels = useRef(null)

  useLoop(ref, (t) => {
    const p = progress.get()
    const m = easeInOut(smooth(0.72, 0.86, p))
    const s = 1 - 0.46 * m
    const dxA = -390 * m
    const dxB = 400 * m
    const at = (x, y, dx) => [CX + (x - CX) * s + dx, CY + (y - CY) * s + 60 * m]
    parts.forEach((q, i) => {
      const [ax, ay] = at(q.cx, q.cy, dxA)
      const on = p >= q.at
      const nf = fresh.current[i]
      if (nf) {
        nf.setAttribute('transform', `translate(${ax} ${ay}) rotate(${q.rot}) scale(${s * smooth(q.at, q.at + 0.015, p)})`)
      }
      const of = old.current[i]
      if (!of) return
      // the old plank: in place, then off to the pile, then (in Hobbes's version) back into a ship
      const out = easeInOut(smooth(q.at, q.at + 0.03, p))
      const back = easeInOut(smooth(0.8 + (i % 20) * 0.004, 0.9 + (i % 20) * 0.004, p))
      const [bx, by] = at(q.cx, q.cy, dxB)
      let x = lerp(q.cx, q.pile.x, out)
      let y = lerp(q.cy, q.pile.y, out)
      let rot = lerp(q.rot, q.pile.rot, out)
      let sc = lerp(1, 0.42, out)
      if (on) {
        x = lerp(x, bx, back)
        y = lerp(y, by, back)
        rot = lerp(rot, q.rot, back)
        sc = lerp(sc, s, back)
      }
      of.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${sc})`)
    })
    const pts = []
    for (let k = 0; k <= 40; k++) {
      const x = k * 40
      pts.push(`${k ? 'L' : 'M'}${x} ${735 + 60 * m + Math.sin(k * 0.7 + t * 1.6) * 5}`)
    }
    sea.current?.setAttribute('d', pts.join(''))
    labels.current?.setAttribute('opacity', smooth(0.9, 0.95, p))
  })

  return (
    <svg ref={ref} className="ship__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path ref={sea} className="ship__sea" />
      {parts.map((q, i) => (
        <rect key={`o${i}`} ref={(el) => (old.current[i] = el)} x={-q.w / 2} y={-q.h / 2} width={q.w} height={q.h} className="ship__old" />
      ))}
      {parts.map((q, i) => (
        <rect key={`n${i}`} ref={(el) => (fresh.current[i] = el)} x={-q.w / 2} y={-q.h / 2} width={q.w} height={q.h} className="ship__new" transform="scale(0)" />
      ))}
      <g ref={labels} opacity="0" className="ship__labels">
        <text x={CX - 390} y="775" textAnchor="middle">A · every part new, one unbroken history</text>
        <text x={CX + 400} y="775" textAnchor="middle">B · every part original, rebuilt</text>
      </g>
    </svg>
  )
}

export default function Ship() {
  const ref = useRef(null)
  const parts = useMemo(buildShip, [])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  const [count, setCount] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setStep(p < 0.3 ? 0 : p < 0.72 ? 1 : 2)
    setCount(parts.filter((q) => p >= q.at).length)
  })
  const meter = useTransform(scrollYProgress, (p) => `${p * 100}%`)
  const s = STEPS[step]

  return (
    <section id="ship" className="ship" ref={ref}>
      <div className="ship__sticky">
        <Stage progress={scrollYProgress} parts={parts} />
        <div className="ship__head">
          <SectionHead no="05" title="The Ship" kicker="If every part is replaced, what is left that stays?" />
        </div>
        <div className="ship__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={s.k} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
              <span className="ship__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="ship__count mono" aria-live="polite">
          <b>{count}</b>
          <span>of {parts.length} parts replaced</span>
          <div>
            <motion.i style={{ width: meter }} />
          </div>
        </div>
      </div>
    </section>
  )
}
