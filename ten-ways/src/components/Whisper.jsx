import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { bus } from '../lib/bus.js'

// Rare lines that tell the visitor they have been noticed. One at a time, quietly.
export default function Whisper() {
  const [queue, setQueue] = useState([])
  const now = queue[0]

  useEffect(() => bus.on((type, data) => type === 'whisper' && setQueue((q) => [...q, { ...data, id: Math.random() }])), [])
  useEffect(() => {
    if (!now) return
    const id = setTimeout(() => setQueue((q) => q.slice(1)), 5200)
    return () => clearTimeout(id)
  }, [now])

  return (
    <div className="whisper" aria-live="polite">
      <AnimatePresence mode="wait">
        {now && (
          <motion.p key={now.id} initial={{ opacity: 0, y: 12, letterSpacing: '0.3em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0.12em' }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}>
            <i style={{ background: now.color }} />
            {now.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
