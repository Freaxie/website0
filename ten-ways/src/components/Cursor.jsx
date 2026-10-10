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
  cinephile: <path d="M8 16V8H16M32 8H40V16M40 32V40H32M16 40H8V32M24 22V26M22 24H26" />,
  musician: (
    <>
      <ellipse cx="20" cy="31" rx="6" ry="4.2" transform="rotate(-20 20 31)" className="fill" />
      <path d="M25.5 30V10L33 14" />
    </>
  ),
  entrepreneur: <path d="M10 38L38 10M22 10H38V26" />,
  biohacker: <path d="M4 26H15L18 20L22 34L26 12L30 30L33 26H44" className="pulse" />,
  looksmaxxer: (
    <>
      <path d="M24 10A14 14 0 0 0 24 38" />
      <path d="M24 10A14 14 0 0 1 24 38" className="ghost" />
      <path d="M24 4V44" className="axis" />
    </>
  ),
  theologian: <path d="M24 6V42M6 24H42M13 13L35 35M35 13L13 35" className="star" />,
  gardener: <path d="M24 40C14 32 14 16 24 8C34 16 34 32 24 40ZM24 40V16" />,
  storyteller: <path d="M24 42L16 22L24 6L32 22ZM24 42V28M24 28a2 2 0 1 0 0.01 0" />,
  detective: (
    <>
      <circle cx="24" cy="18" r="7" />
      <path d="M21 24L18 40H30L27 24" />
    </>
  ),
  archivist: (
    <>
      <rect x="10" y="12" width="28" height="24" />
      <path d="M15 20H33M15 26H27" />
    </>
  ),
  healer: (
    <>
      <circle cx="24" cy="24" r="15" />
      <path d="M24 16V32M16 24H32" />
    </>
  ),
  teacher: <path d="M24 6C31 14 31 20 24 26C17 20 17 14 24 6ZM19 30H29L27 42H21Z" />,
  lover: (
    <>
      <circle cx="19" cy="24" r="9" />
      <circle cx="29" cy="24" r="9" className="soft-line" />
    </>
  ),
  rebel: <path d="M24 42V8M16 16L24 8L32 16M8 28H40" className="blade" />,
}

export default function Cursor() {
  const el = useRef(null)
  const [kind, setKind] = useState(null)
  const [color, setColor] = useState('#000')
  const [fine] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches)

  useEffect(() => {
    if (!fine) return
    let last = { x: -100, y: -100 }
    let cur = null
    let tint = null
    // which world, if any, is under a given element; inside an entry the cursor is an ordinary pointer
    // again, because that part of the plate is for reading
    const classify = (target) => {
      const w = !target || target.closest?.('.entry') ? null : target.closest?.('[data-world]')
      const busy = target?.closest?.('a, button, input, label, [role="button"], [role="radio"], [role="tab"]')
      const k = w && !busy ? w.dataset.world : null
      const c = w ? getComputedStyle(w).getPropertyValue('--fg').trim() || '#000' : tint
      if (k !== cur) {
        cur = k
        setKind(k)
      }
      // the shadow switch changes a plate's colours without the pointer moving to another world
      if (c !== tint) {
        tint = c
        setColor(c)
      }
      return k
    }
    const move = (e) => {
      const k = classify(e.target)
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
    // scrolling moves the page under a still pointer: look again at what is now beneath it,
    // so a plate's cursor does not linger over the next room
    let raf = 0
    const look = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => classify(document.elementFromPoint(last.x, last.y)))
    }
    const leave = (e) => {
      if (!e.relatedTarget) classify(null)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', look, { passive: true })
    window.addEventListener('click', look, { passive: true })
    document.addEventListener('pointerout', leave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', look)
      window.removeEventListener('click', look)
      document.removeEventListener('pointerout', leave)
    }
  }, [fine])

  if (!fine) return null
  return (
    <div ref={el} className={`cursor ${kind ? `cursor--${kind}` : 'is-off'}`} style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 48 48">{kind && SHAPES[kind]}</svg>
    </div>
  )
}
