import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { rng } from '../lib/geom.js'

const W = 1600
const H = 820
const COUNT = 72

export default function HereNow() {
  const svg = useRef(null)
  const [you, setYou] = useState({ x: 800, y: 430 })
  const events = useMemo(() => {
    const r = rng(1908)
    return Array.from({ length: COUNT }, () => ({ x: 40 + r() * (W - 80), y: 30 + r() * (H - 60), s: 4 + r() * 5 }))
  }, [])

  const place = (e) => {
    const pt = svg.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const q = pt.matrixTransform(svg.current.getScreenCTM().inverse())
    setYou({ x: Math.max(20, Math.min(W - 20, q.x)), y: Math.max(20, Math.min(H - 20, q.y)) })
  }

  let past = 0
  let future = 0
  const kinds = events.map((ev) => {
    const dt = you.y - ev.y // time runs up the wall
    const dx = Math.abs(ev.x - you.x)
    if (dx <= dt) return future++, 'future'
    if (dx <= -dt) return past++, 'past'
    return 'elsewhere'
  })
  const elsewhere = COUNT - past - future
  const R = 2000

  return (
    <section id="herenow" className="hn">
      <div className="hn__top">
        <SectionHead no="07" title="Here, Now" kicker="Every experience has one address: a place and a moment at once. Move yours." />
        <div className="hn__counts mono" aria-live="polite">
          <div className="hn__c hn__c--future">
            <b>{future}</b> in your future
          </div>
          <div className="hn__c hn__c--past">
            <b>{past}</b> in your past
          </div>
          <div className="hn__c hn__c--else">
            <b>{elsewhere}</b> elsewhere
          </div>
        </div>
      </div>

      <div className="hn__stage">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="hn__svg"
          onPointerMove={place}
          onPointerDown={place}
          role="img"
          aria-label={`A field of ${COUNT} events. From your position, ${future} lie in your future light cone, ${past} in your past, and ${elsewhere} elsewhere.`}
        >
          <rect width={W} height={H} className="hn__bg" />
          <path d={`M${you.x} ${you.y}L${you.x + R} ${you.y - R}L${you.x - R} ${you.y - R}Z`} className="hn__future" />
          <path d={`M${you.x} ${you.y}L${you.x + R} ${you.y + R}L${you.x - R} ${you.y + R}Z`} className="hn__past" />
          <path d={`M${you.x} 0V${H}M0 ${you.y}H${W}`} className="hn__axes" />
          {events.map((ev, i) => (
            <circle key={i} cx={ev.x} cy={ev.y} r={ev.s} className={`hn__ev hn__ev--${kinds[i]}`} />
          ))}
          <g transform={`translate(${you.x} ${you.y})`}>
            <circle r="16" className="hn__you" />
            <circle r="30" className="hn__youring" />
            <text x="40" y="-14" className="hn__youlabel">
              here, now
            </text>
          </g>
          <text x="24" y={H - 20} className="hn__axislabel">
            SPACE →
          </text>
          <text x="24" y="40" className="hn__axislabel">
            ↑ TIME
          </text>
        </svg>
      </div>

      <motion.div className="hn__notes" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
        {[
          ['Future cone', 'Events you could still reach or signal, at or below the speed of light.', 'future'],
          ['Past cone', 'Events that could have reached you: everything that can have caused this moment.', 'past'],
          ['Elsewhere', 'Too far away for any signal to connect. Observers moving differently disagree about whether these happened before you or after, and none of them is wrong.', 'else'],
        ].map(([h, p, k], i) => (
          <motion.div
            key={h}
            className={`hn__note hn__note--${k}`}
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.8 } } }}
          >
            <span className="mono">{h}</span>
            <p>{p}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
