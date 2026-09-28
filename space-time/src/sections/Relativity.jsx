import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, clamp, mixHex } from '../lib/geom.js'

const MAX = 0.995
const gammaOf = (b) => 1 / Math.sqrt(1 - b * b)

const STATES = [
  { at: 0, name: 'At rest', note: 'Your ruler and your clock agree with everyone at rest beside you. Space is space; time is time.' },
  { at: 0.1, name: 'Fast', note: 'Still nearly Newtonian. The differences are real, but they hide in the decimals.' },
  { at: 0.5, name: 'Relativistic', note: 'Seen from where you stand, the moving rod is measurably shorter and the moving clock measurably slow.' },
  { at: 0.8, name: 'Folding', note: 'Space and time trade against each other. The moving frame’s axes fold toward the light line.' },
  { at: 0.95, name: 'Near light', note: 'Almost no length, almost no time. The speed of light is the one thing every observer agrees on.' },
]
const stateOf = (b) => STATES.reduce((acc, s, i) => (b >= s.at ? i : acc), 0)

function Rod({ beta }) {
  const g = gammaOf(beta)
  const L = 300 / g
  return (
    <svg viewBox="0 0 360 200" className="rel__svg" role="img" aria-label={`A ten-metre rod, contracted to ${(10 / g).toFixed(2)} metres`}>
      <text x="30" y="34" className="rel__cap">
        rod at rest · L₀ = 10 m
      </text>
      <rect x="30" y="46" width="300" height="26" className="rel__outline" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${30 + i * 30} 72V${i % 5 ? 80 : 86}`} className="rel__tick" />
      ))}
      <text x="30" y="126" className="rel__cap">
        moving rod · L = L₀ / γ = {(10 / g).toFixed(2)} m
      </text>
      <rect x="30" y="138" width={L} height="26" fill={C.viridian} />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${30 + (i * L) / 10} 164V${i % 5 ? 172 : 178}`} className="rel__tick" />
      ))}
      <path d={`M${40 + L} 151h${24 + beta * 30}`} className="rel__arrow" />
      <path d={`M${58 + L + beta * 30} 145l8 6-8 6`} className="rel__arrow" />
    </svg>
  )
}

function Clocks({ betaRef }) {
  const ref = useRef(null)
  const handA = useRef(null)
  const handB = useRef(null)
  const txtA = useRef(null)
  const txtB = useRef(null)
  const tA = useRef(0)
  const tB = useRef(0)
  useLoop(ref, (_t, dt) => {
    const g = gammaOf(betaRef.current)
    tA.current += dt
    tB.current += dt / g
    handA.current?.setAttribute('transform', `rotate(${(tA.current / 4) * 360} 90 100)`)
    handB.current?.setAttribute('transform', `rotate(${(tB.current / 4) * 360} 270 100)`)
    if (txtA.current) txtA.current.textContent = `${tA.current.toFixed(1)} s`
    if (txtB.current) txtB.current.textContent = `${tB.current.toFixed(1)} s`
  })
  const face = (cx) => (
    <>
      <circle cx={cx} cy="100" r="62" className="rel__face" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * TAU
        return <line key={i} x1={cx + Math.cos(a) * 54} y1={100 + Math.sin(a) * 54} x2={cx + Math.cos(a) * 62} y2={100 + Math.sin(a) * 62} className="rel__tick" />
      })}
    </>
  )
  return (
    <svg ref={ref} viewBox="0 0 360 200" className="rel__svg" role="img" aria-label="Two clocks: yours, and a moving clock that runs slower by the factor gamma">
      {face(90)}
      {face(270)}
      <line ref={handA} x1="90" y1="100" x2="90" y2="44" className="rel__hand rel__hand--rest" />
      <line ref={handB} x1="270" y1="100" x2="270" y2="44" className="rel__hand" />
      <circle cx="90" cy="100" r="4" fill={C.ink} />
      <circle cx="270" cy="100" r="4" fill={C.amber} />
      <text x="90" y="186" textAnchor="middle" className="rel__cap">
        yours · <tspan ref={txtA}>0.0 s</tspan>
      </text>
      <text x="270" y="186" textAnchor="middle" className="rel__cap">
        moving · <tspan ref={txtB}>0.0 s</tspan>
      </text>
    </svg>
  )
}

function Minkowski({ beta }) {
  const g = gammaOf(beta)
  const S = 26
  const H = 110
  const P = (x, t) => [150 + x * S, 150 - t * S]
  const line = (x0, t0, dx, dt) => {
    const [a, b] = P(x0 - dx * 12, t0 - dt * 12)
    const [c, d] = P(x0 + dx * 12, t0 + dt * 12)
    return `M${a} ${b}L${c} ${d}`
  }
  const grid = []
  for (let n = -5; n <= 5; n++) {
    grid.push(line(g * beta * n, g * n, 1, beta))
    grid.push(line(g * n, g * beta * n, beta, 1))
  }
  return (
    <svg viewBox="0 0 300 300" className="rel__svg" role="img" aria-label="A spacetime diagram: the moving observer's axes tilt toward the light line as speed rises">
      <defs>
        <clipPath id="mk">
          <rect x={150 - H} y={150 - H} width={H * 2} height={H * 2} />
        </clipPath>
      </defs>
      <g clipPath="url(#mk)">
        {grid.map((d, i) => (
          <path key={i} d={d} className="rel__grid" />
        ))}
        <path d={`M${150 - H} ${150 + H}L${150 + H} ${150 - H}M${150 - H} ${150 - H}L${150 + H} ${150 + H}`} className="rel__light" />
        <path d={line(0, 0, beta, 1)} className="rel__prime" />
        <path d={line(0, 0, 1, beta)} className="rel__prime" />
      </g>
      <path d={`M${150 - H} 150H${150 + H}M150 ${150 + H}V${150 - H}`} className="rel__axes" />
      <text x={150 + H - 4} y="166" textAnchor="end" className="rel__cap">
        x
      </text>
      <text x="158" y={150 - H + 12} className="rel__cap">
        t
      </text>
      <text x={P(3.7, 3.7 * beta)[0]} y={P(3.7, 3.7 * beta)[1] - 8} textAnchor="end" className="rel__cap rel__cap--v">
        x′
      </text>
      <text x={P(3.7 * beta, 3.7)[0] + 8} y={P(3.7 * beta, 3.7)[1] + 6} className="rel__cap rel__cap--v">
        t′
      </text>
      <text x={150 - H + 6} y={150 - H + 12} className="rel__cap rel__cap--a">
        light
      </text>
    </svg>
  )
}

function Slider({ v, onTouch }) {
  const track = useRef(null)
  const left = useTransform(v, (x) => `${x * 100}%`)
  const bg = useTransform(v, (x) => mixHex(C.viridian, C.amber, x))
  const [val, setVal] = useState(0)
  useMotionValueEvent(v, 'change', (x) => setVal(x))

  const setFrom = (clientX) => {
    const b = track.current.getBoundingClientRect()
    v.set(clamp((clientX - b.left) / b.width))
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
    <div className="rel__slider">
      <span className="mono">Rest</span>
      <div
        className="rel__track"
        ref={track}
        tabIndex={0}
        role="slider"
        aria-label="Velocity, as a fraction of the speed of light"
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={Number((val * MAX).toFixed(3))}
        aria-valuetext={`${(val * MAX).toFixed(3)} c`}
        onKeyDown={key}
        onPointerDown={(e) => {
          onTouch()
          e.currentTarget.setPointerCapture(e.pointerId)
          setFrom(e.clientX)
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && setFrom(e.clientX)}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <i key={i} style={{ left: `${i * 10}%` }}>
            <span className="mono">{((i / 10) * MAX).toFixed(i === 10 ? 3 : 1)}</span>
          </i>
        ))}
        <motion.div className="rel__fill" style={{ width: left, background: bg }} />
        <motion.div className="rel__handle" style={{ left, background: bg }} />
      </div>
      <span className="mono">c</span>
    </div>
  )
}

export default function Relativity() {
  const v = useMotionValue(0)
  const ref = useRef(null)
  const betaRef = useRef(0)
  const touched = useRef(false)
  const sweep = useRef(null)
  const inView = useInView(ref, { amount: 0.5, once: true })
  const [beta, setBeta] = useState(0)

  useMotionValueEvent(v, 'change', (x) => {
    betaRef.current = x * MAX
    setBeta(x * MAX)
  })

  useEffect(() => {
    if (!inView || touched.current) return
    sweep.current = animate(v, [0, 0.88, 0.6], { duration: 3.6, ease: 'easeInOut', delay: 0.6 })
    return () => sweep.current?.stop()
  }, [inView, v])

  const g = gammaOf(beta)
  const st = STATES[stateOf(beta)]

  return (
    <section id="relativity" className="rel" ref={ref}>
      <div className="rel__top">
        <SectionHead no="04" title="Velocity" kicker="Move faster and space and time stop being separate. Drag toward the speed of light." />
        <div className="rel__readout mono" aria-live="polite">
          <div>
            <span>Velocity</span>
            <b>{(beta * 299792.458).toLocaleString('en-US', { maximumFractionDigits: 0 })} km/s</b>
          </div>
          <div>
            <span>β = v / c</span>
            <b>{beta.toFixed(3)}</b>
          </div>
          <div>
            <span>γ = 1 / √(1 − β²)</span>
            <b>{g.toFixed(3)}</b>
          </div>
          <div>
            <span>Their second lasts</span>
            <b>{g.toFixed(2)} of yours</b>
          </div>
          <p>
            <em>{st.name}.</em> {st.note}
          </p>
        </div>
      </div>

      <div className="rel__panels">
        <figure>
          <figcaption className="mono">Length contraction</figcaption>
          <Rod beta={beta} />
        </figure>
        <figure>
          <figcaption className="mono">Time dilation</figcaption>
          <Clocks betaRef={betaRef} />
        </figure>
        <figure>
          <figcaption className="mono">The axes fold</figcaption>
          <Minkowski beta={beta} />
        </figure>
      </div>

      <div className="rel__words" aria-hidden="true">
        <span className="rel__space" style={{ transform: `scaleX(${1 / g})` }}>
          Space
        </span>
        <span className="rel__time" style={{ letterSpacing: `${(g - 1) * 0.06}em` }}>
          Time
        </span>
      </div>

      <Slider
        v={v}
        onTouch={() => {
          touched.current = true
          sweep.current?.stop()
        }}
      />
    </section>
  )
}
