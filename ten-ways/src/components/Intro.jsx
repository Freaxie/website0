import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ARCHETYPES } from '../lib/archetypes.js'

// The curtain: ten coloured bands, one per way of meeting the world. They leave one by one.
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
  const lit = Math.ceil((n / 100) * ARCHETYPES.length)
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.6 }}>
          <div className="intro__bands">
            {ARCHETYPES.map((a, i) => (
              <motion.span key={a.id} style={{ background: a.color, opacity: i < lit ? 1 : 0.12 }} exit={{ y: i % 2 ? '-101%' : '101%' }} transition={{ duration: 0.9, ease, delay: i * 0.05 }}>
                <em className="mono" style={{ color: a.fg }}>
                  {a.no}
                </em>
              </motion.span>
            ))}
          </div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>{String(n).padStart(3, '0')}</span>
            <span>Ten ways of encountering reality</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
