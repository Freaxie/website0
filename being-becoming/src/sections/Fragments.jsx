import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Rows are opposites: Permanence faces Change, Unity faces Multiplicity, and so on.
const BEING = [
  { word: 'Permanence', gloss: 'What truly is cannot come to be or pass away. Out of what could it come?', glyph: 'permanence' },
  { word: 'Unity', gloss: 'Being is one, whole and continuous. No gap of not-being divides it.', glyph: 'unity' },
  { word: 'Identity', gloss: 'A thing is what it is. To change would be to become what it is not.', glyph: 'identity' },
  { word: 'Rest', gloss: 'Unmoved, unshaken, held fast within its limits.', glyph: 'rest' },
]
const BECOMING = [
  { word: 'Change', gloss: '“Cold things grow warm, the warm grows cold, the wet dries, the parched grows moist.”' },
  { word: 'Multiplicity', gloss: 'Not one frozen whole but many things, arising and passing into one another.' },
  { word: 'Difference', gloss: 'A thing stays itself only by becoming other: the bow and the lyre hold by tension.' },
  { word: 'Motion', gloss: '“Even the barley drink separates if it is not stirred.”' },
]

function Glyph({ kind }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
  return (
    <svg viewBox="0 0 80 80" className="glyph" aria-hidden="true">
      {kind === 'permanence' && (
        <>
          <rect x="14" y="14" width="52" height="52" fill="currentColor" />
          <path d="M4 74H76" {...s} />
        </>
      )}
      {kind === 'unity' && <circle cx="40" cy="40" r="30" fill="currentColor" />}
      {kind === 'identity' && (
        <>
          <rect x="6" y="26" width="28" height="28" fill="currentColor" />
          <rect x="46" y="26" width="28" height="28" fill="currentColor" />
          <path d="M36 36H44M36 44H44" {...s} />
        </>
      )}
      {kind === 'rest' && (
        <>
          <path d="M6 56H74" {...s} />
          <circle cx="40" cy="44" r="12" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

export default function Fragments() {
  const [hover, setHover] = useState(-1)
  const ease = [0.76, 0, 0.24, 1]

  return (
    <section id="fragments" className="frag">
      <SectionHead
        no="02"
        title="Two Fragments"
        kicker="Around 500 BCE, two answers to one question. Is the world, underneath, something that stays, or something that happens?"
      />

      {hover >= 0 && (
        <div className="frag__pair mono" aria-hidden="true">
          {BEING[hover].word} <span>⟷</span> {BECOMING[hover].word}
        </div>
      )}

      <div className="frag__grid">
        <motion.div className="frag__being" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="frag__label mono">
            <span>B</span> Being — <i>Parmenides of Elea</i>
          </div>
          {BEING.map((a, i) => (
            <motion.div
              key={a.word}
              className={`brow ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1.6, delay: 0.3 } } }}
            >
              <span className="brow__word">{a.word}</span>
              <Glyph kind={a.glyph} />
              <p className="brow__gloss">{a.gloss}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="frag__becoming" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <div className="frag__label mono">
            <span>B′</span> Becoming — <i>Heraclitus of Ephesus</i>
          </div>
          {BECOMING.map((d, i) => (
            <motion.div
              key={d.word}
              className={`crow crow--${i} ${hover === i ? 'is-active' : ''} ${hover >= 0 && hover !== i ? 'is-dim' : ''}`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              variants={{
                hidden: { opacity: 0, y: 60 },
                show: { opacity: 1, y: 0, transition: { duration: 1.2, delay: 0.2 + i * 0.18, ease } },
              }}
            >
              <span className="crow__word" aria-label={d.word}>
                {d.word.split('').map((ch, k) => (
                  <span key={k} aria-hidden="true" style={{ '--k': k }}>
                    {ch}
                  </span>
                ))}
              </span>
              <p className="crow__gloss">{d.gloss}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
