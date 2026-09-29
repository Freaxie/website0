// Small geometry kit shared by every room: interpolation, periodic noise, smooth paths, colour mixing.

export const TAU = Math.PI * 2
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Deterministic randomness, so the chaos is the same every visit.
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
  paper: '#efede7',
  white: '#f8f7f3',
  ink: '#0b0b0c',
  ikb: '#002fa7',
  ikbDk: '#001a5e',
  ikbLt: '#b8c6f0',
}

// The generalist's palette: one chip from each exhibition in the series.
export const CHIPS = ['#e5431c', '#f3c300', '#0d6b58', '#e0157a', '#0098c8', '#5a36e0', '#e8921a', '#5d7318']
// A scroll range mapped to 0..1 as a plain function. Function transforms stay on the JS path; array
// transforms of opacity can be handed to a native ScrollTimeline, which mis-measures sticky rooms.
export const range = (a, b, from = 0, to = 1) => (v) => lerp(from, to, clamp((v - a) / (b - a)))
