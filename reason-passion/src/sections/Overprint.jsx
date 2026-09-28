import { useEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { lerp, rng, smooth } from '../lib/geom.js'

const WORD = 'JUDGEMENT'
const stepFor = (w) => (w < 600 ? 5 : 8)

// Print one halftone plate into its own canvas: dots on a rotated screen, sized by the mask beneath.
function plate(w, h, dpr, mask, angle, color) {
  const c = document.createElement('canvas')
  c.width = w * dpr
  c.height = h * dpr
  const ctx = c.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = color
  const m = mask.getContext('2d').getImageData(0, 0, w, h).data
  const a = (angle * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const R = Math.hypot(w, h)
  const STEP = stepFor(w)
  for (let u = -R; u < R; u += STEP) {
    for (let v = -R; v < R; v += STEP) {
      const x = w / 2 + u * cos - v * sin
      const y = h / 2 + u * sin + v * cos
      if (x < 0 || y < 0 || x >= w || y >= h) continue
      const k = m[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] / 255
      if (k < 0.05) continue
      ctx.beginPath()
      ctx.arc(x, y, (STEP / 2) * 0.95 * Math.sqrt(k), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return c
}

// Each plate = the word + its own half of a field of blobs. Only the word is on both.
function masks(w, h) {
  const make = () => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const a = make()
  const b = make()
  // on a narrow screen the word breaks over two lines so it stays large enough to read through the screen
  const lines = w < 600 ? ['JUDGE', 'MENT'] : [WORD]
  const longest = Math.max(...lines.map((l) => l.length))
  const size = Math.min(w / (longest * 0.98), h * (lines.length > 1 ? 0.2 : 0.28))
  for (const c of [a, b]) {
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.font = `900 ${size}px 'Archivo Variable', 'Archivo', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h * 0.5 + (i - (lines.length - 1) / 2) * size * 0.92))
  }
  const r = rng(1106)
  const cell = Math.max(46, size * 0.5)
  let k = 0
  for (let y = -cell; y < h + cell; y += cell * 0.8) {
    for (let x = -cell; x < w + cell; x += cell * 0.8) {
      const ctx = (k++ + Math.floor(y / cell)) % 2 ? a.getContext('2d') : b.getContext('2d')
      ctx.globalAlpha = 0.55 + r() * 0.45
      ctx.beginPath()
      ctx.arc(x + (r() - 0.5) * cell * 0.6, y + (r() - 0.5) * cell * 0.6, cell * (0.28 + r() * 0.2), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }
  return [a, b]
}

export default function Overprint() {
  const ref = useRef(null)
  const wrap = useRef(null)
  const canvas = useRef(null)
  const plates = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const pointer = useRef({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [off, setOff] = useState(80)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setOff(lerp(80, 0, smooth(0.12, 0.7, p))))

  useEffect(() => {
    const el = wrap.current
    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      size.current = { w, h, dpr }
      canvas.current.width = w * dpr
      canvas.current.height = h * dpr
      const [a, b] = masks(w, h)
      plates.current = [plate(w, h, dpr, a, 15, '#0098c8'), plate(w, h, dpr, b, 75, '#e0157a')]
    }
    let ro
    ;(document.fonts?.ready || Promise.resolve()).then(() => {
      build()
      ro = new ResizeObserver(build)
      ro.observe(el)
    })
    return () => ro?.disconnect()
  }, [])

  useLoop(wrap, () => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !plates.current) return
    const { w, h, dpr } = size.current
    const p = scrollYProgress.get()
    const d = lerp(80, 0, smooth(0.12, 0.7, p))
    const jx = pointer.current.x * 10 * (d / 80 + 0.15)
    const jy = pointer.current.y * 10 * (d / 80 + 0.15)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#f8f7f3'
    ctx.fillRect(0, 0, w * dpr, h * dpr)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(plates.current[0], (-d * 0.7 - jx) * dpr, (-d * 0.4 - jy) * dpr)
    ctx.drawImage(plates.current[1], (d * 0.7 + jx) * dpr, (d * 0.4 + jy) * dpr)
    ctx.globalCompositeOperation = 'source-over'
  })

  const move = (e) => {
    const b = wrap.current.getBoundingClientRect()
    pointer.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5 }
  }

  const inRegister = off < 1.5
  return (
    <section id="overprint" className="ovp" ref={ref}>
      <div className="ovp__sticky">
        <div className="ovp__canvas" ref={wrap} onPointerMove={move}>
          <canvas ref={canvas} role="img" aria-label={`Two halftone plates, cyan and magenta. ${inRegister ? `In register, the word ${WORD} appears where both inks overlap.` : 'Out of register, neither plate shows a clear image.'}`} />
        </div>
        <div className="ovp__head">
          <SectionHead no="07" title="Overprint" kicker="Two plates, two inks. Scroll to bring them into register." />
        </div>
        <div className="ovp__reg mono" aria-live="polite">
          <span className="ovp__cross" aria-hidden="true" />
          <div>
            <span>Misregistration</span>
            <b>{inRegister ? 'in register' : `${off.toFixed(1)} px`}</b>
          </div>
        </div>
        <div className="ovp__note">
          <p>
            Neither plate carries the image alone. The word appears only where both inks fall on the same spot. Aristotle’s name for this virtue is <em>phronesis</em>, practical wisdom: caring about the right things, and thinking clearly about them.
          </p>
        </div>
      </div>
    </section>
  )
}
