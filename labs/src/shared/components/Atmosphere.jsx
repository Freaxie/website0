import { useEffect, useMemo, useRef } from 'react'
import { pointer } from '../lib/pointer.js'
import { reducedMotion } from '../lib/math.js'
import { getState } from '../lib/store.js'

function grainTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const g = c.getContext('2d')
  const img = g.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

// Film grain, scanlines, vignette, the idle dimmer, and a faint lamp where attention is.
export default function Atmosphere({ lamp = true, dark = [] }) {
  const lampRef = useRef(null)
  const url = useMemo(() => grainTexture(), [])

  useEffect(() => {
    let raf = 0
    let x = pointer.x
    let y = pointer.y
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (document.hidden) return
      x += (pointer.x - x) * 0.09
      y += (pointer.y - y) * 0.09
      const el = lampRef.current
      if (el) {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.classList.toggle('is-on', pointer.moved && pointer.type === 'mouse' && !dark.includes(getState().section))
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // an occasional, brief signal fault
  useEffect(() => {
    if (reducedMotion()) return
    let t
    const schedule = () => {
      t = setTimeout(
        () => {
          const root = document.documentElement
          if (!root.classList.contains('no-glitch')) {
            root.classList.add('is-glitch')
            setTimeout(() => root.classList.remove('is-glitch'), 240)
          }
          schedule()
        },
        24000 + Math.random() * 30000,
      )
    }
    schedule()
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {lamp && <div ref={lampRef} className="lamp" aria-hidden="true" />}
      <div className="dimmer" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" style={{ backgroundImage: `url(${url})` }} />
      <div className="scan" aria-hidden="true" />
    </>
  )
}
