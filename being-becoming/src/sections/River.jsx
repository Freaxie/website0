import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { rng } from '../lib/geom.js'

const COUNT = 1700
const FOOT = 46

// The river's course and width: fixed. This is the part of the river that is.
const center = (x, w, h) => h * 0.6 + Math.sin((x / w) * Math.PI * 2.2 + 0.6) * h * 0.08
const half = (x, w, h) => h * 0.15 + Math.sin((x / w) * Math.PI * 3 + 1) * h * 0.025

export default function River() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const water = useRef(null)
  const nextId = useRef(0)
  const ripples = useRef([])
  const [steps, setSteps] = useState([])
  const [miss, setMiss] = useState(false)

  if (!water.current) {
    const r = rng(12)
    water.current = Array.from({ length: COUNT }, () => ({ id: nextId.current++, u: r(), v: r() * 2 - 1, len: 6 + r() * 14, sp: 0.8 + r() * 0.4 }))
  }

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.current = { w: el.clientWidth, h: el.clientHeight, dpr }
      canvas.current.width = el.clientWidth * dpr
      canvas.current.height = el.clientHeight * dpr
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pos = (d) => {
    const { w, h } = size.current
    const x = d.u * w
    return [x, center(x, w, h) + d.v * half(x, w, h)]
  }

  useLoop(wrap, (t, dt) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // banks
    ctx.strokeStyle = '#2e3136'
    ctx.lineWidth = 2
    for (const side of [-1, 1]) {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 8) {
        const y = center(x, w, h) + side * (half(x, w, h) + 6)
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
    }

    // water: every drop moves on, and new water arrives from upstream with a new name
    const r = Math.random
    ctx.lineWidth = 1.4
    ctx.strokeStyle = '#e5431c'
    ctx.beginPath()
    for (const d of water.current) {
      d.u += (dt * 0.07 * d.sp * (1 - 0.65 * d.v * d.v) * 1400) / Math.max(w, 1)
      d.v += (r() - 0.5) * 0.02
      if (d.v > 0.98) d.v = 0.98
      if (d.v < -0.98) d.v = -0.98
      if (d.u > 1) {
        d.u -= 1
        d.id = nextId.current++
        d.v = r() * 2 - 1
      }
      const [x, y] = pos(d)
      const [x2, y2] = pos({ u: d.u - d.len / Math.max(w, 1), v: d.v })
      ctx.moveTo(x2, y2)
      ctx.lineTo(x, y)
    }
    ctx.stroke()

    // ripples where you stepped
    ripples.current = ripples.current.filter((rp) => t - rp.t < 3)
    for (const rp of ripples.current) {
      const k = (t - rp.t) / 3
      ctx.strokeStyle = `rgba(13,13,14,${1 - k})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(rp.x, rp.y, FOOT + k * 60, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(13,13,14,0.9)'
    for (const rp of ripples.current.slice(-1)) {
      ctx.beginPath()
      ctx.arc(rp.x, rp.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ripples.current.now = t
  })

  const stepAt = (x, y) => {
    const { w, h } = size.current
    const off = Math.abs(y - center(x, w, h))
    if (off > half(x, w, h)) {
      setMiss(true)
      return
    }
    setMiss(false)
    const ids = new Set()
    for (const d of water.current) {
      const [dx, dy] = pos(d)
      if (Math.hypot(dx - x, dy - y) < FOOT) ids.add(d.id)
    }
    ripples.current.push({ x, y, t: ripples.current.now || 0 })
    setSteps((prev) => {
      const last = prev[prev.length - 1]
      const shared = last ? [...ids].filter((id) => last.ids.has(id)).length : null
      return [...prev.slice(-3), { n: (last?.n || 0) + 1, ids, count: ids.size, shared }]
    })
  }

  const onClick = (e) => {
    const b = wrap.current.getBoundingClientRect()
    stepAt(e.clientX - b.left, e.clientY - b.top)
  }
  const stepCenter = () => {
    const { w, h } = size.current
    stepAt(w * 0.5, center(w * 0.5, w, h))
  }

  const last = steps[steps.length - 1]
  return (
    <section id="river" className="river">
      <div className="river__canvas" ref={wrap} onClick={onClick}>
        <canvas ref={canvas} role="img" aria-label="A river drawn as thousands of moving strokes between two fixed banks" />
      </div>

      <div className="river__top">
        <SectionHead no="03" title="The River" kicker="Click the water to step in. Then step in again." />
        <figure className="river__quote">
          <blockquote>“Upon those who step into the same rivers, different and again different waters flow.”</blockquote>
          <figcaption className="mono">Heraclitus, fragment 12</figcaption>
        </figure>
      </div>

      <div className="river__panel" aria-live="polite">
        <button type="button" className="river__btn mono" onClick={stepCenter}>
          Step into the river
        </button>
        {miss && <p className="river__miss">That is the bank. The bank stays where it is: step into the water.</p>}
        {!steps.length && !miss && <p className="river__hint">Nothing recorded yet.</p>}
        <ol className="river__steps mono">
          {steps.map((s) => (
            <li key={s.n}>
              <span>Step {s.n}</span>
              <b>{s.count} drops</b>
              <span>{s.shared === null ? 'first step' : `${s.shared} the same as last time`}</span>
            </li>
          ))}
        </ol>
        {last && last.shared !== null && (
          <p className="river__verdict">
            {last.shared === 0 ? (
              <>
                The same river. <em>None of the same water.</em>
              </>
            ) : (
              <>
                Only {last.shared} of {last.count} drops were still there. <em>Wait a moment and try again.</em>
              </>
            )}
          </p>
        )}
      </div>

      <p className="river__legend mono">
        <span className="river__key river__key--bank" /> The banks: fixed, measured, the same <span className="river__key river__key--water" /> The water: never the same twice
      </p>
    </section>
  )
}
