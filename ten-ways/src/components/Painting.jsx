import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInView } from 'framer-motion'
import { paint, mediumOf } from '../lib/paintings.js'
import one from '../lib/paintings-1.js'
import two from '../lib/paintings-2.js'
import three from '../lib/paintings-3.js'
import { MAKING, MYTH } from '../lib/painting-notes.js'

const SCENES = { ...one, ...two, ...three }

// The painting at full height, with the myth it shows and how its medium is made.
function Lightbox({ a, sc, from, onClose }) {
  const big = useRef(null)
  const shut = useRef(null)
  useEffect(() => {
    const c = big.current
    c.width = from.width
    c.height = from.height
    c.getContext('2d').drawImage(from, 0, 0)
    const key = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', key)
    const was = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    shut.current.focus()
    return () => {
      removeEventListener('keydown', key)
      document.documentElement.style.overflow = was
    }
  }, [from, onClose])
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={sc.title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" className="lightbox__shut mono" ref={shut} onClick={onClose}>
        Close ×
      </button>
      <div className={`lightbox__pic painting--${sc.style}`}>
        <canvas ref={big} />
      </div>
      <div className="lightbox__text">
        <p className="mono">
          Plate {a.no} · {a.name}
        </p>
        <h3>{sc.title}</h3>
        <p className="lightbox__medium mono">{mediumOf(sc)}</p>
        <h4 className="mono">The myth</h4>
        <p>{MYTH[a.id]}</p>
        <h4 className="mono">How it was made</h4>
        <p>{MAKING[sc.style]}</p>
        <p className="lightbox__note">No image file is stored. This picture was drawn by code in your browser a moment ago.</p>
      </div>
    </div>,
    document.body,
  )
}

// The painting beside each entry's myth. Nothing is stored: the scene is drawn from code and remade
// in its medium once, a little at a time, when the entry comes near, and then it stays still.
export default function Painting({ a, compact = false }) {
  const sc = SCENES[a.id]
  const box = useRef(null)
  const ref = useRef(null)
  const near = useInView(box, { once: true, margin: '700px 0px' })
  const [done, setDone] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!near || !sc) return
    let alive = true
    const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 40))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => paint(ref.current, sc).then(() => alive && setDone(true)), { timeout: 1500 })
    return () => {
      alive = false
      cancel(id)
    }
  }, [near, sc])
  if (!sc) return null
  return (
    <figure className={`painting painting--${sc.style}${compact ? ' painting--compact' : ''}`} ref={box}>
      <button type="button" className="painting__mat" onClick={() => done && setOpen(true)} aria-label={`${sc.title}. ${mediumOf(sc)}. Open larger, with the myth.`}>
        <span className="painting__frame">
          <canvas ref={ref} className={done ? 'is-done' : undefined} aria-hidden="true" />
        </span>
        <span className="painting__zoom mono" aria-hidden="true">
          View larger
        </span>
      </button>
      {open && <Lightbox a={a} sc={sc} from={ref.current} onClose={() => setOpen(false)} />}
      {compact ? (
        <figcaption className="painting__label">
          <span className="painting__title">
            <span className="mono">Enclosed</span> {sc.title}
          </span>
        </figcaption>
      ) : (
        <figcaption className="painting__label">
          <span className="painting__no mono">{a.no}</span>
          <span className="painting__title">{sc.title}</span>
          <span className="painting__medium mono">{mediumOf(sc)}</span>
        </figcaption>
      )}
    </figure>
  )
}
