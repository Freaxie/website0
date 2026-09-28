import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

const MAX = 60
const L = 40
const R = 940
const FR = ['½', '¼', '⅛', '1⁄16', '1⁄32']

export default function Paradox() {
  const [n, setN] = useState(0)
  const [auto, setAuto] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!auto) return
    timer.current = setInterval(() => setN((k) => (k >= MAX ? k : k + 1)), 650)
    return () => clearInterval(timer.current)
  }, [auto])
  useEffect(() => {
    if (n >= MAX) setAuto(false)
  }, [n])

  const covered = 1 - Math.pow(2, -n)
  const x = (f) => L + (R - L) * f
  const segs = Array.from({ length: Math.min(n, 14) }, (_, k) => [1 - Math.pow(2, -k), 1 - Math.pow(2, -(k + 1))])
  const rounded = covered === 1

  return (
    <section id="paradox" className="zeno">
      <div className="zeno__top">
        <SectionHead no="04" title="Zeno’s Wall" kicker="Parmenides’ student defended the One by arguing that motion is impossible. Try to reach the wall." />
        <div className="zeno__readout mono" aria-live="polite">
          <div>
            <span>Steps taken</span>
            <b>{n}</b>
          </div>
          <div>
            <span>Distance covered</span>
            <b>{rounded ? '1 (rounded)' : covered.toFixed(Math.min(16, Math.max(1, Math.ceil(n * 0.31) + 1)))}</b>
          </div>
          <div>
            <span>Gap to the wall</span>
            <b>{n === 0 ? '1' : `1 / 2^${n}`}</b>
          </div>
          <div>
            <span>Steps remaining</span>
            <b>∞</b>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 1000 150" className="zeno__track" role="img" aria-label={`The path to the wall, with ${n} halvings crossed`}>
        <path d={`M${L} 80H${R}`} className="zeno__path" />
        {segs.map(([a, b], k) => (
          <g key={k}>
            <rect x={x(a)} y="62" width={Math.max(0.6, x(b) - x(a) - 1.5)} height="36" className={k % 2 ? 'zeno__seg zeno__seg--b' : 'zeno__seg'} />
            {k < FR.length && (
              <text x={(x(a) + x(b)) / 2} y="124" textAnchor="middle" className="zeno__frac">
                {FR[k]}
              </text>
            )}
          </g>
        ))}
        <rect x={R} y="20" width="22" height="120" className="zeno__wall" />
        <circle cx={x(covered)} cy="80" r="9" className="zeno__runner" />
        <text x={L} y="40" className="zeno__cap">
          START
        </text>
        <text x={R - 8} y="40" textAnchor="end" className="zeno__cap">
          WALL
        </text>
      </svg>

      <div className="zeno__zoom">
        <div className="zeno__zoomlabel mono">
          The remaining gap, magnified ×{n === 0 ? 1 : `2^${n}`}
          {n >= 10 && <span> ≈ {Math.pow(2, n).toExponential(2).replace('e+', ' × 10^')}</span>}
        </div>
        <motion.svg key={n} viewBox="0 0 1000 110" className="zeno__zoomsvg" initial={{ scaleX: 2, opacity: 0.4 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }} style={{ transformOrigin: 'right center' }} aria-hidden="true">
          <path d={`M${L} 55H${R}`} className="zeno__path" />
          <path d={`M${(L + R) / 2} 25V85`} className="zeno__half" />
          <text x={(L + R) / 2} y="16" textAnchor="middle" className="zeno__cap">
            NEXT HALF
          </text>
          <circle cx={L} cy="55" r="9" className="zeno__runner" />
          <rect x={R} y="10" width="22" height="90" className="zeno__wall" />
        </motion.svg>
        <p className="zeno__same mono">It looks exactly the same at every step. That is the paradox.</p>
      </div>

      <div className="zeno__controls">
        <button type="button" className="zeno__btn" onClick={() => setN((k) => Math.min(MAX, k + 1))} disabled={n >= MAX}>
          Cross half of what remains
        </button>
        <button type="button" className="zeno__btn zeno__btn--ghost" onClick={() => setAuto((a) => !a)} disabled={n >= MAX}>
          {auto ? 'Pause' : 'Keep going'}
        </button>
        <button type="button" className="zeno__btn zeno__btn--ghost" onClick={() => (setAuto(false), setN(0))}>
          Start again
        </button>
      </div>

      <div className="zeno__notes">
        <p>
          <span className="mono">Zeno of Elea, c. 450 BCE</span>
          Before you reach the wall you must reach the halfway point, then half of what is left, and so on without end. Infinitely many tasks cannot be completed, so, Zeno concluded, nothing ever moves. Change is an appearance; only Being is real.
        </p>
        <p>
          <span className="mono">The modern reply</span>
          The halves ½ + ¼ + ⅛ + … add up to exactly 1: an infinite series can have a finite sum, as the theory of limits made precise in the nineteenth century. Whether that settles how anyone completes infinitely many steps is still argued over.
        </p>
        <p className={rounded ? 'is-lit' : ''}>
          <span className="mono">A footnote from this page</span>
          {rounded
            ? 'This computer has now rounded the gap to zero. Its numbers carry only 53 binary digits: it reached the wall by giving up precision. Zeno would not accept that.'
            : 'Keep going. At some point this computer will give up on the gap before Zeno does.'}
        </p>
      </div>
    </section>
  )
}
