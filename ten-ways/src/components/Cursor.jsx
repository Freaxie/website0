import { useEffect, useRef, useState } from 'react'

// Inside a plate the cursor becomes that world's instrument. Elsewhere it is the ordinary pointer.
const SHAPES = {
  scientist: (
    <>
      <circle cx="24" cy="24" r="6" />
      <path d="M24 4V15M24 33V44M4 24H15M33 24H44" />
    </>
  ),
  engineer: (
    <>
      <rect x="13" y="13" width="22" height="22" />
      <rect x="20" y="20" width="8" height="8" className="fill" />
    </>
  ),
  warrior: <path d="M6 24H34L44 24L34 20M34 28L44 24" className="blade" />,
  artist: <circle cx="24" cy="24" r="7" className="fill" />,
  philosopher: (
    <text x="24" y="33" textAnchor="middle" className="q">
      ?
    </text>
  ),
  explorer: (
    <>
      <circle cx="24" cy="24" r="20" />
      <circle cx="24" cy="24" r="2" className="fill" />
    </>
  ),
  monk: (
    <>
      <circle cx="24" cy="24" r="2" className="fill" />
      <circle cx="24" cy="24" r="14" className="breath" />
    </>
  ),
  sovereign: <path d="M24 12L33 24L24 36L15 24Z" className="fill" />,
  hedonist: (
    <>
      <circle cx="24" cy="24" r="13" className="fill soft" />
      <circle cx="24" cy="24" r="6" className="fill" />
    </>
  ),
  trickster: (
    <g className="split">
      <rect x="15" y="15" width="12" height="12" className="fill a" />
      <rect x="21" y="21" width="12" height="12" />
    </g>
  ),
}

export default function Cursor() {
  const el = useRef(null)
  const [kind, setKind] = useState(null)
  const [color, setColor] = useState('#000')
  const [fine] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches)

  useEffect(() => {
    if (!fine) return
    let last = { x: 0, y: 0 }
    let cur = null
    const move = (e) => {
      const w = e.target.closest?.('[data-world]')
      const busy = e.target.closest?.('a, button, input, label, [role="button"], [role="radio"], [role="tab"]')
      const k = w && !busy ? w.dataset.world : null
      if (k !== cur) {
        cur = k
        setKind(k)
        if (w) setColor(getComputedStyle(w).getPropertyValue('--fg').trim() || '#000')
      }
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      last = { x: e.clientX, y: e.clientY }
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI
      const sp = Math.min(2.2, 1 + Math.hypot(dx, dy) / 40)
      if (el.current) {
        el.current.style.transform = `translate3d(${e.clientX - 24}px, ${e.clientY - 24}px, 0)`
        el.current.style.setProperty('--ang', k === 'warrior' ? `${ang}deg` : '0deg')
        el.current.style.setProperty('--sp', k === 'artist' ? sp : 1)
      }
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [fine])

  if (!fine) return null
  return (
    <div ref={el} className={`cursor ${kind ? `cursor--${kind}` : 'is-off'}`} style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 48 48">{kind && SHAPES[kind]}</svg>
    </div>
  )
}
