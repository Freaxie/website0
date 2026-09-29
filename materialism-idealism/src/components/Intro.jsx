import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: a slab of matter that drops away, and a field of light that simply fades, as if unobserved.
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
          <motion.div className="intro__half intro__half--matter" exit={{ y: '101%' }} transition={{ duration: 1.1, ease }}>
            <span className="mono">Materialism · matter first</span>
          </motion.div>
          <motion.div className="intro__half intro__half--mind" exit={{ opacity: 0 }} transition={{ duration: 1.1 }}>
            <span className="mono">Idealism · mind first</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Materialism &amp; Idealism — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
