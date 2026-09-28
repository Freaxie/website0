import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain. The left panel never changes while you wait; the right one never stops.
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
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.3 }}>
          <motion.div className="intro__half intro__half--being" exit={{ y: '-101%' }} transition={{ duration: 1.1, ease }}>
            <span className="mono">Being · what is</span>
            <svg viewBox="0 0 100 100" className="intro__glyph" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="currentColor" />
            </svg>
          </motion.div>
          <motion.div className="intro__half intro__half--becoming" exit={{ y: '101%' }} transition={{ duration: 1.1, ease, delay: 0.08 }}>
            <span className="intro__morph" style={{ fontVariationSettings: `"wdth" ${62 + (n % 20) * 3.1}, "wght" ${200 + ((n * 37) % 700)}` }}>
              becoming
            </span>
            <span className="mono">Becoming · what happens</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Being &amp; Becoming — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
