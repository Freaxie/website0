import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

const TAU = Math.PI * 2

function gearPath(r, teeth) {
  const inner = r * 0.84
  const pts = []
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU
    const w = (TAU / teeth) * 0.26
    pts.push([a - w * 1.4, inner], [a - w, r], [a + w, r], [a + w * 1.4, inner])
  }
  return pts.map(([a, rr], i) => `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`).join('') + 'Z'
}

// A cluster of meshing gears. The big hub holds another, smaller cluster: at every scale, more parts.
const GEARS = [
  { x: 0, y: 0, r: 150, t: 24, dir: 1 },
  { x: 222, y: -40, r: 80, t: 13, dir: -1 },
  { x: -196, y: 104, r: 76, t: 12, dir: -1 },
  { x: 60, y: 214, r: 70, t: 11, dir: -1 },
  { x: -130, y: -170, r: 66, t: 10, dir: -1 },
  { x: 320, y: 90, r: 58, t: 9, dir: 1 },
]

function Cluster({ depth }) {
  return (
    <g>
      <path d="M-330 250H380M-280 -250V300" className="mill__rod" />
      {GEARS.map((g, i) => (
        <g key={i} transform={`translate(${g.x} ${g.y})`}>
          <g className={`mill__gear ${g.dir < 0 ? 'is-rev' : ''}`} style={{ animationDuration: `${(g.r / 150) * 14}s` }}>
            <path d={gearPath(g.r, g.t)} className="mill__tooth" />
            <circle r={g.r * 0.62} className="mill__web" />
            {Array.from({ length: 4 }, (_, k) => (
              <path key={k} d={`M0 0L${Math.cos((k / 4) * TAU) * g.r * 0.62} ${Math.sin((k / 4) * TAU) * g.r * 0.62}`} className="mill__spoke" />
            ))}
            <circle r={g.r * 0.14} className="mill__hub" />
          </g>
        </g>
      ))}
      {depth > 0 && (
        <g transform="scale(0.12)">
          <Cluster depth={depth - 1} />
        </g>
      )}
    </g>
  )
}

const STEPS = [
  { k: 'I', h: 'A machine that thinks', p: 'Leibniz, 1714: suppose there were a machine so built that it could think, feel and perceive.' },
  { k: 'II', h: 'Walk inside', p: 'Now imagine it enlarged, keeping the same proportions, so that you could go into it as you would into a mill.' },
  {
    k: 'III',
    h: 'Only parts',
    p: '“…we should, on examining its interior, find only parts which work one upon another, and never anything by which to explain a perception.” Monadology, §17',
  },
  {
    k: 'IV',
    h: 'The hard problem',
    p: 'In 1995 David Chalmers put it again: explain every mechanism in the brain and a question seems left over. Why is any of it experienced at all? Materialists answer that the gap is in our understanding, not in the world.',
  },
]

export default function Mill() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(p < 0.22 ? 0 : p < 0.5 ? 1 : p < 0.78 ? 2 : 3))
  // zoom from a head, into its machinery, into the machinery inside that
  // set the SVG transform attribute directly: a motion value bound to `transform` on an SVG group is not applied
  const zoomRef = useRef(null)
  const applyZoom = (p) =>
    zoomRef.current?.setAttribute('transform', `translate(800 540) scale(${Math.exp(Math.min(1, p / 0.85) * Math.log(60))}) translate(-800 -540)`)
  useMotionValueEvent(scrollYProgress, 'change', applyZoom)
  const head = useTransform(scrollYProgress, [0.1, 0.3], [1, 0])
  const s = STEPS[step]

  return (
    <section id="mill" className="mill" ref={ref}>
      <div className="mill__sticky">
        <svg className="mill__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect x="-400" y="-400" width="2400" height="1800" className="mill__bg" />
          <g ref={zoomRef}>
            <motion.g style={{ opacity: head }} className="mill__head">
              <path d="M690 720C640 700 600 640 600 560C600 450 690 360 800 360C910 360 1000 450 1000 560C1000 610 985 650 960 680L975 740L930 745L925 790H850V720" />
              <text x="800" y="330" textAnchor="middle" className="mill__tag">
                a thinking machine
              </text>
            </motion.g>
            <g transform="translate(800 540) scale(0.4)">
              <Cluster depth={2} />
            </g>
          </g>
        </svg>
        <div className="mill__head-text">
          <SectionHead no="05" title="Leibniz’s Mill" tone="inherit" kicker="Look inside a mind made of matter. What do you find?" />
        </div>
        <div className="mill__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={s.k} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45 }}>
              <span className="mill__k">{s.k}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
