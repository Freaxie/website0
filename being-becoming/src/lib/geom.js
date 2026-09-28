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

// Periodic noise around a circle: integer frequencies keep the contour closed.
// `complexity` feeds in the higher harmonics, which is where a shape stops looking designed.
export function ring(theta, t, seed = 0, complexity = 1) {
  return (
    Math.sin(2 * theta + t * 0.7 + seed) * 0.5 +
    Math.sin(3 * theta - t * 0.9 + seed * 1.3) * 0.32 +
    Math.sin(5 * theta + t * 1.3 + seed * 2.1) * 0.2 * complexity +
    Math.sin(9 * theta - t * 1.9 + seed * 0.7) * 0.12 * complexity * complexity +
    Math.sin(14 * theta + t * 2.6 + seed * 3.1) * 0.07 * complexity * complexity * complexity
  )
}

// Open noise along a line.
export function wave(x, t, seed = 0) {
  return (
    Math.sin(x * 1.0 + t * 0.9 + seed) * 0.5 +
    Math.sin(x * 2.3 - t * 1.3 + seed * 1.7) * 0.3 +
    Math.sin(x * 4.7 + t * 2.1 + seed * 2.3) * 0.2
  )
}

export function blobPoints(cx, cy, r, amp, t, { n = 96, seed = 0, complexity = 1 } = {}) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TAU
    const k = 1 + amp * ring(th, t, seed, complexity)
    pts.push([cx + Math.cos(th) * r * k, cy + Math.sin(th) * r * k])
  }
  return pts
}

const f = (v) => Math.round(v * 10) / 10

// Catmull-Rom through the points, written as cubic Béziers.
export function closedPath(pts) {
  const n = pts.length
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

export function openPath(pts) {
  const n = pts.length
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, n - 1)]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

// Evenly resample a polyline to `m` points, so any two lines can morph point for point.
export function resample(poly, m) {
  const seg = []
  let total = 0
  for (let i = 0; i < poly.length - 1; i++) {
    const l = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1])
    seg.push(l)
    total += l
  }
  const out = []
  for (let j = 0; j < m; j++) {
    let d = (j / (m - 1)) * total
    let i = 0
    while (i < seg.length - 1 && d > seg[i]) d -= seg[i++]
    const t = seg[i] ? d / seg[i] : 0
    out.push([lerp(poly[i][0], poly[i + 1][0], t), lerp(poly[i][1], poly[i + 1][1], t)])
  }
  return out
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export function mixHex(a, b, t) {
  const A = hex(a)
  const B = hex(b)
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(t)))).join(',')})`
}
export function mix3(a, b, c, t) {
  return t < 0.5 ? mixHex(a, b, t * 2) : mixHex(b, c, (t - 0.5) * 2)
}

export const C = {
  paper: '#eceae4',
  chalk: '#f5f4ef',
  ink: '#0d0d0e',
  lead: '#2e3136',
  stone: '#c9ccca',
  ice: '#9fc1d3',
  iceDk: '#4f7890',
  vermilion: '#e5431c',
  ember: '#ffae42',
  char: '#1a0b05',
  ash: '#8a7f78',
}
// A scroll range mapped to 0..1 as a plain function. Function transforms stay on the JS path; array
// transforms of opacity can be handed to a native ScrollTimeline, which mis-measures sticky rooms.
export const range = (a, b, from = 0, to = 1) => (v) => lerp(from, to, clamp((v - a) / (b - a)))
