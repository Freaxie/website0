// Small kit shared by every room: interpolation, deterministic randomness, the palette.

export const TAU = Math.PI * 2
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Deterministic randomness, so every visit sees the same world.
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const C = {
  paper: '#eeebe4',
  white: '#f7f5f0',
  ink: '#0c0c0c',
  grey: '#8a8780',
}

// A scroll range mapped to 0..1 as a plain function (function transforms stay on the JS path).
export const range = (a, b, from = 0, to = 1) => (v) => lerp(from, to, clamp((v - a) / (b - a)))

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mix(a, b, t) {
  const x = hex(a)
  const y = hex(b)
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`
}
