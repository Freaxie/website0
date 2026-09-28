import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, blobPoints, closedPath, range } from '../lib/geom.js'

const SPACE = 'SPACE'.split('')
const TIME = 'TIME'.split('')
const CX = 1070
const CY = 500
const R = 320

// A sector of the real current minute: the wall shows what time it is.
function sector(frac) {
  if (frac <= 0) return ''
  if (frac >= 0.9999) return `M${CX} ${CY - R}A${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R}Z`
  const a = frac * TAU - Math.PI / 2
  const x = CX + Math.cos(a) * R
  const y = CY + Math.sin(a) * R
  return `M${CX} ${CY}L${CX} ${CY - R}A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y}Z`
}

function Field({ px, py }) {
  const ref = useRef(null)
  const wedge = useRef(null)
  const hand = useRef(null)
  const pulse = useRef(null)
  const cross = useRef(null)
  const label = useRef(null)

  useLoop(ref, (t) => {
    const now = new Date()
    const secs = now.getSeconds() + now.getMilliseconds() / 1000
    // the wedge ticks in whole seconds; the hand sweeps
    wedge.current?.setAttribute('d', sector(Math.floor(secs) / 60))
    const a = (secs / 60) * 360
    hand.current?.setAttribute('transform', `rotate(${a} ${CX} ${CY})`)
    const k = (t % 4) / 4
    pulse.current?.setAttribute('r', 40 + k * 460)
    pulse.current?.setAttribute('opacity', Math.ceil((1 - k) * 4) / 4)

    const x = Math.round((px.get() * 0.5 + 0.5) * 1600)
    const y = Math.round((py.get() * 0.5 + 0.5) * 1000)
    const gx = Math.round(x / 60) * 60
    const gy = Math.round(y / 60) * 60 + 20
    if (cross.current) cross.current.setAttribute('transform', `translate(${Math.min(gx, 840)} ${gy})`)
    if (label.current) label.current.textContent = `(${Math.min(gx, 840) / 60}, ${(gy - 20) / 60})`
  })

  const rings = Array.from({ length: 8 }, (_, i) => closedPath(blobPoints(CX, CY, 70 + i * 52, 0.018 + i * 0.002, i * 1.7, { n: 60, seed: i * 2.3, complexity: 0.6 })))
  const draw = (delay) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: 1.6, delay: 1.5 + delay, ease: [0.65, 0, 0.35, 1] },
  })

  return (
    <svg ref={ref} className="hero__field" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* space: a lattice of possible positions */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1.2 }}>
        {Array.from({ length: 15 }, (_, i) =>
          Array.from({ length: 17 }, (_, j) => <circle key={`${i}-${j}`} cx={i * 60} cy={j * 60 + 20} r="1.8" className="hero__dot" />),
        )}
      </motion.g>
      <motion.path d="M60 20V980M0 920H880" className="hero__axis" {...draw(0)} />
      <motion.rect x="440" y="320" width="360" height="360" fill={C.viridian} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.3, delay: 1.7, ease: [0.76, 0, 0.24, 1] }} style={{ transformOrigin: '620px 680px' }} />
      <motion.path d="M440 320L800 680M800 320L440 680M620 320V680M440 500H800" className="hero__construct" {...draw(0.7)} />
      <g ref={cross} className="hero__cross">
        <path d="M-24 0H24M0 -24V24" />
        <circle r="7" />
        <text ref={label} x="12" y="-12" />
      </g>

      {/* time: growth rings, a real clock, a pulse that never stops leaving */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1.4 }}>
        {rings.map((d, i) => (
          <path key={i} d={d} className="hero__ring" />
        ))}
        <path ref={wedge} fill={C.amber} style={{ mixBlendMode: 'multiply' }} />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * TAU
          const r1 = i % 5 ? 452 : 436
          return <line key={i} x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1} x2={CX + Math.cos(a) * 466} y2={CY + Math.sin(a) * 466} className="hero__tick" />
        })}
        <circle ref={pulse} cx={CX} cy={CY} r="40" className="hero__pulse" />
        <line ref={hand} x1={CX} y1={CY + 40} x2={CX} y2={CY - 466} className="hero__hand" />
        <circle cx={CX} cy={CY} r="6" fill={C.ink} />
      </motion.g>
    </svg>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50)
    return () => clearInterval(id)
  }, [])
  const p = (n, l = 2) => String(n).padStart(l, '0')
  return (
    <span className="hero__clock" aria-label="Local time">
      {p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}.{p(Math.floor(now.getMilliseconds() / 10))}
    </span>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const sX = useTransform(scrollYProgress, (p) => `${p * -24}vw`)
  const tX = useTransform(scrollYProgress, (p) => `${p * 24}vw`)
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))
  const pxRaw = useMotionValue(-0.3)
  const pyRaw = useMotionValue(0)
  const px = useSpring(pxRaw, { stiffness: 60, damping: 20 })
  const py = useSpring(pyRaw, { stiffness: 60, damping: 20 })

  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    pxRaw.set(((e.clientX - b.left) / b.width - 0.5) * 2)
    pyRaw.set(((e.clientY - b.top) / b.height - 0.5) * 2)
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={onMove}>
      <Field px={px} py={py} />

      <motion.div className="hero__meta mono" style={{ opacity: fade }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
        <span>A contemporary exhibition</span>
        <span>From Augustine to Minkowski</span>
        <span>Eight rooms · one continuum</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Space and Time">
        <motion.span className="hero__space" style={{ x: sX }} aria-hidden="true">
          {SPACE.map((ch, i) => (
            <span className="cell" key={i}>
              <i className="mono">
                ({i}, 0)
              </i>
              <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 1.3, ease }}>
                {ch}
              </motion.span>
            </span>
          ))}
        </motion.span>

        <span className="hero__mid" aria-hidden="true">
          <motion.span className="hero__side hero__side--space" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.4, duration: 1, ease }}>
            <b className="mono">Extension · Position · Simultaneity</b>
            <q>Everything at once, side by side.</q>
          </motion.span>
          <motion.span className="hero__and" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, duration: 1.1, ease }}>
            &amp;
          </motion.span>
          <motion.span className="hero__side hero__side--time" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8, duration: 1, ease }}>
            <b className="mono">Duration · Succession · Change</b>
            <q>One thing after another.</q>
          </motion.span>
        </span>

        <motion.span className="hero__time" style={{ x: tX }} aria-hidden="true">
          {TIME.map((ch, i) => (
            <motion.span
              key={i}
              className="hero__tl"
              data-ch={ch}
              initial={{ opacity: 0, x: '-0.6em' }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 1.9 + i * 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              style={{ '--i': i }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.span>
      </h1>

      <motion.div className="hero__foot mono" style={{ opacity: fade }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3, duration: 1 }}>
        <span>The two conditions of everything that happens.</span>
        <Clock />
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
