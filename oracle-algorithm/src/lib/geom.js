// Small kit shared by every room: interpolation, deterministic randomness, colour mixing, the palette.

export const TAU = Math.PI * 2
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Deterministic randomness, so the same question always gets the same answer.
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

// FNV-1a: a string to a 32-bit seed.
export function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export const C = {
  obsidian: '#0d0b0a',
  basalt: '#1a1512',
  gold: '#c9a24a',
  goldLt: '#e8d39a',
  crimson: '#a3202a',
  bone: '#e9e3d3',
  black: '#050506',
  white: '#f3f4f6',
  blue: '#2448ff',
  blueLt: '#b4c0ff',
  rule: '#d3d6dc',
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mix(a, b, t) {
  const x = hex(a)
  const y = hex(b)
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`
}

// A scroll range mapped to 0..1 as a plain function. Function transforms stay on the JS path; array
// transforms of opacity can be handed to a native ScrollTimeline, which mis-measures sticky rooms.
export const range = (a, b, from = 0, to = 1) => (v) => lerp(from, to, clamp((v - a) / (b - a)))
