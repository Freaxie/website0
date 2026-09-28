import { useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { C, clamp, lerp, mixHex, rng, smooth } from '../lib/geom.js'

const MODELS = [
  {
    at: 0,
    name: 'Deism',
    relation: 'Made the world, then stands wholly apart from it.',
    who: 'Common among Enlightenment thinkers such as Voltaire: a maker who does not intervene.',
  },
  {
    at: 1 / 3,
    name: 'Classical theism',
    relation: 'Wholly other than the world, yet holding it in being at every moment.',
    who: 'Augustine, Aquinas, and the main line of Jewish, Christian and Islamic thought.',
  },
  {
    at: 2 / 3,
    name: 'Panentheism',
    relation: 'The world is within it, but it is more than the world.',
    who: 'A word coined by Karl Krause around 1828; often applied to Whitehead’s process theology.',
  },
  {
    at: 1,
    name: 'Pantheism',
    relation: 'Not a separate being at all: it is the world, and the world is it.',
    who: 'Spinoza’s Deus sive Natura, “God, or Nature”, is its most famous form.',
  },
]
const WX = 500
const WY = 470
const WR = 190

export default function Divine() {
  const v = useMotionValue(0.33)
  const track = useRef(null)
  const [x, setX] = useState(0.33)
  useMotionValueEvent(v, 'change', setX)
  const left = useTransform(v, (k) => `${k * 100}%`)
  const col = useTransform(v, (k) => mixHex(C.violet, C.moss, k))

  const dots = useMemo(() => {
    const r = rng(1677)
    const out = []
    while (out.length < 90) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * (WR - 12)
      out.push([WX + Math.cos(a) * d, WY + Math.sin(a) * d])
    }
    return out
  }, [])

  const a = smooth(0, 1 / 3, x)
  const b = smooth(1 / 3, 2 / 3, x)
  const c = smooth(2 / 3, 1, x)
  const sy = lerp(lerp(70, 180, a), WY, b)
  const sr = lerp(lerp(24, 30, a), 330, b) * lerp(1, WR / 330, c)
  const big = b > 0.02
  const rays = a * (1 - b)
  const sourceOpacity = 1 - c
  const model = MODELS.reduce((acc, m, i) => (x >= m.at - 0.1667 ? i : acc), 0)
  const m = MODELS[model]

  const setFrom = (clientX) => {
    const r = track.current.getBoundingClientRect()
    v.set(clamp((clientX - r.left) / r.width))
  }
  const key = (e) => {
    const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }
    if (e.key in map) {
      e.preventDefault()
      const stops = MODELS.map((mm) => mm.at)
      const i = Math.max(0, Math.min(3, model + map[e.key]))
      animate(v, stops[i], { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] })
    }
  }

  return (
    <section id="divine" className="div">
      <div className="div__top">
        <SectionHead no="05" title="Where Is It?" kicker="Four pictures of how the source of everything relates to the world. Read “God”, or read meaning, value, the ground of order: the geometry holds either way." />
        <div className="div__readout mono" aria-live="polite">
          <div>
            <span>Model</span>
            <b>{m.name}</b>
          </div>
          <p className="div__rel">{m.relation}</p>
          <p className="div__who">{m.who}</p>
        </div>
      </div>

      <svg viewBox="0 0 1000 720" className="div__svg" role="img" aria-label={`${m.name}: ${m.relation}`}>
        {big && <circle cx={WX} cy={sy} r={sr} fill={C.lilac} opacity={sourceOpacity} />}
        {Array.from({ length: 9 }, (_, i) => {
          const tx = WX + (i - 4) * 38
          const ty = WY - WR * 0.4 + Math.abs(i - 4) * 12
          return <line key={i} x1={WX} y1={sy} x2={tx} y2={ty} stroke={C.violet} strokeWidth="1" opacity={rays} />
        })}
        {x < 0.2 && <path d={`M${WX} ${sy + 34}V${WY - WR - 20}`} stroke={C.violet} strokeWidth="1" strokeDasharray="3 10" opacity={1 - a * 3} />}
        <circle cx={WX} cy={WY} r={WR} fill={C.moss} />
        {dots.map(([dx, dy], i) => (
          <circle key={i} cx={dx} cy={dy} r="4" fill={C.lilac} opacity={c} />
        ))}
        {!big && <circle cx={WX} cy={sy} r={sr} fill={C.violet} opacity={sourceOpacity} />}
        <text x={WX + WR + 24} y={WY + 6} className="div__tag">
          the world
        </text>
        {sourceOpacity > 0.2 && (
          <text x={WX + (big ? sr * 0.72 : sr) + 18} y={big ? sy - sr * 0.72 : sy + 5} className="div__tag div__tag--v">
            the source
          </text>
        )}
      </svg>

      <div className="div__slider">
        <div
          className="div__track"
          ref={track}
          tabIndex={0}
          role="slider"
          aria-label="From transcendent to immanent"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={model}
          aria-valuetext={m.name}
          onKeyDown={key}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setFrom(e.clientX)
          }}
          onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && setFrom(e.clientX)}
          onPointerUp={() => animate(v, MODELS[model].at, { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] })}
        >
          {MODELS.map((mm, i) => (
            <button key={mm.name} type="button" tabIndex={-1} className={`div__stop ${i === model ? 'is-on' : ''}`} style={{ left: `${mm.at * 100}%` }} onPointerDown={(e) => (e.stopPropagation(), animate(v, mm.at, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }))}>
              <span className="mono">{mm.name}</span>
            </button>
          ))}
          <motion.div className="div__fill" style={{ width: left, background: col }} />
          <motion.div className="div__handle" style={{ left, background: col }} />
        </div>
        <div className="div__ends mono">
          <span>↑ Transcendent</span>
          <span>Immanent ·</span>
        </div>
      </div>
    </section>
  )
}
