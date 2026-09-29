import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { clamp, rng } from '../lib/geom.js'

const WORD = 'RED'

// The same event, described twice. Left of the line: what physics sees. Right: what it is like.
export default function TwoDescriptions() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1, font: 100 })
  const pts = useRef([])
  const [split, setSplit] = useState(0.5)
  const splitRef = useRef(0.5)
  splitRef.current = split

  useEffect(() => {
    const el = wrap.current
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      const font = Math.min(w / 2.3, h * 0.7)
      size.current = { w, h, dpr, font }
      canvas.current.width = w * dpr
      canvas.current.height = h * dpr
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.font = `900 ${font}px 'Archivo Variable', 'Archivo', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(WORD, w / 2, h / 2)
      const data = ctx.getImageData(0, 0, w, h).data
      const r = rng(700)
      const out = []
      const step = w < 820 ? 5 : 7
      for (let y = 0; y < h; y += step)
        for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 128) out.push({ x, y, ph: r() * 6.28, s: 2 + r() * 3 })
      pts.current = out
    }
    let ro
    ;(document.fonts?.ready || Promise.resolve()).then(() => {
      build()
      ro = new ResizeObserver(build)
      ro.observe(el)
    })
    return () => ro?.disconnect()
  }, [])

  useLoop(wrap, (t) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr, font } = size.current
    const sx = splitRef.current * w
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // physics
    ctx.fillStyle = '#151412'
    ctx.fillRect(0, 0, sx, h)
    ctx.fillStyle = '#f3c300'
    for (const q of pts.current) {
      if (q.x > sx) continue
      const j = Math.sin(t * 9 + q.ph) * 1.6
      ctx.fillRect(q.x + j, q.y + Math.cos(t * 8 + q.ph) * 1.6, q.s, q.s)
    }
    // experience
    ctx.save()
    ctx.beginPath()
    ctx.rect(sx, 0, w - sx, h)
    ctx.clip()
    ctx.fillStyle = '#f4f3fb'
    ctx.fillRect(sx, 0, w - sx, h)
    ctx.fillStyle = '#e3211b'
    ctx.font = `900 ${font}px 'Archivo Variable', 'Archivo', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(WORD, w / 2, h / 2)
    ctx.restore()
    // the line
    ctx.fillStyle = '#3c3cff'
    ctx.fillRect(sx - 1.5, 0, 3, h)
  })

  const drag = (e) => {
    if (e.type === 'pointermove' && !e.currentTarget.hasPointerCapture(e.pointerId)) return
    if (e.type === 'pointerdown') e.currentTarget.setPointerCapture(e.pointerId)
    const b = wrap.current.getBoundingClientRect()
    setSplit(clamp((e.clientX - b.left) / b.width, 0.02, 0.98))
  }

  return (
    <section id="two" className="two">
      <div className="two__top">
        <SectionHead no="07" title="Two Descriptions" kicker="One event: you see something red. Drag the line to move between the two ways of telling it." />
        <label className="two__range mono" htmlFor="two-split">
          Physics ← → Experience
          <input id="two-split" type="range" min="2" max="98" value={Math.round(split * 100)} onChange={(e) => setSplit(Number(e.target.value) / 100)} />
        </label>
      </div>

      <div className="two__stage" ref={wrap} onPointerDown={drag} onPointerMove={drag}>
        <canvas ref={canvas} role="img" aria-label="On the left, the word RED as vibrating yellow particles on black. On the right, the same word in solid red on white. A blue line divides them." />
        <div className="two__labels mono" aria-hidden="true">
          <span className="two__l" style={{ opacity: split > 0.2 ? 1 : 0 }}>
            ≈ 700 nm light · L-cones firing · area V4 active
          </span>
          <span className="two__r" style={{ opacity: split < 0.8 ? 1 : 0 }}>
            what it is like: the redness of red
          </span>
        </div>
      </div>

      <div className="two__notes">
        <p>
          <span className="mono">Spinoza, 1677</span>
          Thought and extension are two attributes of one substance. “The order and connection of ideas is the same as the order and connection of things.”
        </p>
        <p>
          <span className="mono">Neutral monism</span>
          William James and Bertrand Russell proposed that the world is made of something neither mental nor material, which shows up as matter when described one way and as mind when described another.
        </p>
        <p>
          <span className="mono">The open question</span>
          Is the red on the right just the particles on the left, seen from inside? Materialists say yes; idealists say the right side is the only side we ever see. The line between them is where the argument still lives.
        </p>
      </div>
    </section>
  )
}
