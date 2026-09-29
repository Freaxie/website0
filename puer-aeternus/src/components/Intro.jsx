import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: sky above, lead below. At a hundred the sky lifts away and the lead sinks.
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
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.4 }}>
          <motion.div className="intro__sky" exit={{ y: '-101%' }} transition={{ duration: 1.3, ease }}>
            <span className="mono">Puer · rising</span>
            <i className="intro__sun" style={{ transform: `translateY(${(1 - n / 100) * 60}px)` }} />
          </motion.div>
          <motion.div className="intro__lead" exit={{ y: '101%' }} transition={{ duration: 1.1, ease, delay: 0.15 }}>
            <span className="mono">Senex · settling</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Puer Aeternus: an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
