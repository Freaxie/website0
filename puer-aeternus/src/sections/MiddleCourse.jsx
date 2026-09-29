import { useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { clamp, rng } from '../lib/geom.js'

const W = 1000
const H = 500
const X = 300 // where Icarus flies
const HOT = 170 // above this line the sun softens the wax
const WET = 370 // below this line the spray soaks the feathers
const r = rng(9)
const CLOUDS = Array.from({ length: 7 }, () => ({ x: r() * W, y: 60 + r() * 300, w: 60 + r() * 140, sp: 20 + r() * 40 }))

function Bird({ x, y, flap, loose = 0, cls }) {
  const a = Math.sin(flap) * 22
  const span = 38 * (1 - loose * 0.6)
  return (
    <g transform={`translate(${x} ${y})`} className={cls}>
      <path d={`M0 0Q${-span * 0.5} ${-a - 10} ${-span} ${-a}`} />
      <path d={`M0 0Q${span * 0.5} ${-a - 10} ${span} ${-a}`} />
      <circle r="4.5" />
    </g>
  )
}

export default function MiddleCourse() {
  const wrap = useRef(null)
  const stage = useRef(null)
  const target = useRef(H / 2)
  const s = useRef({ y: H / 2, wax: 0, wet: 0, dist: 0, fallen: null, fallT: 0, t: 0 })
  const feathers = useRef([])
  const [v, setV] = useState({ ...s.current, clouds: CLOUDS.map((c) => c.x), feathers: [] })
  const [best, setBest] = useState(0)
  const [h, setH] = useState(50)

  useLoop(wrap, (t, dt) => {
    const S = s.current
    S.t = t
    if (!S.fallen) {
      S.y += (target.current - S.y) * Math.min(1, dt * 4)
      const heat = clamp((HOT - S.y) / 130)
      const damp = clamp((S.y - WET) / 90)
      S.wax = clamp(S.wax + heat * dt * 0.5 - (heat ? 0 : dt * 0.06))
      S.wet = clamp(S.wet + damp * dt * 0.55 - (damp ? 0 : dt * 0.08))
      S.dist += dt * 0.42
      if (S.wax > 0.35 && Math.random() < S.wax * dt * 14) feathers.current.push({ x: X, y: S.y, vx: -30 - Math.random() * 40, vy: 10 + Math.random() * 20, r: Math.random() * 6 })
      if (S.wax >= 1) S.fallen = 'high'
      if (S.wet >= 1) S.fallen = 'low'
      if (S.fallen) setBest((b) => Math.max(b, S.dist))
    } else {
      S.fallT += dt
      S.y = Math.min(H - 30, S.y + (60 + S.fallT * 260) * dt)
    }
    feathers.current = feathers.current.filter((f) => f.y < H).map((f) => ({ ...f, x: f.x + f.vx * dt, y: f.y + f.vy * dt, r: f.r + dt * 3 }))
    const speed = S.fallen ? 0.2 : 1
    CLOUDS.forEach((c) => {
      c.x -= c.sp * dt * speed
      if (c.x < -c.w) c.x = W + c.w
    })
    setV({ ...S, clouds: CLOUDS.map((c) => c.x), feathers: feathers.current })
  })

  const aim = (e) => {
    const b = stage.current.getBoundingClientRect()
    const y = clamp((e.clientY - b.top) / b.height) * H
    target.current = y
    setH(Math.round(100 - (y / H) * 100))
  }
  const again = () => {
    s.current = { y: H / 2, wax: 0, wet: 0, dist: 0, fallen: null, fallT: 0, t: 0 }
    target.current = H / 2
    feathers.current = []
    setH(50)
  }

  const msg =
    v.fallen === 'high'
      ? 'Too high. The sun softened the wax, the feathers came loose, and he fell into the sea that now bears his name.'
      : v.fallen === 'low'
        ? 'Too low. The spray soaked the feathers until they were too heavy to lift.'
        : v.y < HOT
          ? 'The sun is close. The wax is softening.'
          : v.y > WET
            ? 'The sea is close. The feathers are taking on water.'
            : 'The middle course. Daedalus flies ahead of you.'

  return (
    <section id="course" className="mc" ref={wrap}>
      <div className="mc__top">
        <SectionHead no="04" title="The Middle Course" kicker="Icarus is the puer who flew; Daedalus, his father, is the senex who built the wings. Steer between the sun and the sea." />
        <figure className="mc__quote">
          <blockquote>“Fly midway. If you go too low, the water will weigh down your wings; too high, and the fire will burn them. Fly between.”</blockquote>
          <figcaption className="mono">Daedalus to Icarus · Ovid, Metamorphoses VIII (paraphrased)</figcaption>
        </figure>
      </div>

      <div className="mc__stage" ref={stage} onPointerMove={aim} onPointerDown={aim}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Icarus flying between the sun above and the sea below">
          <rect width={W} height={H} className="mc__sky" />
          <rect width={W} height={HOT} className="mc__hot" />
          <rect y={WET} width={W} height={H - WET} className="mc__wet" />
          <circle cx="840" cy="-30" r="150" className="mc__sun" />
          {v.clouds.map((x, i) => (
            <rect key={i} x={x} y={CLOUDS[i].y} width={CLOUDS[i].w} height="3" className="mc__cloud" />
          ))}
          {Array.from({ length: 4 }, (_, k) => (
            <path key={k} className="mc__wave" d={Array.from({ length: 21 }, (_, j) => `${j ? 'L' : 'M'}${j * 50 - ((v.t * (30 + k * 12)) % 50)} ${H - 58 + k * 16 + Math.sin(j + v.t * 2 + k) * 4}`).join('')} />
          ))}
          <line x1="0" x2={W} y1={HOT} y2={HOT} className="mc__line" />
          <line x1="0" x2={W} y1={WET} y2={WET} className="mc__line" />
          <text x="16" y={HOT - 10} className="mc__label">
            Too high · the wax melts
          </text>
          <text x="16" y={WET + 20} className="mc__label">
            Too low · the feathers soak
          </text>
          <text x="16" y={H / 2 + 4} className="mc__label mc__label--mid">
            The middle course
          </text>
          <Bird x={460 + Math.sin(v.t * 0.5) * 20} y={H / 2 + Math.sin(v.t * 0.8) * 8} flap={v.t * 5} cls="mc__daedalus" />
          {v.feathers.map((f, i) => (
            <line key={i} x1={f.x} y1={f.y} x2={f.x + 7 * Math.cos(f.r)} y2={f.y + 7 * Math.sin(f.r)} className="mc__feather" />
          ))}
          <Bird x={X} y={v.y} flap={v.t * (v.fallen ? 3 : 9)} loose={v.wax} cls={`mc__icarus ${v.fallen ? 'is-fallen' : ''}`} />
        </svg>

        <div className="mc__meters">
          <div>
            <span className="mono">Wax</span>
            <i>
              <b className="is-wax" style={{ width: `${v.wax * 100}%` }} />
            </i>
          </div>
          <div>
            <span className="mono">Water</span>
            <i>
              <b className="is-wet" style={{ width: `${v.wet * 100}%` }} />
            </i>
          </div>
          <div>
            <span className="mono">Distance</span>
            <b className="mc__dist">{v.dist.toFixed(1)} km</b>
          </div>
        </div>
      </div>

      <div className="mc__foot">
        <p className="mc__msg" aria-live="polite">
          {msg}
        </p>
        <label className="mc__height mono">
          Height
          <input
            type="range"
            min="0"
            max="100"
            value={h}
            onChange={(e) => {
              const n = Number(e.target.value)
              setH(n)
              target.current = (1 - n / 100) * H
            }}
          />
        </label>
        <div className="mc__again">
          {v.fallen && (
            <button type="button" className="mono" onClick={again}>
              Fly again
            </button>
          )}
          <span className="mono">Best: {best.toFixed(1)} km</span>
        </div>
      </div>

      <p className="mc__note">
        <span className="mono">Two warnings, one remembered</span>
        Daedalus warned against both extremes, but the story everyone remembers is the fall from too high. The puer’s risk is the sun; the senex’s is the sea, a life that never gets off the water.
      </p>
    </section>
  )
}
