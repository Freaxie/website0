import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: two colour fields hold the doorway, then part.
export default function Intro() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    let n = 0
    const tick = setInterval(() => {
      n = Math.min(100, n + 4 + Math.round(Math.random() * 7))
      setCount(n)
      if (n >= 100) {
        clearInterval(tick)
        setTimeout(() => setOpen(true), 260)
      }
    }, 42)
    return () => clearInterval(tick)
  }, [])

  const ease = [0.76, 0, 0.24, 1]
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.3 }}>
          <motion.div className="intro__half intro__half--apollo" exit={{ y: '-101%' }} transition={{ duration: 1.1, ease }}>
            <span className="mono">Apollo · Traum · dream</span>
            <svg viewBox="0 0 100 100" className="intro__glyph">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M4 50H96M50 4V96" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </motion.div>
          <motion.div className="intro__half intro__half--dion" exit={{ y: '101%' }} transition={{ duration: 1.1, ease, delay: 0.08 }}>
            <svg viewBox="0 0 100 100" className="intro__glyph intro__glyph--warp">
              <path d="M50 6C78 4 96 26 92 52S70 96 46 94 6 74 8 48 26 7 50 6Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="mono">Dionysus · Rausch · intoxication</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(count).padStart(3, '0')}</span>
            <span>The Birth of Tragedy — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
