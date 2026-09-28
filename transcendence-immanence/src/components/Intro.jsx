import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: the upper field leaves upward, beyond the frame; the ground stays and sinks back into the page.
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
        setTimeout(() => setOpen(true), 260)
      }
    }, 40)
    return () => clearInterval(tick)
  }, [])

  const ease = [0.76, 0, 0.24, 1]
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.4 }}>
          <motion.div className="intro__half intro__half--up" exit={{ y: '-101%' }} transition={{ duration: 1.2, ease }}>
            <span className="mono">Transcendence · beyond</span>
            <svg viewBox="0 0 100 100" className="intro__glyph" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M50 0L${5 + i * 11.25} 100`} stroke="currentColor" strokeWidth="0.6" />
              ))}
            </svg>
          </motion.div>
          <motion.div className="intro__half intro__half--down" exit={{ opacity: 0 }} transition={{ duration: 1, delay: 0.3 }}>
            <svg viewBox="0 0 100 100" className="intro__glyph" aria-hidden="true">
              {Array.from({ length: 36 }, (_, i) => (
                <circle key={i} cx={8 + (i % 6) * 17} cy={8 + Math.floor(i / 6) * 17} r="3" fill="currentColor" />
              ))}
            </svg>
            <span className="mono">Immanence · within</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Transcendence &amp; Immanence — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
