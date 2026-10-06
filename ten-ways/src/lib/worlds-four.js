// The worlds behind the four plates added last: Healer, Teacher, Lover, Rebel. Same contract as worlds.js.
import { TAU, clamp, lerp, rng } from './geom.js'
import { bus } from './bus.js'

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

// Healer: a network of vessels, with a pulse travelling outward from the heart at a resting rate.
// The cursor warms what it passes; a click leaves a mark of treatment that slowly settles.
const healer = {
  init(w, h) {
    const r = rng(121)
    const segs = []
    const cx = w * 0.5
    const cy = h * 0.55
    const grow = (x, y, ang, len, d) => {
      if (d > 6 || len < 6) return
      const x2 = x + Math.cos(ang) * len
      const y2 = y + Math.sin(ang) * len
      segs.push({ x1: x, y1: y, x2, y2, d: Math.hypot((x + x2) / 2 - cx, (y + y2) / 2 - cy), wd: Math.max(0.6, 3.2 - d * 0.4), warm: 0 })
      grow(x2, y2, ang - 0.3 - r() * 0.4, len * (0.72 + r() * 0.12), d + 1)
      grow(x2, y2, ang + 0.3 + r() * 0.4, len * (0.72 + r() * 0.12), d + 1)
    }
    for (let k = 0; k < 6; k++) grow(cx, cy, (k / 6) * TAU + r() * 0.4, Math.min(w, h) * 0.13, 0)
    return { segs, cx, cy, marks: [], treated: 0, now: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    // a pulse every second, about sixty beats a minute
    const R = ((t % 1) / 1) * Math.max(w, h) * 0.7
    ctx.strokeStyle = fg
    for (const g of s.segs) {
      if (P.on) {
        const d = Math.hypot((g.x1 + g.x2) / 2 - P.x, (g.y1 + g.y2) / 2 - P.y)
        if (d < 90) g.warm = Math.min(1, g.warm + dt * 3 * (1 - d / 90))
      }
      g.warm = Math.max(0, g.warm - dt * 0.4)
      const beat = Math.exp(-(((g.d - R) / 40) ** 2))
      ctx.globalAlpha = 0.06 + beat * 0.2 + g.warm * 0.3
      ctx.lineWidth = g.wd + beat * 1.2
      line(ctx, g.x1, g.y1, g.x2, g.y2)
    }
    ctx.globalAlpha = 0.5
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.arc(s.cx, s.cy, 5 + Math.exp(-((t % 1) * 8)) * 4, 0, TAU)
    ctx.fill()
    for (const m of s.marks) {
      const k = clamp((t - m.t) / 6)
      ctx.globalAlpha = 0.8 * (1 - k * 0.6)
      ctx.lineWidth = 2
      const a = 9
      line(ctx, m.x - a, m.y, m.x + a, m.y)
      line(ctx, m.x, m.y - a, m.x, m.y + a)
      // calm spreads from the mark in slowing rings
      ctx.lineWidth = 1
      for (let j = 0; j < 3; j++) {
        const kk = clamp(k * 1.5 - j * 0.2)
        ctx.globalAlpha = (1 - kk) * 0.4
        ctx.beginPath()
        ctx.arc(m.x, m.y, 14 + kk * 120, 0, TAU)
        ctx.stroke()
      }
    }
    s.marks = s.marks.filter((m) => s.now - m.t < 30)
    ctx.globalAlpha = 1
  },
  down(s, P) {
    s.marks.push({ x: P.x, y: P.y, t: s.now })
    s.treated++
    if (s.treated === 6) bus.whisper('healer', 'The healer thanks you for staying.', '#2e6a9e')
  },
}

// Teacher: a blackboard. The cursor writes in chalk; half-erased lessons show through; a click wipes a band clean.
const LESSONS = ['a² + b² = c²', 'amo · amas · amat', 'H₂O', 'E = mc²', '∫ x dx = x²/2', 'cogito, ergo sum', '1 + 1 = 2', 'πr²', 'ἀρχή', 'do re mi', '6 × 7 = 42', 'Fe']
const teacher = {
  init(w, h) {
    const r = rng(122)
    return {
      ghosts: LESSONS.map((text) => ({ text, x: 40 + r() * (w - 200), y: 60 + r() * (h - 120), size: 18 + r() * 26, rot: (r() - 0.5) * 0.12, a: 0.06 + r() * 0.08 })),
      strokes: [],
      wipes: [],
      dist: 0,
      now: 0,
      told: false,
    }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    ctx.fillStyle = fg
    ctx.strokeStyle = fg
    ctx.textAlign = 'left'
    for (const g of s.ghosts) {
      ctx.save()
      ctx.translate(g.x, g.y)
      ctx.rotate(g.rot)
      ctx.globalAlpha = g.a
      ctx.font = `italic ${g.size}px "Instrument Serif", serif`
      ctx.fillText(g.text, 0, 0)
      ctx.restore()
    }
    // chalk: a stroke made of many small grains, which fades over half a minute
    const last = s.strokes.at(-1)
    if (P.on && P.speed > 20 && (!last || Math.hypot(P.x - last.x, P.y - last.y) > 3)) {
      if (last) s.dist += Math.hypot(P.x - last.x, P.y - last.y)
      s.strokes.push({ x: P.x, y: P.y, t, seed: Math.random(), jump: !last || Math.hypot(P.x - last.x, P.y - last.y) > 60 })
      if (s.strokes.length > 1400) s.strokes.shift()
      if (s.dist > 6000 && !s.told) {
        s.told = true
        bus.whisper('teacher', 'The teacher has learned something from you.', '#f3e9d2')
      }
    }
    for (let i = 1; i < s.strokes.length; i++) {
      const p = s.strokes[i]
      const q = s.strokes[i - 1]
      if (p.jump) continue
      const age = (t - p.t) / 30
      if (age > 1) continue
      ctx.globalAlpha = 0.55 * (1 - age)
      for (let k = 0; k < 3; k++) {
        const u = (k + p.seed) / 3
        ctx.fillRect(lerp(q.x, p.x, u) + (Math.sin(p.seed * 99 + k) * 2), lerp(q.y, p.y, u) + Math.cos(p.seed * 77 + k) * 1.5, 1.6, 1.6)
      }
    }
    s.strokes = s.strokes.filter((p) => t - p.t < 30)
    // the eraser's smudge
    for (const e of s.wipes) {
      const k = clamp((t - e.t) / 1.2)
      ctx.globalAlpha = 0.08 * (1 - k)
      ctx.fillRect(e.x - 120, e.y - 30, 240 * Math.min(1, k * 3), 60)
    }
    s.wipes = s.wipes.filter((e) => t - e.t < 1.2)
    ctx.globalAlpha = 1
  },
  down(s, P) {
    s.wipes.push({ x: P.x, y: P.y, t: s.now })
    s.strokes = s.strokes.filter((p) => Math.abs(p.y - P.y) > 30 || Math.abs(p.x - P.x) > 120)
  },
}

// Lover: the cursor has a companion that follows on a spring, never quite in step.
// Their trails twine; when they rest close together, rings answer rings.
const lover = {
  init(w, h) {
    return { b: { x: w * 0.6, y: h * 0.5, vx: 0, vy: 0 }, ta: [], tb: [], close: 0, told: false, rings: [], ring: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const A = P.on ? { x: P.x, y: P.y } : { x: w / 2 + Math.cos(t * 0.4) * w * 0.15, y: h / 2 + Math.sin(t * 0.55) * h * 0.15 }
    const b = s.b
    // a spring toward a point that circles the other, so they never quite meet
    const tx = A.x + Math.cos(t * 1.3) * 40
    const ty = A.y + Math.sin(t * 1.3) * 40
    b.vx += (tx - b.x) * dt * 3
    b.vy += (ty - b.y) * dt * 3
    b.vx *= Math.exp(-dt * 1.6)
    b.vy *= Math.exp(-dt * 1.6)
    b.x += b.vx * dt
    b.y += b.vy * dt
    s.ta.push([A.x, A.y, t])
    s.tb.push([b.x, b.y, t])
    s.ta = s.ta.filter((p) => t - p[2] < 4)
    s.tb = s.tb.filter((p) => t - p[2] < 4)
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const [trail, al] of [[s.ta, 0.55], [s.tb, 0.35]]) {
      ctx.globalAlpha = al
      ctx.lineWidth = 1.4
      ctx.beginPath()
      trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
    const d = Math.hypot(A.x - b.x, A.y - b.y)
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.setLineDash([2, 5])
    line(ctx, A.x, A.y, b.x, b.y)
    ctx.setLineDash([])
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(b.x, b.y, 5, 0, TAU)
    ctx.fill()
    if (d < 70) {
      s.close += dt
      s.ring -= dt
      if (s.ring <= 0) {
        s.ring = 0.6
        s.rings.push({ x: A.x, y: A.y, t }, { x: b.x, y: b.y, t })
      }
    } else s.close = 0
    if (s.close > 3 && !s.told) {
      s.told = true
      bus.whisper('lover', 'The lover is paying attention.', '#fde4ee')
    }
    // two sets of rings, overlapping into interference
    for (const r of s.rings) {
      const k = (t - r.t) / 3
      ctx.globalAlpha = (1 - k) * 0.35
      ctx.beginPath()
      ctx.arc(r.x, r.y, 8 + k * 200, 0, TAU)
      ctx.stroke()
    }
    s.rings = s.rings.filter((r) => t - r.t < 3)
    ctx.globalAlpha = 1
  },
}

// Rebel: ranks of upright bars. The cursor pushes them over; a click cracks a line through the ranks.
// Order slowly reasserts itself, except where it has been broken.
const rebel = {
  init(w, h) {
    const bars = []
    const gx = 30
    const gy = 46
    for (let y = gy; y < h; y += gy) for (let x = gx / 2; x < w; x += gx) bars.push({ x, y, a: 0, v: 0, broken: false })
    return { bars, cracks: [], count: 0, now: 0, gx }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    ctx.strokeStyle = fg
    ctx.lineWidth = 2
    for (const b of s.bars) {
      if (P.on) {
        const dx = b.x - P.x
        const d = Math.hypot(dx, b.y - P.y)
        if (d < 70) b.v += Math.sign(dx || 1) * (1 - d / 70) * dt * 30
      }
      // the order pulls each bar upright again, unless it has been broken
      const k = b.broken ? 0.3 : 6
      b.v += -b.a * k * dt
      b.v *= Math.exp(-dt * 3)
      b.a = clamp(b.a + b.v * dt, -1.45, 1.45)
      const L = 12
      ctx.globalAlpha = b.broken ? 0.6 : 0.14
      line(ctx, b.x, b.y, b.x + Math.sin(b.a) * L, b.y - Math.cos(b.a) * L)
    }
    ctx.lineWidth = 1.5
    for (const c of s.cracks) {
      const k = clamp((t - c.t) / 0.6)
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      c.pts.slice(0, Math.max(2, Math.floor(c.pts.length * k))).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  },
  down(s, P, w, h) {
    // a crack runs from the click across the ranks, and everything on it falls
    const ang = Math.random() * TAU
    const pts = [[P.x, P.y]]
    let x = P.x
    let y = P.y
    for (let i = 0; i < 40; i++) {
      x += Math.cos(ang) * 22 + (Math.random() - 0.5) * 16
      y += Math.sin(ang) * 22 + (Math.random() - 0.5) * 16
      pts.push([x, y])
      if (x < 0 || y < 0 || x > w || y > h) break
    }
    for (const b of s.bars) {
      if (pts.some(([px, py]) => Math.hypot(px - b.x, py - b.y) < 22)) {
        b.broken = true
        b.v += (Math.random() - 0.5) * 8
      }
    }
    s.cracks.push({ pts, t: s.now })
    if (s.cracks.length > 12) s.cracks.shift()
    s.count++
    if (s.count === 5) bus.whisper('rebel', 'The rebel says: not like this.', '#ff3b30')
  },
}

export const FOUR = { healer, teacher, lover, rebel }
