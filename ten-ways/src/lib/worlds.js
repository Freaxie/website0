// Worlds, one behind each plate (the second ten live in worlds-more.js): an environment with its own physics, ambience and cursor.
//   init(w, h, look)                    -> state
//   step(s, ctx, t, dt, P, w, h, look)  draws one frame
//   down(s, P, w, h, look)              optional, on press
//   up(s, P)                            optional, on release
// P = { x, y, on, speed, vx, vy, down }. look = { fg, bg, color }.
// Each world reports what the visitor does to it through the bus, which decides when to whisper.
import { TAU, clamp, lerp, rng } from './geom.js'
import { bus } from './bus.js'
import { MORE } from './worlds-more.js'

const MONO = '500 10px "JetBrains Mono", monospace'
const SERIF_I = 'italic 15px "Instrument Serif", serif'

// I · Scientist: a dark observatory. Bodies drift; clicking one records an observation; a model emerges.
const scientist = {
  init(w, h) {
    const r = rng(101)
    return {
      bodies: Array.from({ length: 34 }, (_, i) => ({ x: r() * w, y: r() * h, z: 0.3 + r() * 0.7, ph: r() * TAU, id: i + 1, seen: false })),
      obs: [],
      trail: [],
      lx: null,
      ly: null,
    }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // the observatory grid
    ctx.globalAlpha = 0.07
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x < w; x += 56) {
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, h)
    }
    for (let y = 0; y < h; y += 56) {
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(w, y + 0.5)
    }
    ctx.stroke()
    // drifting bodies
    let near = null
    for (const b of s.bodies) {
      b.x += Math.cos(b.ph + t * 0.05) * 6 * b.z * dt
      b.y += Math.sin(b.ph + t * 0.04) * 4 * b.z * dt
      const tw = 0.5 + 0.5 * Math.sin(t * 1.4 + b.ph)
      ctx.globalAlpha = b.seen ? 0.95 : 0.25 + 0.4 * tw
      ctx.beginPath()
      ctx.arc(b.x, b.y, 1.5 + b.z * 3, 0, TAU)
      b.seen ? ctx.fill() : ctx.stroke()
      if (b.seen) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, 12, 0, TAU)
        ctx.stroke()
      }
      if (P.on && Math.hypot(P.x - b.x, P.y - b.y) < 28) near = b
    }
    if (near && !near.seen) {
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(near.x - 20, near.y)
      ctx.lineTo(near.x + 20, near.y)
      ctx.moveTo(near.x, near.y - 20)
      ctx.lineTo(near.x, near.y + 20)
      ctx.stroke()
      ctx.font = MONO
      ctx.fillText(`OBJ ${String(near.id).padStart(3, '0')} · CLICK TO OBSERVE`, near.x + 16, near.y - 12)
    }
    // the cursor leaves tiny data points behind it
    if (P.on && (s.lx === null || Math.hypot(P.x - s.lx, P.y - s.ly) > 46)) {
      s.trail.push({ x: P.x, y: P.y, t })
      s.lx = P.x
      s.ly = P.y
    }
    s.trail = s.trail.filter((q) => t - q.t < 7)
    ctx.font = MONO
    s.trail.forEach((q, i) => {
      ctx.globalAlpha = 0.6 * (1 - (t - q.t) / 7)
      ctx.fillRect(q.x - 3, q.y - 0.5, 6, 1)
      ctx.fillRect(q.x - 0.5, q.y - 3, 1, 6)
      if (i % 4 === 0) ctx.fillText(`${Math.round(q.x)},${Math.round(q.y)}`, q.x + 6, q.y + 12)
    })
    // the model: a quadratic fitted to every observation so far
    if (s.obs.length >= 3) {
      const n = s.obs.length
      let [sx, sx2, sx3, sx4, sy, sxy, sx2y] = [0, 0, 0, 0, 0, 0, 0]
      for (const o of s.obs) {
        const x = o.x / w
        const y = o.y / h
        sx += x
        sx2 += x * x
        sx3 += x ** 3
        sx4 += x ** 4
        sy += y
        sxy += x * y
        sx2y += x * x * y
      }
      // solve the 3 × 3 normal equations by Cramer's rule
      const M = [[n, sx, sx2], [sx, sx2, sx3], [sx2, sx3, sx4]]
      const v = [sy, sxy, sx2y]
      const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
      const D = det(M)
      if (Math.abs(D) > 1e-9) {
        const coef = [0, 1, 2].map((k) => det(M.map((row, i) => row.map((c, j) => (j === k ? v[i] : c)))) / D)
        const conf = Math.min(1, (n - 2) / 8)
        ctx.globalAlpha = 0.25 + 0.6 * conf
        ctx.lineWidth = 1 + conf * 1.5
        ctx.setLineDash([6, 6 - conf * 5])
        ctx.beginPath()
        for (let x = 0; x <= w; x += 12) {
          const u = x / w
          const y = (coef[0] + coef[1] * u + coef[2] * u * u) * h
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 0.85
        ctx.font = MONO
        ctx.textAlign = 'right'
        ctx.fillText(`MODEL · ${n} OBSERVATIONS · y = ${coef[0].toFixed(2)} ${coef[1] < 0 ? '−' : '+'} ${Math.abs(coef[1]).toFixed(2)}x ${coef[2] < 0 ? '−' : '+'} ${Math.abs(coef[2]).toFixed(2)}x²`, w - 24, h - 24)
        ctx.textAlign = 'left'
      }
    }
    ctx.globalAlpha = 1
  },
  down(s, P) {
    const b = s.bodies.find((q) => !q.seen && Math.hypot(P.x - q.x, P.y - q.y) < 28)
    if (b) b.seen = true
    s.obs.push(b ? { x: b.x, y: b.y } : { x: P.x, y: P.y })
    if (s.obs.length === 9) bus.whisper('scientist', 'The scientist has a model of you.', '#1f4fd8')
  },
}

// II · Engineer: a floating structure of nodes, beams and gears. Grab a node and pull.
const engineer = {
  init(w, h) {
    const cols = 7
    const rows = 3
    const gx = w * 0.06
    const gw = w * 0.88
    const gy = h * 0.22
    const gh = h * 0.56
    const nodes = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = gx + ((c + (r % 2) * 0.5) / (cols - 0.5)) * gw
        const y = gy + (r / (rows - 1)) * gh
        nodes.push({ x, y, ox: x, oy: y, px: x, py: y })
      }
    const beams = []
    const link = (a, b) => beams.push({ a, b, rest: Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) })
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        if (c < cols - 1) link(i, i + 1)
        if (r < rows - 1) {
          link(i, i + cols)
          const d = r % 2 ? c + 1 : c - 1
          if (d >= 0 && d < cols) link(i, (r + 1) * cols + d)
        }
      }
    const gears = [
      { n: 9, r: 40, teeth: 14, dir: 1 },
      { n: 3, r: 28, teeth: 10, dir: -1 },
      { n: 18, r: 34, teeth: 12, dir: -1 },
    ]
    return { nodes, beams, gears, grab: -1, drags: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const { nodes, beams } = s
    // verlet: drift home, float, feel the cursor
    nodes.forEach((n, i) => {
      if (i === s.grab) {
        n.x = P.x
        n.y = P.y
        n.px = n.x
        n.py = n.y
        return
      }
      const vx = (n.x - n.px) * 0.9
      const vy = (n.y - n.py) * 0.9
      n.px = n.x
      n.py = n.y
      let ax = (n.ox - n.x) * 2 + Math.sin(t * 0.7 + i) * 6
      let ay = (n.oy - n.y) * 2 + Math.cos(t * 0.6 + i * 1.3) * 6
      if (P.on && s.grab < 0) {
        const d = Math.hypot(P.x - n.x, P.y - n.y)
        if (d < 160) {
          ax += ((P.x - n.x) / d) * (160 - d) * 1.6
          ay += ((P.y - n.y) / d) * (160 - d) * 1.6
        }
      }
      n.x += vx + ax * dt * dt
      n.y += vy + ay * dt * dt
    })
    for (let k = 0; k < 4; k++)
      for (const b of beams) {
        const A = nodes[b.a]
        const B = nodes[b.b]
        const dx = B.x - A.x
        const dy = B.y - A.y
        const d = Math.hypot(dx, dy) || 1
        const f = ((d - b.rest) / d) * 0.25
        if (b.a !== s.grab) {
          A.x += dx * f
          A.y += dy * f
        }
        if (b.b !== s.grab) {
          B.x -= dx * f
          B.y -= dy * f
        }
      }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const b of beams) {
      const A = nodes[b.a]
      const B = nodes[b.b]
      const strain = Math.abs(Math.hypot(B.x - A.x, B.y - A.y) - b.rest) / b.rest
      ctx.globalAlpha = 0.28 + Math.min(0.6, strain * 6)
      ctx.lineWidth = 1 + Math.min(5, strain * 40)
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(B.x, B.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.8
    nodes.forEach((n, i) => {
      const hot = i === s.grab || (P.on && Math.hypot(P.x - n.x, P.y - n.y) < 26)
      ctx.fillRect(n.x - (hot ? 6 : 3.5), n.y - (hot ? 6 : 3.5), hot ? 12 : 7, hot ? 12 : 7)
    })
    // gears mesh their speed to their size
    ctx.lineWidth = 1.5
    for (const g of s.gears) {
      const n = nodes[g.n]
      const a = (t * 60 * g.dir) / g.r
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      ctx.arc(n.x, n.y, g.r, 0, TAU)
      ctx.arc(n.x, n.y, g.r * 0.3, 0, TAU)
      for (let k = 0; k < g.teeth; k++) {
        const b = a + (k / g.teeth) * TAU
        ctx.moveTo(n.x + Math.cos(b) * g.r, n.y + Math.sin(b) * g.r)
        ctx.lineTo(n.x + Math.cos(b) * (g.r + 7), n.y + Math.sin(b) * (g.r + 7))
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  },
  down(s, P) {
    let best = -1
    let bd = 30
    s.nodes.forEach((n, i) => {
      const d = Math.hypot(P.x - n.x, P.y - n.y)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    s.grab = best
  },
  up(s) {
    if (s.grab >= 0) {
      s.drags++
      if (s.drags === 6) bus.whisper('engineer', 'The engineer is watching.', '#f26a1b')
    }
    s.grab = -1
  },
}

// III · Warrior: a field of shards in motion. A fast cursor is a blade; it cuts what it crosses.
const warrior = {
  init(w, h) {
    const r = rng(103)
    const shard = () => ({ x: r() * w, y: r() * h, vx: -(60 + r() * 120), vy: (r() - 0.5) * 20, a: r() * TAU, va: (r() - 0.5) * 2, s: 8 + r() * 18 })
    return { shards: Array.from({ length: 64 }, shard), trail: [], cuts: 0, sparks: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    if (P.on) s.trail.push({ x: P.x, y: P.y, t, sp: P.speed })
    s.trail = s.trail.filter((q) => t - q.t < 0.22)
    const fast = P.on && P.speed > 650 && s.trail.length > 1
    const seg = fast ? [s.trail[s.trail.length - 2], s.trail[s.trail.length - 1]] : null
    ctx.fillStyle = fg
    ctx.strokeStyle = fg
    const born = []
    s.shards = s.shards.filter((q) => {
      q.x += q.vx * dt
      q.y += q.vy * dt
      q.a += q.va * dt
      q.vy *= Math.exp(-dt * 0.8)
      if (q.x < -40) {
        q.x = w + 40
        q.y = Math.random() * h
        q.s = 8 + Math.random() * 18
      }
      if (seg) {
        // distance from the shard to the blade's latest segment
        const [A, B] = seg
        const ux = B.x - A.x
        const uy = B.y - A.y
        const L = ux * ux + uy * uy || 1
        const k = clamp(((q.x - A.x) * ux + (q.y - A.y) * uy) / L)
        const d = Math.hypot(q.x - (A.x + ux * k), q.y - (A.y + uy * k))
        if (d < q.s) {
          s.cuts++
          for (let n = 0; n < 6; n++) s.sparks.push({ x: q.x, y: q.y, vx: (Math.random() - 0.5) * 500, vy: (Math.random() - 0.5) * 500, t })
          if (q.s > 9) {
            const nx = -uy / Math.sqrt(L)
            const ny = ux / Math.sqrt(L)
            for (const sg of [-1, 1]) born.push({ x: q.x, y: q.y, vx: q.vx + nx * sg * 180, vy: q.vy + ny * sg * 180, a: q.a, va: q.va * 4, s: q.s * 0.62 })
          } else born.push({ x: w + 40, y: Math.random() * h, vx: -(60 + Math.random() * 120), vy: 0, a: 0, va: 1, s: 14 })
          if (s.cuts === 40) bus.whisper('warrior', 'The warrior salutes you.', '#a8161f')
          return false
        }
      }
      ctx.globalAlpha = 0.42
      ctx.beginPath()
      for (let k = 0; k < 3; k++) {
        const b = q.a + (k / 3) * TAU
        const rr = k ? q.s * 0.55 : q.s
        k ? ctx.lineTo(q.x + Math.cos(b) * rr, q.y + Math.sin(b) * rr) : ctx.moveTo(q.x + Math.cos(b) * rr, q.y + Math.sin(b) * rr)
      }
      ctx.closePath()
      ctx.fill()
      return true
    })
    s.shards.push(...born)
    if (s.shards.length > 140) s.shards.splice(0, s.shards.length - 140)
    // sparks
    s.sparks = s.sparks.filter((q) => t - q.t < 0.4)
    ctx.lineWidth = 1.5
    for (const q of s.sparks) {
      const k = (t - q.t) / 0.4
      ctx.globalAlpha = 1 - k
      ctx.beginPath()
      ctx.moveTo(q.x + q.vx * k * 0.3, q.y + q.vy * k * 0.3)
      ctx.lineTo(q.x + q.vx * k * 0.36, q.y + q.vy * k * 0.36)
      ctx.stroke()
    }
    // the blade: a tapering, sharp-edged trail
    if (s.trail.length > 2) {
      ctx.globalAlpha = 0.95
      const T = s.trail
      ctx.beginPath()
      const L = T.length
      const side = []
      for (let i = 0; i < L; i++) {
        const a = T[Math.max(0, i - 1)]
        const b = T[Math.min(L - 1, i + 1)]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const wdt = (i / L) * Math.min(9, T[i].sp / 160)
        side.push([T[i].x - (dy / d) * wdt, T[i].y + (dx / d) * wdt, T[i].x + (dy / d) * wdt, T[i].y - (dx / d) * wdt])
      }
      side.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      for (let i = L - 1; i >= 0; i--) ctx.lineTo(side[i][2], side[i][3])
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 1
  },
}

// IV · Artist: an open canvas. Every stroke is answered by its rotations and reflections,
// and the more you paint, the more ways each stroke is repeated.
const artist = {
  init(w, h) {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(w))
    c.height = Math.max(1, Math.round(h))
    return { ink: c, ix: c.getContext('2d'), strokes: 0, last: null, lastT: 0, hue: 0, sym: 2 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const inks = [fg, '#ffd23f', '#0c0c0c', '#ffb3d6']
    const cx = w / 2
    const cy = h / 2
    const x = s.ix
    // the ink slowly sinks back into the paper
    x.globalCompositeOperation = 'destination-out'
    x.fillStyle = 'rgba(0,0,0,0.006)'
    x.fillRect(0, 0, w, h)
    x.globalCompositeOperation = 'source-over'
    if (P.on && P.speed > 4) {
      if (!s.last || t - s.lastT > 0.35) {
        s.strokes++
        s.sym = Math.min(12, 2 + Math.floor(s.strokes / 3) * 2)
        s.hue++
        if (s.sym >= 8) bus.whisper('artist', 'The artist wants to sign it.', '#e0157a')
        s.last = null
      }
      if (s.last) {
        const width = clamp(11 - P.speed / 110, 1.4, 10)
        x.strokeStyle = inks[s.hue % inks.length]
        x.lineCap = 'round'
        x.lineWidth = width
        for (let k = 0; k < s.sym; k++) {
          const ang = (k / s.sym) * TAU
          const c = Math.cos(ang)
          const sn = Math.sin(ang)
          for (const m of [1, -1]) {
            const ax = (s.last.x - cx) * m
            const ay = s.last.y - cy
            const bx = (P.x - cx) * m
            const by = P.y - cy
            x.beginPath()
            x.moveTo(cx + ax * c - ay * sn, cy + ax * sn + ay * c)
            x.lineTo(cx + bx * c - by * sn, cy + bx * sn + by * c)
            x.stroke()
          }
        }
      }
      s.last = { x: P.x, y: P.y }
      s.lastT = t
    }
    // faint axes of symmetry
    ctx.strokeStyle = fg
    ctx.globalAlpha = 0.07
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let k = 0; k < s.sym; k++) {
      const a = (k / s.sym) * Math.PI
      const R = Math.hypot(w, h)
      ctx.moveTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R)
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.drawImage(s.ink, 0, 0, w, h)
    ctx.globalAlpha = 0.6
    ctx.fillStyle = fg
    ctx.font = MONO
    ctx.textAlign = 'right'
    ctx.fillText(`SYMMETRY ${s.sym}`, w - 24, h - 24)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
  },
}

// V · Philosopher: statements quietly sprout questions; the cursor drags a branching line of thought.
const Q = ['Why?', 'How do you know?', 'What do you mean?', 'Is it, though?', 'Compared to what?', 'Says who?', 'Always?', 'For whom?', 'And if not?', 'What follows?', 'Could it be otherwise?', 'Who is asking?']
const STATEMENTS = ['This is real.', 'I am here.', 'Time passes.', 'Things have causes.', 'I know this.']
const philosopher = {
  init(w, h) {
    const r = rng(105)
    const spots = [[0.32, 0.16], [0.6, 0.93], [0.88, 0.12]]
    const nodes = STATEMENTS.slice(0, 3).map((label, i) => ({ x: w * spots[i][0], y: h * spots[i][1], p: -1, label, born: -3, root: true }))
    return { nodes, r, last: 0, trailFrom: -1, lx: null, ly: null, asked: 0 }
  },
  add(s, x, y, p, label, t, w, h) {
    s.nodes.push({ x: clamp(x, 20, w - 140), y: clamp(y, 24, h - 24), p, label, born: t })
    if (label && label.endsWith('?')) {
      s.asked++
      if (s.asked === 14) bus.whisper('philosopher', 'The philosopher asks who is asking.', '#26285e')
    }
    if (s.nodes.length > 110) {
      // forget the oldest thought after the three first statements, and re-point its children
      s.nodes.splice(3, 1)
      for (const n of s.nodes) {
        if (n.p > 3) n.p--
        else if (n.p === 3) n.p = -1
      }
      if (s.trailFrom > 3) s.trailFrom--
    }
    return s.nodes.length - 1
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    // ambient: every few seconds a statement or question sprouts another question
    if (t - s.last > 2.6) {
      s.last = t
      const i = Math.floor(s.r() * s.nodes.length)
      const n = s.nodes[i]
      const a = (s.r() - 0.5) * Math.PI * 1.4 - Math.PI / 2
      philosopher.add(s, n.x + Math.cos(a) * 120, n.y + Math.sin(a) * 70, i, Q[Math.floor(s.r() * Q.length)], t, w, h)
    }
    // the cursor's line of thought, which now and then forks into a question
    if (P.on && (s.lx === null || Math.hypot(P.x - s.lx, P.y - s.ly) > 64)) {
      const id = philosopher.add(s, P.x, P.y, s.trailFrom, '', t, w, h)
      if (s.r() < 0.35) {
        const a = s.r() * TAU
        philosopher.add(s, P.x + Math.cos(a) * 90, P.y + Math.sin(a) * 60, id, Q[Math.floor(s.r() * Q.length)], t, w, h)
      }
      s.trailFrom = id
      s.lx = P.x
      s.ly = P.y
    }
    if (!P.on) s.trailFrom = -1
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.lineWidth = 1
    for (const n of s.nodes) {
      if (n.p < 0 || !s.nodes[n.p]) continue
      const q = s.nodes[n.p]
      const g = clamp((t - n.born) * 1.5)
      ctx.globalAlpha = 0.32
      ctx.beginPath()
      ctx.moveTo(q.x, q.y)
      const mx = (q.x + n.x) / 2 + (n.y - q.y) * 0.2
      const my = (q.y + n.y) / 2 - (n.x - q.x) * 0.2
      ctx.quadraticCurveTo(mx, my, lerp(q.x, n.x, g), lerp(q.y, n.y, g))
      ctx.stroke()
    }
    for (const n of s.nodes) {
      const g = clamp((t - n.born) * 1.2 - 0.4)
      ctx.globalAlpha = (n.root ? 0.7 : 0.55) * g
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.root ? 3.5 : 2, 0, TAU)
      ctx.fill()
      if (n.label) {
        ctx.font = n.root ? 'italic 20px "Instrument Serif", serif' : SERIF_I
        ctx.fillText(n.label, n.x + 8, n.y - 6)
      }
    }
    ctx.globalAlpha = 1
  },
  down(s, P, w, h) {
    const t = s.now || 0
    const id = philosopher.add(s, P.x, P.y, -1, STATEMENTS[Math.floor(s.r() * STATEMENTS.length)], t, w, h)
    s.nodes[id].root = true
    for (let k = 0; k < 2; k++) {
      const a = -Math.PI / 2 + (k ? 0.7 : -0.7)
      philosopher.add(s, P.x + Math.cos(a) * 110, P.y + Math.sin(a) * 70, id, Q[Math.floor(s.r() * Q.length)], t + 0.3 * k, w, h)
    }
  },
}

// VI · Explorer: a procedural map under fog. A lantern goes with the cursor; what it lights stays lit.
// Somewhere in a corner is a place that is not on any list.
const PLACES = ['Cape Unknown', 'The Long Valley', 'Halfway Spring', 'Last Ridge', 'Island of Doubt', 'The Narrows', 'Old Harbour', 'Saltmarsh']
const explorer = {
  init(w, h, { fg, bg }) {
    const make = () => {
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(w))
      c.height = Math.max(1, Math.round(h))
      return [c, c.getContext('2d')]
    }
    const r = rng(107)
    const waves = Array.from({ length: 7 }, () => [r() * 0.012 + 0.003, r() * 0.012 + 0.003, r() * TAU, 0.3 + r() * 0.7])
    const f = (x, y) => waves.reduce((s, [a, b, p, amp]) => s + Math.sin(x * a + p) * Math.cos(y * b - p) * amp, 0) / 2.4
    const [map, mx] = make()
    mx.fillStyle = fg
    for (let y = 0; y < h; y += 4)
      for (let x = 0; x < w; x += 4) {
        const v = f(x, y)
        if (v < -0.3) {
          if ((x + y) % 16 === 0) mx.fillRect(x, y, 1.3, 1.3)
        } else if ((((v * 8) % 1) + 1) % 1 < 0.12) mx.fillRect(x, y, 1.6, 1.6)
      }
    mx.font = 'italic 15px "Instrument Serif", serif'
    const marks = PLACES.map((n) => [n, 60 + r() * (w - 200), 60 + r() * (h - 120)])
    for (const [n, x, y] of marks) {
      mx.beginPath()
      mx.moveTo(x, y - 7)
      mx.lineTo(x + 6, y + 4)
      mx.lineTo(x - 6, y + 4)
      mx.closePath()
      mx.fill()
      mx.fillText(n, x + 10, y + 5)
    }
    const corner = Math.floor(r() * 4)
    const hidden = { x: corner % 2 ? w - 110 : 70, y: corner < 2 ? 70 : h - 70 }
    const [fog, fx] = make()
    fx.fillStyle = bg
    fx.fillRect(0, 0, w, h)
    fx.globalAlpha = 0.18
    fx.strokeStyle = fg
    for (let i = -h; i < w; i += 16) {
      fx.beginPath()
      fx.moveTo(i, 0)
      fx.lineTo(i + h, h)
      fx.stroke()
    }
    fx.globalAlpha = 1
    fx.globalCompositeOperation = 'destination-out'
    return { map, fog, fx, seen: new Uint8Array(48 * 30), hidden, found: false, time: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    if (P.on) {
      s.fx.beginPath()
      s.fx.arc(P.x, P.y, 74, 0, TAU)
      s.fx.fill()
      for (let gy = -3; gy <= 3; gy++)
        for (let gx = -3; gx <= 3; gx++) {
          const cx = Math.floor((P.x / w) * 48) + gx
          const cy = Math.floor((P.y / h) * 30) + gy
          if (cx >= 0 && cx < 48 && cy >= 0 && cy < 30 && gx * gx + gy * gy <= 9) s.seen[cy * 48 + cx] = 1
        }
      if (P.speed > 20) s.time += dt
      if (s.time > 22) bus.whisper('explorer', 'The explorer notices you.', '#0e7a52')
    }
    // the map stays a little faint, so the words above it can still be read
    ctx.globalAlpha = 0.6
    ctx.drawImage(s.map, 0, 0, w, h)
    ctx.globalAlpha = 1
    ctx.drawImage(s.fog, 0, 0, w, h)
    // the four corners, all explored, give up the hidden place
    if (!s.found) {
      const corner = (x0, y0) => {
        let n = 0
        for (let y = y0; y < y0 + 6; y++) for (let x = x0; x < x0 + 8; x++) n += s.seen[y * 48 + x]
        return n / 48
      }
      if ([corner(0, 0), corner(40, 0), corner(0, 24), corner(40, 24)].every((v) => v > 0.8)) {
        s.found = true
        s.foundT = t
        bus.whisper('terra', 'Terra Incognita: found. You have walked to the edge of every map.', '#0e7a52')
      }
    }
    if (s.found) {
      const k = clamp((t - s.foundT) / 2)
      ctx.globalAlpha = k
      ctx.strokeStyle = fg
      ctx.fillStyle = fg
      ctx.lineWidth = 2
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(s.hidden.x, s.hidden.y, 14 + i * 12 + ((t * 10) % 12), 0, TAU)
        ctx.stroke()
      }
      ctx.font = 'italic 22px "Instrument Serif", serif'
      ctx.fillText('Terra Incognita', s.hidden.x + 34, s.hidden.y + 6)
    }
    if (P.on) {
      ctx.globalAlpha = 0.7
      ctx.strokeStyle = fg
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(P.x, P.y, 74, 0, TAU)
      ctx.stroke()
    }
    const pct = Math.round((s.seen.reduce((a, v) => a + v, 0) / s.seen.length) * 100)
    ctx.globalAlpha = 0.7
    ctx.fillStyle = fg
    ctx.font = MONO
    ctx.textAlign = 'right'
    ctx.fillText(`CHARTED ${pct}%`, w - 24, h - 24)
    ctx.textAlign = 'left'
    ctx.globalAlpha = 1
  },
}

// VII · Monk: almost nothing. One breathing circle. Movement disturbs; stillness returns calm.
const monk = {
  init() {
    return { D: 0, ripples: [], last: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    if (P.on && P.speed > 15) {
      s.D = Math.min(1, s.D + P.speed * dt * 0.0012)
      if (t - s.last > 0.18) {
        s.last = t
        s.ripples.push({ x: P.x, y: P.y, t, a: Math.min(1, P.speed / 900) })
      }
    } else s.D *= Math.exp(-dt * 0.35)
    s.ripples = s.ripples.filter((q) => t - q.t < 5)
    ctx.strokeStyle = fg
    for (const q of s.ripples) {
      const k = (t - q.t) / 5
      ctx.globalAlpha = (1 - k) * 0.35 * (0.4 + q.a)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(q.x, q.y, 8 + k * 160, 0, TAU)
      ctx.stroke()
    }
    // inhale over four seconds, exhale over six
    const cyc = t % 10
    const breath = cyc < 4 ? Math.sin((cyc / 4) * (Math.PI / 2)) : Math.cos(((cyc - 4) / 6) * (Math.PI / 2))
    // one large circle around the whole plate, so it shows in every gap between the words
    const cx = w * 0.5
    const cy = h * 0.54
    const R = Math.min(w, h) * (0.44 + breath * 0.03)
    ctx.globalAlpha = 0.65
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let k = 0; k <= 120; k++) {
      const a = (k / 120) * TAU
      const n = s.D * 26 * Math.sin(a * 5 + t * 3) * Math.sin(a * 3 - t * 2)
      const x = cx + Math.cos(a) * (R + n)
      const y = cy + Math.sin(a) * (R + n)
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  },
}

// VIII · Sovereign: a crowd. Near the cursor it falls into formation, rank by rank; where the cursor
// stands across the width decides the formation.
const FORMS = ['ranks', 'rings', 'wedge', 'column']
const slot = (form, k) => {
  switch (form) {
    case 'rings': {
      let ring = 0
      let n = k
      while (n >= 6 + ring * 6) {
        n -= 6 + ring * 6
        ring++
      }
      const a = (n / (6 + ring * 6)) * TAU
      return [Math.cos(a) * (24 + ring * 22), Math.sin(a) * (24 + ring * 22)]
    }
    case 'wedge': {
      let row = 0
      let n = k
      while (n > row * 2) {
        n -= row * 2 + 1
        row++
      }
      return [(n - row) * 18, 20 + row * 18]
    }
    case 'column':
      return [((k % 3) - 1) * 18, 24 + Math.floor(k / 3) * 16]
    default:
      return [((k % 9) - 4) * 18, 24 + Math.floor(k / 9) * 18]
  }
}
const sovereign = {
  init(w, h) {
    const r = rng(109)
    return { ps: Array.from({ length: 200 }, () => ({ x: r() * w, y: r() * h, vx: 0, vy: 0, rank: -1 })), form: 'ranks', seen: new Set(), sortT: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    if (P.on) {
      s.form = FORMS[clamp(Math.floor((P.x / w) * 4), 0, 3)]
      s.seen.add(s.form)
      if (s.seen.size === 4) bus.whisper('sovereign', 'The sovereign acknowledges you.', '#5a2a8a')
    }
    // every so often the crowd re-sorts itself by nearness: hierarchy is distance from power
    if (P.on && t - s.sortT > 0.3) {
      s.sortT = t
      const near = s.ps.map((p, i) => [Math.hypot(p.x - P.x, p.y - P.y), i]).filter(([d]) => d < 300).sort((a, b) => a[0] - b[0])
      s.ps.forEach((p) => (p.rank = -1))
      near.slice(0, 81).forEach(([, i], k) => (s.ps[i].rank = k))
    }
    if (!P.on) s.ps.forEach((p) => (p.rank = -1))
    ctx.fillStyle = fg
    for (const p of s.ps) {
      if (p.rank >= 0) {
        const [ox, oy] = slot(s.form, p.rank)
        p.vx += (P.x + ox - p.x) * dt * 7
        p.vy += (P.y + oy - p.y) * dt * 7
      } else {
        p.vx += (Math.random() - 0.5) * 120 * dt
        p.vy += (Math.random() - 0.5) * 120 * dt
      }
      p.vx *= Math.exp(-dt * 4)
      p.vy *= Math.exp(-dt * 4)
      p.x = clamp(p.x + p.vx * dt, 2, w - 2)
      p.y = clamp(p.y + p.vy * dt, 2, h - 2)
      const sz = p.rank >= 0 ? 6 - Math.min(3.5, p.rank / 14) : 2.5
      ctx.globalAlpha = p.rank >= 0 ? 0.9 : 0.35
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz)
    }
    if (P.on) {
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.moveTo(P.x, P.y - 9)
      ctx.lineTo(P.x + 7, P.y)
      ctx.lineTo(P.x, P.y + 9)
      ctx.lineTo(P.x - 7, P.y)
      ctx.fill()
      ctx.font = MONO
      ctx.globalAlpha = 0.7
      ctx.fillText(s.form.toUpperCase(), P.x + 14, P.y - 12)
    }
    ctx.globalAlpha = 1
  },
}

// IX · Hedonist: light. Movement leaves small blooms; a press makes a large one, with ripples.
const BLOOM = ['#fff1e6', '#ffd23f', '#e8432e', '#ffffff', '#ffb3d6']
const hedonist = {
  init() {
    return { blooms: [], last: 0, clicks: [] }
  },
  spawn(s, x, y, t, big) {
    s.blooms.push({ x, y, t, big, c: BLOOM[Math.floor(Math.random() * BLOOM.length)], rot: Math.random() * TAU, petals: 5 + Math.floor(Math.random() * 3) })
    if (s.blooms.length > 90) s.blooms.shift()
  },
  step(s, ctx, t, dt, P, w, h) {
    s.now = t
    if (P.on && P.speed > 30 && t - s.last > 0.07) {
      s.last = t
      hedonist.spawn(s, P.x, P.y, t, false)
    }
    if (!P.on && t - s.last > 3.5) {
      s.last = t
      hedonist.spawn(s, w * (0.1 + Math.random() * 0.8), h * (0.1 + Math.random() * 0.8), t, false)
    }
    s.blooms = s.blooms.filter((b) => t - b.t < (b.big ? 4.5 : 2.8))
    for (const b of s.blooms) {
      const life = b.big ? 4.5 : 2.8
      const k = (t - b.t) / life
      const R = (b.big ? 120 : 34) * Math.sqrt(k + 0.05)
      const al = (1 - k) * (b.big ? 0.75 : 0.5)
      ctx.fillStyle = b.c
      // petals open, then fade
      for (let i = 0; i < b.petals; i++) {
        const a = b.rot + (i / b.petals) * TAU + k * 0.6
        ctx.globalAlpha = al * 0.4
        ctx.beginPath()
        ctx.ellipse(b.x + Math.cos(a) * R * 0.55, b.y + Math.sin(a) * R * 0.55, R * 0.5, R * 0.22, a, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = al
      ctx.beginPath()
      ctx.arc(b.x, b.y, R * 0.18, 0, TAU)
      ctx.fill()
      if (b.big) {
        ctx.strokeStyle = b.c
        ctx.lineWidth = 1.5
        for (let j = 0; j < 3; j++) {
          const kk = clamp(k * 1.6 - j * 0.12)
          ctx.globalAlpha = (1 - kk) * 0.6
          ctx.beginPath()
          ctx.arc(b.x, b.y, 20 + kk * 260, 0, TAU)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
  },
  down(s, P) {
    const t = performance.now() / 1000
    s.clicks = s.clicks.filter((c) => t - c < 8)
    s.clicks.push(t)
    if (s.clicks.length >= 10) bus.whisper('hedonist', 'The hedonist is pleased.', '#f47c6c')
    hedonist.spawn(s, P.x, P.y, s.now || 0, true)
  },
}

// X · Trickster: the floor is not reliable. A dot field glitches by rows; near the cursor it twists.
const trickster = {
  init() {
    return { shifts: new Float32Array(40), next: 0, blocks: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg, bg }) {
    const gap = 28
    const rows = Math.ceil(h / gap)
    if (t > s.next) {
      s.next = t + 0.6 + Math.random() * 1.6
      const r0 = Math.floor(Math.random() * rows)
      const n = 1 + Math.floor(Math.random() * 4)
      const d = (Math.random() - 0.5) * 120
      for (let r = r0; r < Math.min(rows, r0 + n); r++) s.shifts[r % 40] = d
      if (Math.random() < 0.5) s.blocks.push({ x: Math.random() * w, y: Math.random() * h, w: 40 + Math.random() * 200, h: 6 + Math.random() * 24, t })
    }
    for (let r = 0; r < 40; r++) s.shifts[r] *= Math.exp(-dt * 1.2)
    s.blocks = s.blocks.filter((b) => t - b.t < 0.5)
    ctx.fillStyle = fg
    for (let r = 0; r < rows; r++) {
      const y = r * gap + gap / 2
      for (let x = gap / 2; x < w; x += gap) {
        let X = x + s.shifts[r % 40]
        let Y = y
        if (P.on) {
          // the cursor twists the floor around itself
          const dx = X - P.x
          const dy = Y - P.y
          const d = Math.hypot(dx, dy)
          if (d < 150) {
            const a = (1 - d / 150) * 1.6
            X = P.x + dx * Math.cos(a) - dy * Math.sin(a)
            Y = P.y + dx * Math.sin(a) + dy * Math.cos(a)
          }
        }
        ctx.globalAlpha = 0.35
        ctx.fillRect(X - 1.5, Y - 1.5, 3, 3)
      }
    }
    for (const b of s.blocks) {
      ctx.globalAlpha = 0.85
      ctx.fillStyle = Math.random() < 0.5 ? fg : bg
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.fillStyle = fg
    }
    ctx.globalAlpha = 1
  },
}

export const WORLDS = { scientist, engineer, warrior, artist, philosopher, explorer, monk, sovereign, hedonist, trickster, ...MORE }
