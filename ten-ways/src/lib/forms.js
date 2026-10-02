// The geometry of each world, as a cloud of points, and the way each world draws a point.
// Passages between worlds move the same points from one form to the other.
import { byId } from './archetypes.js'
import { TAU, lerp, mix, rng, smooth } from './geom.js'

export const N = 420

const evenly = (segs, n) => {
  // n points spread along a list of segments, in proportion to their length
  const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b))
  const total = lens.reduce((s, l) => s + l, 0)
  const out = []
  segs.forEach(([a, b, c, d], i) => {
    const k = Math.max(1, Math.round((lens[i] / total) * n))
    for (let j = 0; j < k; j++) out.push({ x: lerp(a, c, j / k), y: lerp(b, d, j / k), dx: c - a, dy: d - b })
  })
  while (out.length < n) out.push({ ...out[out.length % Math.max(1, out.length)] })
  return out.slice(0, n)
}

const BUILD = {
  scientist() {
    return { fill: true, pts: Array.from({ length: N }, (_, i) => ({ x: ((i % 28) + 0.5) / 28, y: (Math.floor(i / 28) + 0.5) / 15 })) }
  },
  engineer() {
    const segs = []
    for (const y0 of [0.22, 0.5, 0.78]) {
      for (let k = 0; k < 10; k++) {
        const x0 = 0.05 + k * 0.09
        segs.push([x0, y0 + 0.06, x0 + 0.09, y0 + 0.06], [x0, y0 - 0.06, x0 + 0.09, y0 - 0.06], [x0, y0 + 0.06, x0 + 0.045, y0 - 0.06], [x0 + 0.045, y0 - 0.06, x0 + 0.09, y0 + 0.06])
      }
    }
    return { fill: true, pts: evenly(segs, N) }
  },
  warrior() {
    const segs = Array.from({ length: 14 }, (_, i) => [-0.2 + i * 0.1, 1.05, 0.15 + i * 0.1, -0.05])
    return { fill: true, pts: evenly(segs, N) }
  },
  artist() {
    return { fill: false, pts: Array.from({ length: N }, (_, i) => { const arm = i % 3; const k = Math.floor(i / 3); const r = 0.04 + (k / 140) * 0.44; const a = k * 0.16 + (arm * TAU) / 3; return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r, s: 2 + (k % 5) } }) }
  },
  philosopher() {
    const pts = []
    const r = rng(41)
    const grow = (x, y, ang, len, d, link) => {
      const steps = Math.max(2, Math.round(len * 40))
      let prev = link
      for (let j = 1; j <= steps; j++) {
        pts.push({ x: x + Math.cos(ang) * len * (j / steps), y: y + Math.sin(ang) * len * (j / steps), link: prev })
        prev = pts.length - 1
      }
      if (d < 6) {
        const ex = x + Math.cos(ang) * len
        const ey = y + Math.sin(ang) * len
        grow(ex, ey, ang - 0.45 - r() * 0.3, len * 0.72, d + 1, prev)
        grow(ex, ey, ang + 0.45 + r() * 0.3, len * 0.72, d + 1, prev)
      }
    }
    grow(0.5, 0.98, -Math.PI / 2, 0.22, 0, -1)
    return { fill: true, pts: pts.slice(0, N).concat(Array.from({ length: Math.max(0, N - pts.length) }, () => ({ ...pts[0] }))) }
  },
  explorer() {
    const r = rng(43)
    const f = (x, y) => Math.sin(x * 7.1 + 1) * Math.cos(y * 5.3) + Math.sin((x + y) * 4.2) * 0.6
    const pts = []
    let guard = 0
    while (pts.length < N && guard++ < 200000) {
      const x = r()
      const y = r()
      if ((((f(x, y) * 2.5) % 1) + 1) % 1 < 0.05) pts.push({ x, y })
    }
    return { fill: true, pts }
  },
  monk() {
    return { fill: false, pts: Array.from({ length: N }, (_, i) => { const a = ((-50 - (i / N) * 322) * Math.PI) / 180; return { x: 0.5 + Math.cos(a) * 0.32, y: 0.5 + Math.sin(a) * 0.32 } }) }
  },
  sovereign() {
    const segs = []
    for (const s of [0.1, 0.2, 0.3, 0.42]) segs.push([0.5 - s, 0.5 - s, 0.5 + s, 0.5 - s], [0.5 + s, 0.5 - s, 0.5 + s, 0.5 + s], [0.5 + s, 0.5 + s, 0.5 - s, 0.5 + s], [0.5 - s, 0.5 + s, 0.5 - s, 0.5 - s])
    return { fill: false, pts: evenly(segs, N) }
  },
  hedonist() {
    return { fill: false, pts: Array.from({ length: N }, (_, i) => { const a = (i / N) * TAU; const r = 0.42 * Math.abs(Math.cos(4 * a)); return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r, s: i % 4 } }) }
  },
  trickster() {
    const r = rng(47)
    const shift = Array.from({ length: 15 }, () => (r() < 0.4 ? (r() - 0.5) * 0.3 : 0))
    return { fill: true, pts: Array.from({ length: N }, (_, i) => { const row = Math.floor(i / 28); return { x: ((i % 28) + 0.5) / 28 + shift[row], y: (row + 0.5) / 15 } }) }
  },
  reality() {
    return { fill: false, pts: Array.from({ length: N }, (_, i) => { const a = (i / N) * TAU * 3; const r = i < N * 0.8 ? 0.36 : 0.06 * ((i * 7) % 10) / 10; return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r } }) }
  },
}

const cache = {}
export function form(id) {
  if (!cache[id]) cache[id] = BUILD[id] ? BUILD[id]() : BUILD.reality()
  return cache[id]
}

// points of a form, in canvas pixels
export function place(f, w, h) {
  const s = Math.min(w, h) * 0.92
  return f.pts.map((p) => (f.fill ? { x: p.x * w, y: p.y * h } : { x: (w - s) / 2 + p.x * s, y: (h - s) / 2 + p.y * s }))
}

const GLYPHS = '0123456789=+−×∑∫π∂λ'
const WARM = ['#fff1e6', '#ffd23f', '#e8432e', '#ffffff']
const INK = ['#ffd23f', '#0c0c0c', '#ffb3d6']

// draw a set of placed points in the manner of one archetype
export function drawStyle(ctx, id, f, P, alpha, fg) {
  if (alpha <= 0.01) return
  ctx.globalAlpha = alpha
  ctx.fillStyle = fg
  ctx.strokeStyle = fg
  ctx.lineWidth = 1.2
  switch (id) {
    case 'scientist':
      ctx.font = '500 11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      P.forEach((p, i) => ctx.fillText(GLYPHS[i % GLYPHS.length], p.x, p.y))
      break
    case 'engineer':
      ctx.beginPath()
      for (let i = 1; i < P.length; i++) {
        if (Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y) < 48) {
          ctx.moveTo(P[i - 1].x, P[i - 1].y)
          ctx.lineTo(P[i].x, P[i].y)
        }
      }
      ctx.stroke()
      P.forEach((p, i) => i % 6 === 0 && ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5))
      break
    case 'warrior':
      ctx.lineWidth = 2
      ctx.beginPath()
      P.forEach((p, i) => {
        const q = f.pts[i]
        const l = Math.hypot(q.dx || 1, q.dy || 1)
        const ux = (q.dx || 1) / l
        const uy = (q.dy || -1) / l
        ctx.moveTo(p.x - ux * 7, p.y - uy * 7)
        ctx.lineTo(p.x + ux * 7, p.y + uy * 7)
      })
      ctx.stroke()
      break
    case 'artist':
      P.forEach((p, i) => {
        ctx.fillStyle = i % 4 === 0 ? fg : INK[i % INK.length]
        ctx.beginPath()
        ctx.arc(p.x, p.y, f.pts[i].s || 3, 0, TAU)
        ctx.fill()
      })
      break
    case 'philosopher':
      ctx.lineWidth = 1
      ctx.beginPath()
      P.forEach((p, i) => {
        const l = f.pts[i].link
        if (l >= 0 && P[l]) {
          ctx.moveTo(P[l].x, P[l].y)
          ctx.lineTo(p.x, p.y)
        }
      })
      ctx.stroke()
      ctx.font = 'italic 13px "Instrument Serif", serif'
      P.forEach((p, i) => i % 37 === 0 && ctx.fillText('?', p.x + 4, p.y - 4))
      break
    case 'explorer':
      ctx.beginPath()
      P.forEach((p) => {
        ctx.moveTo(p.x - 3, p.y)
        ctx.lineTo(p.x + 3, p.y)
      })
      ctx.stroke()
      P.forEach((p, i) => {
        if (i % 70) return
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - 6)
        ctx.lineTo(p.x + 5, p.y + 3)
        ctx.lineTo(p.x - 5, p.y + 3)
        ctx.fill()
      })
      break
    case 'monk':
      P.forEach((p, i) => i % 3 === 0 && ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6))
      break
    case 'sovereign':
      P.forEach((p) => ctx.fillRect(p.x - 2, p.y - 2, 4, 4))
      break
    case 'hedonist':
      P.forEach((p, i) => {
        ctx.fillStyle = WARM[i % WARM.length]
        ctx.globalAlpha = alpha * 0.35
        ctx.beginPath()
        ctx.arc(p.x, p.y, 7, 0, TAU)
        ctx.fill()
      })
      break
    case 'trickster':
      for (const [dx, c] of [[-3, '#1f4fd8'], [3, '#e0157a'], [0, fg]]) {
        ctx.fillStyle = c
        P.forEach((p) => ctx.fillRect(p.x + dx - 2.5, p.y - 2.5, 5, 5))
      }
      break
    default:
      P.forEach((p) => ctx.fillRect(p.x - 1, p.y - 1, 2, 2))
  }
  ctx.globalAlpha = 1
}

const look = (id) => (byId[id] ? { color: byId[id].color, fg: byId[id].fg } : { color: '#eeebe4', fg: '#0c0c0c' })

// One frame of a passage from world a to world b, p from 0 to 1.
export function drawMorph(ctx, w, h, a, b, p, t) {
  const A = look(a)
  const B = look(b)
  const fa = form(a)
  const fb = form(b)
  const pa = place(fa, w, h)
  const pb = place(fb, w, h)
  const r = rng(99)
  const c = smooth(0.3, 0.7, p)
  ctx.globalAlpha = 1
  ctx.fillStyle = mix(A.color, B.color, c)
  ctx.fillRect(0, 0, w, h)
  const fg = mix(A.fg, B.fg, c)
  // the middle of every passage is a cloud of loose points; going toward the monk, it freezes and goes quiet
  const quiet = b === 'monk'
  const jit = Math.sin(p * Math.PI) * (quiet ? Math.max(0, 1 - p * 2.4) : 1) * 14
  const P = pa.map((q, i) => {
    const sx = r() * w
    const sy = r() * h
    const ph = r() * TAU
    let x
    let y
    if (p < 0.5) {
      const k = smooth(0, 0.5, p)
      x = lerp(q.x, sx, k)
      y = lerp(q.y, sy, k)
    } else {
      const k = smooth(0.5, 1, p)
      x = lerp(sx, pb[i].x, k)
      y = lerp(sy, pb[i].y, k)
    }
    return { x: x + Math.cos(t * 2 + ph) * jit, y: y + Math.sin(t * 2.3 + ph) * jit }
  })
  const dots = smooth(0.3, 0.45, p) * (1 - smooth(0.55, 0.7, p))
  drawStyle(ctx, a, fa, P, 1 - smooth(0.3, 0.48, p), fg)
  ctx.fillStyle = fg
  ctx.globalAlpha = dots * (quiet && p > 0.5 ? 0.3 : 0.8)
  P.forEach((q) => ctx.fillRect(q.x - 1.2, q.y - 1.2, 2.4, 2.4))
  drawStyle(ctx, b, fb, P, smooth(0.52, 0.72, p), fg)
  if (quiet && p > 0.6) {
    // one breathing circle remains
    const s = Math.min(w, h) * 0.92 * 0.32
    ctx.globalAlpha = smooth(0.6, 0.9, p)
    ctx.strokeStyle = fg
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, s * (1 + Math.sin(t * 0.8) * 0.03), 0, TAU)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

