import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Room index, fixed at the right edge. Blend mode difference keeps it legible on every wall colour.
export default function Nav({ rooms }) {
  const [active, setActive] = useState(rooms[0].id)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    rooms.forEach((r) => {
      const el = document.getElementById(r.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [rooms])

  const current = rooms.find((r) => r.id === active)
  return (
    <>
      <a className="mark mono" href="#entrance" aria-label="Back to the entrance">
        M<span>/</span>I
      </a>
      <div className="room-label mono" aria-live="polite">
        <motion.span key={current.id} initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
          Room {current.no} — {current.name}
        </motion.span>
      </div>
      <nav className="rooms" aria-label="Rooms">
        {rooms.map((r) => (
          <a key={r.id} href={`#${r.id}`} className={r.id === active ? 'is-active' : ''} aria-current={r.id === active ? 'true' : undefined}>
            <span className="mono">{r.no}</span>
            <i />
            <em>{r.name}</em>
          </a>
        ))}
      </nav>
    </>
  )
}
