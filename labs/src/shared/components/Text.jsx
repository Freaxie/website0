import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { pointer } from '../lib/pointer.js'
import { reducedMotion } from '../lib/math.js'

const EASE = [0.2, 0.7, 0.1, 1]

// "*word*" renders as serif italic inside a statement
function parse(text) {
  const out = []
  let em = false
  for (const part of text.split('*')) {
    if (part) part.split(/(\s+)/).forEach((w) => w && out.push({ w, em }))
    em = !em
  }
  return out
}

// A large statement that comes into focus word by word, like a lens finding its plane.
// With `lens`, letters near the pointer swell as if seen through glass.
export function Statement({
  text,
  as = 'h2',
  className = 'big',
  delay = 0,
  stagger = 0.07,
  amount = 0.45,
  lens = false,
  style,
}) {
  const Tag = motion[as]
  const ref = useRef(null)
  const tokens = parse(text)
  let wi = 0

  useEffect(() => {
    if (!lens || reducedMotion() || matchMedia('(pointer: coarse)').matches) return
    const el = ref.current
    if (!el) return
    const chars = [...el.querySelectorAll('.ch')]
    let raf = 0
    let visible = false
    let calm = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    const tick = () => {
      if (!visible) return
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      const near =
        pointer.x > r.left - 160 && pointer.x < r.right + 160 && pointer.y > r.top - 160 && pointer.y < r.bottom + 160
      if (!near) {
        if (!calm) {
          chars.forEach((c) => (c.style.transform = ''))
          calm = true
        }
        return
      }
      calm = false
      const R = Math.max(90, r.height * 0.55)
      for (const c of chars) {
        const cx = r.left + c.offsetLeft + c.offsetWidth / 2
        const cy = r.top + c.offsetTop + c.offsetHeight / 2
        const d = Math.hypot(cx - pointer.x, cy - pointer.y)
        const f = Math.max(0, 1 - d / R)
        const k = f * f * (3 - 2 * f)
        c.style.transform =
          k > 0.001
            ? `translateY(${(-k * 6).toFixed(2)}px) scale(${(1 + k * 0.16).toFixed(3)}, ${(1 + k * 0.34).toFixed(3)})`
            : ''
      }
    }
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [lens])

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t.w)) return ' '
        const idx = wi++
        const content = lens
          ? [...t.w].map((c, j) => (
              <span key={j} className="ch">
                {c}
              </span>
            ))
          : t.w
        const word = (
          <motion.span
            key={i}
            className="word"
            variants={{
              hidden: { opacity: 0, filter: 'blur(16px)', y: 16 },
              show: {
                opacity: 1,
                filter: 'blur(0px)',
                y: 0,
                transition: { duration: 1.6, ease: EASE, delay: delay + idx * stagger },
              },
            }}
          >
            {content}
          </motion.span>
        )
        return t.em ? <em key={i}>{word}</em> : word
      })}
    </Tag>
  )
}

// Small text that fades up once it is in view.
export function Reveal({ as = 'div', children, delay = 0, className, style, amount = 0.3, y = 18 }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1.3, ease: EASE, delay }}
    >
      {children}
    </Tag>
  )
}

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>?'

// Text that resolves from noise whenever it changes.
export function Scramble({ text, className, duration = 520 }) {
  const ref = useRef(null)
  const shown = useRef(text)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    const to = text
    if (reducedMotion()) {
      el.textContent = to
      shown.current = to
      return
    }
    const len = Math.max(from.length, to.length)
    const start = performance.now()
    let raf = 0
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration)
      let out = ''
      for (let i = 0; i < len; i++) {
        const settle = (i / len) * 0.6 + 0.4
        if (p >= settle) out += to[i] ?? ''
        else if (p > settle - 0.45) out += to[i] === ' ' ? ' ' : POOL[(Math.random() * POOL.length) | 0]
        else out += from[i] ?? ''
      }
      el.textContent = out
      if (p < 1) raf = requestAnimationFrame(step)
      else shown.current = to
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, duration])
  return (
    <span ref={ref} className={className} aria-live="polite">
      {shown.current}
    </span>
  )
}

// Types text out, character by character.
export function Typed({ text, speed = 34, className, onDone, start = true }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !start) return
    if (reducedMotion()) {
      el.textContent = text
      onDone?.()
      return
    }
    let i = 0
    el.textContent = ''
    const id = setInterval(() => {
      i++
      el.textContent = text.slice(0, i)
      if (i >= text.length) {
        clearInterval(id)
        onDone?.()
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, start])
  return <span ref={ref} className={className} aria-label={text} />
}
