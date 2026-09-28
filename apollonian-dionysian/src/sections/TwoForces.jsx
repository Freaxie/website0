import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { rng } from '../lib/geom.js'

// Rows are opposites: Form faces Becoming, Boundary faces Unity, and so on.
const APOLLO = [
  { word: 'Form', gloss: 'The world held still long enough to be seen.', glyph: 'form' },
  { word: 'Boundary', gloss: 'Where I end and you begin. The line that makes a self.', glyph: 'boundary' },
  { word: 'Clarity', gloss: 'Light on a surface. The dream-image, sharply outlined.', glyph: 'clarity' },
  { word: 'Measure', gloss: 'Nothing in excess. Proportion as an ethic.', glyph: 'measure' },
]
const DION = [
  { word: 'Becoming', gloss: 'Nothing is finished. Every shape is a moment in a current.' },
  { word: 'Unity', gloss: 'The wall between self and world, and self and other, gives way.' },
  { word: 'Instinct', gloss: 'What moves in us before thought has found its name.' },
  { word: 'Ecstasy', gloss: 'Ek-stasis: standing outside oneself.' },
]

function Glyph({ kind }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
  return (
    <svg viewBox="0 0 80 80" className="glyph" aria-hidden="true">
      {kind === 'form' && (
        <>
          <rect x="8" y="8" width="64" height="64" {...s} />
          <circle cx="40" cy="40" r="32" {...s} />
          <circle cx="40" cy="40" r="4" fill="currentColor" />
        </>
      )}
      {kind === 'boundary' && (
        <>
          <circle cx="40" cy="40" r="26" fill="currentColor" />
          <circle cx="40" cy="40" r="34" {...s} strokeDasharray="2 4" />
          <path d="M4 74H76" {...s} />
        </>
      )}
      {kind === 'clarity' && (
        <>
          <circle cx="40" cy="40" r="30" {...s} />
          <path d="M40 2V78M2 40H78" {...s} strokeWidth="0.8" />
          <circle cx="40" cy="40" r="12" {...s} />
        </>
      )}
      {kind === 'measure' && (
        <>
          <path d="M6 56H74" {...s} />
          {Array.from({ length: 15 }, (_, i) => (
            <path key={i} d={`M${6 + i * 4.857} 56V${i % 5 === 0 ? 38 : i % 5 === 2 ? 46 : 50}`} {...s} strokeWidth="0.9" />
          ))}
          <rect x="6" y="14" width="42" height="16" fill="currentColor" />
          <rect x="48" y="14" width="26" height="16" {...s} />
        </>
      )}
    </svg>
  )
}

const r = rng(91)
const letterFx = DION.map((d) => d.word.split('').map(() => ({ delay: -r() * 4, amp: 0.04 + r() * 0.1, rot: (r() - 0.5) * 10 })))

function DionWord({ word, fx, active }) {
  return (
    <span className={`dword ${active ? 'is-active' : ''}`} aria-label={word}>
      {word.split('').map((ch, i) => (
        <span key={i} aria-hidden="true" style={{ '--d': `${fx[i].delay}s`, '--a': `${fx[i].amp}em`, '--r': `${fx[i].rot}deg` }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

export default function TwoForces() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]

  return (
    <section id="forces" className="forces">
      <SectionHead
        no="02"
        title="Two Forces"
        kicker="Not reason against feeling, not good against bad. Nietzsche calls them the two art-drives of nature: each is incomplete, and each needs the other."
      />

      {hover >= 0 && (
        <div className="forces__pair mono" aria-hidden="true">
          {APOLLO[hover].word} <span>⟷</span> {DION[hover].word}
        </div>
      )}

      <div className="forces__grid">
        <motion.div className="forces__apollo" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="forces__label mono">
            <span>A</span> Apollonian — <i>the dream</i>
          </div>
          {APOLLO.map((a, i) => (
            <motion.div
              key={a.word}
              className={`arow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{
                hidden: { clipPath: 'inset(0 100% 0 0)' },
                show: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 1, delay: 0.2 + i * 0.14, ease } },
              }}
            >
              <span className="arow__no mono">{['I', 'II', 'III', 'IV'][i]}</span>
              <span className="arow__word">{a.word}</span>
              <Glyph kind={a.glyph} />
              <p className="arow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="forces__dion">
          <svg className="forces__swirl" viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={i}
                d={`M${-40 + i * 10} ${90 + i * 90} C ${160 + i * 20} ${-40 + i * 100}, ${360 - i * 12} ${260 + i * 70}, ${660} ${60 + i * 96}`}
                className="forces__swirlpath"
                style={{ animationDelay: `${-i * 1.7}s` }}
              />
            ))}
          </svg>
          <div className="forces__label mono">
            <span>D</span> Dionysian — <i>intoxication</i>
          </div>
          {DION.map((d, i) => (
            <motion.div
              key={d.word}
              className={`drow drow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              initial={{ opacity: 0, filter: 'blur(16px)', x: 60 * (i % 2 ? -1 : 1), rotate: (i % 2 ? 4 : -4) }}
              whileInView={{ opacity: 1, filter: 'blur(0px)', x: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.8, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <DionWord word={d.word} fx={letterFx[i]} active={hover === i} />
              <p className="drow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
