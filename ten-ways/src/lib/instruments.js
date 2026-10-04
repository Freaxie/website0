// Small instruments, one per archetype (the second ten live in instruments-more.js). Each draws its way of meeting the world on a canvas:
//   init(w, h, look)                       -> state
//   step(state, ctx, t, dt, P, w, h, look) draws one frame
//   click(state, P, w, h)                  optional
// P is the pointer in canvas pixels: { x, y, on, speed }. look = { fg, bg }.
import { TAU, clamp, lerp, rng } from './geom.js'
import { MORE } from './instruments-more.js'

const MONO = '500 11px "JetBrains Mono", monospace'

function readout(ctx, text, x, y, fg, align = 'left') {
  ctx.globalAlpha = 1
  ctx.font = MONO
  ctx.textAlign = align
  ctx.fillStyle = fg
  ctx.fillText(text.toUpperCase(), x, y)
}

// I · Scientist: observations, and the straight line that best explains them.
const scientist = {
  init() {
    const r = rng(1)
    return { pts: Array.from({ length: 14 }, () => { const x = 0.08 + r() * 0.84; return [x, clamp(0.2 + 0.55 * x + (r() - 0.5) * 0.22)] }) }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const m = 34
    const X = (x) => m + x * (w - 2 * m)
    const Y = (y) => h - m - y * (h - 2 * m)
    ctx.strokeStyle = fg
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.moveTo(m, m)
    ctx.lineTo(m, h - m)
    ctx.lineTo(w - m, h - m)
    ctx.stroke()
    const n = s.pts.length
    const mx = s.pts.reduce((a, p) => a + p[0], 0) / n
    const my = s.pts.reduce((a, p) => a + p[1], 0) / n
    let sxy = 0
    let sxx = 0
    let syy = 0
    for (const [x, y] of s.pts) {
      sxy += (x - mx) * (y - my)
      sxx += (x - mx) ** 2
      syy += (y - my) ** 2
    }
    const b = sxx ? sxy / sxx : 0
    const a = my - b * mx
    const r2 = sxx && syy ? (sxy * sxy) / (sxx * syy) : 0
    ctx.globalAlpha = 0.35
    for (const [x, y] of s.pts) {
      ctx.beginPath()
      ctx.moveTo(X(x), Y(y))
      ctx.lineTo(X(x), Y(a + b * x))
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(X(0), Y(a))
    ctx.lineTo(X(1), Y(a + b))
    ctx.stroke()
    ctx.fillStyle = fg
    for (const [x, y] of s.pts) {
      ctx.beginPath()
      ctx.arc(X(x), Y(y), 4, 0, TAU)
      ctx.fill()
    }
    if (P.on) {
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(P.x, P.y, 7, 0, TAU)
      ctx.stroke()
    }
    readout(ctx, `n = ${n}   slope ${b.toFixed(2)}   r² ${r2.toFixed(2)}`, m, m - 12, fg)
  },
  click(s, P, w, h) {
    const m = 34
    s.pts.push([clamp((P.x - m) / (w - 2 * m)), clamp((h - m - P.y) / (h - 2 * m))])
    if (s.pts.length > 80) s.pts.shift()
  },
}

// II · Engineer: a truss carrying a load, its sag drawn two hundred times larger than life.
const engineer = {
  init() {
    return { a: 0.5 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const m = 40
    const L = w - 2 * m
    const base = h * 0.58
    const H = Math.min(80, L / 7)
    const N = 10
    const target = P.on ? clamp((P.x - m) / L, 0.02, 0.98) : 0.5 + 0.42 * Math.sin(t * 0.45)
    s.a += (target - s.a) * Math.min(1, dt * 3)
    const a = s.a
    const sag = (u) => (u <= a ? (1 - a) * u * (1 - (1 - a) ** 2 - u * u) : a * (1 - u) * (1 - a * a - (1 - u) ** 2))
    const k = (H * 0.9) / 0.125
    const bot = Array.from({ length: N + 1 }, (_, i) => { const u = i / N; return [m + u * L, base + sag(u) * k, u] })
    const top = Array.from({ length: N }, (_, i) => { const u = (i + 0.5) / N; return [m + u * L, base - H + sag(u) * k, u] })
    const member = (p, q) => {
      const u = (p[2] + q[2]) / 2
      ctx.lineWidth = 1 + 4 * Math.exp(-((u - a) ** 2) / 0.015)
      ctx.beginPath()
      ctx.moveTo(p[0], p[1])
      ctx.lineTo(q[0], q[1])
      ctx.stroke()
    }
    ctx.strokeStyle = fg
    ctx.globalAlpha = 1
    for (let i = 0; i < N; i++) {
      member(bot[i], bot[i + 1])
      member(bot[i], top[i])
      member(top[i], bot[i + 1])
      if (i < N - 1) member(top[i], top[i + 1])
    }
    // the unloaded shape, for comparison
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    ctx.moveTo(m, base)
    ctx.lineTo(m + L, base)
    ctx.stroke()
    ctx.setLineDash([])
    // supports and ground
    ctx.globalAlpha = 1
    ctx.fillStyle = fg
    for (const x of [m, m + L]) {
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.lineTo(x - 12, base + 20)
      ctx.lineTo(x + 12, base + 20)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillRect(0, base + 20, m + 14, 3)
    ctx.fillRect(m + L - 14, base + 20, w, 3)
    // the load
    const lx = m + a * L
    const ly = base - H + sag(a) * k
    ctx.fillRect(lx - 16, ly - 58, 32, 26)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(lx, ly - 32)
    ctx.lineTo(lx, ly - 6)
    ctx.moveTo(lx - 6, ly - 12)
    ctx.lineTo(lx, ly - 4)
    ctx.lineTo(lx + 6, ly - 12)
    ctx.stroke()
    readout(ctx, `load at ${Math.round(a * 100)}% of span · sag drawn 200×`, m, h - 22, fg)
  },
}

// III · Warrior: a current that pushes back, and a blade that goes through it.
const warrior = {
  init(w, h) {
    const r = rng(3)
    return { ps: Array.from({ length: 360 }, () => ({ x: r() * w, y: r() * h, vx: -(50 + r() * 70), vy: 0, base: -(50 + r() * 70) })), trail: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const B = P.on ? { x: P.x, y: P.y } : { x: w * 0.5 + Math.sin(t * 0.8) * w * 0.32, y: h * 0.5 + Math.sin(t * 1.7) * h * 0.3 }
    s.trail.push(B)
    if (s.trail.length > 18) s.trail.shift()
    const R = Math.min(90, w * 0.14)
    ctx.strokeStyle = fg
    ctx.lineWidth = 1.2
    for (const p of s.ps) {
      const dx = p.x - B.x
      const dy = p.y - B.y
      const d = Math.hypot(dx, dy) || 1
      if (d < R) {
        const f = ((R - d) / R) * 900 * dt
        p.vx += (dx / d) * f
        p.vy += (dy / d) * f
      }
      p.vx += (p.base - p.vx) * Math.min(1, dt * 1.5)
      p.vy *= Math.exp(-dt * 2)
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.x < -10) {
        p.x = w + 10
        p.y = Math.random() * h
      }
      if (p.x > w + 20) p.x = -5
      if (p.y < -10) p.y = h + 5
      if (p.y > h + 10) p.y = -5
      const sp = Math.hypot(p.vx, p.vy) || 1
      ctx.globalAlpha = 0.65
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - (p.vx / sp) * 9, p.y - (p.vy / sp) * 9)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    s.trail.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
    ctx.stroke()
    ctx.lineCap = 'butt'
    readout(ctx, 'The current never stops. Neither do you.', 20, h - 18, fg)
  },
}

// IV · Artist: every mark is answered five more times, turned around a centre.
const artist = {
  init() {
    return { strokes: [], cur: null, lastOn: false, hue: 0, autoT: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const cx = w / 2
    const cy = h / 2
    const inks = [fg, '#ffd23f', '#0c0c0c', '#ffb3d6']
    let pt = null
    if (P.on) pt = [P.x - cx, P.y - cy]
    else {
      s.autoT += dt
      const q = s.autoT * 0.9
      pt = [Math.sin(q * 1.3) * w * 0.32 * Math.cos(q * 0.21), Math.sin(q * 1.7 + 1) * h * 0.3]
    }
    const fresh = P.on !== s.lastOn || !s.cur || (!P.on && s.cur.pts.length > 160)
    if (fresh) {
      s.cur = { pts: [], col: inks[s.hue++ % inks.length], born: t }
      s.strokes.push(s.cur)
      if (s.strokes.length > 24) s.strokes.shift()
    }
    s.lastOn = P.on
    if (P.on ? P.speed > 0 : true) s.cur.pts.push(pt)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const st of s.strokes) {
      const age = t - st.born
      const alpha = Math.max(0, 1 - age / 24)
      if (alpha <= 0 || st.pts.length < 2) continue
      ctx.strokeStyle = st.col
      ctx.lineWidth = 2.2
      ctx.globalAlpha = alpha
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU
        const c = Math.cos(ang)
        const sn = Math.sin(ang)
        ctx.beginPath()
        st.pts.forEach(([x, y], i) => {
          const X = cx + x * c - y * sn
          const Y = cy + x * sn + y * c
          i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
        })
        ctx.stroke()
      }
    }
    ctx.lineCap = 'butt'
    ctx.globalAlpha = 1
  },
}

// V · Philosopher: a statement, and the questions that grow out of it.
const QUESTIONS = ['Why?', 'How do you know?', 'What do you mean by that?', 'Is it, though?', 'Compared to what?', 'Says who?', 'What follows?', 'Always?', 'Could it be otherwise?', 'What is “real”?', 'For whom?', 'And if not?']
const philosopher = {
  init() {
    return { nodes: [{ x: 0.5, y: 0.9, label: 'This is real.', p: -1, born: 0, kids: 0 }], last: 0, idle: 0, r: rng(5) }
  },
  add(s, x, y, parent, t) {
    s.nodes.push({ x, y, label: QUESTIONS[Math.floor(s.r() * QUESTIONS.length)], p: parent, born: t, kids: 0 })
    s.nodes[parent].kids++
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.t = t
    s.idle = P.on ? 0 : s.idle + dt
    if (s.idle > 1.5 && t - s.last > 1.3) {
      s.last = t
      if (s.nodes.length > 26) Object.assign(s, philosopher.init(), { last: t, idle: s.idle })
      else {
        const open = s.nodes.map((n, i) => [n, i]).filter(([n]) => n.kids < 2 && n.y > 0.14)
        const [n, i] = open[Math.floor(s.r() * open.length)] || [s.nodes[0], 0]
        // try a few directions; a question too close to another is not asked
        for (let k = 0; k < 8; k++) {
          const ang = -Math.PI / 2 + (s.r() - 0.5) * 2.4
          const x = clamp(n.x + Math.cos(ang) * 0.22, 0.08, 0.92)
          const y = clamp(n.y + Math.sin(ang) * 0.17, 0.06, 0.92)
          if (s.nodes.every((o) => Math.hypot((o.x - x) * 1.6, o.y - y) > 0.14)) {
            philosopher.add(s, x, y, i, t)
            break
          }
        }
      }
    }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.lineWidth = 1
    for (const n of s.nodes) {
      if (n.p < 0) continue
      const q = s.nodes[n.p]
      ctx.globalAlpha = Math.min(1, (t - n.born) * 2) * 0.55
      ctx.beginPath()
      ctx.moveTo(q.x * w, q.y * h)
      ctx.lineTo(n.x * w, n.y * h)
      ctx.stroke()
    }
    for (const [i, n] of s.nodes.entries()) {
      ctx.globalAlpha = Math.min(1, (t - n.born) * 2)
      ctx.beginPath()
      ctx.arc(n.x * w, n.y * h, i ? 3 : 5, 0, TAU)
      ctx.fill()
      ctx.font = i ? 'italic 15px "Instrument Serif", serif' : 'italic 20px "Instrument Serif", serif'
      ctx.textAlign = n.x > 0.7 ? 'right' : 'left'
      ctx.fillText(n.label, n.x * w + (n.x > 0.7 ? -9 : 9), n.y * h - 7)
    }
    ctx.globalAlpha = 1
  },
  click(s, P, w, h) {
    let best = 0
    let bd = 1e9
    s.nodes.forEach((n, i) => {
      const d = Math.hypot(n.x * w - P.x, n.y * h - P.y)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    if (s.nodes.length > 40) return
    philosopher.add(s, clamp(P.x / w, 0.05, 0.95), clamp(P.y / h, 0.05, 0.95), best, s.t || 0)
  },
}

// VI · Explorer: a map under fog. What you uncover stays uncovered.
const explorer = {
  init(w, h, { fg, bg }) {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const make = () => {
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(w * dpr))
      c.height = Math.max(1, Math.round(h * dpr))
      const x = c.getContext('2d')
      x.scale(dpr, dpr)
      return [c, x]
    }
    const [map, mx] = make()
    const r = rng(6)
    const waves = Array.from({ length: 6 }, () => [r() * 0.03 + 0.006, r() * 0.03 + 0.006, r() * TAU, 0.3 + r() * 0.7])
    const f = (x, y) => waves.reduce((s, [a, b, p, amp]) => s + Math.sin(x * a + p) * Math.cos(y * b - p) * amp, 0) / 2.2
    mx.fillStyle = fg
    for (let y = 0; y < h; y += 3)
      for (let x = 0; x < w; x += 3) {
        const v = f(x, y)
        if (v < -0.32) {
          if ((x + y) % 12 === 0) mx.fillRect(x, y, 1.2, 1.2) // water
        } else if (((v * 7) % 1 + 1) % 1 < 0.13) mx.fillRect(x, y, 1.5, 1.5) // contour bands
      }
    // a few named places
    mx.font = 'italic 14px "Instrument Serif", serif'
    const names = ['Cape Unknown', 'The Long Valley', 'Halfway Spring', 'Last Ridge', 'Island of Doubt']
    names.forEach((n, i) => {
      const x = 40 + r() * (w - 140)
      const y = 40 + r() * (h - 80)
      mx.beginPath()
      mx.moveTo(x, y - 6)
      mx.lineTo(x + 5, y + 3)
      mx.lineTo(x - 5, y + 3)
      mx.closePath()
      mx.fill()
      mx.fillText(n, x + 9, y + 4)
    })
    const [fog, fx] = make()
    fx.fillStyle = bg
    fx.fillRect(0, 0, w, h)
    fx.globalAlpha = 0.25
    fx.strokeStyle = fg
    for (let i = -h; i < w; i += 14) {
      fx.beginPath()
      fx.moveTo(i, 0)
      fx.lineTo(i + h, h)
      fx.stroke()
    }
    fx.globalAlpha = 1
    fx.globalCompositeOperation = 'destination-out'
    return { map, fog, fx, seen: new Uint8Array(40 * 30), walker: { x: w * 0.2, y: h * 0.5, a: 0 } }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    let at
    if (P.on) at = { x: P.x, y: P.y }
    else {
      const k = s.walker
      k.a += (Math.random() - 0.5) * dt * 6
      k.x += Math.cos(k.a) * 70 * dt
      k.y += Math.sin(k.a) * 70 * dt
      if (k.x < 20 || k.x > w - 20) k.a = Math.PI - k.a
      if (k.y < 20 || k.y > h - 20) k.a = -k.a
      k.x = clamp(k.x, 20, w - 20)
      k.y = clamp(k.y, 20, h - 20)
      at = k
    }
    s.fx.beginPath()
    s.fx.arc(at.x, at.y, 46, 0, TAU)
    s.fx.fill()
    for (let gy = -2; gy <= 2; gy++)
      for (let gx = -2; gx <= 2; gx++) {
        const cx = Math.floor((at.x / w) * 40) + gx
        const cy = Math.floor((at.y / h) * 30) + gy
        if (cx >= 0 && cx < 40 && cy >= 0 && cy < 30) s.seen[cy * 40 + cx] = 1
      }
    ctx.globalAlpha = 1
    ctx.drawImage(s.map, 0, 0, w, h)
    ctx.drawImage(s.fog, 0, 0, w, h)
    ctx.strokeStyle = fg
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(at.x, at.y, 7, 0, TAU)
    ctx.stroke()
    const pct = Math.round((s.seen.reduce((a, v) => a + v, 0) / s.seen.length) * 100)
    readout(ctx, `explored ${pct}%`, w - 18, h - 18, fg, 'right')
  },
}

// VII · Monk: agitation settles only in stillness, into an open circle.
const monk = {
  init() {
    const r = rng(7)
    return { A: 1, ps: Array.from({ length: 280 }, () => ({ k: r(), off: (r() - 0.5) * 2, f1: 0.5 + r() * 1.5, f2: 0.5 + r() * 1.5, ph: r() * TAU, sz: 0.8 + r() * 1.6 })) }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const moving = P.on && P.speed > 12
    if (moving) s.A = Math.min(1, s.A + P.speed * dt * 0.006)
    else s.A *= Math.exp(-dt * 0.55)
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.32
    ctx.fillStyle = fg
    for (const p of s.ps) {
      // the brush: thick where it starts, thin where it trails off
      const ang = (-50 - p.k * 322) * (Math.PI / 180)
      const thick = lerp(16, 2, p.k)
      const rr = R + p.off * thick
      const tx = cx + Math.cos(ang) * rr
      const ty = cy + Math.sin(ang) * rr
      const wob = s.A * Math.min(w, h) * 0.45
      const x = tx + Math.sin(t * p.f1 + p.ph) * wob * Math.cos(p.ph * 3)
      const y = ty + Math.cos(t * p.f2 + p.ph) * wob * Math.sin(p.ph * 2)
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.arc(x, y, p.sz, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    readout(ctx, `stillness ${Math.round((1 - s.A) * 100)}%`, w - 18, h - 18, fg, 'right')
  },
}

// VIII · Sovereign: a crowd, and the order that forms around the one who stands in it.
const sovereign = {
  init(w, h) {
    const r = rng(8)
    return { I: 0, ps: Array.from({ length: 144 }, () => ({ x: r() * w, y: r() * h, vx: 0, vy: 0 })) }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    // left alone, the crowd gathers and disperses on its own, slowly
    const want = P.on ? 1 : Math.sin(t * 0.32) > 0.2 ? 1 : 0
    s.I += (want - s.I) * Math.min(1, dt * (want ? 1.2 : 0.5))
    const c = P.on ? { x: P.x, y: P.y } : { x: w / 2 + Math.sin(t * 0.3) * w * 0.15, y: h / 2 }
    const gap = Math.min(20, Math.min(w, h) / 16)
    ctx.fillStyle = fg
    s.ps.forEach((p, i) => {
      const col = i % 12
      const row = Math.floor(i / 12)
      const tx = c.x + (col - 5.5) * gap
      const ty = c.y + (row - 5.5) * gap
      p.vx += (tx - p.x) * s.I * dt * 6 + (Math.random() - 0.5) * 260 * (1 - s.I) * dt
      p.vy += (ty - p.y) * s.I * dt * 6 + (Math.random() - 0.5) * 260 * (1 - s.I) * dt
      p.vx *= Math.exp(-dt * 3)
      p.vy *= Math.exp(-dt * 3)
      p.x = clamp(p.x + p.vx * dt, 4, w - 4)
      p.y = clamp(p.y + p.vy * dt, 4, h - 4)
      ctx.globalAlpha = 0.9
      ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5)
    })
    if (s.I > 0.3) {
      ctx.globalAlpha = s.I
      ctx.strokeStyle = fg
      ctx.lineWidth = 1
      ctx.strokeRect(c.x - 6.5 * gap, c.y - 6.5 * gap, 13 * gap, 13 * gap)
    }
    readout(ctx, `order ${Math.round(s.I * 100)}%`, w - 18, h - 18, fg, 'right')
  },
}

// IX · Hedonist: every touch blooms, and fades.
const hedonist = {
  init() {
    return { blooms: [], last: 0 }
  },
  step(s, ctx, t, dt, P, w, h) {
    const cols = ['#fff1e6', '#ffd23f', '#e8432e', '#0c0c0c', '#ffffff']
    if (P.on ? P.speed > 15 && t - s.last > 0.06 : t - s.last > 0.45) {
      s.last = t
      const x = P.on ? P.x : w * (0.15 + Math.random() * 0.7)
      const y = P.on ? P.y : h * (0.15 + Math.random() * 0.7)
      s.blooms.push({ x, y, born: t, col: cols[Math.floor(Math.random() * cols.length)], size: 0.6 + Math.random() * 0.9 })
    }
    s.blooms = s.blooms.filter((b) => t - b.born < 3.2)
    for (const b of s.blooms) {
      const age = t - b.born
      const r = (8 + age * 70) * b.size
      const alpha = Math.max(0, 1 - age / 3.2)
      ctx.fillStyle = b.col
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = alpha * 0.22
        ctx.beginPath()
        ctx.arc(b.x, b.y, r * (1 - k * 0.3), 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = alpha
      ctx.strokeStyle = b.col
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(b.x, b.y, r, 0, TAU)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  },
}

// X · Trickster: an orderly sentence that comes undone at a touch, and slowly forgets it did.
const LINES = ['REALITY', 'IS WHAT', 'WE AGREE', 'IT IS.', 'SO WHO', 'AGREED?']
const trickster = {
  init() {
    const tiles = []
    LINES.forEach((line, row) =>
      line.split('').forEach((ch, k) => {
        if (ch !== ' ') tiles.push({ ch, home: ch, row, col: k + (8 - line.length) / 2, rot: 0, dx: 0, dy: 0, inv: 0, wait: 0 })
      }),
    )
    return { tiles, auto: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg, bg }) {
    const cw = Math.min((w - 40) / 8, (h - 70) / LINES.length)
    const ox = (w - cw * 8) / 2
    const oy = (h - cw * LINES.length) / 2
    const letters = LINES.join('').replace(/[^A-Z]/g, '')
    const disturb = (tile) => {
      tile.rot = (Math.random() - 0.5) * 300
      tile.dx = (Math.random() - 0.5) * cw * 1.4
      tile.dy = (Math.random() - 0.5) * cw * 1.4
      tile.inv = Math.random() < 0.5 ? 1 : 0
      tile.ch = letters[Math.floor(Math.random() * letters.length)]
      tile.wait = 1.5 + Math.random() * 2
    }
    s.auto += dt
    if (!P.on && s.auto > 0.9) {
      s.auto = 0
      disturb(s.tiles[Math.floor(Math.random() * s.tiles.length)])
    }
    let calm = 0
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${Math.round(cw * 0.55)}px "Archivo Variable", "Archivo", sans-serif`
    for (const tile of s.tiles) {
      const x = ox + tile.col * cw + cw / 2
      const y = oy + tile.row * cw + cw / 2
      if (P.on && P.speed > 10 && Math.hypot(P.x - x, P.y - y) < cw * 0.9 && tile.wait <= 0.5) disturb(tile)
      tile.wait -= dt
      if (tile.wait <= 0) {
        const k = Math.min(1, dt * 1.6)
        tile.rot -= tile.rot * k
        tile.dx -= tile.dx * k
        tile.dy -= tile.dy * k
        if (Math.abs(tile.rot) < 4) {
          tile.ch = tile.home
          tile.inv = 0
        }
      }
      if (tile.ch === tile.home && Math.abs(tile.rot) < 4) calm++
      ctx.save()
      ctx.translate(x + tile.dx, y + tile.dy)
      ctx.rotate((tile.rot * Math.PI) / 180)
      ctx.globalAlpha = 1
      ctx.strokeStyle = fg
      ctx.lineWidth = 1
      if (tile.inv) {
        ctx.fillStyle = fg
        ctx.fillRect(-cw / 2 + 2, -cw / 2 + 2, cw - 4, cw - 4)
      } else ctx.strokeRect(-cw / 2 + 2, -cw / 2 + 2, cw - 4, cw - 4)
      ctx.fillStyle = tile.inv ? bg : fg
      ctx.fillText(tile.ch, 0, 2)
      ctx.restore()
    }
    ctx.textBaseline = 'alphabetic'
    readout(ctx, `order ${Math.round((calm / s.tiles.length) * 100)}%`, w - 18, h - 18, fg, 'right')
  },
}

export const INSTRUMENTS = { scientist, engineer, warrior, artist, philosopher, explorer, monk, sovereign, hedonist, trickster, ...MORE }
