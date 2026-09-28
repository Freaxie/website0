import { useMemo, useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useLoop } from '../lib/useLoop.js'
import { C, TAU, closedPath, range, ring, rng } from '../lib/geom.js'

const BECOMING = 'BECOMING'.split('')
const FX = 1110
const FY = 600

// A flame is a blob pulled upward: narrow at the top, heavy at the base, never the same twice.
export function flamePoints(cx, cy, r, t, { n = 80, seed = 0, amp = 0.22 } = {}) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU
    const k = 1 + amp * ring(th, t, seed, 1.6)
    const s = Math.sin(th)
    const up = s < 0 ? -s : 0
    pts.push([cx + Math.cos(th) * r * k * (1 - 0.62 * up), cy + s * r * k * (s < 0 ? 1.9 : 0.8)])
  }
  return pts
}

function Field({ px }) {
  const ref = useRef(null)
  const outer = useRef(null)
  const inner = useRef(null)
  const embers = useRef([])
  const seeds = useMemo(() => {
    const r = rng(30)
    return Array.from({ length: 70 }, () => ({ x: (r() - 0.5) * 360, life: 2 + r() * 3, off: r() * 5, s: 3 + r() * 7, drift: (r() - 0.5) * 80 }))
  }, [])

  useLoop(ref, (t) => {
    const sway = px.get() * 40
    outer.current?.setAttribute('d', closedPath(flamePoints(FX + sway * 0.4, FY, 230, t * 2.2, { seed: 1 })))
    inner.current?.setAttribute('d', closedPath(flamePoints(FX + sway * 0.6, FY + 50, 130, t * 2.8 + 3, { seed: 4, amp: 0.28 })))
    embers.current.forEach((el, i) => {
      if (!el) return
      const e = seeds[i]
      const k = ((t + e.off) % e.life) / e.life
      const x = FX + e.x * (1 - k * 0.4) + Math.sin(t * 2 + i) * 14 + (e.drift + sway) * k
      const y = FY + 120 - k * 760
      el.setAttribute('x', x)
      el.setAttribute('y', y)
      const s = e.s * (1 - k)
      el.setAttribute('width', s)
      el.setAttribute('height', s)
      el.setAttribute('fill', k < 0.5 ? C.ember : C.vermilion)
      el.setAttribute('opacity', 1 - k)
    })
  })

  return (
    <svg ref={ref} className="hero__field" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <path id="itis" d="M150 520a370 370 0 1 1 740 0a370 370 0 1 1 -740 0" />
      </defs>
      {/* being: a sphere, as Parmenides has it, "equally balanced from the middle in every direction". No motion here, ever. */}
      <circle cx="520" cy="520" r="310" fill={C.lead} />
      <circle cx="520" cy="520" r="340" fill="none" stroke={C.lead} strokeWidth="1" />
      <text className="hero__itis">
        <textPath href="#itis">IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS · IT IS ·</textPath>
      </text>
      <path d="M520 150V890M150 520H890" stroke={C.lead} strokeWidth="1" strokeDasharray="2 8" />

      {/* becoming: fire */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1.4 }}>
        <path ref={outer} fill={C.vermilion} style={{ mixBlendMode: 'multiply' }} />
        <path ref={inner} fill={C.ember} style={{ mixBlendMode: 'multiply' }} />
        {seeds.map((_, i) => (
          <rect key={i} ref={(el) => (embers.current[i] = el)} />
        ))}
      </motion.g>
    </svg>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const cX = useTransform(scrollYProgress, (p) => `${p * 26}vw`)
  const fade = useTransform(scrollYProgress, range(0, 0.8, 1, 0))
  const pxRaw = useMotionValue(0)
  const px = useSpring(pxRaw, { stiffness: 40, damping: 16 })
  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    pxRaw.set(((e.clientX - b.left) / b.width - 0.5) * 2)
  }

  const ease = [0.76, 0, 0.24, 1]
  return (
    <section id="entrance" className="hero" ref={ref} onPointerMove={onMove}>
      <Field px={px} />

      <motion.div className="hero__meta mono" style={{ opacity: fade }}>
        <span>A contemporary exhibition</span>
        <span>After Parmenides and Heraclitus, c. 500 BCE</span>
        <span>Eight rooms · one question</span>
      </motion.div>

      <h1 className="hero__title" aria-label="Being and Becoming">
        {/* Being has no entrance animation and ignores scroll: it was already here. */}
        <span className="hero__being" aria-hidden="true">
          Being
        </span>

        <span className="hero__mid" aria-hidden="true">
          <span className="hero__side hero__side--being">
            <b className="mono">One · Whole · Unchanging</b>
            <q>What is, is.</q>
            <i className="mono">Parmenides</i>
          </span>
          <motion.span className="hero__and" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.2, duration: 1.1, ease }}>
            &amp;
          </motion.span>
          <motion.span className="hero__side hero__side--becoming" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.6, duration: 1, ease }}>
            <b className="mono">Flux · Process · Change</b>
            <q>Everything flows.</q>
            <i className="mono">After Heraclitus</i>
          </motion.span>
        </span>

        <motion.span className="hero__becoming" style={{ x: cX }} aria-hidden="true">
          {BECOMING.map((ch, i) => (
            <motion.span
              key={i}
              className="bl"
              style={{ '--i': i }}
              initial={{ opacity: 0, y: '40%' }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.span>
      </h1>

      <motion.div className="hero__foot mono" style={{ opacity: fade }}>
        <span>Is the world something that stays, or something that happens?</span>
        <span className="hero__scroll">
          Enter <i />
        </span>
      </motion.div>
    </section>
  )
}
