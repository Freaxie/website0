import { useEffect, useRef } from 'react'
import { useScroll } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { drawMorph } from '../lib/forms.js'
import { reduced } from '../lib/bus.js'

// The ground between two plates: scrolling through it turns one world's geometry into the next.
export default function Threshold({ a, b }) {
  const ref = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  useEffect(() => {
    const el = canvas.current
    const fit = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      el.width = Math.max(1, Math.round(r.width * dpr))
      el.height = Math.max(1, Math.round(r.height * dpr))
      size.current = { w: r.width, h: r.height, dpr }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(ref, (t) => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // under reduced motion the passage holds still at its midpoint colours
    drawMorph(ctx, w, h, a, b, reduced ? Math.round(scrollYProgress.get()) : scrollYProgress.get(), t)
  })

  return (
    <div className="threshold" ref={ref} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  )
}
