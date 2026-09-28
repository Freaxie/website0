import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'

const CYCLES = 6
const SIX = Array.from({ length: 6 }, (_, k) => [Math.cos((k * Math.PI) / 3), Math.sin((k * Math.PI) / 3)])

export default function GrainOfSand() {
  const ref = useRef(null)
  const wrap = useRef(null)
  const canvas = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [zoom, setZoom] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setZoom(p * CYCLES))

  useEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size.current = { w: el.clientWidth, h: el.clientHeight, dpr }
      canvas.current.width = el.clientWidth * dpr
      canvas.current.height = el.clientHeight * dpr
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const last = useRef('')
  useLoop(wrap, () => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = size.current
    const z = scrollYProgress.get() * CYCLES
    // redraw only when the zoom or the size changes: thousands of grains are not free
    const key = `${z.toFixed(4)}|${w}|${h}`
    if (key === last.current) return
    last.current = key
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#231b10'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const base = Math.min(w, h) * 0.36
    const R = base * Math.pow(3, z)
    const far = Math.hypot(w, h) / 2
    const fills = ['#5d7318', '#231b10']

    // each grain holds seven grains a third its size: one in the middle, six around it
    const draw = (x, y, r, d) => {
      const dist = Math.hypot(x - cx, y - cy)
      if (dist - r > far) return
      ctx.fillStyle = fills[d % 2]
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(195,220,60,0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
      if (r < 18) return
      const c = r / 3
      draw(x, y, c, d + 1)
      for (const [ux, uy] of SIX) draw(x + ux * c * 2, y + uy * c * 2, c, d + 1)
    }
    draw(cx, cy, R, 0)

    // the point at the centre: always there, always further in
    ctx.fillStyle = '#5a36e0'
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#d8d0ff'
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.stroke()
  })

  const mag = Math.pow(3, zoom)
  return (
    <section id="grain" className="grn" ref={ref}>
      <div className="grn__sticky">
        <div className="grn__canvas" ref={wrap}>
          <canvas ref={canvas} role="img" aria-label="A grain made of seven smaller grains, each made of seven more, zooming inward without end toward a violet point at the centre" />
        </div>
        <div className="grn__head">
          <SectionHead no="07" title="A World in a Grain" tone="paper" kicker="The infinite need not be above the world. Scroll, and look closer." />
        </div>
        <div className="grn__stats mono" aria-live="off">
          <div>
            <span>Magnification</span>
            <b>×{mag < 1000 ? mag.toFixed(1) : Math.round(mag).toLocaleString('en-US')}</b>
          </div>
          <div>
            <span>Levels passed</span>
            <b>{Math.floor(zoom)}</b>
          </div>
          <div>
            <span>Bottom reached</span>
            <b>never</b>
          </div>
        </div>
        <motion.figure className="grn__quote" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.5 }} transition={{ duration: 1.2 }}>
          <blockquote>
            To see a World in a Grain of Sand
            <br />
            And a Heaven in a Wild Flower,
            <br />
            Hold Infinity in the palm of your hand
            <br />
            And Eternity in an hour.
          </blockquote>
          <figcaption className="mono">William Blake, Auguries of Innocence, c. 1803</figcaption>
          <p>Transcendence found by going in, not up: a beyond that lives inside the ordinary, the way the sacred, for many traditions, dwells in the world without being used up by it.</p>
        </motion.figure>
      </div>
    </section>
  )
}
