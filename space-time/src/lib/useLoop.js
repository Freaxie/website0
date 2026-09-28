import { useRef } from 'react'
import { useAnimationFrame, useInView, useReducedMotion } from 'framer-motion'

// A frame loop that only runs while its room is on screen. Time slows to a crawl under reduced motion.
export function useLoop(ref, fn, margin = '10% 0px 10% 0px') {
  const visible = useInView(ref, { margin })
  const reduce = useReducedMotion()
  const t = useRef(0)
  const last = useRef(null)
  useAnimationFrame((now) => {
    if (!visible) {
      last.current = null
      return
    }
    const dt = last.current == null ? 0 : Math.min(0.05, (now - last.current) / 1000)
    last.current = now
    t.current += dt * (reduce ? 0.08 : 1)
    fn(t.current, dt)
  })
}
