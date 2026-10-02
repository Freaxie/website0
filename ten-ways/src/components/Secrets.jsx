import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { bus } from '../lib/bus.js'

// Things that happen only to those who wait, or who will not sit still.
export default function Secrets() {
  const [still, setStill] = useState(false)
  const last = useRef(performance.now())

  useEffect(() => {
    const wake = () => {
      last.current = performance.now()
      setStill(false)
    }
    const evs = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart', 'scroll']
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }))
    const id = setInterval(() => {
      const idle = (performance.now() - last.current) / 1000
      if (performance.now() < 8000) return
      if (idle > 12) bus.whisper('monk', 'The monk has noticed.', '#e3a21a')
      if (idle > 30) setStill(true)
    }, 1000)
    const off = bus.on((type) => {
      if (type === 'trick') {
        bus.whisper('trick', 'The trickster is laughing.', '#c2d82b')
        document.body.classList.add('is-tricked')
        setTimeout(() => document.body.classList.remove('is-tricked'), 1400)
      }
      if (type === 'all') bus.whisper('all', 'All ten. The coda has changed.', '#0c0c0c')
    })
    return () => {
      evs.forEach((e) => window.removeEventListener(e, wake))
      clearInterval(id)
      off()
    }
  }, [])

  return (
    <AnimatePresence>
      {still && (
        <motion.div className="stillness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 3 }} aria-hidden="true">
          <i className="stillness__circle" />
          <p className="mono">
            <span>thirty seconds of stillness</span>
            <span>the monk sat with you</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
