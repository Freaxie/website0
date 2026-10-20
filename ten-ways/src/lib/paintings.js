// The seven media. A scene is drawn once through the kit at a working size and then remade: reduced
// to a palette and dithered, cut into tesserae, leaded into glass, washed in ink on paper, fired on
// clay, cut in wood, or screened in dots of two inks.
import { rng, clamp, lerp } from './geom.js'
import { makeKit, canvas, drawBlurred, FW, FH, hex } from './paint-kit.js'

const W = 720
const H = 900

function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function noise(x, y, s = 0) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  return lerp(lerp(hash(xi, yi, s), hash(xi + 1, yi, s), u), lerp(hash(xi, yi + 1, s), hash(xi + 1, yi + 1, s), u), v)
}
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// The media work a row at a time and hand the thread back every few milliseconds, so a painting
// being made never stalls the scroll.
let budget = 0
async function breathe() {
  if (performance.now() - budget < 10) return
  await new Promise((r) => setTimeout(r, 0))
  budget = performance.now()
}

function source(sc, w, h, extra = {}, compose) {
  const c = canvas(w, h)
  const ctx = c.getContext('2d')
  ctx.scale(w / FW, h / FH)
  const K = makeKit(ctx, sc.seed ?? 1, extra)
  if (compose) compose(ctx, K)
  else sc.draw(ctx, K)
  return c
}
const pixelsOf = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data

// Colour distance weighted roughly as the eye weighs it.
const dist3 = (r, g, b, c) => {
  const dr = r - c[0]
  const dg = g - c[1]
  const db = b - c[2]
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db
}
function nearest(C, r, g, b) {
  let bi = 0
  let bd = Infinity
  for (let c = 0; c < C.length; c++) {
    const d = dist3(r, g, b, C[c])
    if (d < bd) {
      bd = d
      bi = c
    }
  }
  return bi
}

// k-means++ in RGB over a sample: the seeding favours rare colours, so a small fire keeps its orange.
function kmeans(px, k, seed = 1, iters = 10) {
  const n = px.length / 3
  const R = rng(seed)
  const step = Math.max(1, Math.floor(n / 7000))
  const idx = []
  for (let i = 0; i < n; i += step) idx.push(i)
  const m = idx.length
  const at = (i) => [px[i * 3], px[i * 3 + 1], px[i * 3 + 2]]
  const C = [at(idx[Math.floor(R() * m)])]
  const best = new Float64Array(m).fill(Infinity)
  while (C.length < k) {
    const c = C[C.length - 1]
    let sum = 0
    for (let j = 0; j < m; j++) {
      const i = idx[j]
      const d = dist3(px[i * 3], px[i * 3 + 1], px[i * 3 + 2], c)
      if (d < best[j]) best[j] = d
      sum += best[j]
    }
    if (sum === 0) break
    let r = R() * sum
    let j = 0
    while (j < m - 1 && (r -= best[j]) > 0) j++
    C.push(at(idx[j]))
  }
  for (let it = 0; it < iters; it++) {
    const acc = C.map(() => [0, 0, 0, 0])
    for (const i of idx) {
      const a = acc[nearest(C, px[i * 3], px[i * 3 + 1], px[i * 3 + 2])]
      a[0] += px[i * 3]
      a[1] += px[i * 3 + 1]
      a[2] += px[i * 3 + 2]
      a[3]++
    }
    acc.forEach((a, c) => {
      if (a[3]) C[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]
    })
  }
  return C
}

function rgbOf(d, n) {
  const px = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    px[i * 3] = d[i * 4]
    px[i * 3 + 1] = d[i * 4 + 1]
    px[i * 3 + 2] = d[i * 4 + 2]
  }
  return px
}

// A separable box blur over an array of ch channels, run twice for a softer kernel.
async function boxBlur(a, w, h, r, ch = 1) {
  let src = a
  for (let pass = 0; pass < 2; pass++) {
    const tmp = new Float32Array(src.length)
    const dst = new Float32Array(src.length)
    for (let y = 0; y < h; y++, await breathe())
      for (let c = 0; c < ch; c++) {
        let s = 0
        for (let x = -r; x <= r; x++) s += src[(y * w + clamp(x, 0, w - 1)) * ch + c]
        for (let x = 0; x < w; x++) {
          tmp[(y * w + x) * ch + c] = s / (2 * r + 1)
          s += src[(y * w + Math.min(w - 1, x + r + 1)) * ch + c] - src[(y * w + Math.max(0, x - r)) * ch + c]
        }
      }
    for (let x = 0; x < w; x++, x % 64 || (await breathe()))
      for (let c = 0; c < ch; c++) {
        let s = 0
        for (let y = -r; y <= r; y++) s += tmp[(clamp(y, 0, h - 1) * w + x) * ch + c]
        for (let y = 0; y < h; y++) {
          dst[(y * w + x) * ch + c] = s / (2 * r + 1)
          s += tmp[(Math.min(h - 1, y + r + 1) * w + x) * ch + c] - tmp[(Math.max(0, y - r) * w + x) * ch + c]
        }
      }
    src = dst
  }
  return src
}

function luminance(d, n) {
  const L = new Float32Array(n)
  for (let i = 0; i < n; i++) L[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
  return L
}

async function sobel(L, w, h) {
  const E = new Float32Array(w * h)
  for (let y = 1; y < h - 1; y++, await breathe())
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = L[i - w + 1] + 2 * L[i + 1] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - 1] - L[i + w - 1]
      const gy = L[i + w - 1] + 2 * L[i + w] + L[i + w + 1] - L[i - w - 1] - 2 * L[i - w] - L[i - w + 1]
      E[i] = Math.hypot(gx, gy)
    }
  return E
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

// Pixels: the drawing averaged down to 128 × 160, reduced to its own palette, ordered-dithered.
async function pixel(sc, out) {
  const w = sc.res ?? 128
  const h = Math.round(w * 1.25)
  const f = 4
  const src = pixelsOf(source(sc, w * f, h * f))
  const px = new Float32Array(w * h * 3)
  for (let y = 0; y < h; y++, await breathe())
    for (let x = 0; x < w; x++) {
      let r = 0
      let g = 0
      let b = 0
      for (let j = 0; j < f; j++)
        for (let i = 0; i < f; i++) {
          const o = ((y * f + j) * w * f + x * f + i) * 4
          r += src[o]
          g += src[o + 1]
          b += src[o + 2]
        }
      const o = (y * w + x) * 3
      px[o] = r / (f * f)
      px[o + 1] = g / (f * f)
      px[o + 2] = b / (f * f)
    }
  const pal = kmeans(px, sc.colors ?? 18, sc.seed)
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(w, h)
  const d = img.data
  const spread = sc.dither ?? 13
  for (let y = 0; y < h; y++, await breathe())
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const t = ((BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5) * spread
      const c = pal[nearest(pal, px[i * 3] + t, px[i * 3 + 1] + t, px[i * 3 + 2] + t)]
      d[i * 4] = c[0]
      d[i * 4 + 1] = c[1]
      d[i * 4 + 2] = c[2]
      d[i * 4 + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
}

// Tesserae: a staggered course of stones, split where the picture is busy, each stone one of a dozen
// colours with its own small tilt, set in grout. Gold stones catch the light unevenly, as they do.
async function mosaic(sc, out) {
  const src = pixelsOf(source(sc, W, H))
  const R = rng((sc.seed ?? 1) + 7)
  const base = W / (sc.tiles ?? 58)
  const stat = (x0, y0, s) => {
    let r = 0
    let g = 0
    let b = 0
    let q = 0
    let n = 0
    const st = Math.max(1, Math.floor(s / 5))
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y0 + s); y += st)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x0 + s); x += st) {
        const o = (y * W + x) * 4
        r += src[o]
        g += src[o + 1]
        b += src[o + 2]
        q += src[o] ** 2 + src[o + 1] ** 2 + src[o + 2] ** 2
        n++
      }
    if (!n) return null
    const m = [r / n, g / n, b / n]
    return { m, v: q / n - (m[0] ** 2 + m[1] ** 2 + m[2] ** 2) }
  }
  const tiles = []
  for (let row = 0; row * base < H; row++) {
    const y0 = row * base
    const off = (row % 2) * base * 0.5
    for (let x0 = -off; x0 < W; x0 += base) {
      const st = stat(x0, y0, base)
      if (!st) continue
      if (st.v > (sc.split ?? 700)) {
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ]) {
          const s2 = stat(x0 + (dx * base) / 2, y0 + (dy * base) / 2, base / 2)
          if (s2) tiles.push({ x: x0 + (dx * base) / 2, y: y0 + (dy * base) / 2, s: base / 2, c: s2.m })
        }
      } else tiles.push({ x: x0, y: y0, s: base, c: st.m })
    }
  }
  const px = new Float32Array(tiles.length * 3)
  tiles.forEach((t, i) => px.set(t.c, i * 3))
  const pal = kmeans(px, sc.colors ?? 14, sc.seed)
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  ctx.fillStyle = sc.grout ?? '#3a342c'
  ctx.fillRect(0, 0, W, H)
  const isGold = (p) => sc.gold && p[0] > 150 && p[1] > 100 && p[2] < 125 && p[0] - p[2] > 80
  let laid = 0
  for (const t of tiles) {
    if (++laid % 300 === 0) await breathe()
    const p = pal[nearest(pal, ...t.c)]
    const g = 1 + (R() - 0.5) * 0.13
    const gap = t.s * 0.07 + 0.7
    const j = () => (R() - 0.5) * t.s * 0.16
    const q = [
      [t.x + gap + j(), t.y + gap + j()],
      [t.x + t.s - gap + j(), t.y + gap + j()],
      [t.x + t.s - gap + j(), t.y + t.s - gap + j()],
      [t.x + gap + j(), t.y + t.s - gap + j()],
    ]
    let c = p.map((v) => clamp(v * g, 0, 255))
    if (isGold(p)) {
      const k = 0.72 + R() * 0.62
      c = [clamp(p[0] * k + 20, 0, 255), clamp(p[1] * k + 8, 0, 255), clamp(p[2] * k * 0.8, 0, 255)]
    }
    ctx.beginPath()
    q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.fillStyle = `rgb(${c.map(Math.round).join(',')})`
    ctx.fill()
    // a little bevel: the lit upper-left of each stone
    ctx.beginPath()
    ctx.moveTo(q[0][0], q[0][1])
    ctx.lineTo(q[1][0], q[1][1])
    ctx.lineTo(lerp(q[1][0], q[3][0], 0.18), lerp(q[1][1], q[3][1], 0.18) + t.s * 0.12)
    ctx.lineTo(lerp(q[3][0], q[1][0], 0.18) + t.s * 0.12, lerp(q[3][1], q[1][1], 0.18))
    ctx.lineTo(q[3][0], q[3][1])
    ctx.closePath()
    ctx.fillStyle = isGold(p) && R() < 0.35 ? 'rgba(255,246,210,0.35)' : 'rgba(255,255,255,0.09)'
    ctx.fill()
  }
  grain(ctx, 0.05, sc.seed)
}

// Glass: the drawing reduced to a dozen colours, the colour fields cut again by a Voronoi grid, every
// cut leaded; light pools in the middle of each piece, and the fine lines come back as painted
// grisaille. A lancet arch, two saddle bars, and the wall outside left clear.
async function glass(sc, out) {
  const w = 360
  const h = 450
  const n = w * h
  const sd = pixelsOf(source(sc, w, h))
  const bl = await boxBlur(rgbOf(sd, n), w, h, 2, 3)
  const pal = kmeans(bl, sc.colors ?? 12, sc.seed)
  let q = new Uint8Array(n)
  for (let i = 0; i < n; i++) q[i] = nearest(pal, bl[i * 3], bl[i * 3 + 1], bl[i * 3 + 2])
  for (let pass = 0; pass < (sc.smooth ?? 2); pass++) {
    const q2 = q.slice()
    const cnt = new Uint8Array(pal.length)
    for (let y = 1; y < h - 1; y++, await breathe())
      for (let x = 1; x < w - 1; x++) {
        cnt.fill(0)
        let bi = q[y * w + x]
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) cnt[q[(y + j) * w + x + i]]++
        for (let c = 0; c < pal.length; c++) if (cnt[c] > cnt[bi]) bi = c
        q2[y * w + x] = bi
      }
    q = q2
  }
  const R = rng((sc.seed ?? 1) + 3)
  const sp = w / (sc.cells ?? 13)
  const gw = Math.ceil(w / sp) + 1
  const gh = Math.ceil(h / sp) + 1
  const seeds = []
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) seeds.push([(gx + 0.5 + (R() - 0.5) * 0.85) * sp, (gy + 0.5 + (R() - 0.5) * 0.85) * sp])
  const lab = new Int32Array(n)
  for (let y = 0; y < h; y++, await breathe())
    for (let x = 0; x < w; x++) {
      const cx = Math.floor(x / sp)
      const cy = Math.floor(y / sp)
      let bi = 0
      let bd = Infinity
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const gx = cx + i
          const gy = cy + j
          if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue
          const s = seeds[gy * gw + gx]
          const d = (s[0] - x) ** 2 + (s[1] - y) ** 2
          if (d < bd) {
            bd = d
            bi = gy * gw + gx
          }
        }
      lab[y * w + x] = bi * 32 + q[y * w + x]
    }
  const sums = new Map()
  for (let i = 0; i < n; i++) {
    let s = sums.get(lab[i])
    if (!s) sums.set(lab[i], (s = [0, 0, 0, 0]))
    s[0] += bl[i * 3]
    s[1] += bl[i * 3 + 1]
    s[2] += bl[i * 3 + 2]
    s[3]++
  }
  const colour = new Map()
  const sat = sc.saturate ?? 1.35
  for (const [k, s] of sums) {
    const m = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]
    const l = 0.3 * m[0] + 0.59 * m[1] + 0.11 * m[2]
    colour.set(
      k,
      m.map((v) => clamp((l + (v - l) * sat) * 1.06, 0, 255)),
    )
  }
  const dist = new Float32Array(n).fill(1e6)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x < w - 1 && lab[i] !== lab[i + 1]) dist[i] = dist[i + 1] = 0
      if (y < h - 1 && lab[i] !== lab[i + w]) dist[i] = dist[i + w] = 0
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1)
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 1)
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - w - 1] + 1.414)
      if (x < w - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - w + 1] + 1.414)
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1)
      if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 1)
      if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + 1.414)
      if (x > 0 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + 1.414)
    }
  const E = await sobel(luminance(sd, n), w, h)
  // the window: a pointed arch on straight jambs
  const L0 = 34
  const R0 = W - 34
  const ww = R0 - L0
  const ra = ww * 0.62
  const ys = 20 + Math.sqrt(ra * ra - (ra - ww / 2) ** 2)
  const yb = H - 20
  const inside = (x, y) => (y >= ys ? Math.min(x - L0, R0 - x, yb - y) : Math.min(ra - Math.hypot(x - (L0 + ra), y - ys), ra - Math.hypot(x - (R0 - ra), y - ys), yb - y))
  const bars = [ys + (yb - ys) * 0.28, ys + (yb - ys) * 0.64]
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const k = w / W
  const leadW = sc.lead ?? 3.2
  const frame = 13
  for (let Y = 0; Y < H; Y++, await breathe())
    for (let X = 0; X < W; X++) {
      const o = (Y * W + X) * 4
      const win = inside(X + 0.5, Y + 0.5)
      if (win < -0.5) {
        d[o + 3] = 0
        continue
      }
      const fx = clamp((X + 0.5) * k - 0.5, 0, w - 1.001)
      const fy = clamp((Y + 0.5) * k - 0.5, 0, h - 1.001)
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const tx = fx - x0
      const ty = fy - y0
      const i0 = y0 * w + x0
      const dd = lerp(lerp(dist[i0], dist[i0 + 1], tx), lerp(dist[i0 + w], dist[i0 + w + 1], tx), ty) / k
      const li = Math.round(fy) * w + Math.round(fx)
      const c = colour.get(lab[li])
      const e = lerp(lerp(E[i0], E[i0 + 1], tx), lerp(E[i0 + w], E[i0 + w + 1], tx), ty)
      const glow = 0.7 + 0.3 * smooth(0, 16, dd)
      const streak = 0.93 + 0.12 * noise(X * 0.11, Y * 0.012, 3) + 0.05 * noise(X * 0.03, Y * 0.03, 9)
      const paint = 1 - clamp((e - 0.7) * 1.2) * 0.5
      let r = c[0] * glow * streak * paint
      let g = c[1] * glow * streak * paint
      let b = c[2] * glow * streak * paint
      let lead = clamp(leadW - dd + 0.5)
      for (const by of bars) lead = Math.max(lead, clamp(4.5 - Math.abs(Y - by) + 0.5))
      if (win < frame) lead = 1
      if (lead > 0) {
        const edge = win < frame ? clamp(win / frame) : clamp(dd / leadW)
        const lv = 24 + 34 * Math.sin(Math.PI * clamp(1 - edge * 0.9)) * 0.6
        r = lerp(r, lv, lead)
        g = lerp(g, lv * 0.95, lead)
        b = lerp(b, lv * 0.9, lead)
      }
      d[o] = r
      d[o + 1] = g
      d[o + 2] = b
      d[o + 3] = 255 * clamp(win + 0.5)
    }
  ctx.putImageData(img, 0, 0)
}

// Ink: the drawing laid on warm paper, sharp where the brush pressed and bled where it was wet, with
// the granulation of real ink, and a red seal.
async function ink(sc, out) {
  const src = source(sc, W, H)
  const bleed = canvas(W, H)
  drawBlurred(bleed.getContext('2d'), src, sc.bleed ?? 3)
  const a = pixelsOf(src)
  const b = pixelsOf(bleed)
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const paper = hex(sc.paper ?? '#efe6d2')
  for (let y = 0; y < H; y++, await breathe())
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4
      const fib = 1 - 0.04 * noise(x * 0.5, y * 0.04, 1) - 0.035 * noise(x * 0.04, y * 0.5, 2) - 0.02 * hash(x, y, 4)
      const vig = 1 - 0.1 * (((x / W - 0.5) * 2) ** 2 + ((y / H - 0.5) * 2) ** 2) * 0.5
      const as = a[o + 3] / 255
      const ab = (b[o + 3] / 255) * 0.5
      const gr = 0.8 + 0.32 * noise(x * 0.3, y * 0.3, 5)
      const cov = clamp(1 - (1 - as * gr) * (1 - ab))
      const src2 = as > 0.02 ? a : b
      for (let c = 0; c < 3; c++) {
        const base = paper[c] * fib * vig
        d[o + c] = base * (1 - cov * (1 - src2[o + c] / 255))
      }
      d[o + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
  if (sc.seal) seal(ctx, ...sc.seal, sc.seed)
  grain(ctx, 0.04, sc.seed)
}

function seal(ctx, x, y, s, seed) {
  const R = rng(seed + 11)
  const k = W / FW
  const X = x * k
  const Y = y * k
  const S = s * k
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = '#b5302a'
  ctx.beginPath()
  ctx.roundRect(X, Y, S, S * 1.2, S * 0.08)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(239,230,210,0.92)'
  ctx.lineWidth = S * 0.075
  ctx.lineCap = 'square'
  ctx.strokeRect(X + S * 0.12, Y + S * 0.12, S * 0.76, S * 0.96)
  // two columns of seal-script strokes, abstract rather than any real character
  for (let col = 0; col < 2; col++)
    for (let i = 0; i < 4; i++) {
      const cx = X + S * (0.26 + col * 0.36)
      const cy = Y + S * (0.27 + i * 0.22)
      ctx.beginPath()
      if (R() < 0.5) {
        ctx.moveTo(cx - S * 0.1, cy)
        ctx.lineTo(cx + S * 0.1, cy)
      } else {
        ctx.moveTo(cx, cy - S * 0.07)
        ctx.lineTo(cx, cy + S * 0.07)
        ctx.lineTo(cx + S * 0.09 * (R() < 0.5 ? 1 : -1), cy + S * 0.07)
      }
      ctx.stroke()
    }
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = 'rgba(239,230,210,0.5)'
    ctx.fillRect(X + R() * S, Y + R() * S * 1.2, 1 + R() * 3, 1 + R() * 2)
  }
  ctx.restore()
}

// Clay: the medium lays the ground, the bands and the field, the scene draws its figures in the
// colours it is lent (F figure, L line, W white, P purple, T letters), and the surface is fired: a
// curved body, a glaze sheen, the grain of the clay.
const GLAZE = '#17110d'
async function vase(sc, out) {
  const red = sc.figure === 'red'
  const clay = sc.ground ?? '#c46a3b'
  const lend = red ? { G: GLAZE, F: clay, L: GLAZE, W: '#efe3cb', P: '#7c2b22', T: '#b4492f' } : { G: clay, F: GLAZE, L: clay, W: '#efe4cc', P: '#6e2a22', T: GLAZE }
  const tondo = sc.shape === 'tondo'
  const compose = (ctx, K) => {
    K.rect(0, 0, FW, FH, GLAZE)
    ctx.save()
    ctx.beginPath()
    if (tondo) ctx.arc(50, 62.5, 45, 0, Math.PI * 2)
    else ctx.rect(6, 13, 88, 95)
    ctx.clip()
    K.rect(0, 0, FW, FH, lend.G)
    sc.draw(ctx, K)
    ctx.restore()
    if (tondo) {
      K.ring(50, 62.5, 45.2, GLAZE, 0.9)
      K.ring(50, 62.5, 47.3, clay, 0.9)
      return
    }
    // tongues above, a running meander below
    K.rect(6, 6, 88, 6, clay)
    for (let x = 6.6; x < 93; x += 3.4) {
      K.shape((c) => {
        c.moveTo(x, 6)
        c.lineTo(x + 2.4, 6)
        c.lineTo(x + 2.4, 9.6)
        c.arc(x + 1.2, 9.6, 1.2, 0, Math.PI)
        c.closePath()
      }, GLAZE)
    }
    K.rect(6, 11.4, 88, 0.6, GLAZE)
    K.rect(6, 109, 88, 7, clay)
    const u = 7 / 6
    K.line(
      [
        [6, 115.4],
        [94, 115.4],
      ],
      GLAZE,
      0.75,
      'butt',
    )
    for (let x = 6.4; x < 92; x += 6 * u) {
      K.line(
        [
          [x, 115.4],
          [x, 109.6],
          [x + 4.6 * u, 109.6],
          [x + 4.6 * u, 113.6],
          [x + 2 * u, 113.6],
          [x + 2 * u, 111.6],
        ],
        GLAZE,
        0.75,
        'butt',
      )
    }
  }
  const src = pixelsOf(source(sc, W, H, lend, compose))
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  for (let y = 0; y < H; y++, await breathe())
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4
      const lum = 0.3 * src[o] + 0.59 * src[o + 1] + 0.11 * src[o + 2]
      const m = 1 - clamp((lum - 28) / 70)
      const u = x / W - 0.5
      const v = y / H - 0.5
      const shade = tondo ? 1 - 0.22 * ((u * u + v * v * 0.64) * 4) : 1 - 0.36 * (u * 2) ** 2
      const clayTex = 0.93 + 0.1 * noise(x * 0.07, y * 0.07, 1) + 0.04 * (hash(x, y, 2) - 0.5)
      const glazeTex = 0.9 + 0.2 * noise(x * 0.02, y * 0.05, 3)
      const sheen = tondo ? Math.exp(-(((u + 0.16) / 0.13) ** 2) - ((v + 0.2) / 0.1) ** 2) * 0.22 : Math.exp(-(((u + 0.24) / 0.09) ** 2)) * 0.06
      const chip = m > 0.85 && hash(x >> 1, y >> 1, 7) > 0.9994 ? 0.6 : 0
      for (let c = 0; c < 3; c++) {
        let val = src[o + c] * shade * lerp(clayTex, glazeTex, m) + sheen * m * 255
        if (chip) val = lerp(val, [150, 90, 60][c], chip)
        d[o + c] = val
      }
      d[o + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
}

// Wood: tone becomes hatching. The lines run across the block and bend with the large shapes, as a
// cutter's would; dark passages are cross-hatched, edges are cut as outlines, and a second block
// prints one colour underneath, a little out of register.
async function woodcut(sc, out) {
  const n = W * H
  const sd = pixelsOf(source(sc, W, H))
  const spot = sc.spot ? pixelsOf(source(sc, W, H, {}, (ctx, K) => sc.spot(ctx, K))) : null
  const L = luminance(sd, n)
  const Lb = await boxBlur(L, W, H, 2)
  const Lbig = await boxBlur(L, W, H, 14)
  const E = await sobel(await boxBlur(L, W, H, 1), W, H)
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const paper = hex(sc.paper ?? '#ede4cf')
  const inkc = hex('#16120f')
  const sp = hex(sc.spotCol ?? '#c8321f')
  const s = sc.spacing ?? 6
  for (let y = 0; y < H; y++, await breathe())
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const dk = clamp((1 - Lb[i] - 0.07) / 0.86)
      const v = (y + Lbig[i] * s * 4 + 2.2 * Math.sin(x * 0.016 + y * 0.003) + 3 * noise(x * 0.008, y * 0.008, 1)) / s
      const dd = Math.abs(v - Math.floor(v) - 0.5) * s
      let cov = clamp(dk * s * 0.52 - dd + 0.5)
      if (dk > 0.5) {
        const v2 = (x * 0.77 - y * 0.64 + Lbig[i] * s * 3) / (s * 0.9)
        const d2 = Math.abs(v2 - Math.floor(v2) - 0.5) * s * 0.9
        cov = Math.max(cov, clamp(((dk - 0.5) / 0.5) * s * 0.42 - d2 + 0.5))
      }
      cov = Math.max(cov, clamp((E[i] - 0.16) * 3.2))
      if (dk > 0.92) cov = 1
      cov *= 0.9 + 0.1 * noise(x * 0.3, y * 0.3, 2)
      if (cov > 0.95 && noise(x * 0.03, y * 0.6, 6) > 0.86) cov *= 0.6
      const fib = 1 - 0.035 * noise(x * 0.4, y * 0.03, 4) - 0.02 * hash(x, y, 5)
      let r = paper[0] * fib
      let g = paper[1] * fib
      let b = paper[2] * fib
      if (spot) {
        const xs = Math.min(W - 1, x + 3)
        const ys = Math.min(H - 1, y + 2)
        const so = (ys * W + xs) * 4
        const sa = (spot[so + 3] / 255) * (0.85 + 0.15 * noise(x * 0.05, y * 0.05, 8))
        r *= 1 - sa * (1 - sp[0] / 255)
        g *= 1 - sa * (1 - sp[1] / 255)
        b *= 1 - sa * (1 - sp[2] / 255)
      }
      d[i * 4] = lerp(r, inkc[0], cov)
      d[i * 4 + 1] = lerp(g, inkc[1], cov)
      d[i * 4 + 2] = lerp(b, inkc[2], cov)
      d[i * 4 + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
}

// Screen: the drawing separated into two inks by finding, for every colour, the pair of coverages
// that overprints closest to it on this paper; each ink then screened at its own angle, a little
// out of register, with the grain of a cheap print.
async function halftone(sc, out) {
  const n = W * H
  const sd = pixelsOf(source(sc, W, H))
  const paper = hex(sc.paper ?? '#f1e9da')
  const inks = sc.inks.map((k) => ({ ...k, rgb: hex(k.col), ca: Math.cos(((k.ang ?? 45) * Math.PI) / 180), sa: Math.sin(((k.ang ?? 45) * Math.PI) / 180) }))
  const steps = 15
  const combos = []
  const rec = (k, cov) => {
    if (k === inks.length) {
      const c = paper.map((p, ch) => cov.reduce((v, cv, j) => v * (1 - cv * (1 - inks[j].rgb[ch] / 255)), p))
      combos.push({ cov: cov.slice(), c })
      return
    }
    for (let s = 0; s < steps; s++) rec(k + 1, [...cov, s / (steps - 1)])
  }
  rec(0, [])
  const lut = new Map()
  const cover = inks.map(() => new Float32Array(n))
  for (let i = 0; i < n; i++) {
    if (i % W === 0) await breathe()
    const key = ((sd[i * 4] >> 3) << 10) | ((sd[i * 4 + 1] >> 3) << 5) | (sd[i * 4 + 2] >> 3)
    let best = lut.get(key)
    if (!best) {
      let bd = Infinity
      for (const cb of combos) {
        const dd = dist3(sd[i * 4], sd[i * 4 + 1], sd[i * 4 + 2], cb.c)
        if (dd < bd) {
          bd = dd
          best = cb
        }
      }
      lut.set(key, best)
    }
    for (let k = 0; k < inks.length; k++) cover[k][i] = best.cov[k]
  }
  const sm = []
  for (const c of cover) sm.push(await boxBlur(c, W, H, 1))
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const cell = sc.cell ?? 6.5
  for (let y = 0; y < H; y++, await breathe())
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const fib = 1 - 0.03 * noise(x * 0.4, y * 0.04, 4) - 0.025 * hash(x, y, 1)
      let r = paper[0] * fib
      let g = paper[1] * fib
      let b = paper[2] * fib
      inks.forEach((k, j) => {
        const [ox, oy] = k.off ?? [0, 0]
        const sx = clamp(x - ox, 0, W - 1)
        const sy = clamp(y - oy, 0, H - 1)
        const c = sm[j][sy * W + sx]
        const u = (x * k.ca + y * k.sa) / cell
        const v = (-x * k.sa + y * k.ca) / cell
        const fu = u - Math.round(u)
        const fv = v - Math.round(v)
        let cov
        if (c <= 0.5) cov = clamp(cell * Math.sqrt(c / Math.PI) - Math.hypot(fu, fv) * cell + 0.5)
        else cov = clamp(Math.hypot(0.5 - Math.abs(fu), 0.5 - Math.abs(fv)) * cell - cell * Math.sqrt((1 - c) / Math.PI) + 0.5)
        cov *= 0.86 + 0.14 * noise(x * 0.6, y * 0.6, 3 + j)
        r *= 1 - cov * (1 - k.rgb[0] / 255)
        g *= 1 - cov * (1 - k.rgb[1] / 255)
        b *= 1 - cov * (1 - k.rgb[2] / 255)
      })
      d[i * 4] = r
      d[i * 4 + 1] = g
      d[i * 4 + 2] = b
      d[i * 4 + 3] = 255
    }
  ctx.putImageData(img, 0, 0)
}

function grain(ctx, amt, seed) {
  const { width: w, height: h } = ctx.canvas
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] === 0) continue
    const g = 1 + (hash(i % w, Math.floor(i / w), seed) - 0.5) * amt
    d[i * 4] *= g
    d[i * 4 + 1] *= g
    d[i * 4 + 2] *= g
  }
  ctx.putImageData(img, 0, 0)
}

export const MEDIA = { pixel, mosaic, glass, ink, vase, woodcut, halftone }

export function mediumOf(sc) {
  if (sc.medium) return sc.medium
  switch (sc.style) {
    case 'pixel':
      return `Pixel painting · 128 × 160 · ${sc.colors ?? 18} colours`
    case 'mosaic':
      return sc.gold ? 'Wall mosaic with gold, after Byzantine work' : 'Floor mosaic, after Roman work'
    case 'glass':
      return 'Stained glass, after Gothic windows'
    case 'ink':
      return 'Ink on paper, after Chan painting'
    case 'vase':
      return `${sc.shape === 'tondo' ? 'Cup interior' : 'Vase panel'}, after Attic ${sc.figure === 'red' ? 'red' : 'black'}-figure`
    case 'woodcut':
      return 'Woodcut with a colour block, after early printed books'
    case 'halftone':
      return 'Two-colour screenprint'
    default:
      return ''
  }
}

// One painting at a time, in the order they were asked for.
let queue = Promise.resolve()
export function paint(out, sc) {
  const job = queue.then(() => {
    budget = performance.now()
    return MEDIA[sc.style](sc, out)
  })
  queue = job.catch(() => {})
  return job
}
