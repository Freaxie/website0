import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, clamp, closedPath, mix3, openPath, ring, rng, smooth, wave } from '../lib/geom.js'

const STATES = [
  { word: 'Geometry', note: 'Perfect symmetry. Every point is where it must be. Beautiful, and perfectly still.' },
  { word: 'Tension', note: 'A tremor under the surface. The form holds, but it has begun to breathe.' },
  { word: 'Distortion', note: 'The measure bends. The circle remembers it was once a circle.' },
  { word: 'Flux', note: 'Edges open. Parts slip their places and start to move with each other.' },
  { word: 'Chaos', note: 'No outline left to keep. Only rhythm, pressure and pulse: life before form.' },
]

const W = 1000
const H = 680
const CX = 500
const CY = 340
const r = rng(404)
const SHARDS = Array.from({ length: 22 }, () => ({
  x: 80 + r() * 840,
  y: 60 + r() * 560,
  a: r() * TAU,
  s: 8 + r() * 26,
  spin: (r() - 0.5) * 2,
  at: 0.45 + r() * 0.45,
}))

function Stage({ v }) {
  const ref = useRef(null)
  const circle = useRef(null)
  const inner = useRef(null)
  const square = useRef(null)
  const gridV = useRef([])
  const gridH = useRef([])
  const shards = useRef([])
  const bg = useRef(null)
  const time = useRef(0)

  useLoop(ref, (_t, dt) => {
    const x = v.get()
    // Apollo's world is still; time only begins to run once the measure is disturbed.
    time.current += dt * (x * 1.8)
    const t = time.current
    const amp = Math.pow(x, 1.4)
    const cx = mix3(C.cobalt, C.purple, C.blush, x)

    bg.current?.setAttribute('fill', mix3(C.marble, '#e6dcd6', C.wineDk, smooth(0.1, 1, x)))

    const n = 140
    const pts = []
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU
      const k = 1 + amp * 0.34 * ring(th, t, 1, 0.4 + x * 1.6)
      pts.push([CX + Math.cos(th) * 230 * k, CY + Math.sin(th) * 230 * k])
    }
    if (circle.current) {
      circle.current.setAttribute('d', closedPath(pts))
      circle.current.setAttribute('stroke', cx)
      circle.current.setAttribute('fill', C.crimson)
      circle.current.setAttribute('fill-opacity', smooth(0.35, 0.95, x) * 0.7)
      circle.current.setAttribute('stroke-width', 1.5 + x * 2)
    }
    if (inner.current) {
      const ip = []
      for (let i = 0; i < 90; i++) {
        const th = (i / 90) * TAU
        const k = 1 + amp * 0.6 * ring(th, t * 1.3, 4, 0.6 + x * 1.8)
        ip.push([CX + Math.cos(th) * 92 * k + amp * 60 * Math.sin(t * 0.7), CY + Math.sin(th) * 92 * k])
      }
      inner.current.setAttribute('d', closedPath(ip))
      inner.current.setAttribute('fill', mix3(C.cobalt, C.wine, C.crimsonLt, x))
    }
    if (square.current) {
      const side = 325
      const sq = []
      const per = 120
      for (let i = 0; i < per; i++) {
        const u = (i / per) * 4
        const e = Math.floor(u)
        const f = u - e
        const h = side / 2
        let px, py
        if (e === 0) [px, py] = [-h + f * side, -h]
        else if (e === 1) [px, py] = [h, -h + f * side]
        else if (e === 2) [px, py] = [h - f * side, h]
        else [px, py] = [-h, h - f * side]
        const th = (i / per) * TAU
        const d = amp * 70 * ring(th, t * 0.8 + 2, 3, 1 + x)
        const len = Math.hypot(px, py)
        sq.push([CX + px + (px / len) * d, CY + py + (py / len) * d])
      }
      square.current.setAttribute('d', closedPath(sq))
      square.current.setAttribute('stroke', cx)
      square.current.setAttribute('stroke-dasharray', x < 0.55 ? 'none' : `${60 - 50 * smooth(0.55, 1, x)} ${30 * smooth(0.55, 1, x)}`)
      square.current.setAttribute('transform', `rotate(${amp * 30 * Math.sin(t * 0.3)} ${CX} ${CY})`)
    }
    gridV.current.forEach((el, i) => {
      if (!el) return
      const x0 = 40 + i * 92
      const line = []
      for (let k = 0; k <= 20; k++) {
        const y = (k / 20) * H
        line.push([x0 + amp * 70 * wave(y * 0.008 + i * 0.7, t, i), y])
      }
      el.setAttribute('d', openPath(line))
      el.setAttribute('stroke', cx)
      el.setAttribute('stroke-opacity', 0.35 - x * 0.1)
    })
    gridH.current.forEach((el, i) => {
      if (!el) return
      const y0 = 30 + i * 89
      const line = []
      for (let k = 0; k <= 24; k++) {
        const xx = (k / 24) * W
        line.push([xx, y0 + amp * 60 * wave(xx * 0.007 + i * 0.9, t * 1.1, i + 3)])
      }
      el.setAttribute('d', openPath(line))
      el.setAttribute('stroke', cx)
      el.setAttribute('stroke-opacity', 0.35 - x * 0.1)
    })
    shards.current.forEach((el, i) => {
      if (!el) return
      const s = SHARDS[i]
      const on = smooth(s.at, s.at + 0.15, x)
      const drift = amp * 40
      el.setAttribute(
        'transform',
        `translate(${s.x + Math.sin(t * 0.6 + i) * drift} ${s.y + Math.cos(t * 0.5 + i) * drift}) rotate(${(s.a + t * s.spin) * 57.3}) scale(${on})`,
      )
      el.setAttribute('fill', i % 3 ? C.crimsonLt : C.blush)
    })
  })

  return (
    <svg ref={ref} className="spec__stage" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect ref={bg} width={W} height={H} />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={`v${i}`} ref={(el) => (gridV.current[i] = el)} fill="none" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={`h${i}`} ref={(el) => (gridH.current[i] = el)} fill="none" strokeWidth="1" />
      ))}
      <path ref={circle} />
      <path ref={square} fill="none" strokeWidth="1.5" />
      <path ref={inner} />
      {SHARDS.map((s, i) => (
        <path key={i} ref={(el) => (shards.current[i] = el)} d={`M0 ${-s.s}L${s.s * 0.6} ${s.s * 0.5}L${-s.s * 0.8} ${s.s * 0.3}Z`} />
      ))}
    </svg>
  )
}

function Slider({ v, onTouch }) {
  const track = useRef(null)
  const left = useTransform(v, (x) => `${x * 100}%`)
  const radius = useTransform(v, (x) => {
    const a = Math.round(x * 50)
    const b = Math.round(x * 30)
    return `${a}% ${50 - b + a * 0.4}% ${a}% ${b + a * 0.3}% / ${a * 0.8}% ${a}% ${50 - b}% ${a}%`
  })
  const rot = useTransform(v, [0, 1], [0, 135])
  const bgc = useTransform(v, (x) => mix3(C.cobalt, C.purple, C.crimson, x))
  const [val, setVal] = useState(0)
  useMotionValueEvent(v, 'change', (x) => setVal(Math.round(x * 100)))

  const setFrom = (clientX) => {
    const b = track.current.getBoundingClientRect()
    v.set(clamp((clientX - b.left) / b.width))
  }
  const down = (e) => {
    onTouch()
    e.currentTarget.setPointerCapture(e.pointerId)
    setFrom(e.clientX)
  }
  const move = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFrom(e.clientX)
  }
  const key = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02
    const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }
    if (e.key in map) {
      e.preventDefault()
      onTouch()
      v.set(clamp(v.get() + map[e.key]))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      onTouch()
      v.set(e.key === 'Home' ? 0 : 1)
    }
  }

  return (
    <div className="spec__slider">
      <span className="spec__end mono">Apollo</span>
      <div
        className="spec__track"
        ref={track}
        onPointerDown={down}
        onPointerMove={move}
        onKeyDown={key}
        tabIndex={0}
        role="slider"
        aria-label="From perfect geometry to organic chaos"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={val}
        aria-valuetext={STATES[Math.min(4, Math.floor(val / 20))].word}
      >
        {Array.from({ length: 41 }, (_, i) => (
          <i key={i} className={i % 10 === 0 ? 'major' : ''} style={{ left: `${i * 2.5}%` }} />
        ))}
        <motion.div className="spec__fill" style={{ width: left, background: bgc }} />
        <motion.div className="spec__handle" style={{ left, borderRadius: radius, rotate: rot, background: bgc }} />
      </div>
      <span className="spec__end mono">Dionysus</span>
    </div>
  )
}

export default function Spectrum() {
  const v = useMotionValue(0)
  const ref = useRef(null)
  const touched = useRef(false)
  const sweep = useRef(null)
  const inView = useInView(ref, { amount: 0.5, once: true })
  const [stage, setStage] = useState(0)
  const [x, setX] = useState(0)

  useMotionValueEvent(v, 'change', (val) => {
    setStage(Math.min(4, Math.floor(val * 5)))
    setX(val)
  })

  // One unprompted sweep, so the visitor sees that the wall moves.
  useEffect(() => {
    if (!inView || touched.current) return
    sweep.current = animate(v, [0, 0.42, 0], { duration: 3.2, ease: 'easeInOut', delay: 0.6 })
    return () => sweep.current?.stop()
  }, [inView, v])

  const wordW = useTransform(v, [0, 1], [125, 62])
  const skew = useTransform(v, [0, 0.4, 1], [0, -6, -14])
  const spacing = useTransform(v, [0, 1], ['0.02em', '-0.06em'])
  const wordColor = useTransform(v, (val) => mix3(C.cobalt, C.crimson, C.blush, val))
  const variation = useTransform(wordW, (w) => `"wdth" ${w}`)
  const ink = useTransform(v, (val) => (val > 0.72 ? C.paper : C.ink))
  const s = STATES[stage]
  const dion = stage >= 3

  return (
    <section id="spectrum" className="spec" ref={ref}>
      <motion.div className="spec__inner" style={{ color: ink }}>
        <Stage v={v} />
        <div className="spec__head">
          <SectionHead no="04" title="Spectrum" kicker="Drag the measure. Watch a form discover it is alive, and then forget it was ever a form." tone="inherit" />
        </div>

        <motion.div
          className={`spec__word ${dion ? 'is-dion' : ''}`}
          style={{ fontVariationSettings: dion ? undefined : variation, skewX: skew, letterSpacing: spacing, color: wordColor }}
          aria-hidden="true"
        >
          {s.word.split('').map((ch, i) => (
            <motion.span
              key={`${s.word}-${i}`}
              initial={{ opacity: 0, y: dion ? 40 : '0.4em', rotate: dion ? (i % 2 ? 20 : -20) : 0, filter: dion ? 'blur(6px)' : 'blur(0px)' }}
              animate={{ opacity: 1, y: 0, rotate: dion ? (i % 2 ? 4 : -5) * x : 0, filter: 'blur(0px)' }}
              transition={{ duration: dion ? 0.9 : 0.5, delay: i * (dion ? 0.03 : 0.035), ease: [0.2, 0.8, 0.2, 1] }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        <div className="spec__readout mono" aria-live="polite">
          <div>
            <span>State</span>
            <b>
              {String(stage + 1).padStart(2, '0')} / {s.word}
            </b>
          </div>
          <div>
            <span>Symmetry</span>
            <b>{(100 * (1 - Math.pow(x, 0.8))).toFixed(1)}%</b>
          </div>
          <div>
            <span>Deviation σ</span>
            <b>{(Math.pow(x, 1.4) * 0.34).toFixed(3)}</b>
          </div>
          <div>
            <span>Tempo</span>
            <b>{Math.round(x * 180)} bpm</b>
          </div>
          <p>{s.note}</p>
        </div>

        <Slider v={v} onTouch={() => {
            touched.current = true
            sweep.current?.stop()
          }} />
      </motion.div>
    </section>
  )
}
