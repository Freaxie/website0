export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, t) => a + (b - a) * t
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const TAU = Math.PI * 2

// deterministic PRNG, so procedural layouts are the same on every visit
export function rng(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// frame-rate independent exponential approach
export const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt))

export const ink = (a) => `rgba(232,229,222,${a})`
export const signal = (a) => `rgba(255,77,46,${a})`
export const cool = (a) => `rgba(141,180,196,${a})`
export const warm = (a) => `rgba(226,180,138,${a})`

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const isCoarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

const GLYPHS = '#%&?/\\<>*+=:;01'
export function corrupt(text, amount, r = Math.random) {
  if (amount <= 0) return text
  let out = ''
  for (const ch of text) out += ch !== ' ' && r() < amount ? GLYPHS[(r() * GLYPHS.length) | 0] : ch
  return out
}
