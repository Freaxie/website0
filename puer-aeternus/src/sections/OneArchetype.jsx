import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'
import { C, clamp, lerp, mix, rng } from '../lib/geom.js'

// One random number per node of the tree, fixed, so the tree holds its shape while the slider moves.
const R = (() => {
  const r = rng(21)
  return Array.from({ length: 8192 }, r)
})()

const STATES = [
  { upTo: 0.2, name: 'Puer without senex', text: 'All shoots, no trunk. Everything begun, nothing held; the new growth drifts off before it can join anything.' },
  { upTo: 0.8, name: 'Puer and senex', text: 'Something that grows and lasts: new shoots, carried by old wood, held by roots.' },
  { upTo: 1.01, name: 'Senex without puer', text: 'All trunk, no shoots. Everything held, nothing new; the wood is sound and the top is cut flat.' },
]

export default function OneArchetype() {
  const ref = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const [s, setS] = useState(0.5)
  const sRef = useRef(s)
  sRef.current = s

  useEffect(() => {
    const el = canvas.current
    const fit = () => {
      const b = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(b.width * dpr)
      el.height = Math.round(b.height * dpr)
      size.current = { w: b.width, h: b.height, dpr }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLoop(ref, (t) => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    const k = sRef.current
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const gy = h * 0.66
    const cx = w / 2
    const unit = Math.min(w * 0.9, gy * 0.72) // sized so the tallest tree still fits under the top edge

    const youth = 1 - k
    const detach = clamp(1 - k * 3.2) // at the puer's end, shoots come loose from each other
    const depth = k > 0.9 ? 0 : Math.round(lerp(6, 1, k)) // the oldest tree is trunk only
    const stub = lerp(1, 0.45, clamp((k - 0.7) / 0.3)) // the old tree's limbs are short and cut
    const trunkW = lerp(1.2, 46, k ** 1.3)
    const trunkLen = unit * lerp(0.03, 0.2, clamp(k * 1.8))
    const spread = lerp(0.62, 0.22, k)
    const wood = mix(C.sky, C.lead, k * 1.4)
    const tips = []

    const branch = (x, y, ang, len, wid, d, id) => {
      const sway = Math.sin(t * 0.9 + d * 0.7 + id * 0.01) * 0.035 * youth * d
      const a = ang + sway
      const x2 = x + Math.sin(a) * len
      const y2 = y - Math.cos(a) * len
      ctx.strokeStyle = wood
      ctx.globalAlpha = d > 0 && detach > 0 ? 1 - detach * (d / depth) * 0.7 : 1
      ctx.lineWidth = Math.max(0.8, wid)
      ctx.lineCap = k > 0.8 ? 'butt' : 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      if (d >= depth) {
        tips.push([x2, y2, id])
        return
      }
      for (const side of [-1, 1]) {
        const cid = id * 2 + (side > 0 ? 1 : 0)
        const rr = R[cid % R.length]
        const na = a + side * spread * (0.6 + rr * 0.8)
        // loose shoots start a little way off, and drift upward, the further out the more
        const gap = detach * (6 + d * 5)
        const lift = detach * d * d * 1.6 * (1 + Math.sin(t * 0.6 + cid) * 0.3)
        branch(x2 + Math.sin(na) * gap, y2 - Math.cos(na) * gap - lift, na, len * (0.72 + rr * 0.12) * stub, wid * 0.66, d + 1, cid)
      }
    }
    // the puer has many thin stems from the ground; the senex has one trunk
    const stems = Math.max(1, Math.round(lerp(3, 1, clamp(k * 2.4))))
    for (let i = 0; i < stems; i++) {
      const off = stems === 1 ? 0 : (i / (stems - 1) - 0.5) * unit * 0.34
      const lean = stems === 1 ? 0 : (i / (stems - 1) - 0.5) * 0.7
      branch(cx + off, gy, lean, trunkLen + unit * 0.08 * (1 - k), trunkW, 0, i + 1)
    }

    // blossoms on the tips, most in the middle of the range
    const bloom = Math.sin(Math.PI * clamp(k * 1.15)) * (k < 0.9 ? 1 : 0)
    if (bloom > 0.05)
      for (const [x, y, id] of tips) {
        const rr = R[(id * 7) % R.length]
        ctx.globalAlpha = bloom * (0.5 + rr * 0.5)
        ctx.fillStyle = rr > 0.6 ? C.sun : C.sky
        ctx.beginPath()
        ctx.arc(x, y, 2 + rr * 3 * bloom, 0, Math.PI * 2)
        ctx.fill()
      }
    ctx.globalAlpha = 1

    // the cut top of an old trunk shows its rings
    if (k > 0.82) {
      const ty = gy - (trunkLen + unit * 0.08 * (1 - k))
      ctx.strokeStyle = C.ochre
      ctx.lineWidth = 1
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath()
        ctx.ellipse(cx, ty, (trunkW / 2) * (i / 5), 4 * (i / 5), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // ground
    ctx.fillStyle = C.lead
    ctx.fillRect(0, gy, w, h - gy)

    // roots: none for the puer, a deep net for the senex
    const rdepth = Math.round(lerp(0, 7, k))
    const root = (x, y, ang, len, wid, d, id) => {
      const x2 = x + Math.sin(ang) * len
      const y2 = y + Math.cos(ang) * len
      ctx.strokeStyle = C.ochre
      ctx.globalAlpha = 0.9 - d * 0.08
      ctx.lineWidth = Math.max(0.7, wid)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      if (d >= rdepth) return
      for (const side of [-1, 1]) {
        const cid = id * 2 + (side > 0 ? 1 : 0)
        const rr = R[(cid + 4096) % R.length]
        root(x2, y2, ang + side * (0.35 + rr * 0.5), len * (0.68 + rr * 0.14), wid * 0.62, d + 1, cid)
      }
    }
    if (rdepth > 0) root(cx, gy, 0, (h - gy) * 0.3, trunkW * 0.8, 1, 1)
    ctx.globalAlpha = 1
  })

  const st = STATES.find((x) => s < x.upTo)
  return (
    <section id="archetype" className="arc" ref={ref}>
      <div className="arc__top">
        <SectionHead no="05" title="One Archetype" kicker="James Hillman argued that puer and senex are not two people but two faces of one figure. Pull them apart and each becomes a caricature. Slide between them." />
        <div className="arc__state" aria-live="polite">
          <span className="mono">{st.name}</span>
          <p>{st.text}</p>
        </div>
      </div>
      <div className="arc__stage">
        <canvas ref={canvas} className="arc__canvas" role="img" aria-label={`A tree drawn as ${st.name.toLowerCase()}`} />
      </div>
      <div className="arc__slider">
        <span className="mono">Puer</span>
        <input type="range" min="0" max="100" value={Math.round(s * 100)} onChange={(e) => setS(Number(e.target.value) / 100)} aria-label="From puer to senex" />
        <span className="mono">Senex</span>
      </div>
      <div className="arc__notes">
        <p>
          <span className="mono">Hillman, 1967</span>
          In an Eranos lecture, “Senex and Puer”, James Hillman described the two as poles of a single archetype. The trouble begins when they split: a youth with no sense of time, an age with no spirit.
        </p>
        <p>
          <span className="mono">Saturn</span>
          The senex belongs to Saturn, the Roman Kronos: the god of time, harvest and limits, and in the old medicine the planet of melancholy and of lead.
        </p>
      </div>
    </section>
  )
}
