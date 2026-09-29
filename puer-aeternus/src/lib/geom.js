// Small kit shared by every room: interpolation, deterministic randomness, the palette.

export const TAU = Math.PI * 2
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Deterministic randomness, so the sky is the same every visit.
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

// The puer's colours are air, sky and sun; the senex's are lead, stone and ochre.
export const C = {
  air: '#eaf0f6',
  cloud: '#fbfcfd',
  sky: '#1d7fd0',
  skyDk: '#0d4f8a',
  sun: '#ffbf1f',
  lead: '#2b2c2e',
  slate: '#5a5c60',
  stone: '#d8d2c6',
  ochre: '#a8742a',
  umber: '#4a3524',
}

// A scroll range mapped to 0..1 as a plain function (function transforms stay on the JS path).
export const range = (a, b, from = 0, to = 1) => (v) => lerp(from, to, clamp((v - a) / (b - a)))

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mix(a, b, t) {
  const x = hex(a)
  const y = hex(b)
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`
}
