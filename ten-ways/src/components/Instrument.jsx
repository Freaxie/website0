import { useEffect, useRef } from 'react'
import { useLoop } from '../lib/useLoop.js'
import { INSTRUMENTS } from '../lib/instruments.js'

// A canvas that runs one archetype's instrument while it is on screen.
export default function Instrument({ kind, fg, bg, label }) {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const inst = INSTRUMENTS[kind]
  const state = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const P = useRef({ x: 0, y: 0, on: false, speed: 0, lx: 0, ly: 0, lt: 0 })

  useEffect(() => {
    const el = canvas.current
    const fit = () => {
      const b = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.max(1, Math.round(b.width * dpr))
      el.height = Math.max(1, Math.round(b.height * dpr))
      size.current = { w: b.width, h: b.height, dpr }
      state.current = inst.init(b.width, b.height, { fg, bg })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [inst, fg, bg])

  useLoop(wrap, (t, dt) => {
    const el = canvas.current
    if (!el || !state.current) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // speed decays when the pointer stops reporting movement
    P.current.speed *= Math.exp(-dt * 8)
    inst.step(state.current, ctx, t, dt, P.current, w, h, { fg, bg })
  })

  const at = (e) => {
    const b = canvas.current.getBoundingClientRect()
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    const now = performance.now()
    const p = P.current
    const gap = Math.max(1, now - p.lt)
    const sp = p.on ? (Math.hypot(x - p.lx, y - p.ly) / gap) * 1000 : 0
    Object.assign(p, { x, y, on: true, speed: Math.max(p.speed * 0.5, sp), lx: x, ly: y, lt: now })
  }

  return (
    <div className="inst" ref={wrap}>
      <canvas
        ref={canvas}
        className="inst__canvas"
        role="img"
        aria-label={label}
        onPointerMove={at}
        onPointerDown={(e) => {
          at(e)
          inst.click?.(state.current, P.current, size.current.w, size.current.h)
        }}
        onPointerLeave={() => (P.current.on = false)}
      />
    </div>
  )
}
