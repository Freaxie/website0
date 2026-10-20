import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { paint, mediumOf } from '../lib/paintings.js'
import one from '../lib/paintings-1.js'
import two from '../lib/paintings-2.js'
import three from '../lib/paintings-3.js'

const SCENES = { ...one, ...two, ...three }

// The painting beside each entry's myth. Nothing is stored: the scene is drawn from code and remade
// in its medium once, a little at a time, when the entry comes near, and then it stays still.
export default function Painting({ a }) {
  const sc = SCENES[a.id]
  const box = useRef(null)
  const ref = useRef(null)
  const near = useInView(box, { once: true, margin: '700px 0px' })
  const [done, setDone] = useState(false)
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
    <figure className={`painting painting--${sc.style}`} ref={box}>
      <div className="painting__frame">
        <canvas ref={ref} className={done ? 'is-done' : undefined} role="img" aria-label={`${sc.title}. ${mediumOf(sc)}.`} />
      </div>
      <figcaption>
        <span className="painting__title">{sc.title}</span>
        <span className="painting__medium mono">{mediumOf(sc)}</span>
      </figcaption>
    </figure>
  )
}
