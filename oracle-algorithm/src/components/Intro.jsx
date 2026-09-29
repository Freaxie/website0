import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: an obsidian panel with a gold circle being drawn, a white panel with a blue grid being filled.
// At a hundred they part.
export default function Intro() {
  const [open, setOpen] = useState(false)
  const [n, setN] = useState(0)

  useEffect(() => {
    let k = 0
    const tick = setInterval(() => {
      k = Math.min(100, k + 3 + Math.round(Math.random() * 8))
      setN(k)
      if (k >= 100) {
        clearInterval(tick)
        setTimeout(() => setOpen(true), 280)
      }
    }, 40)
    return () => clearInterval(tick)
  }, [])

  const ease = [0.76, 0, 0.24, 1]
  const cells = 48
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.3 }}>
          <motion.div className="intro__half intro__half--o" exit={{ x: '-101%' }} transition={{ duration: 1.1, ease }}>
            <svg viewBox="0 0 100 100" className="intro__circle" aria-hidden="true">
              <circle cx="50" cy="50" r="46" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - n / 100} />
              <circle cx="50" cy="50" r="30" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - Math.max(0, n - 30) / 70} />
            </svg>
            <span className="mono">Oracle · reading</span>
          </motion.div>
          <motion.div className="intro__half intro__half--a" exit={{ x: '101%' }} transition={{ duration: 1.1, ease }}>
            <div className="intro__grid" aria-hidden="true">
              {Array.from({ length: cells }, (_, i) => (
                <i key={i} className={i < (n / 100) * cells ? 'is-on' : ''} />
              ))}
            </div>
            <span className="mono">Algorithm · computing</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Oracle vs Algorithm: an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
