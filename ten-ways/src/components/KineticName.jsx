import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { rng } from '../lib/geom.js'

// An archetype's name, letter by letter, entering the way that archetype moves.
// The parent plate decides when ("hidden" → "show"); each name decides how.
function entrance(id, i, n, r) {
  switch (id) {
    case 'scientist':
      // scattered readings settle onto the grid
      return { hidden: { opacity: 0, x: (r() - 0.5) * 280, y: (r() - 0.5) * 160 }, show: { opacity: 1, x: 0, y: 0, transition: { duration: 1.1, delay: 0.1 + i * 0.04, ease: [0.7, 0, 0.2, 1] } } }
    case 'engineer':
      // components slide in from both sides and lock
      return { hidden: { opacity: 0, x: (i % 2 ? 1 : -1) * 90 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 520, damping: 28, delay: i * 0.07 } } }
    case 'warrior':
      return { hidden: { opacity: 0, y: -70, scale: 1.8, skewX: -25 }, show: { opacity: 1, y: 0, scale: 1, skewX: 0, transition: { type: 'spring', stiffness: 900, damping: 24, delay: i * 0.035 } } }
    case 'artist':
      return { hidden: { opacity: 0, filter: 'blur(14px)', y: 16 }, show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 1.6, delay: i * 0.1, ease: 'easeOut' } } }
    case 'philosopher':
      // typed, one considered letter at a time
      return { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01, delay: 0.2 + i * 0.11 } } }
    case 'explorer':
      return { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, delay: i * 0.07 } } }
    case 'monk':
      return { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 2.6, delay: i * 0.45 } } }
    case 'sovereign':
      // the whole rank arrives together, from the centre outward
      return { hidden: { opacity: 0, y: -90 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: Math.abs(i - (n - 1) / 2) * 0.09 } } }
    case 'hedonist':
      return { hidden: { opacity: 0, scale: 0.2, rotate: (r() - 0.5) * 80 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 110, damping: 8, delay: i * 0.07 } } }
    case 'trickster':
      return { hidden: { opacity: 0, y: (r() - 0.5) * 80, rotate: (r() - 0.5) * 180 }, show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.5, delay: r() * 0.6 } } }
    case 'cinephile':
      // opening credits: wide, slow, out of the dark
      return { hidden: { opacity: 0, letterSpacing: '0.9em', scaleY: 0.6 }, show: { opacity: 1, letterSpacing: '0.3em', scaleY: 1, transition: { duration: 2.2, delay: 0.3 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] } } }
    case 'musician':
      // each letter lands on its note, a little higher or lower than the last
      return { hidden: { opacity: 0, y: (i % 4 < 2 ? -1 : 1) * 50 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 11, delay: i * 0.125 } } }
    case 'entrepreneur':
      // a growth chart: every letter rises a little further, a little faster
      return { hidden: { opacity: 0, y: 30 + i * 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5 - Math.pow(i / n, 2) * 0.45 + i * 0.05, ease: [0.5, 0, 0.1, 1] } } }
    case 'biohacker':
      // boots in discrete steps, like a device
      return { hidden: { opacity: 0, scaleY: 0.05 }, show: { opacity: [0, 1, 0.3, 1], scaleY: 1, transition: { duration: 0.5, delay: 0.2 + i * 0.06, ease: 'linear', times: [0, 0.3, 0.6, 1] } } }
    case 'looksmaxxer':
      // each letter turns round from its reflection
      return { hidden: { opacity: 0, scaleX: -1 }, show: { opacity: 1, scaleX: 1, transition: { duration: 0.9, delay: Math.abs(i - (n - 1) / 2) * 0.08, ease: [0.6, 0, 0.2, 1] } } }
    case 'theologian':
      // descends, slowly, as if carved in place
      return { hidden: { opacity: 0, y: -40 }, show: { opacity: 1, y: 0, transition: { duration: 2.4, delay: i * 0.18, ease: [0.1, 0.6, 0.2, 1] } } }
    case 'gardener':
      // grows up from the soil
      return { hidden: { opacity: 0, scaleY: 0 }, show: { opacity: 1, scaleY: 1, transition: { duration: 1.6, delay: r() * 1.2, ease: [0.3, 1.4, 0.4, 1] } } }
    case 'storyteller':
      // told in order, each word leaning into the next
      return { hidden: { opacity: 0, x: -20, rotate: -8 }, show: { opacity: 1, x: 0, rotate: 0, transition: { duration: 0.8, delay: i * 0.14, ease: 'easeOut' } } }
    case 'detective':
      return { hidden: { opacity: 1 }, show: { opacity: 1 } }
    case 'archivist':
      // filed, one card after another
      return { hidden: { opacity: 0, y: 40, rotateX: 80 }, show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.2, 0.8, 0.2, 1] } } }
    default:
      return { hidden: {}, show: {} }
  }
}

export default function KineticName({ a }) {
  const letters = a.name.split('')
  const n = letters.length
  const variants = useMemo(() => {
    const r = rng(a.no.length * 31 + n)
    return letters.map((_, i) => entrance(a.id, i, n, r))
  }, [a.id])

  return (
    <span className={`kname kname--${a.id}`} aria-label={a.name}>
      {letters.map((ch, i) => (
        <motion.span key={i} className="kname__c" variants={variants[i]} aria-hidden="true">
          <span className="kname__l" style={{ '--i': i }}>
            {ch}
          </span>
          {a.id === 'detective' && <motion.span className="kname__bar" variants={{ hidden: { scaleX: 1 }, show: { scaleX: 0, transition: { duration: 0.5, delay: 0.6 + i * 0.09, ease: [0.7, 0, 0.3, 1] } } }} />}
        </motion.span>
      ))}
      {a.id === 'philosopher' && <span className="kname__caret" aria-hidden="true" />}
    </span>
  )
}
