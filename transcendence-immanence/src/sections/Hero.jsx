import { useMemo, useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, range, rng } from '../lib/geom.js'

const RAYS = 27

// Sky: rays converge on a point above the frame. Reach toward it and it withdraws further.
function Sky({ px, py }) {
  const ref = useRef(null)
  const rays = useRef([])
  const motes = useRef([])
  const marker = useRef(null)
  const seeds = useMemo(() => {
    const r = rng(509)
    return Array.from({ length: 40 }, () => ({ ray: Math.floor(r() * RAYS), off: r(), sp: 0.05 + r() * 0.08 }))
  }, [])

  useLoop(ref, (t) => {
    const reach = Math.max(0, -py.get()) // 0 when the pointer is low, 1 at the very top
    const vx = 800 + px.get() * 30
    const vy = -300 - reach * 700
    const foot = (i) => [-300 + (i / (RAYS - 1)) * 2200, 600]
    rays.current.forEach((el, i) => {
      if (!el) return
      const [fx, fy] = foot(i)
      el.setAttribute('d', `M${fx} ${fy}L${vx} ${vy}`)
    })
    motes.current.forEach((el, i) => {
      if (!el) return
      const m = seeds[i]
      const k = (m.off + t * m.sp) % 1
      const [fx, fy] = foot(m.ray)
      el.setAttribute('cx', fx + (vx - fx) * k)
      el.setAttribute('cy', fy + (vy - fy) * k)
      el.setAttribute('r', 3.2 * (1 - k))
    })
    marker.current?.setAttribute('transform', `translate(${vx} 0)`)
  })

  return (
    <svg ref={ref} className="hero__sky" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1.6 }}>
        {Array.from({ length: RAYS }, (_, i) => (
          <path key={i} ref={(el) => (rays.current[i] = el)} className="hero__ray" />
        ))}
        {seeds.map((_, i) => (
          <circle key={i} ref={(el) => (motes.current[i] = el)} className="hero__mote" />
        ))}
      </motion.g>
      <g ref={marker} className="hero__marker">
        <path d="M0 40V4M-8 14L0 4L8 14" />
      </g>
    </svg>
  )
}

// Ground: a network with no top and no centre. It grows toward you from wherever you are.
function Ground({ gx, gy }) {
  const ref = useRef(null)
  const reach = useRef([])
  const pulses = useRef([])
  const { nodes, edges } = useMemo(() => {
    const r = rng(1677)
    const nodes = Array.from({ length: 64 }, () => [r() * 1600, 20 + r() * 400])
    const edges = []
    nodes.forEach((a, i) => {
      const near = nodes
        .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])])
        .filter(([j]) => j !== i)
        .sort((p, q) => p[1] - q[1])
        .slice(0, 3)
      near.forEach(([j]) => i < j && edges.push([i, j]))
    })
    return { nodes, edges }
  }, [])

  useLoop(ref, (t) => {
    const x = gx.get() * 1600
    const y = gy.get() * 440
    const near = nodes
      .map((n, i) => [i, Math.hypot(n[0] - x, n[1] - y)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4)
    reach.current.forEach((el, k) => {
      if (!el) return
      const [i, d] = near[k]
      const [nx, ny] = nodes[i]
      const mx = (x + nx) / 2 + Math.sin(t * 2 + k) * 14
      const my = (y + ny) / 2 + Math.cos(t * 1.7 + k) * 14
      el.setAttribute('d', `M${x} ${y}Q${mx} ${my} ${nx} ${ny}`)
      el.setAttribute('opacity', gy.get() < 0 ? 0 : Math.max(0, 1 - d / 500))
    })
    pulses.current.forEach((el, k) => {
      if (!el) return
      const [a, b] = edges[(k * 7) % edges.length]
      const u = (t * 0.35 + k * 0.13) % 1
      el.setAttribute('cx', nodes[a][0] + (nodes[b][0] - nodes[a][0]) * u)
      el.setAttribute('cy', nodes[a][1] + (nodes[b][1] - nodes[a][1]) * u)
    })
  })

  return (
    <svg ref={ref} className="hero__ground" viewBox="0 0 1600 440" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <motion.path
          key={i}
          d={`M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`}
          className="hero__edge"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 1.6 + (i % 20) * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 ? 3 : 5} className="hero__node" />
      ))}
      {Array.from({ length: 4 }, (_, k) => (
        <path key={k} ref={(el) => (reach.current[k] = el)} className="hero__reach" />
      ))}
      {Array.from({ length: 18 }, (_, k) => (
        <circle key={k} ref={(el) => (pulses.current[k] = el)} r="3" className="hero__pulse" />
      ))}
    </svg>
  )
}

const LADDER = [1, 0.62, 0.4, 0.26, 0.17]

export default function Hero() {
  const ref = useRef(null)
  const ground = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const up = useTransform(scrollYProgress, (p) => `${p * -40}vh`)
  const fade = useTransform(scrollYProgress, range(0, 0.7, 1, 0))
  const pxRaw = useMotionValue(0)
  const pyRaw = useMotionValue(0.4)
  const px = useSpring(pxRaw, { stiffness: 40, damping: 16 })
  const py = useSpring(pyRaw, { stiffness: 40, damping: 16 })
  const gx = useMotionValue(0.5)
  const gy = useMotionValue(-1)

  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    pxRaw.set(((e.clientX - b.left) / b.width - 0.5) * 2)
    pyRaw.set(((e.clientY - b.top) / b.height - 0.5) * 2)
    const g = ground.current.getBoundingClientRect()
    gx.set((e.clientX - g.left) / g.width)
    gy.set(e.clientY < g.top ? -1 : (e.clientY - g.top) / g.height)
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={onMove}>
      <div className="hero__up">
        <Sky px={px} py={py} />
        <motion.div className="hero__meta mono" style={{ opacity: fade }}>
          <span>A contemporary exhibition</span>
          <span>From Plato to Deleuze</span>
          <span>Eight rooms · two directions</span>
        </motion.div>
        <motion.h1 className="hero__trans" style={{ y: up }} aria-label="Transcendence and Immanence">
          {LADDER.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              style={{ fontSize: `calc(var(--t-size) * ${s})`, opacity: 1 - i * 0.2 }}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 - i * 0.2 }}
              transition={{ duration: 1.2, delay: 1.9 - i * 0.12, ease }}
            >
              Transcendence
            </motion.span>
          ))}
        </motion.h1>
      </div>

      <div className="hero__down" ref={ground}>
        <Ground gx={gx} gy={gy} />
        <div className="hero__mid" aria-hidden="true">
          <motion.span className="hero__side hero__side--t" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 1, ease }}>
            <b className="mono">Beyond · Above · Wholly other</b>
            <q>Look up, and past the world.</q>
          </motion.span>
          <motion.span className="hero__and" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, duration: 1.1, ease }}>
            &amp;
          </motion.span>
          <motion.span className="hero__side hero__side--i" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 1, ease }}>
            <b className="mono">Within · Among · Throughout</b>
            <q>Look closer, into the world.</q>
          </motion.span>
        </div>
        <div className="hero__imm" aria-hidden="true">
          {'IMMANENCE'.split('').map((ch, i) => (
            <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.9, delay: 1.5 + i * 0.04, ease }}>
              {ch}
            </motion.span>
          ))}
        </div>
        <motion.div className="hero__foot mono" style={{ opacity: fade }}>
          <span>Is what matters most beyond this world, or in it?</span>
          <span className="hero__scroll">
            Enter <i />
          </span>
        </motion.div>
      </div>
    </section>
  )
}
