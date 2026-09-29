import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CHIPS } from '../lib/geom.js'

// The curtain: a row of many colours above, one deep blue below. The row scatters; the blue sinks.
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
          <div className="intro__chips">
            {CHIPS.map((c, i) => (
              <motion.span key={c} style={{ background: c }} exit={{ y: i % 2 ? '-101%' : '101%' }} transition={{ duration: 0.9, ease, delay: i * 0.04 }} />
            ))}
          </div>
          <motion.div className="intro__shaft" exit={{ y: '101%' }} transition={{ duration: 1.1, ease, delay: 0.2 }}>
            <span className="mono">Specialist · one thing, deeply</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Generalist &amp; Specialist — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
