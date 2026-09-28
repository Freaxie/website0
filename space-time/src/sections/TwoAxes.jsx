import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Rows are counterparts: Here faces Now, There faces Then, Beside faces After, Distance faces Duration.
const SPACE = [
  { word: 'Here', gloss: 'The point you occupy. Every map needs one.', glyph: 'here' },
  { word: 'There', gloss: 'Somewhere you are not, but could go.', glyph: 'there' },
  { word: 'Beside', gloss: 'Two things at once, side by side. Simultaneity.', glyph: 'beside' },
  { word: 'Distance', gloss: 'A gap that can be measured, walked, crossed back.', glyph: 'distance' },
]
const TIME = [
  { word: 'Now', gloss: 'The only moment that is ever present, and it will not stay.' },
  { word: 'Then', gloss: 'Before and after: memory on one side, expectation on the other.' },
  { word: 'After', gloss: 'An order you cannot reverse. Effects follow causes.' },
  { word: 'Duration', gloss: 'Time as it is lived: stretched by waiting, shrunk by joy.' },
]

function Glyph({ kind }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
  const dots = (skip) =>
    Array.from({ length: 16 }, (_, i) => (i === skip ? null : <circle key={i} cx={10 + (i % 4) * 20} cy={10 + Math.floor(i / 4) * 20} r="1.6" fill="currentColor" />))
  return (
    <svg viewBox="0 0 80 80" className="glyph" aria-hidden="true">
      {kind === 'here' && (
        <>
          {dots(5)}
          <circle cx="30" cy="30" r="7" fill="currentColor" />
          <path d="M30 0V80M0 30H80" {...s} strokeWidth="0.7" />
        </>
      )}
      {kind === 'there' && (
        <>
          {dots(-1)}
          <circle cx="10" cy="70" r="5" {...s} />
          <circle cx="70" cy="10" r="7" fill="currentColor" />
          <path d="M14 66L64 16" {...s} strokeDasharray="3 4" />
        </>
      )}
      {kind === 'beside' && (
        <>
          <rect x="6" y="24" width="32" height="32" fill="currentColor" />
          <rect x="42" y="24" width="32" height="32" {...s} />
          <path d="M6 66H74" {...s} strokeWidth="0.7" />
        </>
      )}
      {kind === 'distance' && (
        <>
          <circle cx="10" cy="40" r="5" fill="currentColor" />
          <circle cx="70" cy="40" r="5" fill="currentColor" />
          <path d="M10 56H70M10 50V62M70 50V62" {...s} />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${20 + i * 7.5} 56V${i % 2 ? 53 : 51}`} {...s} strokeWidth="0.8" />
          ))}
        </>
      )}
    </svg>
  )
}

// A clock face whose hand has swept a different share for each word: now is a sliver, duration a long arc.
function Arc({ share }) {
  const a = share * Math.PI * 2 - Math.PI / 2
  const x = 40 + Math.cos(a) * 30
  const y = 40 + Math.sin(a) * 30
  return (
    <svg viewBox="0 0 80 80" className="glyph glyph--time" aria-hidden="true">
      <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d={`M40 40L40 10A30 30 0 ${share > 0.5 ? 1 : 0} 1 ${x} ${y}Z`} fill="currentColor" />
    </svg>
  )
}

export default function TwoAxes() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]
  const shares = [0.02, 0.3, 0.55, 0.86]

  return (
    <section id="axes" className="axes">
      <SectionHead
        no="02"
        title="Two Axes"
        kicker="Two ways a world is arranged. Space sets things side by side; time sets them one after another. Neither means much without the other."
      />

      {hover >= 0 && (
        <div className="axes__pair mono" aria-hidden="true">
          {SPACE[hover].word} <span>⟷</span> {TIME[hover].word}
        </div>
      )}

      <div className="axes__grid">
        <motion.div className="axes__space" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="axes__label mono">
            <span>x</span> Space — <i>the order of things together</i>
          </div>
          {SPACE.map((a, i) => (
            <motion.div
              key={a.word}
              className={`srow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{
                hidden: { clipPath: 'inset(0 100% 0 0)' },
                show: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 1, delay: 0.2 + i * 0.14, ease } },
              }}
            >
              <span className="srow__no mono">x{i}</span>
              <span className="srow__word">{a.word}</span>
              <Glyph kind={a.glyph} />
              <p className="srow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="axes__time" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="axes__label mono">
            <span>t</span> Time — <i>the order of things in turn</i>
          </div>
          {TIME.map((d, i) => (
            <motion.div
              key={d.word}
              className={`trow trow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{
                hidden: { opacity: 0, x: -80 },
                show: { opacity: 1, x: 0, transition: { duration: 1.4, delay: 0.5 + i * 0.35, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <div className="trow__head">
                <span className="trow__word">{d.word}</span>
                <Arc share={shares[i]} />
              </div>
              <p className="trow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
