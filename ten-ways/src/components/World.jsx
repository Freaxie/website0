import { useEffect, useRef } from 'react'
import { useLoop } from '../lib/useLoop.js'
import { WORLDS } from '../lib/worlds.js'
import { bus, reduced } from '../lib/bus.js'

// The environment behind a plate. It listens to the whole plate, so the cursor acts on the world
// wherever it goes, except inside the plate's own instrument, which has its own physics.
export default function World({ kind, fg, bg, color, host }) {
  const canvas = useRef(null)
  const world = WORLDS[kind]
  const state = useRef(null)
  const size = useRef({ w: 1, h: 1, dpr: 1 })
  const P = useRef({ x: 0, y: 0, on: false, speed: 0, vx: 0, vy: 0, down: false, lt: 0 })
  const engaged = useRef(0)

  useEffect(() => {
    const el = canvas.current
    const fit = () => {
      const b = el.getBoundingClientRect()
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      el.width = Math.max(1, Math.round(b.width * dpr))
      el.height = Math.max(1, Math.round(b.height * dpr))
      size.current = { w: b.width, h: b.height, dpr }
      state.current = world.init(b.width, b.height, { fg, bg, color })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [world, fg, bg, color])

  useEffect(() => {
    const h = host.current
    if (!h) return
    const at = (e) => {
      const b = canvas.current.getBoundingClientRect()
      const x = e.clientX - b.left
      const y = e.clientY - b.top
      const p = P.current
      const now = performance.now()
      const gap = Math.max(1, now - p.lt)
      const inside = !e.target.closest('.inst')
      const sp = p.on ? (Math.hypot(x - p.x, y - p.y) / gap) * 1000 : 0
      Object.assign(p, { vx: x - p.x, vy: y - p.y, x, y, on: inside, speed: Math.max(p.speed * 0.6, sp), lt: now })
    }
    const move = (e) => at(e)
    const down = (e) => {
      if (e.target.closest('a, button, .inst')) return
      at(e)
      P.current.down = true
      world.down?.(state.current, P.current, size.current.w, size.current.h, { fg, bg, color })
      bus.experience(kind)
    }
    const up = () => {
      P.current.down = false
      world.up?.(state.current, P.current)
    }
    const leave = () => {
      P.current.on = false
      up()
    }
    h.addEventListener('pointermove', move)
    h.addEventListener('pointerdown', down)
    h.addEventListener('pointerup', up)
    h.addEventListener('pointerleave', leave)
    return () => {
      h.removeEventListener('pointermove', move)
      h.removeEventListener('pointerdown', down)
      h.removeEventListener('pointerup', up)
      h.removeEventListener('pointerleave', leave)
    }
  }, [host, world, kind, fg, bg, color])

  useLoop(host, (t, dt) => {
    const el = canvas.current
    if (!el || !state.current) return
    const ctx = el.getContext('2d')
    const { w, h, dpr } = size.current
    const step = reduced ? dt * 0.15 : dt
    P.current.speed *= Math.exp(-dt * 6)
    // a few seconds of real attention counts as having met this world
    if (P.current.on && P.current.speed > 10) {
      engaged.current += dt
      if (engaged.current > 3) bus.experience(kind)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    world.step(state.current, ctx, t, step, P.current, w, h, { fg, bg, color })
  })

  return <canvas ref={canvas} className="world" aria-hidden="true" />
}
