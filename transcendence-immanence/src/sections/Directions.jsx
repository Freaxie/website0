import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Rows are counterparts: Beyond faces Within, Above faces Among, Apart faces Throughout, Other faces Here.
const T = [
  { word: 'Beyond', gloss: 'Outside the world rather than a part of it.' },
  { word: 'Above', gloss: 'Higher than anything that can be measured or reached.' },
  { word: 'Apart', gloss: 'Separate from what it grounds, as a maker stands apart from what is made.' },
  { word: 'Other', gloss: 'Wholly unlike anything we know, spoken of mostly by saying what it is not.' },
]
const I = [
  { word: 'Within', gloss: 'Not outside the world but its inside, its depth.' },
  { word: 'Among', gloss: 'On one level with everything else. No view from above.' },
  { word: 'Throughout', gloss: 'Present in every part, the way salt is in the sea.' },
  { word: 'Here', gloss: 'Nowhere else to look. This world is enough to be going on with.' },
]

function TGlyph({ i }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1 }
  return (
    <svg viewBox="0 0 60 80" className="glyph" aria-hidden="true">
      <path d="M0 70H60" {...s} />
      {i === 0 && <path d="M30 70V4M24 12L30 4L36 12" {...s} />}
      {i === 1 && <circle cx="30" cy="8" r="5" fill="currentColor" />}
      {i === 2 && (
        <>
          <rect x="16" y="50" width="28" height="20" {...s} />
          <circle cx="30" cy="14" r="5" fill="currentColor" />
          <path d="M30 20V42" {...s} strokeDasharray="2 3" />
        </>
      )}
      {i === 3 && <circle cx="30" cy="30" r="14" {...s} strokeDasharray="1 4" />}
    </svg>
  )
}

function IGlyph({ i }) {
  const dots = Array.from({ length: 25 }, (_, k) => [8 + (k % 5) * 11, 8 + Math.floor(k / 5) * 11])
  return (
    <svg viewBox="0 0 60 60" className="glyph" aria-hidden="true">
      {dots.map(([x, y], k) => {
        const hit = i === 0 ? k === 12 : i === 1 ? k % 2 === 0 : i === 2 ? true : k === 12 || k === 7 || k === 11 || k === 13 || k === 17
        return <circle key={k} cx={x} cy={y} r={hit ? 3.2 : 1.4} fill="currentColor" />
      })}
    </svg>
  )
}

export default function Directions() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="directions" className="dir">
      <SectionHead
        no="02"
        title="Two Directions"
        kicker="Where should we look for what matters most: past the world, or deeper into it? Both answers are old, and both are still held."
      />

      {hover >= 0 && (
        <div className="dir__pair mono" aria-hidden="true">
          {T[hover].word} <span>⟷</span> {I[hover].word}
        </div>
      )}

      <div className="dir__grid">
        <motion.div className="dir__t" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="dir__label mono">
            <span>↑</span> Transcendence — <i>the beyond</i>
          </div>
          {T.map((a, i) => (
            <motion.div
              key={a.word}
              className={`trow trow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { opacity: 0, y: 70 }, show: { opacity: 1, y: 0, transition: { duration: 1.4, delay: 0.2 + i * 0.16, ease } } }}
            >
              <div className="trow__head">
                <span className="trow__word">{a.word}</span>
                <TGlyph i={i} />
              </div>
              <p className="trow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="dir__i" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="dir__label mono">
            <span>·</span> Immanence — <i>the within</i>
          </div>
          {I.map((d, i) => (
            <motion.div
              key={d.word}
              className={`irow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { clipPath: 'inset(100% 0 0 0)' }, show: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 1, delay: 0.2 + i * 0.12, ease } } }}
            >
              <span className="irow__word">{d.word}</span>
              <IGlyph i={i} />
              <p className="irow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
