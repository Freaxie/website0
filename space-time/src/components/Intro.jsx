import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// The curtain: a lattice above, a clock below. The counter is a stopwatch, because waiting is the first exhibit.
export default function Intro() {
  const [open, setOpen] = useState(false)
  const [ms, setMs] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = now - start
      setMs(t)
      if (t < 1500) raf = requestAnimationFrame(tick)
      else setTimeout(() => setOpen(true), 200)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  const ease = [0.76, 0, 0.24, 1]
  return (
    <AnimatePresence>
      {!open && (
        <motion.div className="intro" key="intro" exit={{ pointerEvents: 'none' }} transition={{ duration: 1.3 }}>
          <motion.div className="intro__half intro__half--space" exit={{ x: '-101%' }} transition={{ duration: 1.1, ease }}>
            <span className="mono">Space · extension · here</span>
            <svg viewBox="0 0 100 100" className="intro__glyph" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) =>
                Array.from({ length: 6 }, (_, j) => <circle key={`${i}${j}`} cx={8 + i * 16.8} cy={8 + j * 16.8} r="1.6" fill="currentColor" />),
              )}
              <path d="M8 92V8M8 92H92" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </motion.div>
          <motion.div className="intro__half intro__half--time" exit={{ x: '101%' }} transition={{ duration: 1.1, ease, delay: 0.08 }}>
            <svg viewBox="0 0 100 100" className="intro__glyph" aria-hidden="true">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1" />
              <g style={{ transform: `rotate(${(ms / 1500) * 360}deg)`, transformOrigin: '50px 50px' }}>
                <path d="M50 50V10" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </svg>
            <span className="mono">Time · duration · now</span>
          </motion.div>
          <motion.div className="intro__count mono" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span>
              {String(s).padStart(2, '0')}:{String(cs).padStart(2, '0')}
            </span>
            <span>Space &amp; Time — an exhibition</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
