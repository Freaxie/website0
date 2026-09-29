import { useEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, clamp, lerp, mix, rng, smooth } from '../lib/geom.js'
import { GLYPHS, glyphPoints } from '../lib/glyphs.js'

const STAGES = [
  { at: 0, no: 'i', title: 'Symbol', text: 'A shape that means more than it shows. Twelve signs on a wheel, each a door to a story.' },
  { at: 0.28, no: 'ii', title: 'Sign', text: 'Take away the story and the shape comes apart into marks.' },
  { at: 0.52, no: 'iii', title: 'Point', text: 'Each mark becomes a point: a place, and nothing else.' },
  { at: 0.76, no: 'iv', title: 'Grid', text: 'Every point a coordinate, every coordinate a number. Now it can be counted, and something is lost that could not be.' },
]

// Build the two states of the same set of points: the ritual wheel, and a regular grid.
function build(w, h) {
  const cx = w / 2
  const cy = h / 2
  const R = Math.min(w, h) * 0.34
  const s = R * 0.36
  const src = []
  GLYPHS.forEach((g, i) => {
    const a = (i / 12) * TAU - Math.PI / 2
    const gx = cx + Math.cos(a) * R
    const gy = cy + Math.sin(a) * R
    for (const [x, y] of glyphPoints(g.prims, 5)) src.push([gx + ((x - 50) / 100) * s, gy + ((y - 50) / 100) * s, i])
  })
  // the wheel's own rings
  for (const [rr, n] of [[R + s * 0.75, 150], [R - s * 0.75, 110], [R * 0.3, 40]]) {
    for (let k = 0; k < n; k++) src.push([cx + Math.cos((k / n) * TAU) * rr, cy + Math.sin((k / n) * TAU) * rr, -1])
  }
  const N = src.length
  // the grid: on wide screens it steps right, out of the captions' way
  const wide = w > 820
  const gx = wide ? w * 0.6 : w / 2
  const gy = wide ? h * 0.52 : h * 0.44
  const gw = wide ? Math.min(w * 0.58, h * 1.3) : w * 0.9
  const gh = wide ? Math.min(h * 0.6, gw * 0.72) : h * 0.44
  const cols = Math.ceil(Math.sqrt((N * gw) / gh))
  const rows = Math.ceil(N / cols)
  const cw = gw / cols
  const ch = gh / rows
  const dst = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dst.length < N) dst.push([gx - gw / 2 + (c + 0.5) * cw, gy - gh / 2 + (r + 0.5) * ch])
  // pair by angle around the centre, so the wheel unwinds into the grid rather than scrambling
  const ang = (ox, oy) => ([x, y]) => Math.atan2(y - oy, x - ox)
  const sa = ang(cx, cy)
  const da = ang(gx, gy)
  const si = src.map((p, i) => i).sort((a, b) => sa(src[a]) - sa(src[b]))
  const di = dst.map((p, i) => i).sort((a, b) => da(dst[a]) - da(dst[b]))
  const r = rng(5)
  const pts = si.map((k, j) => ({ sx: src[k][0], sy: src[k][1], g: src[k][2], dx: dst[di[j]][0], dy: dst[di[j]][1], d: r(), v: r() }))
  return { pts, grid: { x: gx - gw / 2, y: gy - gh / 2, gw, gh, cols, rows, cw, ch }, cx, cy, R, s }
}

export default function Transmutation() {
  const ref = useRef(null)
  const stickyRef = useRef(null)
  const canvas = useRef(null)
  const scene = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const prog = useRef(0)
  const [stage, setStage] = useState(0)
  const [pct, setPct] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    prog.current = p
    let k = 0
    STAGES.forEach((s, i) => p >= s.at && (k = i))
    setStage(k)
    setPct(Math.round(p * 100))
  })

  useEffect(() => {
    const el = canvas.current
    const fit = () => {
      const b = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(b.width * dpr)
      el.height = Math.round(b.height * dpr)
      size.current = { w: b.width, h: b.height, dpr }
      scene.current = build(b.width, b.height)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(stickyRef, (t) => {
    const el = canvas.current
    const S = scene.current
    if (!el || !S) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    const p = prog.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // the wall itself turns from obsidian to white
    const bg = smooth(0.42, 0.62, p)
    ctx.fillStyle = mix(C.obsidian, C.white, bg)
    ctx.fillRect(0, 0, w, h)

    // the wheel turns while it is still a wheel
    const spin = (1 - smooth(0.2, 0.45, p)) * t * 0.04
    const cs = Math.cos(spin)
    const sn = Math.sin(spin)

    // faint constellation lines between neighbouring points of the same sign, fading out as it comes apart
    const lines = 1 - smooth(0.12, 0.34, p)
    // grid rules fade in
    const rules = smooth(0.6, 0.8, p)
    const G = S.grid
    if (rules > 0) {
      ctx.strokeStyle = C.rule
      ctx.globalAlpha = rules
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let c = 0; c <= G.cols; c++) {
        const x = Math.round(G.x + c * G.cw) + 0.5
        ctx.moveTo(x, G.y)
        ctx.lineTo(x, G.y + G.gh)
      }
      for (let r = 0; r <= G.rows; r++) {
        const y = Math.round(G.y + r * G.ch) + 0.5
        ctx.moveTo(G.x, y)
        ctx.lineTo(G.x + G.gw, y)
      }
      ctx.stroke()
    }

    let prev = null
    ctx.lineWidth = 1.2
    for (const q of S.pts) {
      // each point leaves on its own schedule
      const k = smooth(0.24 + q.d * 0.2, 0.62 + q.d * 0.14, p)
      const rx = q.sx - S.cx
      const ry = q.sy - S.cy
      const wx = S.cx + rx * cs - ry * sn
      const wy = S.cy + rx * sn + ry * cs
      // a little turbulence in the middle of the passage
      const j = Math.sin(k * Math.PI) * 26
      const x = lerp(wx, q.dx, k) + Math.cos(q.v * TAU + t) * j
      const y = lerp(wy, q.dy, k) + Math.sin(q.v * TAU + t) * j
      if (lines > 0 && prev && prev.g === q.g && q.g >= 0 && Math.hypot(prev.x - x, prev.y - y) < 14) {
        ctx.strokeStyle = C.gold
        ctx.globalAlpha = lines * 0.9
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      prev = { x, y, g: q.g }
      const lit = q.v < 0.08
      ctx.globalAlpha = 1
      ctx.fillStyle = k < 0.5 ? mix(C.goldLt, C.crimson, k * 2 * (q.v < 0.3 ? 1 : 0)) : lit ? C.blue : mix(C.gold, C.black, (k - 0.5) * 2)
      const sz = lerp(1.6, 2.2, k)
      if (k > 0.85) ctx.fillRect(x - sz, y - sz, sz * 2, sz * 2)
      else {
        ctx.beginPath()
        ctx.arc(x, y, sz, 0, TAU)
        ctx.fill()
      }
    }

    // at the end, some cells light up with their values
    const nums = smooth(0.84, 0.96, p)
    if (nums > 0) {
      ctx.font = '500 9px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.globalAlpha = nums
      S.pts.forEach((q, i) => {
        if (q.v > 0.08) return
        ctx.fillStyle = C.blue
        ctx.fillText(`.${String(Math.floor(q.d * 100)).padStart(2, '0')}`, q.dx + 5, q.dy - 4)
        if (i % 3 === 0) {
          ctx.strokeStyle = C.blue
          ctx.lineWidth = 1
          ctx.strokeRect(q.dx - G.cw / 2 + 0.5, q.dy - G.ch / 2 + 0.5, G.cw, G.ch)
        }
      })
    }
    ctx.globalAlpha = 1
  })

  const s = STAGES[stage]
  const dark = pct < 52
  return (
    <section id="transmutation" className={`trn ${dark ? 'is-dark' : 'is-light'}`} ref={ref}>
      <div className="trn__sticky" ref={stickyRef}>
        <canvas ref={canvas} className="trn__canvas" aria-hidden="true" />
        <header className="trn__head">
          <span className="mono">03</span>
          <h2>Transmutation</h2>
        </header>
        <div className="trn__caption" aria-live="polite">
          <span className="mono">
            {s.no} / {s.title}
          </span>
          <p key={stage}>{s.text}</p>
        </div>
        <div className="trn__meter mono" aria-hidden="true">
          <span>Symbol</span>
          <i>
            <b style={{ width: `${pct}%` }} />
          </i>
          <span>Grid</span>
        </div>
      </div>
    </section>
  )
}
