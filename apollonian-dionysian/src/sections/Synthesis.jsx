import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, blobPoints, closedPath, lerp, range, smooth } from '../lib/geom.js'

function Merge({ progress, px, py }) {
  const ref = useRef(null)
  const circle = useRef(null)
  const blob = useRef(null)
  const core = useRef(null)
  const word = useRef(null)

  useLoop(ref, (t) => {
    const p = progress.get()
    const m = smooth(0.08, 0.62, p)
    // Apollo learns to breathe; Dionysus learns to hold a contour. Neither becomes the other.
    const aCx = lerp(330, 640, m) + px.get() * 10
    const dCx = lerp(1090, 780, m) + px.get() * 30
    const cy = 440 + py.get() * 16
    circle.current?.setAttribute('d', closedPath(blobPoints(aCx, cy, 250, lerp(0, 0.035, m), t * 0.8, { seed: 8, complexity: 0.3 })))
    blob.current?.setAttribute('d', closedPath(blobPoints(dCx, cy + 6, 250, lerp(0.24, 0.07, m), t * lerp(0.9, 0.5, m), { seed: 3, complexity: lerp(1.4, 0.6, m) })))
    const k = smooth(0.55, 0.8, p)
    core.current?.setAttribute('opacity', k)
    word.current?.setAttribute('opacity', k)
    word.current?.setAttribute('x', (aCx + dCx) / 2)
    word.current?.setAttribute('y', cy + 16)
    core.current?.setAttribute('cx', (aCx + dCx) / 2)
    core.current?.setAttribute('cy', cy)
    core.current?.setAttribute('r', 150 + Math.sin(t * 1.4) * 4)
  })

  return (
    <svg ref={ref} className="syn__svg" viewBox="0 0 1420 880" role="img" aria-label="A cobalt circle and a crimson organic form drift together and overlap; where they meet, a third colour appears">
      <path ref={circle} fill={C.cobalt} style={{ mixBlendMode: 'multiply' }} />
      <path ref={blob} fill={C.crimson} style={{ mixBlendMode: 'multiply' }} />
      <circle ref={core} fill="none" stroke={C.paper} strokeWidth="1" strokeDasharray="3 6" opacity="0" />
      <text ref={word} className="syn__core" textAnchor="middle" opacity="0">
        tragedy
      </text>
    </svg>
  )
}

export default function Synthesis() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const pxRaw = useMotionValue(0)
  const pyRaw = useMotionValue(0)
  const px = useSpring(pxRaw, { stiffness: 30, damping: 14 })
  const py = useSpring(pyRaw, { stiffness: 30, damping: 14 })
  const aX = useTransform(scrollYProgress, (p) => `${range(0, 0.7, -40, 12)(p)}%`)
  const dX = useTransform(scrollYProgress, (p) => `${range(0, 0.7, 40, -12)(p)}%`)
  const lend = useTransform(scrollYProgress, range(0.35, 0.55))
  const quote = useTransform(scrollYProgress, range(0.66, 0.84))
  const quoteY = useTransform(scrollYProgress, range(0.66, 0.84, 30, 0))

  const onMove = (e) => {
    const b = e.currentTarget.getBoundingClientRect()
    pxRaw.set(((e.clientX - b.left) / b.width - 0.5) * 2)
    pyRaw.set(((e.clientY - b.top) / b.height - 0.5) * 2)
  }

  return (
    <section id="synthesis" className="syn" ref={ref}>
      <div className="syn__sticky" onPointerMove={onMove}>
        <div className="syn__words" aria-hidden="true">
          <motion.span className="syn__w syn__w--a" style={{ x: aX }}>
            Apollonian
          </motion.span>
          <motion.span className="syn__w syn__w--d" style={{ x: dX }}>
            Dionysian
          </motion.span>
        </div>

        <div className="syn__head">
          <SectionHead no="07" title="Synthesis" kicker="Not a winner. A tension, held." />
        </div>

        <Merge progress={scrollYProgress} px={px} py={py} />

        <motion.div className="syn__lend syn__lend--a" style={{ opacity: lend }}>
          <span className="mono">Apollo lends</span>
          <p>a contour, a distance, a beautiful appearance steady enough to hold the gaze.</p>
        </motion.div>
        <motion.div className="syn__lend syn__lend--d" style={{ opacity: lend }}>
          <span className="mono">Dionysus lends</span>
          <p>the pulse, the depth, the truth no contour can contain.</p>
        </motion.div>

        <motion.figure className="syn__quote" style={{ opacity: quote, y: quoteY }}>
          <blockquote>“…perpetual strife with only periodically intervening reconciliations.”</blockquote>
          <figcaption className="mono">The Birth of Tragedy, § 1, on the two drives</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
