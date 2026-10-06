import { useEffect } from 'react'
import { pointer } from './pointer.js'

// Runs a 2D (or WebGL) canvas animation only while the canvas is on screen and the tab is visible.
// `factory(ctx, s, canvas)` returns { frame(dt, s), resize?(w, h), dispose?() }.
// `s` carries size, time and the pointer in canvas-local CSS pixels.
export function useCanvas(ref, factory, { maxDpr = 2, context = '2d', deps = [] } = {}) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx =
      context === '2d'
        ? canvas.getContext('2d')
        : canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false })
    const s = { w: 1, h: 1, dpr: 1, t: 0, mx: -9999, my: -9999, inside: false, visible: false, ok: !!ctx }
    const inst = factory(ctx, s, canvas) || {}
    let raf = 0
    let last = 0
    let running = false

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      const dpr = Math.min(window.devicePixelRatio || 1, typeof maxDpr === 'function' ? maxDpr() : maxDpr)
      s.dpr = dpr
      s.w = r.width
      s.h = r.height
      canvas.width = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
      if (context === '2d' && ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      inst.resize?.(s.w, s.h)
      if (!running) draw(0)
    }
    const draw = (dt) => {
      const r = canvas.getBoundingClientRect()
      s.left = r.left
      s.top = r.top
      s.mx = pointer.x - r.left
      s.my = pointer.y - r.top
      s.inside = pointer.moved && s.mx >= 0 && s.my >= 0 && s.mx <= r.width && s.my <= r.height
      inst.frame?.(dt, s)
    }
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      s.t += dt
      draw(dt)
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    const update = () => (s.visible && !document.hidden ? start() : stop())

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(
      ([e]) => {
        s.visible = e.isIntersecting
        update()
      },
      { rootMargin: '80px 0px' },
    )
    io.observe(canvas)
    document.addEventListener('visibilitychange', update)
    resize()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      inst.dispose?.()
    }
  }, deps)
}
