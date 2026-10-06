// Instruments for the four plates added last: Healer, Teacher, Lover, Rebel. Same contract as instruments.js.
import { TAU, clamp, rng } from './geom.js'

const MONO = '500 11px "JetBrains Mono", monospace'

function readout(ctx, text, x, y, fg, align = 'left') {
  ctx.globalAlpha = 1
  ctx.font = MONO
  ctx.textAlign = align
  ctx.fillStyle = fg
  ctx.fillText(text.toUpperCase(), x, y)
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

// Healer: a body with hidden complaints. Hold the cursor still to listen; a found complaint can be treated.
const healer = {
  init() {
    return { spots: [], r: rng(21), next: 0, eased: 0, still: 0, lx: 0, ly: 0 }
  },
  body(w, h) {
    const cx = w / 2
    const top = 36
    const H = h - 80
    return { cx, top, H, head: [cx, top + H * 0.09, H * 0.08] }
  },
  // a complaint lives somewhere on the body: head, chest, belly, a limb
  place(s, w, h) {
    const { cx, top, H } = this.body(w, h)
    const r = s.r
    const where = [[cx, top + H * 0.09], [cx + (r() - 0.5) * H * 0.12, top + H * 0.3], [cx + (r() - 0.5) * H * 0.1, top + H * 0.46], [cx + (r() < 0.5 ? -1 : 1) * H * 0.2, top + H * 0.38], [cx + (r() < 0.5 ? -1 : 1) * H * 0.07, top + H * 0.82]]
    const [x, y] = where[Math.floor(r() * where.length)]
    s.spots.push({ x: x + (r() - 0.5) * 10, y: y + (r() - 0.5) * 10, found: 0, pain: 1, ph: r() * TAU })
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const { cx, top, H, head } = this.body(w, h)
    if (!s.spots.length) for (let k = 0; k < 3; k++) this.place(s, w, h)
    if (s.spots.every((q) => q.pain <= 0)) {
      s.next += dt
      if (s.next > 6) {
        s.next = 0
        s.spots = []
      }
    }
    // stillness is how one listens
    const moved = Math.hypot(P.x - s.lx, P.y - s.ly)
    s.still = P.on && moved < 2 ? s.still + dt : 0
    s.lx = P.x
    s.ly = P.y
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.lineWidth = 1.6
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(head[0], head[1], head[2], 0, TAU)
    ctx.stroke()
    const sh = top + H * 0.2
    const hip = top + H * 0.56
    ctx.beginPath()
    ctx.moveTo(cx - H * 0.13, sh)
    ctx.quadraticCurveTo(cx - H * 0.11, hip - H * 0.1, cx - H * 0.09, hip)
    ctx.lineTo(cx + H * 0.09, hip)
    ctx.quadraticCurveTo(cx + H * 0.11, hip - H * 0.1, cx + H * 0.13, sh)
    ctx.closePath()
    ctx.stroke()
    line(ctx, cx - H * 0.13, sh, cx - H * 0.22, top + H * 0.52)
    line(ctx, cx + H * 0.13, sh, cx + H * 0.22, top + H * 0.52)
    line(ctx, cx - H * 0.06, hip, cx - H * 0.08, top + H)
    line(ctx, cx + H * 0.06, hip, cx + H * 0.08, top + H)
    line(ctx, cx, head[1] + head[2], cx, sh)
    let found = 0
    for (const q of s.spots) {
      const near = P.on && Math.hypot(P.x - q.x, P.y - q.y) < 46
      if (near && s.still > 0.25) q.found = Math.min(1, q.found + dt * 1.2)
      if (q.found >= 1) found++
      if (q.found <= 0 || q.pain <= 0) {
        if (q.pain <= 0) {
          ctx.globalAlpha = 0.6
          ctx.lineWidth = 1.5
          line(ctx, q.x - 6, q.y, q.x + 6, q.y)
          line(ctx, q.x, q.y - 6, q.x, q.y + 6)
        }
        continue
      }
      const beat = 0.5 + 0.5 * Math.sin(t * (4 + q.pain * 4) + q.ph)
      ctx.lineWidth = 1
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = q.found * q.pain * (0.7 - k * 0.2)
        ctx.beginPath()
        ctx.arc(q.x, q.y, 6 + k * 8 + beat * 4 * q.pain, 0, TAU)
        ctx.stroke()
      }
    }
    // the listening hand: a ring that closes as the cursor rests
    if (P.on) {
      ctx.globalAlpha = 0.6
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(P.x, P.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(s.still / 0.8))
      ctx.stroke()
    }
    const pain = s.spots.reduce((a, q) => a + Math.max(0, q.pain), 0)
    const bpm = Math.round(62 + pain * 14)
    readout(ctx, `pulse ${bpm} · ${found} found · ${s.eased} eased`, 18, h - 16, fg)
    readout(ctx, s.spots.every((q) => q.pain <= 0) ? 'comfort always' : 'hold still to listen', w - 18, h - 16, fg, 'right')
  },
  click(s, P) {
    const q = s.spots.find((x) => x.found >= 1 && x.pain > 0 && Math.hypot(P.x - x.x, P.y - x.y) < 46)
    if (!q) return
    q.pain = Math.max(0, q.pain - 0.5)
    if (q.pain <= 0) s.eased++
  },
}

// Teacher: a class of students. Explaining to one raises their understanding, which spreads to neighbours
// and slowly fades unless it is used.
const teacher = {
  init() {
    return { u: [], cols: 0, rows: 0, lessons: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const cols = Math.max(4, Math.floor((w - 60) / 64))
    const rows = Math.max(3, Math.floor((h - 90) / 64))
    if (s.cols !== cols || s.rows !== rows) {
      s.cols = cols
      s.rows = rows
      s.u = new Array(cols * rows).fill(0).map((_, i) => (i % 7 === 3 ? 0.4 : 0.05))
    }
    const gx = (w - 60) / cols
    const gy = (h - 90) / rows
    const pos = (i) => [30 + (i % cols) * gx + gx / 2, 40 + Math.floor(i / cols) * gy + gy / 2]
    // understanding diffuses to neighbours, and fades a little when no one uses it
    const next = s.u.slice()
    for (let i = 0; i < s.u.length; i++) {
      const x = i % cols
      const y = Math.floor(i / cols)
      let flow = 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
        flow += s.u[ny * cols + nx] - s.u[i]
      }
      next[i] = clamp(s.u[i] + flow * dt * 0.35 - s.u[i] * dt * 0.012)
      if (P.on) {
        const [px, py] = pos(i)
        if (Math.hypot(P.x - px, P.y - py) < gx * 0.5) next[i] = clamp(next[i] + dt * 0.08)
      }
    }
    s.u = next
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // the front of the room
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 1
    line(ctx, 30, 22, w - 30, 22)
    for (let i = 0; i < s.u.length; i++) {
      const [x, y] = pos(i)
      const u = s.u[i]
      const R = Math.min(gx, gy) * 0.3
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, R, 0, TAU)
      ctx.stroke()
      // understanding fills each student like a rising level
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, R, 0, TAU)
      ctx.clip()
      ctx.globalAlpha = 0.9
      ctx.fillRect(x - R, y + R - 2 * R * u, 2 * R, 2 * R * u)
      ctx.restore()
      if (u > 0.85) {
        ctx.globalAlpha = 0.9
        ctx.beginPath()
        ctx.arc(x, y - R - 6, 2, 0, TAU)
        ctx.fill()
      }
    }
    const mean = s.u.reduce((a, b) => a + b, 0) / s.u.length
    readout(ctx, `class understanding ${Math.round(mean * 100)}%`, 30, h - 18, fg)
    readout(ctx, `${s.lessons} explanation${s.lessons === 1 ? '' : 's'}`, w - 30, h - 18, fg, 'right')
  },
  click(s, P, w, h) {
    const cols = s.cols
    const gx = (w - 60) / cols
    const gy = (h - 90) / s.rows
    const i = Math.floor((P.x - 30) / gx) + Math.floor((P.y - 40) / gy) * cols
    if (i < 0 || i >= s.u.length || P.x < 30 || P.x > w - 30) return
    s.u[i] = 1
    s.lessons++
  },
}

// Lover: two bodies drawn to each other, held apart by a little repulsion, so they circle and never collide.
const lover = {
  init(w, h) {
    return { a: { x: w * 0.4, y: h * 0.5, vx: 0, vy: 40 }, b: { x: w * 0.6, y: h * 0.5, vx: 0, vy: -40 }, lead: 'a', ta: [], tb: [], sync: 0.5 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    dt = Math.min(dt, 0.05)
    const { a, b } = s
    const pull = (p, q) => {
      const dx = q.x - p.x
      const dy = q.y - p.y
      const d = Math.max(8, Math.hypot(dx, dy))
      // attraction at a distance, a gentle push when too close
      const f = 900 / d - 60000 / (d * d * d / 10 + 1)
      p.vx += (dx / d) * f * dt * 6
      p.vy += (dy / d) * f * dt * 6
      // and a slight sideways drift, so that resting together is still a slow dance
      p.vx += (-dy / d) * 14 * dt
      p.vy += (dx / d) * 14 * dt
    }
    const led = s.lead === 'a' ? a : b
    const other = s.lead === 'a' ? b : a
    if (P.on) {
      led.vx += (P.x - led.x) * dt * 12
      led.vy += (P.y - led.y) * dt * 12
      led.vx *= Math.exp(-dt * 6)
      led.vy *= Math.exp(-dt * 6)
    } else pull(led, other)
    pull(other, led)
    for (const p of [a, b]) {
      p.vx *= Math.exp(-dt * 0.4)
      p.vy *= Math.exp(-dt * 0.4)
      p.x = clamp(p.x + p.vx * dt, 14, w - 14)
      p.y = clamp(p.y + p.vy * dt, 14, h - 40)
    }
    s.ta.push([a.x, a.y])
    s.tb.push([b.x, b.y])
    if (s.ta.length > 240) s.ta.shift()
    if (s.tb.length > 240) s.tb.shift()
    // how in step they are: agreement of their headings, smoothed
    const va = Math.hypot(a.vx, a.vy) || 1
    const vb = Math.hypot(b.vx, b.vy) || 1
    const cos = (a.vx * b.vx + a.vy * b.vy) / (va * vb)
    s.sync += ((cos + 1) / 2 - s.sync) * Math.min(1, dt * 1.5)
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const [trail, al, dash] of [[s.ta, 0.7, []], [s.tb, 0.7, [3, 4]]]) {
      ctx.globalAlpha = al
      ctx.lineWidth = 1.5
      ctx.setLineDash(dash)
      ctx.beginPath()
      trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    }
    ctx.setLineDash([])
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    line(ctx, a.x, a.y, b.x, b.y)
    for (const [p, filled] of [[a, true], [b, false]]) {
      ctx.globalAlpha = 1
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, p === led ? 8 : 6, 0, TAU)
      filled ? ctx.fill() : ctx.stroke()
    }
    readout(ctx, `distance ${Math.round(d)} · in step ${Math.round(s.sync * 100)}%`, 18, h - 16, fg)
    readout(ctx, `${s.lead === 'a' ? 'the solid one' : 'the open one'} leads`, w - 18, h - 16, fg, 'right')
  },
  click(s) {
    s.lead = s.lead === 'a' ? 'b' : 'a'
  },
}

// Rebel: a lattice held in order by springs. Pressure deforms it; enough pressure breaks links,
// and every broken link weakens its neighbours, so refusal spreads.
const rebel = {
  init(w, h) {
    const cols = Math.max(8, Math.floor((w - 40) / 30))
    const rows = Math.max(6, Math.floor((h - 70) / 30))
    const gx = (w - 40) / (cols - 1)
    const gy = (h - 70) / (rows - 1)
    const pts = []
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) pts.push({ rx: 20 + x * gx, ry: 24 + y * gy, x: 20 + x * gx, y: 24 + y * gy, vx: 0, vy: 0, k: 1 })
    const links = []
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (x < cols - 1) links.push({ a: i, b: i + 1, L: gx, on: true })
        if (y < rows - 1) links.push({ a: i, b: i + cols, L: gy, on: true })
      }
    return { pts, links, broken: 0, shove: null }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    dt = Math.min(dt, 0.033)
    const press = []
    if (P.on) press.push([P.x, P.y, 46, 2600])
    if (s.shove) {
      press.push([s.shove.x, s.shove.y, 90, 9000])
      s.shove.life -= dt
      if (s.shove.life <= 0) s.shove = null
    }
    for (const p of s.pts) {
      // the order pulls every point home, more weakly where it has been broken
      p.vx += (p.rx - p.x) * 18 * p.k * dt
      p.vy += (p.ry - p.y) * 18 * p.k * dt
      for (const [x, y, R, F] of press) {
        const dx = p.x - x
        const dy = p.y - y
        const d = Math.hypot(dx, dy) || 1
        if (d < R) {
          p.vx += (dx / d) * (1 - d / R) * F * dt
          p.vy += (dy / d) * (1 - d / R) * F * dt
        }
      }
      p.vx *= Math.exp(-dt * 6)
      p.vy *= Math.exp(-dt * 6)
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    let strain = 0
    ctx.strokeStyle = fg
    for (const l of s.links) {
      const A = s.pts[l.a]
      const B = s.pts[l.b]
      const len = Math.hypot(A.x - B.x, A.y - B.y)
      const e = len / l.L
      if (l.on) {
        strain = Math.max(strain, e)
        if (e > 1.75) {
          l.on = false
          s.broken++
          A.k *= 0.8
          B.k *= 0.8
        }
        ctx.globalAlpha = clamp(0.25 + (e - 1) * 1.2, 0.25, 1)
        ctx.lineWidth = e > 1.3 ? 2 : 1
        line(ctx, A.x, A.y, B.x, B.y)
      } else {
        // the broken ends hang loose
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        line(ctx, A.x, A.y, A.x + (B.x - A.x) * 0.3, A.y + (B.y - A.y) * 0.3)
        line(ctx, B.x, B.y, B.x + (A.x - B.x) * 0.3, B.y + (A.y - B.y) * 0.3)
      }
    }
    ctx.fillStyle = fg
    ctx.globalAlpha = 0.8
    for (const p of s.pts) ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
    readout(ctx, `pressure ${Math.round(clamp((strain - 1) / 0.75) * 100)}% · ${s.broken} links broken`, 18, h - 16, fg)
    readout(ctx, s.broken > 40 ? 'the order has given' : 'push · click to shove', w - 18, h - 16, fg, 'right')
  },
  click(s, P) {
    s.shove = { x: P.x, y: P.y, life: 0.35 }
  },
}

export const FOUR = { healer, teacher, lover, rebel }
