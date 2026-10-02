import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { rng } from '../lib/geom.js'
import { reduced } from '../lib/bus.js'

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
    default:
      return { hidden: {}, show: {} }
  }
}

const GLITCH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&?!'

export default function KineticName({ a }) {
  const letters = a.name.split('')
  const n = letters.length
  const variants = useMemo(() => {
    const r = rng(a.no.length * 31 + n)
    return letters.map((_, i) => entrance(a.id, i, n, r))
  }, [a.id])
  // the trickster's letters will not stay put
  const [shown, setShown] = useState(letters)
  useEffect(() => {
    if (a.id !== 'trickster' || reduced) return
    let restore
    const id = setInterval(() => {
      const next = [...letters]
      if (Math.random() < 0.5) {
        const i = Math.floor(Math.random() * n)
        const j = Math.floor(Math.random() * n)
        ;[next[i], next[j]] = [next[j], next[i]]
      } else for (let k = 0; k < 2; k++) next[Math.floor(Math.random() * n)] = GLITCH[Math.floor(Math.random() * GLITCH.length)]
      setShown(next)
      restore = setTimeout(() => setShown(letters), 420 + Math.random() * 500)
    }, 2400)
    return () => {
      clearInterval(id)
      clearTimeout(restore)
    }
  }, [a.id])

  return (
    <span className={`kname kname--${a.id}`} aria-label={a.name}>
      {shown.map((ch, i) => (
        <motion.span key={i} className="kname__c" variants={variants[i]} aria-hidden="true">
          <span className="kname__l" style={{ '--i': i }}>
            {ch}
          </span>
        </motion.span>
      ))}
      {a.id === 'philosopher' && <span className="kname__caret" aria-hidden="true" />}
    </span>
  )
}
