// Ten more worlds, behind the plates XI to XX. Same contract as worlds.js.
import { TAU, clamp, lerp, rng } from './geom.js'
import { bus } from './bus.js'

const MONO = '500 10px "JetBrains Mono", monospace'
const SERIF_I = 'italic 22px "Instrument Serif", serif'
const RED = '#d2453a'
const PHI = 1.618

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

// XI · Cinephile: the world is projected. Grain, scratches and dust; the cursor is the camera; a click cuts.
const cinephile = {
  init() {
    return { scratches: [], dust: [], cut: 0, cuts: 0, now: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    ctx.fillStyle = fg
    ctx.strokeStyle = fg
    // grain, fresh every frame
    ctx.globalAlpha = 0.12
    for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2)
    // the gate weaves, and the light flickers
    ctx.globalAlpha = 0.015 + Math.random() * 0.025
    ctx.fillRect(0, 0, w, h)
    if (Math.random() < dt * 1.5) s.scratches.push({ x: Math.random() * w, life: 0.2 + Math.random() * 0.6, wob: Math.random() * TAU })
    if (Math.random() < dt * 3) s.dust.push({ x: Math.random() * w, y: Math.random() * h, life: 0.08 + Math.random() * 0.1, r: 1 + Math.random() * 3, hair: Math.random() < 0.3, a: Math.random() * TAU })
    ctx.lineWidth = 1
    for (const q of s.scratches) {
      q.life -= dt
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      for (let y = 0; y <= h; y += 20) {
        const x = q.x + Math.sin(y * 0.01 + q.wob) * 3
        y ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    s.scratches = s.scratches.filter((q) => q.life > 0)
    for (const d of s.dust) {
      d.life -= dt
      ctx.globalAlpha = 0.6
      if (d.hair) {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.quadraticCurveTo(d.x + Math.cos(d.a) * 20, d.y + Math.sin(d.a) * 20, d.x + 30 * Math.cos(d.a + 1), d.y + 30 * Math.sin(d.a + 1))
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, TAU)
        ctx.fill()
      }
    }
    s.dust = s.dust.filter((d) => d.life > 0)
    // letterbox
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#000'
    const lb = Math.max(18, (h - w / 2.39) / 2 * 0.35)
    ctx.fillRect(0, 0, w, lb)
    ctx.fillRect(0, h - lb, w, lb)
    ctx.fillStyle = fg
    // the cursor frames whatever it is over
    if (P.on) {
      const fw = 220
      const fh = fw / 2.39
      const b = 12
      ctx.globalAlpha = 0.7
      ctx.lineWidth = 1.5
      for (const [cx, cy, dx, dy] of [[-1, -1, 1, 1], [1, -1, -1, 1], [-1, 1, 1, -1], [1, 1, -1, -1]]) {
        const x = P.x + (cx * fw) / 2
        const y = P.y + (cy * fh) / 2
        ctx.beginPath()
        ctx.moveTo(x + dx * b, y)
        ctx.lineTo(x, y)
        ctx.lineTo(x, y + dy * b)
        ctx.stroke()
      }
      ctx.font = MONO
      ctx.textAlign = 'left'
      ctx.fillText(`A CAM · ${Math.round(24 + P.speed / 80)}MM`, P.x - fw / 2, P.y - fh / 2 - 8)
    }
    if (s.cut > 0) {
      ctx.globalAlpha = s.cut * 0.5
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = s.cut
      ctx.fillStyle = '#000'
      ctx.font = '700 64px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('CUT', w / 2, h / 2 + 22)
      s.cut -= dt * 3
    }
    ctx.globalAlpha = 1
  },
  down(s) {
    s.cut = 1
    s.cuts++
    if (s.cuts === 6) bus.whisper('cinephile', 'The cinephile would watch you again.', '#efe6d2')
  },
}

// XII · Musician: staves. The cursor writes notes that fall into time; a playhead sounds them out.
const musician = {
  init() {
    return { notes: [], beat: 0, chords: [], count: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const staves = [h * 0.26, h * 0.52, h * 0.78]
    const gap = 12
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.28
    for (const y0 of staves) for (let k = -2; k <= 2; k++) line(ctx, 0, y0 + k * gap, w, y0 + k * gap)
    // eighth notes at 96 beats a minute
    const eighth = 60 / 96 / 2
    s.beat += dt
    if (P.on && P.speed > 40 && s.beat > eighth) {
      s.beat = 0
      const y0 = staves.reduce((a, b) => (Math.abs(b - P.y) < Math.abs(a - P.y) ? b : a))
      const step = clamp(Math.round((P.y - y0) / (gap / 2)), -8, 8)
      s.notes.push({ x: P.x, y: y0 + step * (gap / 2), y0, step, lit: 0 })
      s.count++
      if (s.count === 32) bus.whisper('musician', 'The musician hears you in time.', '#00a0b4')
    }
    // the playhead goes round once every two bars
    const ph = ((t % 5) / 5) * w
    ctx.globalAlpha = 0.5
    line(ctx, ph, staves[0] - 40, ph, staves[2] + 40)
    for (const n of s.notes) {
      n.x -= dt * 26
      if (Math.abs(n.x - ph) < 4) n.lit = 1
      n.lit = Math.max(0, n.lit - dt * 2)
      ctx.globalAlpha = 0.8
      ctx.save()
      ctx.translate(n.x, n.y)
      ctx.rotate(-0.35)
      ctx.beginPath()
      ctx.ellipse(0, 0, 6 + n.lit * 3, 4.2 + n.lit * 2, 0, 0, TAU)
      ctx.fill()
      ctx.restore()
      ctx.lineWidth = 1.2
      const up = n.step > 0
      line(ctx, n.x + (up ? 5.5 : -5.5), n.y, n.x + (up ? 5.5 : -5.5), n.y + (up ? -30 : 30))
      // ledger lines beyond the staff
      ctx.lineWidth = 1
      for (let k = 6; k <= Math.abs(n.step); k += 2) line(ctx, n.x - 10, n.y0 + Math.sign(n.step) * k * (gap / 2), n.x + 10, n.y0 + Math.sign(n.step) * k * (gap / 2))
    }
    s.notes = s.notes.filter((n) => n.x > -20)
    if (s.notes.length > 140) s.notes.shift()
    for (const c of s.chords) {
      const k = (t - c.t) / 2.5
      for (let j = 0; j < 3; j++) {
        const kk = clamp(k - j * 0.1)
        ctx.globalAlpha = (1 - kk) * 0.5
        ctx.beginPath()
        ctx.ellipse(c.x, c.y, 10 + kk * 240, 6 + kk * 90, 0, 0, TAU)
        ctx.stroke()
      }
    }
    s.chords = s.chords.filter((c) => t - c.t < 2.5)
    s.now = t
    ctx.globalAlpha = 1
  },
  down(s, P) {
    s.chords.push({ x: P.x, y: P.y, t: s.now || 0 })
    for (const k of [0, 2, 4]) s.notes.push({ x: P.x, y: P.y - k * 6, y0: P.y, step: -k, lit: 1 })
  },
}

// XIII · Entrepreneur: click to found something. It grows, links to its neighbours, and trades.
const TICK = ['ALPHA', 'NODE', 'LOOP', 'SEED', 'SCALE', 'PIVOT', 'MOAT', 'RUNWAY', 'EXIT', 'FLYWHEEL']
const entrepreneur = {
  init(w, h) {
    const r = rng(113)
    const nodes = Array.from({ length: 3 }, () => ({ x: w * (0.15 + r() * 0.7), y: h * (0.2 + r() * 0.6), v: 1 + r() * 2, born: 0 }))
    return { nodes, links: [[0, 1], [1, 2]], pulses: [], founded: 0, r, tape: Array.from({ length: 30 }, (_, i) => `${TICK[i % TICK.length]} ${(r() * 90 + 10).toFixed(2)} ${r() < 0.7 ? '▲' : '▼'}${(r() * 9).toFixed(1)}%`).join('    ') }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // the ticker, top and bottom, in opposite directions
    ctx.font = MONO
    ctx.globalAlpha = 0.35
    ctx.textAlign = 'left'
    const tw = ctx.measureText(s.tape).width
    const off = (t * 40) % tw
    ctx.fillText(s.tape + '    ' + s.tape, -off, 18)
    ctx.fillText(s.tape + '    ' + s.tape, off - tw, h - 10)
    for (const n of s.nodes) {
      // compounding, until the market saturates
      const near = P.on && Math.hypot(P.x - n.x, P.y - n.y) < 120
      n.v = Math.min(40, n.v * Math.exp(dt * (near ? 0.25 : 0.06)))
    }
    ctx.lineWidth = 1
    for (const [a, b] of s.links) {
      const A = s.nodes[a]
      const B = s.nodes[b]
      ctx.globalAlpha = 0.35
      line(ctx, A.x, A.y, B.x, B.y)
    }
    if (Math.random() < dt * 4 && s.links.length) {
      const [a, b] = s.links[Math.floor(Math.random() * s.links.length)]
      s.pulses.push(Math.random() < 0.5 ? { a, b, k: 0 } : { a: b, b: a, k: 0 })
    }
    for (const p of s.pulses) {
      p.k += dt * 0.8
      const A = s.nodes[p.a]
      const B = s.nodes[p.b]
      ctx.globalAlpha = 0.9
      ctx.fillRect(lerp(A.x, B.x, p.k) - 2, lerp(A.y, B.y, p.k) - 2, 4, 4)
    }
    s.pulses = s.pulses.filter((p) => p.k < 1)
    for (const n of s.nodes) {
      const R = 3 + Math.sqrt(n.v) * 4
      ctx.globalAlpha = 0.85
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(n.x, n.y, R, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(n.x, n.y, 2.5, 0, TAU)
      ctx.fill()
      ctx.globalAlpha = 0.5
      ctx.fillText(`$${(n.v * 1.3).toFixed(1)}M`, n.x + R + 4, n.y - R)
    }
    ctx.globalAlpha = 1
  },
  down(s, P) {
    const n = { x: P.x, y: P.y, v: 1, born: 1 }
    const i = s.nodes.push(n) - 1
    const near = s.nodes
      .map((m, j) => [Math.hypot(m.x - n.x, m.y - n.y), j])
      .filter(([, j]) => j !== i)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2)
    for (const [, j] of near) s.links.push([i, j])
    if (s.nodes.length > 40) {
      s.nodes.shift()
      s.links = s.links.map(([a, b]) => [a - 1, b - 1]).filter(([a, b]) => a >= 0 && b >= 0)
      s.pulses = []
    }
    s.founded++
    if (s.founded === 8) bus.whisper('entrepreneur', 'The entrepreneur sees a market in you.', '#6cc644')
  },
}

// XIV · Biohacker: a monitor. Your movement is the heart rate; stillness brings it down.
const ecg = (p) => {
  const g = (c, wd) => Math.exp(-(((p - c) / wd) ** 2))
  return 0.12 * g(0.14, 0.03) - 0.12 * g(0.27, 0.008) + 1 * g(0.3, 0.011) - 0.28 * g(0.33, 0.012) + 0.3 * g(0.56, 0.045)
}
const biohacker = {
  init(w) {
    return { buf: new Float32Array(Math.ceil(w / 2) + 2), head: 0, ph: 0, bpm: 64, effort: 0, peaked: false, beats: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.effort = lerp(s.effort, P.on ? clamp(P.speed / 1600) : 0, Math.min(1, dt * 0.6))
    s.bpm = lerp(s.bpm, 56 + s.effort * 110, Math.min(1, dt * 0.8))
    if (s.bpm > 150 && !s.peaked) {
      s.peaked = true
      bus.whisper('biohacker', 'The biohacker logs your peak.', '#c9f0e4')
    }
    const pxs = w / 5
    let adv = pxs * dt
    while (adv > 0) {
      const stepPx = Math.min(2, adv)
      adv -= stepPx
      const prev = s.ph
      s.ph += ((s.bpm / 60) * stepPx) / pxs
      if (Math.floor(s.ph) !== Math.floor(prev)) {
        s.beats.push(t)
        if (s.beats.length > 12) s.beats.shift()
      }
      s.head = (s.head + stepPx / 2) % s.buf.length
      s.buf[Math.floor(s.head)] = ecg(s.ph % 1)
    }
    const y0 = h * 0.55
    const A = Math.min(140, h * 0.22)
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // the graph paper
    ctx.globalAlpha = 0.07
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x < w; x += 40) {
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, h)
    }
    for (let y = y0 % 40; y < h; y += 40) {
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(w, y + 0.5)
    }
    ctx.stroke()
    // the trace, with a gap just ahead of the write head
    ctx.globalAlpha = 0.8
    ctx.lineWidth = 2
    ctx.beginPath()
    let pen = false
    const hd = Math.floor(s.head)
    for (let i = 0; i < s.buf.length; i++) {
      const ahead = (i - hd + s.buf.length) % s.buf.length
      if (ahead > 0 && ahead < 14) {
        pen = false
        continue
      }
      const x = i * 2
      const y = y0 - s.buf[i] * A
      pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      pen = true
    }
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(hd * 2, y0 - s.buf[hd] * A, 3.5, 0, TAU)
    ctx.fill()
    // heart rate variability, from the last beats
    const iv = s.beats.slice(1).map((b, i) => b - s.beats[i])
    const mean = iv.reduce((a, b) => a + b, 0) / Math.max(1, iv.length)
    const hrv = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, iv.length)) * 1000
    ctx.globalAlpha = 0.7
    ctx.font = MONO
    ctx.textAlign = 'right'
    ctx.fillText(`HR ${Math.round(s.bpm)} BPM   HRV ${Math.round(20 + hrv)} MS   SPO2 98%`, w - 24, h - 24)
    ctx.globalAlpha = 1
  },
}

// XV · Looksmaxxer: a mirror runs down the middle of the room. Everything you do is reflected, and measured.
const looksmaxxer = {
  init() {
    return { trail: [], found: false }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const ax = w / 2
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // the golden grid, faint
    ctx.globalAlpha = 0.09
    ctx.lineWidth = 1
    for (const k of [0.382, 0.618]) {
      line(ctx, w * k, 0, w * k, h)
      line(ctx, 0, h * k, w, h * k)
    }
    // a golden spiral in quarter-arcs, centred on the axis
    ctx.globalAlpha = 0.1
    let size = Math.min(w, h) * 0.5
    let x = ax - size * 0.5
    let y = h * 0.5 - size * 0.31
    ctx.beginPath()
    for (let i = 0; i < 9; i++) {
      const a = (i * Math.PI) / 2
      ctx.arc(x, y, size, a + Math.PI, a + Math.PI * 1.5)
      x += Math.cos(a + Math.PI * 1.5) * size * (1 - 1 / PHI)
      y += Math.sin(a + Math.PI * 1.5) * size * (1 - 1 / PHI)
      size /= PHI
    }
    ctx.stroke()
    ctx.globalAlpha = 0.45
    ctx.setLineDash([2, 8])
    line(ctx, ax, 0, ax, h)
    ctx.setLineDash([])
    if (P.on) s.trail.push([P.x, P.y, t])
    s.trail = s.trail.filter((q) => t - q[2] < 1.6)
    ctx.lineWidth = 1.5
    for (const m of [1, -1]) {
      ctx.globalAlpha = m === 1 ? 0.6 : 0.3
      ctx.beginPath()
      s.trail.forEach(([px, py], i) => {
        const X = m === 1 ? px : 2 * ax - px
        i ? ctx.lineTo(X, py) : ctx.moveTo(X, py)
      })
      ctx.stroke()
    }
    if (P.on) {
      const mx = 2 * ax - P.x
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.arc(mx, P.y, 10, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 0.35
      ctx.setLineDash([3, 4])
      line(ctx, P.x, P.y, mx, P.y)
      ctx.setLineDash([])
      // calipers: distance to the mirror, against distance to the floor
      const d = Math.abs(P.x - ax)
      const r = d / Math.max(1, h - P.y)
      const gold = Math.abs(r - PHI) < 0.04 || Math.abs(r - 1 / PHI) < 0.02
      ctx.globalAlpha = gold ? 1 : 0.6
      line(ctx, P.x, P.y + 14, P.x, h - 6)
      ctx.font = MONO
      ctx.textAlign = 'center'
      ctx.fillText(gold ? 'φ' : r.toFixed(3), (P.x + ax) / 2, P.y - 10)
      if (gold && !s.found) {
        s.found = true
        bus.whisper('looksmaxxer', 'The looksmaxxer found your best angle.', '#f2c4ce')
      }
    }
    ctx.globalAlpha = 1
  },
}

// XVI · Theologian: light falls from high windows; dust turns in it. The cursor carries a candle; a click rings the bell.
const theologian = {
  init(w, h) {
    const r = rng(116)
    return { motes: Array.from({ length: 120 }, () => ({ x: r() * w, y: r() * h, ph: r() * TAU, z: 0.4 + r() * 0.6 })), bells: [], rung: 0, now: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    s.now = t
    ctx.fillStyle = fg
    ctx.strokeStyle = fg
    // four shafts of light, slanting from the clerestory
    const slope = 0.45
    const shafts = [0.18, 0.4, 0.62, 0.84].map((k, i) => ({ x: w * k, wd: 46 + 10 * Math.sin(t * 0.2 + i), a: 0.05 + 0.025 * Math.sin(t * 0.3 + i * 1.7) }))
    for (const sh of shafts) {
      ctx.globalAlpha = sh.a
      ctx.beginPath()
      ctx.moveTo(sh.x, 0)
      ctx.lineTo(sh.x + sh.wd, 0)
      ctx.lineTo(sh.x + sh.wd + h * slope, h)
      ctx.lineTo(sh.x + h * slope, h)
      ctx.closePath()
      ctx.fill()
    }
    const inShaft = (x, y) => shafts.some((sh) => x - y * slope > sh.x && x - y * slope < sh.x + sh.wd)
    for (const m of s.motes) {
      m.y += Math.sin(t * 0.3 + m.ph) * 4 * dt - 3 * dt * m.z
      m.x += Math.cos(t * 0.2 + m.ph) * 5 * dt
      if (P.on) {
        // the warmth of the candle lifts the dust
        const d = Math.hypot(P.x - m.x, P.y - m.y)
        if (d < 120) m.y -= (1 - d / 120) * 30 * dt
      }
      if (m.y < 0) m.y += h
      if (m.x > w) m.x -= w
      if (m.x < 0) m.x += w
      ctx.globalAlpha = inShaft(m.x, m.y) ? 0.8 : 0.12
      ctx.fillRect(m.x, m.y, 1.6 * m.z, 1.6 * m.z)
    }
    if (P.on) {
      // a candle's halo, in rings rather than a blend
      const fl = 1 + Math.sin(t * 11) * 0.04 + Math.sin(t * 7.3) * 0.03
      for (let k = 5; k >= 1; k--) {
        ctx.globalAlpha = 0.035
        ctx.beginPath()
        ctx.arc(P.x, P.y, k * 22 * fl, 0, TAU)
        ctx.fill()
      }
    }
    for (const b of s.bells) {
      const k = (t - b.t) / 4
      for (let j = 0; j < 4; j++) {
        const kk = clamp(k - j * 0.12)
        ctx.globalAlpha = (1 - kk) * 0.4
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(b.x, b.y, 10 + kk * Math.max(w, h) * 0.6, 0, TAU)
        ctx.stroke()
      }
    }
    s.bells = s.bells.filter((b) => t - b.t < 4)
    ctx.globalAlpha = 1
  },
  down(s, P) {
    s.bells.push({ x: P.x, y: P.y, t: s.now })
    s.rung++
    if (s.rung === 3) bus.whisper('theologian', 'The theologian hears the bell.', '#f1d9a8')
  },
}

// XVII · Gardener: a vine follows the cursor, slowly, and stays where it has grown.
const gardener = {
  init() {
    return { path: [], grown: 0, slow: 0, told: false }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const last = s.path.at(-1)
    if (P.on && (!last || Math.hypot(P.x - last.x, P.y - last.y) > 9)) {
      // a jump starts a new runner instead of a long straight stem
      s.path.push({ x: P.x, y: P.y, t, gap: !last || Math.hypot(P.x - last.x, P.y - last.y) > 80 })
      if (s.path.length > 900) {
        s.path.shift()
        s.grown = Math.max(0, s.grown - 1)
      }
    }
    // a vine is slower than a hand
    s.grown = Math.min(s.path.length, s.grown + dt * 7)
    if (P.on && P.speed > 5 && P.speed < 140) s.slow += dt
    if (s.slow > 10 && !s.told) {
      s.told = true
      bus.whisper('gardener', 'The gardener notices your patience.', '#55772b')
    }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    const n = Math.floor(s.grown)
    ctx.globalAlpha = 0.7
    ctx.lineWidth = 1.6
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const p = s.path[i]
      i && !p.gap ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
    }
    ctx.stroke()
    for (let i = 2; i < n; i += 3) {
      const p = s.path[i]
      const q = s.path[i - 1]
      if (p.gap) continue
      const a = Math.atan2(p.y - q.y, p.x - q.x)
      const side = i % 6 === 2 ? 1 : -1
      const age = clamp((n - i) / 12)
      const L = 9 * age
      const lx = p.x + Math.cos(a + side * 1.0) * L
      const ly = p.y + Math.sin(a + side * 1.0) * L
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1
      line(ctx, p.x, p.y, lx, ly)
      ctx.beginPath()
      ctx.ellipse(lx, ly, 6 * age, 2.6 * age, a + side * 1.0, 0, TAU)
      ctx.fill()
      // every so often, a tendril curls, and much later, a flower
      if (i % 27 === 2) {
        ctx.beginPath()
        for (let k = 0; k < 24; k++) {
          const r = 10 * age * (1 - k / 24)
          const aa = a - side * 1.4 + k * 0.4 * side
          const x = p.x + Math.cos(aa) * r
          const y = p.y + Math.sin(aa) * r
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
        ctx.stroke()
      }
      if (i % 45 === 2 && t - p.t > 6) {
        const bloom = clamp((t - p.t - 6) / 4)
        for (let k = 0; k < 5; k++) {
          const aa = (k / 5) * TAU + p.t
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.arc(p.x + Math.cos(aa) * 5 * bloom, p.y + Math.sin(aa) * 5 * bloom, 3.2 * bloom, 0, TAU)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
  },
}

// XVIII · Storyteller: the cursor writes. Its path becomes a line of a story, word by word.
const STORY = [
  'Once upon a time there was a visitor who could not keep still.',
  'They wandered through twenty rooms, looking for the one that was theirs.',
  'In each room someone told them the world was a different shape.',
  'And every time, the visitor half believed it.',
  'Until, in the last room, they found a page with their own name on it.',
]
const storyteller = {
  init() {
    return { words: [], si: 0, wi: 0, dist: 0, lx: null, ly: null, done: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    ctx.font = SERIF_I
    ctx.textAlign = 'left'
    if (P.on) {
      if (s.lx !== null) s.dist += Math.hypot(P.x - s.lx, P.y - s.ly)
      const words = STORY[s.si].split(' ')
      const word = words[s.wi]
      const need = ctx.measureText(word + ' ').width
      if (s.dist > need) {
        s.dist = 0
        s.words.push({ text: word, x: P.x, y: P.y, a: Math.atan2(P.y - (s.ly ?? P.y), P.x - (s.lx ?? P.x - 1)), t })
        s.wi++
        if (s.wi >= words.length) {
          s.wi = 0
          s.si = (s.si + 1) % STORY.length
          s.done++
          if (s.done === 3) bus.whisper('storyteller', 'The storyteller wants to know what happens next.', '#b5532c')
        }
      }
      s.lx = P.x
      s.ly = P.y
    } else s.lx = null
    s.words = s.words.filter((q) => t - q.t < 9)
    ctx.fillStyle = fg
    for (const q of s.words) {
      const k = (t - q.t) / 9
      let a = q.a
      if (a > Math.PI / 2) a -= Math.PI
      if (a < -Math.PI / 2) a += Math.PI
      ctx.globalAlpha = Math.min(1, (t - q.t) * 4) * (1 - k) * 0.8
      ctx.save()
      ctx.translate(q.x, q.y)
      ctx.rotate(a)
      ctx.fillText(q.text, 0, 0)
      ctx.restore()
    }
    ctx.globalAlpha = 1
  },
}

// XIX · Detective: the room is dark. The torch finds traces; rest on one to pin it as evidence.
const MARKS = ['print', 'shoe', 'hair', 'ash', 'print', 'shoe', 'drop', 'button', 'print', 'ash', 'drop', 'button']
const detective = {
  init(w, h) {
    const r = rng(119)
    return { marks: MARKS.map((k) => ({ k, x: 50 + r() * (w - 100), y: 60 + r() * (h - 120), a: r() * TAU, hold: 0, no: 0 })), found: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    ctx.fillStyle = '#000'
    ctx.globalAlpha = 0.45
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    const R = 150
    if (P.on) {
      // the torch: a disc of lesser darkness, ringed
      ctx.globalAlpha = 0.06
      ctx.beginPath()
      ctx.arc(P.x, P.y, R, 0, TAU)
      ctx.fill()
      ctx.globalAlpha = 0.2
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(P.x, P.y, R, 0, TAU)
      ctx.stroke()
    }
    // red string between the exhibits, in the order they were found
    ctx.strokeStyle = RED
    ctx.lineWidth = 1.3
    ctx.globalAlpha = 0.85
    for (let i = 1; i < s.found.length; i++) {
      const A = s.found[i - 1]
      const B = s.found[i]
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.quadraticCurveTo((A.x + B.x) / 2, (A.y + B.y) / 2 + 24, B.x, B.y)
      ctx.stroke()
    }
    ctx.strokeStyle = fg
    for (const m of s.marks) {
      const d = P.on ? Math.hypot(P.x - m.x, P.y - m.y) : 999
      const vis = m.no ? 0.9 : clamp(1 - d / R) * 0.9
      if (!m.no && d < 34) {
        m.hold += dt
        if (m.hold > 0.7) {
          m.no = s.found.length + 1
          s.found.push(m)
          if (s.found.length === 5) bus.whisper('detective', 'The detective has a suspect.', '#ebe4d0')
        }
      } else if (!m.no) m.hold = Math.max(0, m.hold - dt)
      if (vis <= 0.01) continue
      ctx.globalAlpha = vis
      ctx.lineWidth = 1
      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate(m.a)
      if (m.k === 'print') for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.ellipse(0, 0, k * 2.6, k * 3.4, 0, Math.PI * 0.1, Math.PI * 1.9); ctx.stroke() }
      else if (m.k === 'shoe') { ctx.beginPath(); ctx.ellipse(0, -7, 6, 10, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 12, 5, 6, 0, 0, TAU); ctx.stroke() }
      else if (m.k === 'hair') { ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-4, -10, 4, 10, 14, -2); ctx.stroke() }
      else if (m.k === 'ash') for (let k = 0; k < 9; k++) ctx.fillRect(Math.cos(k * 2.4) * k * 1.6, Math.sin(k * 2.4) * k * 1.6, 2, 2)
      else if (m.k === 'drop') { ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(8, 5, 2, 0, TAU); ctx.fill() }
      else { ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke(); for (const [x, y] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4) }
      ctx.restore()
      if (m.no) {
        ctx.fillStyle = RED
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(m.x, m.y - 18, 3.5, 0, TAU)
        ctx.fill()
        ctx.fillStyle = fg
        ctx.globalAlpha = 0.8
        ctx.font = MONO
        ctx.textAlign = 'left'
        ctx.fillText(`EXHIBIT ${String.fromCharCode(64 + m.no)}`, m.x + 16, m.y - 14)
      } else if (m.hold > 0) {
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.arc(m.x, m.y, 22, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(m.hold / 0.7))
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
  },
}

// XX · Archivist: a wall of index cards, each slowly fading. Rest on one to stamp it, and it is kept.
const archivist = {
  init(w, h) {
    const r = rng(120)
    const cw = 124
    const ch = 78
    const cards = []
    for (let y = 12; y < h; y += ch + 14) for (let x = 12; x < w; x += cw + 14) cards.push({ x, y, life: 0.55 + r() * 0.45, rate: 0.006 + r() * 0.012, kept: false, stamp: 0, rot: (r() - 0.5) * 0.4, no: cards.length + 1, lines: [0.5 + r() * 0.5, 0.3 + r() * 0.6, 0.2 + r() * 0.7] })
    return { cards, cw, ch, kept: 0, lost: 0, told: false }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const { cw, ch } = s
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.font = MONO
    ctx.textAlign = 'left'
    let fading = 0
    for (const c of s.cards) {
      const hot = P.on && P.x > c.x && P.x < c.x + cw && P.y > c.y && P.y < c.y + ch
      if (hot && !c.kept && c.life > 0) {
        c.kept = true
        c.life = 1
        s.kept++
        if (s.kept === 12 && !s.told) {
          s.told = true
          bus.whisper('archivist', 'The archivist will remember you.', '#d9c7a3')
        }
      }
      if (!c.kept && c.life > 0) {
        c.life -= c.rate * dt
        fading++
        if (c.life <= 0) s.lost++
      }
      if (c.kept) c.stamp = Math.min(1, c.stamp + dt * 5)
      const L = Math.max(0, c.life)
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.07 + L * 0.13
      if (L <= 0) ctx.setLineDash([2, 4])
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, cw, ch)
      ctx.setLineDash([])
      if (L > 0) {
        ctx.globalAlpha = L * 0.2
        line(ctx, c.x + 8, c.y + 20, c.x + cw - 8, c.y + 20)
        ctx.fillText(`NO. ${String(c.no).padStart(3, '0')}`, c.x + 8, c.y + 14)
        c.lines.forEach((l, i) => ctx.fillRect(c.x + 8, c.y + 32 + i * 12, (cw - 16) * l, 2))
      }
      if (c.stamp > 0) {
        // the stamp lands slightly larger and settles
        const k = 1 + (1 - c.stamp) * 0.6
        ctx.save()
        ctx.translate(c.x + cw - 34, c.y + ch - 26)
        ctx.rotate(c.rot)
        ctx.scale(k, k)
        ctx.globalAlpha = c.stamp * 0.5
        ctx.lineWidth = 1.5
        ctx.strokeRect(-24, -10, 48, 20)
        ctx.font = '700 10px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('KEPT', 0, 4)
        ctx.restore()
        ctx.font = MONO
        ctx.textAlign = 'left'
      }
    }
    ctx.globalAlpha = 0.7
    ctx.textAlign = 'right'
    ctx.fillText(`KEPT ${s.kept} · FADING ${fading} · LOST ${s.lost}`, w - 20, h - 14)
    ctx.globalAlpha = 1
  },
}

export const MORE = { cinephile, musician, entrepreneur, biohacker, looksmaxxer, theologian, gardener, storyteller, detective, archivist }
