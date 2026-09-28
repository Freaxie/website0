import { useEffect, useMemo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { HEAD, POLYS, polyPoints, sampleFigure } from '../lib/figure.js'
import { TAU, clamp, easeInOut, lerp, range, rng, smooth } from '../lib/geom.js'

const COUNT = 2200

function GeometricFigure({ progress }) {
  const draw = useTransform(progress, [0.02, 0.3], [0, 1])
  const fill = useTransform(progress, [0.18, 0.36], [0, 1])
  return (
    <svg viewBox="-40 -20 480 840" className="ind__figure" role="img" aria-label="A human figure constructed from circles and polygons, with measuring lines">
      {/* the canon: eight modules, each one head tall */}
      {Array.from({ length: 9 }, (_, i) => (
        <motion.line key={i} x1="-30" x2="430" y1={50 + i * 90 - 40} y2={50 + i * 90 - 40} className="ind__module" style={{ pathLength: draw }} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <text key={i} x="-34" y={50 + i * 90 + 8} className="ind__tick">
          {i + 1}/8
        </text>
      ))}
      <motion.line x1="200" x2="200" y1="-20" y2="820" className="ind__axis" style={{ pathLength: draw }} />
      <motion.circle cx="200" cy="420" r="392" className="ind__construct" style={{ pathLength: draw }} />
      <motion.g style={{ opacity: fill }}>
        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} className="ind__solid" />
        {Object.entries(POLYS).map(([k, p]) => (
          <polygon key={k} points={polyPoints(p)} className="ind__solid" />
        ))}
      </motion.g>
      <g>
        <motion.circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} className="ind__edge" style={{ pathLength: draw }} />
        {Object.entries(POLYS).map(([k, p]) => (
          <motion.polygon key={k} points={polyPoints(p)} className="ind__edge" style={{ pathLength: draw }} />
        ))}
      </g>
      <motion.g style={{ opacity: fill }} className="ind__dims">
        <path d="M60 790H340M60 782V798M340 782V798" />
        <text x="200" y="812" textAnchor="middle">
          1 : 8
        </text>
      </motion.g>
    </svg>
  )
}

function Dissolution({ progress }) {
  const canvas = useRef(null)
  const wrap = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })

  const particles = useMemo(() => {
    const home = sampleFigure(COUNT, 11)
    const r = rng(5)
    return home.map(([x, y]) => {
      const fromCore = Math.hypot((x - 200) / 140, (y - 330) / 400)
      return {
        x,
        y,
        start: clamp(0.3 + 0.28 * (1 - Math.min(fromCore, 1)) + r() * 0.12, 0, 0.8),
        orbit: Math.sqrt(r()),
        angle: r() * TAU,
        speed: 0.08 + r() * 0.12,
        swirl: (r() - 0.5) * 2,
        size: 0.8 + r() * 1.6,
        tone: r(),
      }
    })
  }, [])

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      size.current = { w, h, dpr }
      canvas.current.width = w * dpr
      canvas.current.height = h * dpr
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(wrap, (t) => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    const p = progress.get()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const narrow = w < 820
    const scale = (h * (narrow ? 0.42 : 0.7)) / 800
    const ox = narrow ? w / 2 - 200 * scale : w * 0.7 - 200 * scale
    const oy = narrow ? h * 0.52 : h * 0.16
    const cx = ox + 200 * scale
    const cy = oy + 400 * scale
    const maxR = Math.hypot(w, h) * 0.5

    for (const q of particles) {
      const e = easeInOut(smooth(q.start, q.start + 0.3, p))
      const hx = ox + q.x * scale + Math.sin(t * 1.3 + q.angle * 3) * 0.6
      const hy = oy + q.y * scale + Math.cos(t * 1.1 + q.angle * 2) * 0.6
      const rad = lerp(30, maxR, Math.pow(q.orbit, 1.3))
      const a = q.angle + t * q.speed * (1 + 160 / rad) + rad * 0.0035
      const fx = cx + Math.cos(a) * rad
      const fy = cy + Math.sin(a) * rad * 0.62
      // on the way out, each point bends sideways: the figure doesn't explode, it swirls
      const bend = Math.sin(e * Math.PI) * 60 * q.swirl
      const x = lerp(hx, fx, e) + bend
      const y = lerp(hy, fy, e) - bend * 0.4
      const alpha = lerp(0.95, q.tone > 0.7 ? 0.35 : 0.75, e)
      ctx.fillStyle =
        q.tone > 0.82 && e > 0.3 ? `rgba(241,217,214,${alpha})` : q.tone > 0.5 && e > 0.2 ? `rgba(122,26,82,${alpha})` : `rgba(226,51,79,${alpha})`
      const s = q.size * (1 + e * 0.4)
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
    }
  })

  return (
    <div className="ind__canvas" ref={wrap}>
      <canvas ref={canvas} role="img" aria-label="The same figure drawn as particles of light, which dissolve outward into a slowly turning field as you scroll" />
    </div>
  )
}

export default function Individual() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const leftCap = useTransform(scrollYProgress, range(0.05, 0.2))
  const rightCap = useTransform(scrollYProgress, range(0.45, 0.6))
  const whole = useTransform(scrollYProgress, range(0.72, 0.86))
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section id="individual" className="ind" ref={ref}>
      <div className="ind__sticky">
        <Dissolution progress={scrollYProgress} />
        <div className="ind__head">
          <SectionHead no="03" title="The Individual" tone="paper" />
        </div>

        <div className="ind__panel">
          <GeometricFigure progress={scrollYProgress} />
          <motion.div className="ind__cap ind__cap--apollo" style={{ opacity: leftCap }}>
            <span className="mono">principium individuationis</span>
            <p>
              A body measured in modules: eight heads tall, bounded, one. Apollo presides over the principle of individuation, which makes each thing
              <em> this</em> thing and not another.
            </p>
          </motion.div>
        </div>

        <motion.div className="ind__cap ind__cap--dion" style={{ opacity: rightCap }}>
          <span className="mono">das Ur-Eine · the primordial unity</span>
          <p>
            Under the Dionysian spell the boundary loosens. Nietzsche describes terror, and then a blissful ecstasy, as the principle of individuation breaks down, and the self flows back into the whole it came from.
          </p>
        </motion.div>

        <motion.p className="ind__whole" style={{ opacity: whole }}>
          One shape. <i>One sea.</i>
        </motion.p>

        <div className="ind__progress mono" aria-hidden="true">
          <span>Bounded</span>
          <div>
            <motion.i style={{ width: bar }} />
          </div>
          <span>Unbounded</span>
        </div>
      </div>
    </section>
  )
}
