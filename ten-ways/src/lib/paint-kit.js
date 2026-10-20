// The drawing kit for the paintings: a few dozen primitives (skies, glows, splines, bodies, beasts,
// wings, trees, brushes, a small Greek stroke alphabet) in a 100 × 125 frame. Each scene draws itself
// once with these, and a medium (paintings.js) then turns the drawing into pixels, tesserae, glass,
// ink, clay or a print.
import { rng, lerp, clamp } from './geom.js'

export const FW = 100
export const FH = 125
const D = Math.PI / 180

export function hex(c) {
  const h = c.replace('#', '')
  const f = h.length === 3 ? [...h].map((x) => x + x).join('') : h
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16))
}
export const rgba = (c, a = 1) => `rgba(${hex(c).join(',')},${a})`
export const tint = (c, t, to = '#ffffff') => {
  const y = hex(to)
  return (
    '#' +
    hex(c)
      .map((v, i) =>
        Math.round(lerp(v, y[i], clamp(t)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

export function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// Whether ctx.filter really blurs (Safari long kept the property without the effect).
let FILTER = null
function filterWorks() {
  if (FILTER !== null) return FILTER
  try {
    const c = canvas(9, 9)
    const x = c.getContext('2d')
    x.filter = 'blur(2px)'
    x.fillStyle = '#fff'
    x.fillRect(4, 4, 1, 1)
    FILTER = x.getImageData(1, 4, 1, 1).data[3] > 0
  } catch {
    FILTER = false
  }
  return FILTER
}

// Draw a canvas blurred by px device pixels, with a filter where it works and a down-and-up scale where not.
export function drawBlurred(ctx, src, px) {
  if (px <= 0.3) return ctx.drawImage(src, 0, 0)
  if (filterWorks()) {
    ctx.filter = `blur(${px}px)`
    ctx.drawImage(src, 0, 0)
    ctx.filter = 'none'
    return
  }
  const k = Math.max(1, px / 1.1)
  const s = canvas(Math.max(1, Math.round(src.width / k)), Math.max(1, Math.round(src.height / k)))
  const sx = s.getContext('2d')
  sx.imageSmoothingQuality = 'high'
  sx.drawImage(src, 0, 0, s.width, s.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(s, 0, 0, src.width, src.height)
}

// A smooth curve through points (uniform Catmull–Rom as cubic Béziers).
export function spline(ctx, pts, closed = false) {
  const n = pts.length
  ctx.moveTo(pts[0][0], pts[0][1])
  if (n < 3) {
    for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
    if (closed) ctx.closePath()
    return
  }
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = at(i - 1)
    const b = at(i)
    const c = at(i + 1)
    const d = at(i + 2)
    ctx.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1])
  }
  if (closed) ctx.closePath()
}

// The same curve as dense points, for ribbons and brushes.
export function sample(pts, per = 10) {
  const n = pts.length
  if (n < 2) return pts.slice()
  const at = (i) => pts[Math.max(0, Math.min(n - 1, i))]
  const out = []
  for (let i = 0; i < n - 1; i++) {
    const a = at(i - 1)
    const b = at(i)
    const c = at(i + 1)
    const d = at(i + 2)
    for (let k = 0; k < per; k++) {
      const t = k / per
      const t2 = t * t
      const t3 = t2 * t
      out.push([0, 1].map((j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3)))
    }
  }
  out.push(pts[n - 1])
  return out
}

// A filled band along points whose width follows wf(t).
export function ribbon(ctx, pts, wf) {
  const n = pts.length
  const L = []
  const R = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    let dx = b[0] - a[0]
    let dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    dx /= l
    dy /= l
    const w = wf(n === 1 ? 0 : i / (n - 1)) / 2
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w])
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w])
  }
  ctx.beginPath()
  ctx.moveTo(L[0][0], L[0][1])
  for (const p of L) ctx.lineTo(p[0], p[1])
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1])
  ctx.closePath()
}

function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = []
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop()
    lo.push(q)
  }
  const up = []
  for (const q of p.reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop()
    up.push(q)
  }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

// 1-D value noise and its fractal sum, in roughly −1..1.
function vnoise(seed) {
  const r = rng(seed)
  const v = Array.from({ length: 512 }, () => r() * 2 - 1)
  return (x) => {
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    return lerp(v[i & 511], v[(i + 1) & 511], u)
  }
}
export function fbm(seed, oct = 4) {
  const ns = Array.from({ length: oct }, (_, k) => vnoise(seed + k * 101))
  const norm = 2 - 2 ** (1 - oct)
  return (x) => ns.reduce((s, n, k) => s + n(x * 2 ** k) / 2 ** k, 0) / norm
}

// A small stroke alphabet for vase inscriptions, in the Old Attic letters the painters used.
const GLYPHS = {
  Α: [
    [
      [0, 1.4],
      [0.5, 0],
      [1, 1.4],
    ],
    [
      [0.22, 0.85],
      [0.78, 0.85],
    ],
  ],
  Χ: [
    [
      [0, 0],
      [1, 1.4],
    ],
    [
      [1, 0],
      [0, 1.4],
    ],
  ],
  Ι: [
    [
      [0.5, 0],
      [0.5, 1.4],
    ],
  ],
  Λ: [
    [
      [0, 1.4],
      [0.5, 0],
      [1, 1.4],
    ],
  ],
  Ε: [
    [
      [1, 0],
      [0, 0],
      [0, 1.4],
      [1, 1.4],
    ],
    [
      [0, 0.7],
      [0.8, 0.7],
    ],
  ],
  Υ: [
    [
      [0, 0],
      [0.5, 0.7],
      [1, 0],
    ],
    [
      [0.5, 0.7],
      [0.5, 1.4],
    ],
  ],
  Σ: [
    [
      [1, 0],
      [0, 0],
      [0.55, 0.7],
      [0, 1.4],
      [1, 1.4],
    ],
  ],
  Κ: [
    [
      [0, 0],
      [0, 1.4],
    ],
    [
      [1, 0],
      [0, 0.7],
      [1, 1.4],
    ],
  ],
  Ρ: [
    [
      [0, 1.4],
      [0, 0],
      [0.75, 0.05],
      [0.95, 0.35],
      [0.75, 0.65],
      [0, 0.7],
    ],
  ],
  Τ: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0.5, 0],
      [0.5, 1.4],
    ],
  ],
  Η: [
    [
      [0, 0],
      [0, 1.4],
    ],
    [
      [1, 0],
      [1, 1.4],
    ],
    [
      [0, 0.7],
      [1, 0.7],
    ],
  ],
  Ν: [
    [
      [0, 1.4],
      [0, 0],
      [1, 1.4],
      [1, 0],
    ],
  ],
  Δ: [
    [
      [0, 1.4],
      [0.5, 0],
      [1, 1.4],
      [0, 1.4],
    ],
  ],
  Π: [
    [
      [0, 1.4],
      [0, 0],
      [1, 0],
      [1, 1.4],
    ],
  ],
  Ο: 'O',
}

export const BEASTS = {
  lion: { bl: 8.5, bh: 4.2, leg: 6.6, lw: 2.6, neck: 3.2, nA: 40, nw: 4.4, head: 2.5, snout: 2.4, sA: 18 },
  horse: { bl: 9.6, bh: 4.2, leg: 10, lw: 2.2, neck: 7.4, nA: 34, nw: 3.6, head: 1.9, snout: 4.2, sA: 55 },
  deer: { bl: 7.4, bh: 3.2, leg: 9.4, lw: 1.5, neck: 6, nA: 26, nw: 2.4, head: 1.6, snout: 2.8, sA: 40 },
  dog: { bl: 6.2, bh: 2.9, leg: 6.4, lw: 1.6, neck: 3.6, nA: 42, nw: 2.4, head: 1.8, snout: 2.4, sA: 20 },
  coyote: { bl: 6.4, bh: 2.7, leg: 7, lw: 1.5, neck: 3.8, nA: 46, nw: 2.4, head: 1.7, snout: 3, sA: 22 },
}

export function makeKit(ctx, seed = 1, extra = {}) {
  const R = rng(seed)
  const rand = (a = 0, b = 1) => a + R() * (b - a)
  const K = { ctx, R, rand, ...extra }
  const fill = (col) => {
    ctx.fillStyle = col
    ctx.fill()
  }
  const stops = (g, list) => {
    list.forEach((s, i) => (Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(list.length === 1 ? 0 : i / (list.length - 1), s)))
    return g
  }

  K.lin = (x0, y0, x1, y1, list) => stops(ctx.createLinearGradient(x0, y0, x1, y1), list)
  K.rad = (x, y, r, list, r0 = 0) => stops(ctx.createRadialGradient(x, y, r0, x, y, r), list)
  K.rect = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(x, y, w, h)
  }
  K.sky = (list, y0 = 0, y1 = FH, x0 = 0, x1 = FW) => K.rect(x0, y0, x1 - x0, y1 - y0, K.lin(0, y0, 0, y1, list))
  K.glow = (x, y, r, col, a = 1, mode = 'lighter') => {
    ctx.save()
    ctx.globalCompositeOperation = mode
    ctx.fillStyle = K.rad(x, y, r, [
      [0, rgba(col, a)],
      [0.3, rgba(col, a * 0.5)],
      [0.65, rgba(col, a * 0.14)],
      [1, rgba(col, 0)],
    ])
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.restore()
  }
  K.poly = (pts, col) => {
    ctx.beginPath()
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
    ctx.closePath()
    fill(col)
  }
  K.blob = (pts, col) => {
    ctx.beginPath()
    spline(ctx, pts, true)
    fill(col)
  }
  K.shape = (fn, col) => {
    ctx.beginPath()
    fn(ctx)
    fill(col)
  }
  K.disc = (x, y, r, col) => {
    ctx.beginPath()
    ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2)
    fill(col)
  }
  K.oval = (x, y, rx, ry, rot, col) => {
    ctx.beginPath()
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), (rot || 0) * D, 0, Math.PI * 2)
    fill(col)
  }
  K.line = (pts, col, w = 0.5, cap = 'round') => {
    ctx.beginPath()
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
    ctx.strokeStyle = col
    ctx.lineWidth = w
    ctx.lineCap = cap
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  K.curve = (pts, col, w = 0.5) => {
    ctx.beginPath()
    spline(ctx, pts)
    ctx.strokeStyle = col
    ctx.lineWidth = w
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  K.ring = (x, y, r, col, w = 0.5, a0 = 0, a1 = 360) => {
    ctx.beginPath()
    ctx.arc(x, y, r, a0 * D, a1 * D)
    ctx.strokeStyle = col
    ctx.lineWidth = w
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  // A band whose width follows wf(t) from start to end: limbs, tails, scarves, flames.
  K.ribbon = (pts, wf, col, per = 8) => {
    ribbon(ctx, sample(pts, per), typeof wf === 'number' ? () => wf : wf)
    fill(col)
  }
  K.limb = (A, B, wa, wb, col) => {
    ribbon(ctx, [A, B], (t) => lerp(wa, wb, t))
    fill(col)
    K.disc(A[0], A[1], wa / 2, col)
    K.disc(B[0], B[1], wb / 2, col)
  }

  K.fbm = fbm
  K.noise = (oct = 4) => fbm(Math.floor(R() * 1e6), oct)

  // A layer drawn apart and laid back on: for alpha, blending, blur and masks (destination-in, -out).
  K.layer = (fn, o = {}) => {
    const c = canvas(ctx.canvas.width, ctx.canvas.height)
    const l = c.getContext('2d')
    l.setTransform(ctx.getTransform())
    fn(makeKit(l, Math.floor(R() * 1e9), extra), l)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = o.alpha ?? 1
    ctx.globalCompositeOperation = o.mode ?? 'source-over'
    drawBlurred(ctx, c, ((o.blur ?? 0) * c.width) / FW)
    ctx.restore()
  }

  // Terrain: a silhouette from x0 to x1, filled to the bottom, returning its height at any x.
  K.ridge = (base, amp, col, o = {}) => {
    const f = fbm(o.seed ?? Math.floor(R() * 1e6), o.oct ?? 4)
    const fr = o.freq ?? 0.04
    const x0 = o.x0 ?? -2
    const x1 = o.x1 ?? FW + 2
    const y1 = o.y1 ?? FH + 2
    const peaks = o.peaks ?? []
    const at = (x) => {
      let n = f(x * fr + (o.off ?? 0))
      if (o.sharp) n = 1 - 2 * Math.abs(n)
      let y = base - amp * n - (o.slope ?? 0) * (x - 50)
      for (const [cx, h, w] of peaks) y -= h * Math.exp(-(((x - cx) / w) ** 2))
      return y
    }
    const pts = [[x0, y1]]
    for (let x = x0; x <= x1; x += 0.5) pts.push([x, at(x)])
    pts.push([x1, y1])
    K.poly(pts, col)
    return at
  }

  K.stars = (n, box = [0, 0, FW, FH * 0.6], col = '#ffffff', size = 0.35, o = {}) => {
    for (let i = 0; i < n; i++) {
      const x = box[0] + R() * box[2]
      const y = box[1] + Math.pow(R(), o.bias ?? 1) * box[3]
      if (o.keep && !o.keep(x, y)) continue
      const big = R() ** 3
      const r = size * (0.45 + big * 1.7)
      ctx.globalAlpha = 0.35 + R() * 0.65
      K.disc(x, y, r, col)
      if (big > 0.55) {
        K.line(
          [
            [x - r * 4, y],
            [x + r * 4, y],
          ],
          col,
          r * 0.5,
        )
        K.line(
          [
            [x, y - r * 4],
            [x, y + r * 4],
          ],
          col,
          r * 0.5,
        )
      }
    }
    ctx.globalAlpha = 1
  }

  // A full or crescent moon: phase 0 is full; a phase cuts away an offset disc.
  K.moon = (x, y, r, col, phase = 0, ang = -30) => {
    if (!phase) return K.disc(x, y, r, col)
    K.layer((L) => {
      L.disc(x, y, r, col)
      L.ctx.globalCompositeOperation = 'destination-out'
      L.disc(x + Math.cos(ang * D) * r * phase * 1.3, y + Math.sin(ang * D) * r * phase * 1.3, r * 1.02, '#000')
    })
  }

  // The canvas below a waterline, mirrored with a ripple; clip limits it to a pool.
  K.reflect = (yw, o = {}) => {
    const c = ctx.canvas
    const sy = c.height / FH
    const sx = c.width / FW
    const Y = Math.round(yw * sy)
    const snap = canvas(c.width, c.height)
    snap.getContext('2d').drawImage(c, 0, 0)
    ctx.save()
    if (o.clip) {
      ctx.beginPath()
      o.clip(ctx)
      ctx.clip()
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const end = Math.min(c.height, Y + Math.round((o.depth ?? FH) * sy))
    for (let r = Y; r < end; r++) {
      const src = 2 * Y - r - 1
      if (src < 0) break
      const t = (r - Y) / Math.max(1, end - Y)
      const dx = Math.sin(((r * (o.freq ?? 0.55)) / sy) * 2.2 + Math.sin(r * 0.13)) * (o.ripple ?? 0.5) * sx * (0.25 + t)
      ctx.globalAlpha = (o.alpha ?? 0.55) * (1 - t * (o.fade ?? 0.5))
      ctx.drawImage(snap, 0, src, c.width, 1, dx, r, c.width, 1)
    }
    ctx.restore()
  }

  // The joints of a figure without drawing it, for colour blocks and props.
  K.joints = (p) => {
    const s = p.s ?? 1
    const T = (p.torso ?? 0) * D
    const HA = (p.head ?? p.torso ?? 0) * D
    const dn = (A, a, l) => [A[0] + Math.sin(a * D) * l * s, A[1] + Math.cos(a * D) * l * s]
    const P = [p.x, p.y]
    const tl = (p.tl ?? 13) * s
    const sc = [P[0] + Math.sin(T) * tl, P[1] - Math.cos(T) * tl]
    const ux = Math.cos(T)
    const uy = Math.sin(T)
    const sw = (p.sw ?? 3.4) * s
    const hw = (p.hw ?? 2.4) * s
    const sl = [sc[0] - ux * sw, sc[1] - uy * sw]
    const sr = [sc[0] + ux * sw, sc[1] + uy * sw]
    const pl = [P[0] - ux * hw, P[1] - uy * hw]
    const pr = [P[0] + ux * hw, P[1] + uy * hw]
    const hd = [sc[0] + Math.sin(HA) * 4.4 * s, sc[1] - Math.cos(HA) * 4.4 * s]
    const aL = p.armL ?? [-8, -4]
    const aR = p.armR ?? [8, 4]
    const lL = p.legL ?? [-3, 0]
    const lR = p.legR ?? [3, 0]
    const el = dn(sl, aL[0], 7.4)
    const hl = dn(el, aL[1], 7)
    const er = dn(sr, aR[0], 7.4)
    const hr = dn(er, aR[1], 7)
    const kl = dn(pl, lL[0], 10)
    const fl = dn(kl, lL[1], 10)
    const kr = dn(pr, lR[0], 10)
    const fr = dn(kr, lR[1], 10)
    return { P, sc, sl, sr, pl, pr, hd, el, er, hl, hr, kl, kr, fl, fr, s, dir: p.dir ?? 1, ux, uy }
  }

  // A human figure from a skeleton. Limb angles are degrees from straight down, positive toward +x,
  // as [upper, lower]; torso and head lean from straight up. L and R mean the −x and +x sides.
  K.body = (p) => {
    const s = p.s ?? 1
    const dir = p.dir ?? 1
    const col = p.col ?? '#111111'
    const lc = p.limbs ?? col
    const J = K.joints(p)
    const { P, sc, sl, sr, pl, pr, hd, el, er, hl, hr, kl, kr, fl, fr, ux, uy } = J
    const wk = p.w ?? 1
    const back = p.back ?? []
    const arm = (side) => {
      const [S, E, Hh] = side === 'L' ? [sl, el, hl] : [sr, er, hr]
      const c = (side === 'L' ? p.colL : p.colR) ?? p.arms ?? lc
      if (p.outline) {
        const o = (p.ow ?? 0.5) * s
        K.limb(S, E, 2.7 * s * wk + o, 2 * s * wk + o, p.outline)
        K.limb(E, Hh, 2 * s * wk + o, 1.35 * s * wk + o, p.outline)
        K.disc(Hh[0], Hh[1], 1.15 * s * wk + o / 2, p.outline)
      }
      K.limb(S, E, 2.7 * s * wk, 2 * s * wk, c)
      K.limb(E, Hh, 2 * s * wk, 1.35 * s * wk, c)
      K.disc(Hh[0], Hh[1], 1.15 * s * wk, p.hands ?? c)
    }
    const leg = (side) => {
      const [Pp, Kk, F] = side === 'L' ? [pl, kl, fl] : [pr, kr, fr]
      const c = (side === 'L' ? p.legColL : p.legColR) ?? lc
      if (p.outline) {
        const o = (p.ow ?? 0.5) * s
        K.limb(Pp, Kk, 3.9 * s * wk + o, 2.6 * s * wk + o, p.outline)
        K.limb(Kk, F, 2.6 * s * wk + o, 1.5 * s * wk + o, p.outline)
      }
      K.limb(Pp, Kk, 3.9 * s * wk, 2.6 * s * wk, c)
      K.limb(Kk, F, 2.6 * s * wk, 1.5 * s * wk, c)
      if (p.feet !== false) K.oval(F[0] + dir * 1.1 * s, F[1] + 0.2 * s, 1.9 * s, 0.85 * s, 0, c)
    }
    if (back.includes('armL')) arm('L')
    if (back.includes('armR')) arm('R')
    if (!p.noLegs) {
      leg('L')
      leg('R')
    }
    ctx.beginPath()
    ctx.moveTo(sl[0], sl[1])
    ctx.lineTo(sr[0], sr[1])
    ctx.quadraticCurveTo(lerp(sr[0], pr[0], 0.5) + ux * 0.9 * s, lerp(sr[1], pr[1], 0.5) + uy * 0.9 * s, pr[0], pr[1])
    ctx.lineTo(pl[0], pl[1])
    ctx.quadraticCurveTo(lerp(sl[0], pl[0], 0.5) - ux * 0.9 * s, lerp(sl[1], pl[1], 0.5) - uy * 0.9 * s, sl[0], sl[1])
    fill(p.torsoCol ?? col)
    K.disc(sl[0], sl[1], 1.5 * s, p.torsoCol ?? col)
    K.disc(sr[0], sr[1], 1.5 * s, p.torsoCol ?? col)
    if (p.robe) {
      const r = p.robe
      const m = 0.9 * s
      const pts = [sl, sr, pl, pr]
      if (r.knees) pts.push(kl, kr)
      if (r.hem !== undefined) {
        const yb = r.y ?? Math.max(fl[1], fr[1]) - 0.6 * s
        const cx = P[0] + (r.sway ?? 0) * s
        pts.push([cx - r.hem * s, yb], [cx + r.hem * s, yb])
      }
      if (r.extra) pts.push(...r.extra)
      const h = hull(pts)
      const cx = h.reduce((a, q) => a + q[0], 0) / h.length
      const cy = h.reduce((a, q) => a + q[1], 0) / h.length
      const g = h.map(([x, y]) => {
        const l = Math.hypot(x - cx, y - cy) || 1
        return [x + ((x - cx) / l) * m, y + ((y - cy) / l) * m]
      })
      K.blob(g, r.col)
      J.robe = g
    }
    if (!back.includes('armL')) arm('L')
    if (!back.includes('armR')) arm('R')
    const nk = [lerp(sc[0], hd[0], 0.62), lerp(sc[1], hd[1], 0.62)]
    K.limb(sc, nk, 2.3 * s * wk, 1.9 * s * wk, p.neck ?? col)
    const hr2 = 2.5 * s * (p.headR ?? 1)
    K.disc(hd[0], hd[1], hr2, p.headCol ?? col)
    if (p.nose !== false) {
      const fx = hd[0] + dir * hr2 * 0.82
      const fy = hd[1] + 0.1 * s
      K.poly(
        [
          [fx, fy - 0.9 * s],
          [fx + dir * 1.15 * s, fy + 0.55 * s],
          [fx - dir * 0.2 * s, fy + 0.85 * s],
        ],
        p.headCol ?? col,
      )
    }
    if (p.beard)
      K.blob(
        [
          [hd[0] + dir * 1.8 * s, hd[1] + 0.8 * s],
          [hd[0] + dir * 1.4 * s, hd[1] + 3.4 * s],
          [hd[0] + dir * 0.2 * s, hd[1] + 4.2 * s * (p.beard === 'long' ? 1.4 : 1)],
          [hd[0] - dir * 0.9 * s, hd[1] + 1.6 * s],
        ],
        p.beardCol ?? p.headCol ?? col,
      )
    if (p.eye) {
      const ex = hd[0] + dir * hr2 * 0.45
      const ey = hd[1] - 0.35 * s
      K.line(
        [
          [ex - dir * 0.55 * s, ey - 0.1 * s],
          [ex + dir * 0.45 * s, ey],
        ],
        p.eye,
        0.32 * s,
      )
      K.disc(ex, ey, 0.24 * s, p.eye)
    }
    if (p.hair)
      K.blob(
        [
          [hd[0] - dir * 2.7 * s, hd[1] + (p.hairLen ?? 1) * 2.4 * s],
          [hd[0] - dir * 2.6 * s, hd[1] - 1.4 * s],
          [hd[0] - dir * 0.4 * s, hd[1] - 2.8 * s],
          [hd[0] + dir * 1.9 * s, hd[1] - 1.9 * s],
          [hd[0] + dir * 0.4 * s, hd[1] - 0.8 * s],
          [hd[0] - dir * 1.2 * s, hd[1] + 0.6 * s],
        ],
        p.hair,
      )
    return J
  }

  // A wing as a fan of feathers from a root; ang points the leading edge (from straight up).
  K.wing = (x, y, s, ang, col, o = {}) => {
    const n = o.n ?? 9
    const len = (o.len ?? 16) * s
    const spread = (o.spread ?? 70) * (o.flip ? -1 : 1)
    const w = (o.w ?? 2.6) * s
    for (let k = n - 1; k >= 0; k--) {
      const t = k / (n - 1)
      const a = (ang + spread * t) * D
      const l = len * (1 - (o.taper ?? 0.5) * Math.pow(t, 1.2))
      const b0 = [x + Math.sin(a) * l * 0.12, y - Math.cos(a) * l * 0.12]
      const tip = [x + Math.sin(a) * l, y - Math.cos(a) * l]
      ribbon(ctx, sample([b0, tip], 6), (u) => w * Math.pow(Math.sin(Math.PI * Math.min(0.96, u * 0.85 + 0.12)), 0.7))
      fill(o.cols ? o.cols[k % o.cols.length] : col)
      if (o.edge) {
        ctx.strokeStyle = o.edge
        ctx.lineWidth = 0.25 * s
        ctx.stroke()
      }
    }
    const a = (ang + spread * 0.35) * D
    K.oval(x + Math.sin(a) * len * 0.22, y - Math.cos(a) * len * 0.22, len * 0.28, w * 1.25, ang + spread * 0.35 - 90, o.covert ?? col)
  }

  // A four-legged animal standing on y, facing dir; run spreads the legs, tilt rears it up (degrees).
  K.beast = (p) => {
    const C = { ...BEASTS[p.kind ?? 'dog'], ...(p.cfg ?? {}) }
    const s = p.s ?? 1
    const d = p.dir ?? 1
    const col = p.col ?? '#111111'
    const run = p.run ?? 0
    const tilt = (p.tilt ?? 0) * D
    const bl = C.bl * s
    const bh = C.bh * s
    const leg = C.leg * s
    const hip = [p.x - d * bl * 0.62, p.y - leg - bh * 0.15]
    const loc = (u, v) => {
      const du = u + bl * 0.62
      const ru = du * Math.cos(tilt) - v * Math.sin(tilt)
      const rv = du * Math.sin(tilt) + v * Math.cos(tilt)
      return [hip[0] + d * ru, hip[1] - rv]
    }
    const by = -bh * 0.35
    const torso = [
      [-bl * 1.02, by + bh * 0.45],
      [-bl * 0.55, by + bh * 0.62],
      [bl * 0.25, by + bh * (C.hump ?? 0.55)],
      [bl * 0.85, by + bh * 0.72],
      [bl * 1.04, by + bh * 0.05],
      [bl * 0.78, by - bh * 0.55],
      [bl * 0.15, by - bh * (C.belly ?? 0.4)],
      [-bl * 0.62, by - bh * 0.55],
      [-bl * 1.04, by - bh * 0.1],
    ].map(([u, v]) => loc(u, v))
    const legOf = (A, a1, a2, l1, l2, w) => {
      const B = [A[0] + Math.sin(a1 * D) * l1, A[1] + Math.cos(a1 * D) * l1]
      const F = [B[0] + Math.sin(a2 * D) * l2, B[1] + Math.cos(a2 * D) * l2]
      K.limb(A, B, w, w * 0.62, col)
      K.limb(B, F, w * 0.62, w * 0.45, col)
      if (p.hoof !== false) K.oval(F[0] + d * w * 0.25, F[1], w * 0.42, w * 0.26, 0, p.hoofCol ?? col)
      return F
    }
    const lw = C.lw * s
    const fsh = loc(bl * 0.72, by)
    const hh = loc(-bl * 0.72, by + bh * 0.1)
    const fa = p.front ?? [
      [d * (4 + run * 38), d * (2 - run * 10)],
      [d * (-6 - run * 30), d * (4 + run * 60)],
    ]
    const ha = p.hind ?? [
      [d * (-14 - run * 40), d * (8 + run * 20)],
      [d * (14 + run * 30), d * (-6 - run * 10)],
    ]
    const tiltDeg = (p.tilt ?? 0) * d
    legOf(fsh, fa[1][0] - tiltDeg, fa[1][1] - tiltDeg, leg * 0.55, leg * 0.55, lw * 0.95)
    legOf(hh, ha[1][0], ha[1][1], leg * 0.62, leg * 0.58, lw * 1.05)
    // tail
    const tb = loc(-bl * 1.0, by + bh * 0.35)
    const ta = (C.tailA ?? -35) * D
    const tl = (C.tail ?? 7) * s
    const tm = [tb[0] - d * Math.cos(ta) * tl * 0.5, tb[1] - Math.sin(ta) * tl * 0.5 + tl * 0.2]
    const tt = [tb[0] - d * Math.cos(ta) * tl, tb[1] - Math.sin(ta) * tl + (p.kind === 'lion' ? tl * 0.6 : tl * 0.3)]
    const tw = p.kind === 'coyote' || p.kind === 'deer' ? 1.6 * s : p.kind === 'horse' ? 2.2 * s : 0.7 * s
    K.ribbon([tb, tm, tt], (t) => (p.kind === 'coyote' ? tw * Math.sin(Math.PI * (0.25 + t * 0.7)) * 1.4 : p.kind === 'horse' ? tw * (1 - t * 0.5) : tw * (1 - t * 0.5)), col)
    if (p.kind === 'lion') K.oval(tt[0], tt[1], 1.1 * s, 0.8 * s, 0, p.mane ?? col)
    K.blob(torso, col)
    legOf(fsh, fa[0][0] - tiltDeg, fa[0][1] - tiltDeg, leg * 0.55, leg * 0.55, lw)
    legOf(hh, ha[0][0], ha[0][1], leg * 0.62, leg * 0.58, lw * 1.1)
    const J = { hip, shoulder: loc(bl * 0.75, by + bh * 0.62), fsh }
    if (p.noHead) return J
    const nb = loc(bl * 0.82, by + bh * 0.3)
    const nAng = (C.nA + (p.neck ?? 0) - (p.tilt ?? 0)) * D
    const ne = [nb[0] + d * Math.sin(nAng) * C.neck * s, nb[1] - Math.cos(nAng) * C.neck * s]
    if (p.kind === 'lion')
      K.blob(
        [
          [nb[0] - d * 3.4 * s, nb[1] + 1.5 * s],
          [nb[0] - d * 2.8 * s, nb[1] - 3 * s],
          [ne[0] - d * 1.4 * s, ne[1] - 3.6 * s],
          [ne[0] + d * 1.6 * s, ne[1] - 2.6 * s],
          [ne[0] + d * 2.2 * s, ne[1] + 1.6 * s],
          [nb[0] + d * 2.4 * s, nb[1] + 3.6 * s],
          [nb[0] - d * 0.6 * s, nb[1] + 3.2 * s],
        ],
        p.mane ?? col,
      )
    K.limb(nb, ne, C.nw * s, C.nw * 0.62 * s, col)
    if (p.kind === 'horse')
      K.ribbon(
        [
          [nb[0] - d * 0.6 * s, nb[1] - 1.4 * s],
          [lerp(nb[0], ne[0], 0.5) - d * 1.1 * s, lerp(nb[1], ne[1], 0.5) - 1.2 * s],
          [ne[0] - d * 0.9 * s, ne[1] - 1.2 * s],
        ],
        (t) => 1.5 * s * (1 - t * 0.4),
        p.mane ?? col,
      )
    const hr = C.head * s
    const hc = [ne[0] + d * hr * 0.2, ne[1]]
    K.disc(hc[0], hc[1], hr, col)
    const sa = (C.sA + (p.headDown ?? 0) - (p.tilt ?? 0)) * D
    const sn = [hc[0] + d * Math.cos(sa) * C.snout * s, hc[1] + Math.sin(sa) * C.snout * s]
    K.limb(hc, sn, hr * 1.6, hr * (p.kind === 'horse' ? 0.95 : 0.7), col)
    const ear = (dx, h, w) =>
      K.poly(
        [
          [hc[0] + d * (dx - w) * s, hc[1] - hr * 0.6],
          [hc[0] + d * (dx - w * 0.6) * s, hc[1] - hr * 0.6 - h * s],
          [hc[0] + d * (dx + w) * s, hc[1] - hr * 0.7],
        ],
        col,
      )
    if (p.kind === 'coyote' || p.kind === 'dog') ear(-0.4, p.kind === 'coyote' ? 2.6 : 1.8, 0.7)
    if (p.kind === 'horse' || p.kind === 'deer') ear(-0.6, 1.6, 0.45)
    if (p.kind === 'deer' && p.antlers !== false) {
      const a0 = [hc[0] - d * 0.3 * s, hc[1] - hr * 0.8]
      const tine = (A, ang, l, k) => {
        const B = [A[0] + Math.sin(ang * D) * l * s, A[1] - Math.cos(ang * D) * l * s]
        K.line([A, B], p.antlerCol ?? col, 0.45 * s)
        if (k > 0) {
          tine(B, ang - 26, l * 0.7, k - 1)
          tine([lerp(A[0], B[0], 0.5), lerp(A[1], B[1], 0.5)], ang + 34, l * 0.55, k - 1)
        }
      }
      tine(a0, -d * 18, 3.4, 2)
      tine(a0, -d * 42, 3, 2)
    }
    return { ...J, head: hc, snout: sn, neckEnd: ne }
  }

  K.gull = (x, y, s, col, w = 0.35) =>
    K.curve(
      [
        [x - 2.2 * s, y + 0.2 * s],
        [x - 1.1 * s, y - 0.6 * s],
        [x, y + 0.2 * s],
        [x + 1.1 * s, y - 0.6 * s],
        [x + 2.2 * s, y + 0.2 * s],
      ],
      col,
      w * s,
    )

  K.bird = (x, y, s, col, dir = 1, flap = 0.6) => {
    K.oval(x, y, 1.8 * s, 0.75 * s, 0, col)
    K.disc(x + dir * 1.9 * s, y - 0.4 * s, 0.6 * s, col)
    K.poly(
      [
        [x + dir * 2.4 * s, y - 0.5 * s],
        [x + dir * 3.2 * s, y - 0.2 * s],
        [x + dir * 2.4 * s, y - 0.1 * s],
      ],
      col,
    )
    K.poly(
      [
        [x - dir * 1.5 * s, y],
        [x - dir * 3.2 * s, y - 0.8 * s],
        [x - dir * 3 * s, y + 0.6 * s],
      ],
      col,
    )
    K.blob(
      [
        [x - dir * 0.8 * s, y - 0.2 * s],
        [x - dir * 1.8 * s, y - (2 + flap * 3) * s],
        [x + dir * 0.6 * s, y - (1.6 + flap * 2.8) * s],
        [x + dir * 0.7 * s, y - 0.3 * s],
      ],
      col,
    )
  }

  K.dolphin = (x, y, s, ang, col, flip = false) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang * D)
    ctx.scale(s * (flip ? -1 : 1), s)
    K.blob(
      [
        [-9, 0.2],
        [-6, -1.6],
        [-1, -2.6],
        [4, -2.4],
        [7.4, -1.2],
        [9.6, -0.4],
        [7.4, 0.5],
        [4, 1.6],
        [-2, 1.7],
        [-7, 0.8],
      ],
      col,
    )
    K.poly(
      [
        [-1, -2.4],
        [1.4, -5.2],
        [2.6, -2.4],
      ],
      col,
    )
    K.poly(
      [
        [-8.6, 0.2],
        [-11.4, -2.6],
        [-10.2, 0.3],
        [-11.6, 3],
        [-8.4, 0.7],
      ],
      col,
    )
    K.poly(
      [
        [1.6, 1.4],
        [0, 3.6],
        [3.4, 1.4],
      ],
      col,
    )
    ctx.restore()
  }

  K.serpent = (pts, w, col, o = {}) => {
    const P = sample(pts, 10)
    ribbon(ctx, P, (t) => w * (o.even ? 1 : lerp(1, 0.18, Math.pow(t, 1.4))))
    fill(col)
    const [hx, hy] = P[0]
    const [nx, ny] = P[1]
    const a = Math.atan2(hy - ny, hx - nx)
    K.oval(hx + Math.cos(a) * w * 0.35, hy + Math.sin(a) * w * 0.35, w * 0.95, w * 0.62, (a * 180) / Math.PI, o.head ?? col)
  }

  // A branching tree; leaf(x, y, depth) is called at the tips.
  K.tree = (x, y, len, ang, depth, col, o = {}) => {
    const r = rng(o.seed ?? Math.floor(R() * 1e6))
    const spread = o.spread ?? 26
    const decay = o.decay ?? 0.74
    const go = (x0, y0, l, a, k, w) => {
      const bend = (r() - 0.5) * (o.wiggle ?? 14)
      const x1 = x0 + Math.sin((a + bend) * D) * l
      const y1 = y0 - Math.cos((a + bend) * D) * l
      K.limb([x0, y0], [x1, y1], w, w * 0.68, col)
      if (k <= 0) {
        if (o.leaf) o.leaf(x1, y1, k, r)
        return
      }
      const n = o.forks ?? 2
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5
        go(x1, y1, l * (decay + (r() - 0.5) * 0.16), a + bend + t * spread * 2 + (r() - 0.5) * 12, k - 1, w * 0.68)
      }
      if (o.leaf && k <= (o.leafFrom ?? 1)) o.leaf(x1, y1, k, r)
    }
    go(x, y, len, ang, depth, o.w ?? len * 0.22)
  }

  // An ink brush: pressure rises, holds and lifts; dry splits it into bristles that run out.
  K.brush = (pts, w, col, o = {}) => {
    const P = sample(pts, o.per ?? 12)
    const prof = o.prof ?? ((t) => Math.pow(Math.min(1, t / 0.1), 0.55) * Math.pow(1 - t * 0.92, 0.45))
    if (!o.dry) {
      ribbon(ctx, P, (t) => w * prof(t))
      fill(col)
      return
    }
    const n = P.length
    const N = P.map((q, i) => {
      const a = P[Math.max(0, i - 1)]
      const b = P[Math.min(n - 1, i + 1)]
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
    })
    const nb = o.bristles ?? 7
    for (let k = 0; k < nb; k++) {
      const off = (k + 0.5) / nb - 0.5
      const lift = 1 - o.dry * (0.25 + R() * 0.75)
      let seg = []
      const flush = () => {
        if (seg.length > 1) {
          ribbon(
            ctx,
            seg.map((q) => q.p),
            (t) => seg[Math.round(t * (seg.length - 1))].w,
          )
          fill(col)
        }
        seg = []
      }
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1)
        const ww = w * prof(t)
        const gap = t > lift && R() < 0.35
        if (gap) {
          flush()
          continue
        }
        seg.push({ p: [P[i][0] + N[i][0] * off * ww, P[i][1] + N[i][1] * off * ww], w: (ww / nb) * 1.7 })
      }
      flush()
    }
  }

  // An inscription in the stroke alphabet, along an angle.
  K.inscribe = (str, x, y, h, col, o = {}) => {
    const w = h / 1.4
    const gap = w * (o.gap ?? 0.55)
    const a = (o.ang ?? 0) * D
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.strokeStyle = col
    ctx.lineWidth = o.w ?? h * 0.12
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    let cx = 0
    for (const ch of str) {
      const g = GLYPHS[ch]
      if (g === 'O') {
        ctx.beginPath()
        ctx.ellipse(cx + w * 0.5, h * 0.5, w * 0.48, h * 0.48, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (g) {
        for (const stroke of g) {
          ctx.beginPath()
          stroke.forEach(([u, v], i) => (i ? ctx.lineTo(cx + u * w, v * w) : ctx.moveTo(cx + u * w, v * w)))
          ctx.stroke()
        }
      }
      cx += w + gap
    }
    ctx.restore()
  }

  return K
}
