// Ten more instruments, for the archetypes XI to XX. Same contract as instruments.js:
//   init(w, h, look) -> state, step(state, ctx, t, dt, P, w, h, look), click(state, P, w, h)
import { TAU, clamp, lerp, rng } from './geom.js'

const MONO = '500 11px "JetBrains Mono", monospace'
const RED = '#d2453a'

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

const tc = (t) => {
  const f = Math.floor(t * 24) % 24
  const s = Math.floor(t) % 60
  const m = Math.floor(t / 60) % 60
  return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
}

// XI · Cinephile: a viewfinder over a small world. Click to take the shot; the storyboard keeps it.
function scene(ctx, w, h, t, fg) {
  const hz = h * 0.6
  ctx.strokeStyle = fg
  ctx.fillStyle = fg
  ctx.lineWidth = 1.2
  line(ctx, 0, hz, w, hz)
  // the sun, setting very slowly
  const sx = w * (0.72 + 0.04 * Math.sin(t * 0.05))
  ctx.beginPath()
  ctx.arc(sx, hz - 40 + 10 * Math.sin(t * 0.07), 22, 0, TAU)
  ctx.stroke()
  // a town on the horizon
  const r = rng(11)
  let x = 0
  while (x < w) {
    const bw = 14 + r() * 34
    const bh = 10 + r() * 46
    ctx.strokeRect(x, hz - bh, bw, bh)
    if (r() > 0.6) line(ctx, x + bw / 2, hz - bh, x + bw / 2, hz - bh - 14)
    x += bw + r() * 30
  }
  // a road toward the vanishing point
  line(ctx, w * 0.42, h, w * 0.5, hz)
  line(ctx, w * 0.62, h, w * 0.52, hz)
  // a walker crossing the frame
  const wx = ((t * 18) % (w + 80)) - 40
  const wy = hz + 34
  const sw = Math.sin(t * 6) * 5
  ctx.beginPath()
  ctx.arc(wx, wy - 30, 4, 0, TAU)
  ctx.fill()
  line(ctx, wx, wy - 26, wx, wy - 12)
  line(ctx, wx, wy - 12, wx - sw, wy)
  line(ctx, wx, wy - 12, wx + sw, wy)
  line(ctx, wx, wy - 22, wx + sw * 0.8, wy - 15)
  // birds
  for (let i = 0; i < 4; i++) {
    const bx = ((t * (22 + i * 5) + i * 160) % (w + 60)) - 30
    const by = h * 0.22 + i * 14 + Math.sin(t * 2 + i) * 4
    const f = 3 + Math.sin(t * 8 + i * 2) * 2
    ctx.beginPath()
    ctx.moveTo(bx - 6, by - f)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx + 6, by - f)
    ctx.stroke()
  }
}

const cinephile = {
  init(w, h) {
    return { fx: w / 2, fy: h * 0.45, shots: [], flash: 0, t: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg, bg }) {
    s.t = t
    const strip = 54
    const sh = h - strip - 14
    const fw = Math.min(w * 0.5, 320)
    const fh = fw / 2.39
    const tx = P.on ? P.x : w / 2 + Math.sin(t * 0.3) * w * 0.18
    const ty = P.on ? P.y : sh * 0.5 + Math.cos(t * 0.23) * sh * 0.12
    // the camera has weight: it eases toward the eye
    s.fx = lerp(s.fx, clamp(tx, fw / 2 + 8, w - fw / 2 - 8), Math.min(1, dt * 4))
    s.fy = lerp(s.fy, clamp(ty, fh / 2 + 22, sh - fh / 2), Math.min(1, dt * 4))
    const x0 = s.fx - fw / 2
    const y0 = s.fy - fh / 2
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, sh)
    ctx.clip()
    ctx.globalAlpha = 0.22
    scene(ctx, w, sh, t, fg)
    ctx.beginPath()
    ctx.rect(x0, y0, fw, fh)
    ctx.clip()
    ctx.globalAlpha = 1
    ctx.fillStyle = bg
    ctx.fillRect(x0, y0, fw, fh)
    scene(ctx, w, sh, t, fg)
    ctx.restore()
    // the frame: brackets and thirds
    ctx.strokeStyle = fg
    ctx.globalAlpha = 0.35
    ctx.lineWidth = 1
    for (let k = 1; k < 3; k++) {
      line(ctx, x0 + (fw * k) / 3, y0, x0 + (fw * k) / 3, y0 + fh)
      line(ctx, x0, y0 + (fh * k) / 3, x0 + fw, y0 + (fh * k) / 3)
    }
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    const b = 14
    for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x0 + fw, y0, -1, 1], [x0, y0 + fh, 1, -1], [x0 + fw, y0 + fh, -1, -1]]) {
      ctx.beginPath()
      ctx.moveTo(cx + dx * b, cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy + dy * b)
      ctx.stroke()
    }
    ctx.fillStyle = RED
    if (Math.floor(t * 2) % 2) {
      ctx.beginPath()
      ctx.arc(x0 + 8, y0 - 12, 3.5, 0, TAU)
      ctx.fill()
    }
    readout(ctx, `rec ${tc(t)}`, x0 + 16, y0 - 8, fg)
    if (fw > 260) readout(ctx, '2.39 : 1', x0 + fw, y0 - 8, fg, 'right')
    // the storyboard
    const tw = strip * 2.39 * 0.62
    const thh = tw / 2.39
    ctx.globalAlpha = 0.4
    line(ctx, 0, h - strip - 4, w, h - strip - 4)
    s.shots.forEach((sh0, i) => {
      const x = 12 + i * (tw + 10)
      const y = h - strip + 6
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, tw, thh)
      ctx.clip()
      ctx.translate(x, y)
      const k = tw / sh0.fw
      ctx.scale(k, k)
      ctx.translate(-sh0.x0, -sh0.y0)
      ctx.globalAlpha = 1
      ctx.lineWidth = 1
      scene(ctx, w, sh, sh0.t, fg)
      ctx.restore()
      ctx.strokeStyle = fg
      ctx.globalAlpha = 1
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, tw, thh)
      readout(ctx, `${i + 1}`, x, y + thh + 12, fg)
    })
    if (!s.shots.length) readout(ctx, 'click to take the shot', 12, h - strip / 2 + 4, fg)
    if (s.flash > 0) {
      ctx.globalAlpha = s.flash
      ctx.fillStyle = fg
      ctx.fillRect(x0, y0, fw, fh)
      s.flash -= dt * 4
    }
    s.frame = { x0, y0, fw }
  },
  click(s, P, w) {
    if (!s.frame) return
    s.shots.push({ ...s.frame, t: s.t })
    const tw = 54 * 2.39 * 0.62
    const fit = Math.max(1, Math.floor((w - 12) / (tw + 10)))
    while (s.shots.length > fit) s.shots.shift()
    s.flash = 1
  },
}

// XII · Musician: eight strings in a pentatonic scale. Sweep across to pluck them; click to hear them.
const NOTES = [['C', 261.63], ['D', 293.66], ['E', 329.63], ['G', 392], ['A', 440], ['c', 523.25], ['d', 587.33], ['e', 659.25]]
const musician = {
  init() {
    return { str: NOTES.map(() => ({ a: 0, at: 0.5, ph: 0 })), ly: null, lx: 0, audio: null, plucks: 0 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const m = 36
    const gap = (h - 2 * m) / (NOTES.length - 1)
    const yOf = (i) => h - m - i * gap
    if (P.on && s.ly !== null) {
      NOTES.forEach((_, i) => {
        const y = yOf(i)
        if ((s.ly - y) * (P.y - y) < 0) this.pluck(s, i, clamp((P.x - m) / (w - 2 * m), 0.05, 0.95), clamp(P.speed / 1400, 0.25, 1))
      })
    }
    s.ly = P.on ? P.y : null
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    NOTES.forEach(([name], i) => {
      const st = s.str[i]
      const y = yOf(i)
      st.a *= Math.exp(-dt * (1.1 + i * 0.08))
      st.ph += dt * (24 + i * 5)
      const disp = st.a * Math.cos(st.ph) * Math.min(gap * 0.42, 22)
      ctx.globalAlpha = 0.35 + st.a * 0.65
      ctx.lineWidth = 1 + (NOTES.length - i) * 0.25
      ctx.beginPath()
      for (let k = 0; k <= 60; k++) {
        const u = k / 60
        // a plucked string: a triangle with its corner at the pluck, plus a little of the second harmonic
        const tri = u < st.at ? u / st.at : (1 - u) / (1 - st.at)
        const yy = y + disp * (tri * 0.85 + 0.15 * Math.sin(TAU * u) * Math.cos(st.ph * 2))
        const xx = m + u * (w - 2 * m)
        if (k) ctx.lineTo(xx, yy)
        else ctx.moveTo(xx, yy)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.arc(m - 10, y, 2.5, 0, TAU)
      ctx.arc(w - m + 10, y, 2.5, 0, TAU)
      ctx.fill()
      readout(ctx, name, 12, y + 4, fg)
    })
    readout(ctx, s.audio ? `${s.plucks} notes` : w > 480 ? 'sweep to pluck · click for sound' : 'click for sound', w - m, m - 14, fg, 'right')
  },
  pluck(s, i, at, a) {
    const st = s.str[i]
    st.a = Math.min(1, st.a * 0.4 + a)
    st.at = at
    s.plucks++
    const ac = s.audio
    if (!ac) return
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'triangle'
    o.frequency.value = NOTES[i][1] / 2
    const now = ac.currentTime
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.12 * a, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    o.connect(g).connect(ac.destination)
    o.start(now)
    o.stop(now + 1.7)
  },
  click(s, P, w, h) {
    if (!s.audio) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) s.audio = new AC()
    }
    const m = 36
    const gap = (h - 2 * m) / (NOTES.length - 1)
    const i = clamp(Math.round((h - m - P.y) / gap), 0, NOTES.length - 1)
    this.pluck(s, i, clamp((P.x - m) / (w - 2 * m), 0.05, 0.95), 0.8)
  },
}

// XIII · Entrepreneur: opportunities appear and close. Most are worth taking; some are traps.
const entrepreneur = {
  init() {
    return { ops: [], cap: 100, hist: [100], seized: 0, traps: 0, missed: 0, next: 0.4, tick: 0, r: rng(13), pop: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg, bg }) {
    const chart = 70
    const top = 30
    s.next -= dt
    if (s.next <= 0 && s.ops.length < 7) {
      const r = s.r
      s.ops.push({ x: 40 + r() * (w - 80), y: top + 24 + r() * (h - chart - top - 60), life: 1, dur: 2.2 + r() * 2, trap: r() < 0.28, v: Math.round(10 + r() * 40) })
      s.next = 0.5 + r() * 0.9
    }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const o of s.ops) {
      o.life -= dt / o.dur
      const R = 18
      ctx.globalAlpha = clamp(o.life * 3)
      ctx.lineWidth = 1.5
      if (o.trap) ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(o.x, o.y, R, 0, TAU)
      ctx.stroke()
      ctx.setLineDash([])
      // the window closing
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(o.x, o.y, R + 6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(o.life))
      ctx.stroke()
      const hot = P.on && Math.hypot(P.x - o.x, P.y - o.y) < R + 8
      if (hot) {
        ctx.beginPath()
        ctx.arc(o.x, o.y, R - 5, 0, TAU)
        ctx.fill()
      }
      ctx.font = MONO
      ctx.textAlign = 'center'
      ctx.fillStyle = hot ? bg : fg
      ctx.fillText(`+${o.v}`, o.x, o.y + 4)
      ctx.fillStyle = fg
      if (o.life <= 0) s.missed++
    }
    s.ops = s.ops.filter((o) => o.life > 0)
    for (const p of s.pop) {
      p.life -= dt
      p.y -= dt * 30
      ctx.globalAlpha = clamp(p.life)
      readout(ctx, p.text, p.x, p.y, p.trap ? RED : fg, 'center')
    }
    s.pop = s.pop.filter((p) => p.life > 0)
    // the capital line
    s.tick += dt
    if (s.tick > 0.25) {
      s.tick = 0
      s.hist.push(s.cap)
      if (s.hist.length > 120) s.hist.shift()
    }
    const lo = Math.min(...s.hist, 0)
    const hi = Math.max(...s.hist, 200)
    const Y = (v) => h - 16 - ((v - lo) / (hi - lo)) * (chart - 20)
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    line(ctx, 30, h - chart, w - 30, h - chart)
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    ctx.beginPath()
    s.hist.forEach((v, i) => {
      const x = 30 + (i / 119) * (w - 60)
      if (i) ctx.lineTo(x, Y(v))
      else ctx.moveTo(x, Y(v))
    })
    ctx.stroke()
    readout(ctx, `capital ${Math.round(s.cap)}`, 30, top - 10, fg)
    readout(ctx, w > 480 ? `${s.seized} seized · ${s.traps} traps · ${s.missed} missed` : `${s.seized} · ${s.traps} traps`, w - 30, top - 10, fg, 'right')
  },
  click(s, P) {
    const o = s.ops.find((q) => Math.hypot(P.x - q.x, P.y - q.y) < 28)
    if (!o) return
    o.life = 0
    s.ops = s.ops.filter((q) => q !== o)
    if (o.trap) {
      s.cap -= o.v * 2.5
      s.traps++
    } else {
      s.cap += o.v
      s.seized++
    }
    s.pop.push({ x: o.x, y: o.y - 24, life: 1, trap: o.trap, text: o.trap ? `−${Math.round(o.v * 2.5)}` : `+${o.v}` })
  },
}

// XIV · Biohacker: the dose makes the poison. A little stress strengthens; too much harms.
const resp = (u) => clamp(0.5 + 45 * u * u * Math.exp(-u / 0.12) - 0.5 * u ** 2.2)
const biohacker = {
  init() {
    return { trials: [], u: 0.3, r: rng(14) }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const m = 40
    const X = (u) => m + u * (w - 2 * m)
    const Y = (v) => h - m - v * (h - 2 * m - 20)
    const target = P.on ? clamp((P.x - m) / (w - 2 * m)) : 0.5 + 0.42 * Math.sin(t * 0.35)
    s.u = lerp(s.u, target, Math.min(1, dt * 5))
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // zones
    const zones = [[0, 0.07, 'too little'], [0.07, 0.55, 'hormesis'], [0.55, 1, 'too much']]
    ctx.lineWidth = 1
    zones.forEach(([a, b, name], i) => {
      ctx.globalAlpha = 0.25
      if (i) line(ctx, X(a), m, X(a), h - m)
      const here = s.u >= a && s.u < b
      ctx.globalAlpha = here ? 1 : 0.45
      readout(ctx, name, i ? X((a + b) / 2) : X(a), m + 4, fg, i ? 'center' : 'left')
      ctx.globalAlpha = 1
    })
    ctx.globalAlpha = 0.4
    ctx.setLineDash([4, 4])
    line(ctx, m, Y(0.5), w - m, Y(0.5))
    ctx.setLineDash([])
    ctx.globalAlpha = 0.6
    line(ctx, m, h - m, w - m, h - m)
    ctx.globalAlpha = 1
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let k = 0; k <= 100; k++) {
      const u = k / 100
      if (k) ctx.lineTo(X(u), Y(resp(u)))
      else ctx.moveTo(X(u), Y(resp(u)))
    }
    ctx.stroke()
    for (const [u, v] of s.trials) {
      ctx.beginPath()
      ctx.arc(X(u), Y(v), 3, 0, TAU)
      ctx.fill()
    }
    const v = resp(s.u)
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    line(ctx, X(s.u), h - m, X(s.u), Y(v))
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(X(s.u), Y(v), 7, 0, TAU)
    ctx.stroke()
    const pct = Math.round((v - 0.5) * 200)
    readout(ctx, `dose ${(s.u * 10).toFixed(1)}   response ${pct >= 0 ? '+' : ''}${pct}%   n = ${s.trials.length}`, m, h - m + 22, fg)
  },
  click(s) {
    const r = s.r
    s.trials.push([s.u, clamp(resp(s.u) + (r() + r() + r() - 1.5) * 0.12)])
    if (s.trials.length > 60) s.trials.shift()
  },
}

// XV · Looksmaxxer: a face of a few lines, and a symmetry score. Click a feature to move it.
const looksmaxxer = {
  init() {
    return {
      f: { el: [-0.36, -0.12], er: [0.33, -0.15], n: [0.04, 0.16], mo: [-0.03, 0.42], br: [0.36, -0.3], bl: [-0.38, -0.27] },
      held: null,
      polished: 0,
    }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const cx = w / 2
    const cy = h / 2 + 4
    const R = Math.min(w * 0.3, h * 0.38)
    const to = (p) => [cx + p[0] * R, cy + p[1] * R]
    const from = (x, y) => [(x - cx) / R, (y - cy) / R]
    if (s.held && P.on) {
      const [x, y] = from(P.x, P.y)
      s.f[s.held] = [clamp(x, -0.9, 0.9), clamp(y, -0.7, 0.8)]
    }
    const F = s.f
    // the axis
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    line(ctx, cx, cy - R * 1.25, cx, cy + R * 1.25)
    ctx.setLineDash([])
    // the head
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, R * 0.78, R, 0, 0, TAU)
    ctx.stroke()
    const draw = (k, fn) => {
      const hot = s.held === k || (!s.held && P.on && Math.hypot(...to(F[k]).map((v, i) => v - [P.x, P.y][i])) < 22)
      ctx.lineWidth = hot ? 3 : 2
      fn(...to(F[k]))
    }
    for (const k of ['el', 'er']) draw(k, (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, R * 0.13, R * 0.06, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, R * 0.03, 0, TAU); ctx.fill() })
    for (const k of ['bl', 'br']) draw(k, (x, y) => line(ctx, x - R * 0.14, y, x + R * 0.14, y))
    draw('n', (x, y) => { ctx.beginPath(); ctx.moveTo(x, y - R * 0.2); ctx.lineTo(x + R * 0.05, y); ctx.lineTo(x - R * 0.04, y + R * 0.02); ctx.stroke() })
    draw('mo', (x, y) => { ctx.beginPath(); ctx.moveTo(x - R * 0.2, y); ctx.quadraticCurveTo(x, y + R * 0.07, x + R * 0.2, y); ctx.stroke() })
    // the score: how far each pair is from its mirror, and the midline from the axis
    const pair = (a, b) => Math.hypot(F[a][0] + F[b][0], F[a][1] - F[b][1])
    const err = pair('el', 'er') + pair('bl', 'br') + Math.abs(F.n[0]) + Math.abs(F.mo[0])
    const sym = clamp(1 - err * 0.55) * 100
    // calipers between the eyes, against the width of the face
    const [lx, ly] = to(F.el)
    const [rx, ry] = to(F.er)
    const yy = Math.min(ly, ry) - R * 0.22
    ctx.globalAlpha = 0.5
    ctx.lineWidth = 1
    line(ctx, lx, yy, rx, yy)
    line(ctx, lx, yy - 5, lx, yy + 5)
    line(ctx, rx, yy - 5, rx, yy + 5)
    const ratio = (R * 1.56) / Math.max(1, Math.abs(rx - lx))
    readout(ctx, ratio.toFixed(3), (lx + rx) / 2, yy - 8, fg, 'center')
    ctx.globalAlpha = 1
    if (sym > 98.5) s.polished += dt
    readout(ctx, `symmetry ${sym.toFixed(1)}%`, 18, h - 18, fg)
    if (s.polished > 1.5 || w > 520) readout(ctx, s.polished > 1.5 ? 'it was fine before' : s.held ? 'click to set it down' : 'click a feature to move it', w - 18, h - 18, fg, 'right')
  },
  click(s, P, w, h) {
    if (s.held) {
      s.held = null
      return
    }
    const cx = w / 2
    const cy = h / 2 + 4
    const R = Math.min(w * 0.3, h * 0.38)
    let best = null
    let bd = 26
    for (const [k, p] of Object.entries(s.f)) {
      const d = Math.hypot(cx + p[0] * R - P.x, cy + p[1] * R - P.y)
      if (d < bd) {
        bd = d
        best = k
      }
    }
    s.held = best
  },
}

// XVI · Theologian: a rose window. Light gathers in the pane you rest on; click to light a candle.
const theologian = {
  init() {
    return { lit: new Array(25).fill(0), candles: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const cx = w / 2
    const cy = h * 0.44
    const R = Math.min(w * 0.36, h * 0.38)
    const rings = [[0, 0.2, 1], [0.2, 0.52, 8], [0.52, 1, 16]]
    let idx = 0
    let hover = -1
    if (P.on) {
      const d = Math.hypot(P.x - cx, P.y - cy) / R
      const a = (Math.atan2(P.y - cy, P.x - cx) + TAU + Math.PI / 2) % TAU
      let base = 0
      for (const [r0, r1, n] of rings) {
        if (d >= r0 && d < r1) hover = base + Math.floor((a / TAU) * n)
        base += n
      }
    }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const [r0, r1, n] of rings) {
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * TAU - Math.PI / 2
        const a1 = ((k + 1) / n) * TAU - Math.PI / 2
        if (idx === hover) s.lit[idx] = Math.min(1, s.lit[idx] + dt * 0.6)
        const L = s.lit[idx]
        ctx.beginPath()
        if (n === 1) ctx.arc(cx, cy, r1 * R, 0, TAU)
        else {
          ctx.arc(cx, cy, r1 * R, a0, a1)
          ctx.arc(cx, cy, r0 * R, a1, a0, true)
          ctx.closePath()
        }
        if (L > 0) {
          ctx.globalAlpha = L * (0.55 + 0.1 * Math.sin(t * 1.3 + idx))
          ctx.fill()
        }
        ctx.globalAlpha = 0.9
        ctx.lineWidth = 1.5
        ctx.stroke()
        idx++
      }
    }
    // tracery: a small circle in every outer pane
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1
    for (let k = 0; k < 16; k++) {
      const a = ((k + 0.5) / 16) * TAU - Math.PI / 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, R * 0.09, 0, TAU)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.04, 0, TAU)
    ctx.stroke()
    // candles
    const base = h - 22
    s.candles.forEach((c, i) => {
      const x = w / 2 + (i - (s.candles.length - 1) / 2) * 22
      ctx.globalAlpha = 1
      ctx.lineWidth = 1.5
      ctx.strokeRect(x - 3, base - 24, 6, 24)
      const fl = Math.sin(t * 9 + i * 2.3) * 1.5
      ctx.beginPath()
      ctx.moveTo(x, base - 38 + fl)
      ctx.quadraticCurveTo(x + 5, base - 30, x, base - 26)
      ctx.quadraticCurveTo(x - 5, base - 30, x, base - 38 + fl)
      ctx.fill()
    })
    const n = s.lit.filter((v) => v >= 1).length
    readout(ctx, n === 25 ? 'lux perpetua' : `${n} of 25 panes lit`, 18, h - 18, fg)
    if (s.candles.length || w > 520) readout(ctx, s.candles.length ? `${s.candles.length} candle${s.candles.length > 1 ? 's' : ''}` : 'rest here · click to light a candle', w - 18, h - 18, fg, 'right')
  },
  click(s) {
    if (s.candles.length < 13) s.candles.push(1)
  },
}

// XVII · Gardener: click the ground to plant. Hover to water. Nothing grows untended.
const gardener = {
  init(w) {
    return { plants: [{ x: w * 0.3, g: 0.55, water: 0.6, wilt: 0, seed: 1 }, { x: w * 0.66, g: 0.3, water: 0.3, wilt: 0, seed: 2 }], drops: [], n: 3 }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const ground = h - 34
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 1
    line(ctx, 16, ground, w - 16, ground)
    for (let x = 22; x < w - 16; x += 14) line(ctx, x, ground + 4, x - 5, ground + 10)
    let thriving = 0
    let wilting = 0
    for (const p of s.plants) {
      const near = P.on && Math.abs(P.x - p.x) < 34 && P.y < ground
      if (near) {
        p.water = Math.min(1, p.water + dt * 0.7)
        if (Math.random() < dt * 30) s.drops.push({ x: P.x + (Math.random() - 0.5) * 16, y: P.y + 8, v: 60 })
      }
      p.water = Math.max(0, p.water - dt * 0.045)
      if (p.water > 0.2) {
        p.g = Math.min(1, p.g + dt * 0.05 * p.water)
        p.wilt = Math.max(0, p.wilt - dt * 0.3)
      } else p.wilt = Math.min(1, p.wilt + dt * 0.08)
      if (p.wilt > 0.5) wilting++
      else if (p.g > 0.6) thriving++
      const D = 6
      const r = rng(p.seed * 97)
      const sway = Math.sin(t * 0.8 + p.seed) * 0.03
      const br = (x, y, ang, len, d) => {
        const grow = clamp(p.g * D - d)
        if (grow <= 0) return
        const droop = p.wilt * 0.22 * d * (Math.cos(ang) >= 0 ? 1 : -1)
        const a = ang + droop + sway * d
        const x2 = x + Math.cos(a) * len * grow
        const y2 = y + Math.sin(a) * len * grow
        ctx.globalAlpha = 1 - p.wilt * 0.5
        ctx.lineWidth = Math.max(0.8, (D - d) * 0.7)
        line(ctx, x, y, x2, y2)
        const sp = 0.32 + r() * 0.3
        const k = 0.68 + r() * 0.12
        if (grow >= 1 && d < D - 1) {
          br(x2, y2, a - sp, len * k, d + 1)
          br(x2, y2, a + sp * (0.7 + r() * 0.5), len * k, d + 1)
        } else if (d >= 2) {
          ctx.beginPath()
          ctx.ellipse(x2, y2, 4 * grow, 2 * grow, a, 0, TAU)
          ctx.fill()
        }
      }
      br(p.x, ground, -Math.PI / 2, Math.min(46, h * 0.12), 0)
    }
    ctx.globalAlpha = 0.7
    for (const d of s.drops) {
      d.v += dt * 400
      d.y += d.v * dt
      line(ctx, d.x, d.y, d.x, d.y + 5)
    }
    s.drops = s.drops.filter((d) => d.y < ground)
    readout(ctx, w > 420 ? `${s.plants.length} planted · ${thriving} thriving · ${wilting} wilting` : `${thriving} thriving · ${wilting} wilting`, 18, 24, fg)
    if (w > 520) readout(ctx, 'click to plant · hover to water', w - 18, 24, fg, 'right')
  },
  click(s, P, w) {
    if (s.plants.length >= 12) s.plants.shift()
    s.plants.push({ x: clamp(P.x, 30, w - 30), g: 0.02, water: 0.5, wilt: 0, seed: s.n++ })
  },
}

// XVIII · Storyteller: click to place a beat, higher for more tension. The shape of the plot appears.
const ZONES = [[0, 0.2, 'exposition'], [0.2, 0.52, 'rising action'], [0.52, 0.68, 'climax'], [0.68, 0.86, 'falling action'], [0.86, 1, 'resolution']]
const WORDS = ['once', 'then', 'but', 'so', 'until', 'suddenly', 'because', 'at last', 'and so', 'after', 'meanwhile', 'still', 'then', 'finally']
const storyteller = {
  init() {
    return { beats: [[0.04, 0.15], [0.96, 0.2]] }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const m = 36
    const X = (u) => m + u * (w - 2 * m)
    const Y = (v) => h - m - 24 - v * (h - 2 * m - 56)
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    // Freytag's pyramid, faint, for reference
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 1
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    ctx.moveTo(X(0), Y(0.12))
    ctx.lineTo(X(0.2), Y(0.15))
    ctx.lineTo(X(0.6), Y(0.92))
    ctx.lineTo(X(0.86), Y(0.25))
    ctx.lineTo(X(1), Y(0.2))
    ctx.stroke()
    ctx.setLineDash([])
    const pu = P.on ? clamp((P.x - m) / (w - 2 * m)) : -1
    ZONES.forEach(([a, b, name], i) => {
      ctx.globalAlpha = 0.25
      if (i) line(ctx, X(a), m, X(a), h - m - 10)
      ctx.globalAlpha = pu >= a && pu < b ? 1 : 0.45
      readout(ctx, name, X((a + b) / 2), h - m + 10 + (i % 2) * 13, fg, 'center')
    })
    const B = [...s.beats].sort((a, b) => a[0] - b[0])
    ctx.globalAlpha = 1
    ctx.lineWidth = 2.5
    ctx.beginPath()
    B.forEach(([u, v], i) => {
      if (!i) ctx.moveTo(X(u), Y(v))
      else {
        const [pu0, pv0] = B[i - 1]
        const mx = (X(pu0) + X(u)) / 2
        ctx.bezierCurveTo(mx, Y(pv0), mx, Y(v), X(u), Y(v))
      }
    })
    ctx.stroke()
    B.forEach(([u, v], i) => {
      ctx.beginPath()
      ctx.arc(X(u), Y(v), 4.5, 0, TAU)
      ctx.fill()
      ctx.font = 'italic 17px "Instrument Serif", serif'
      ctx.textAlign = 'center'
      ctx.fillText(WORDS[i % WORDS.length], X(u), Y(v) - 12)
    })
    if (P.on) {
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.arc(P.x, P.y, 6, 0, TAU)
      ctx.stroke()
    }
    // a verdict on the plot
    const peak = B.reduce((a, b) => (b[1] > a[1] ? b : a))
    const last = B.at(-1)
    let verdict = 'nothing has happened yet'
    if (peak[1] > 0.4) {
      if (last[1] > 0.6) verdict = 'a cliffhanger'
      else if (peak[0] >= 0.52 && peak[0] < 0.68) verdict = 'a well-made plot'
      else if (peak[0] < 0.3) verdict = 'it peaks too soon'
      else verdict = 'a story'
    }
    readout(ctx, `${B.length} beats · ${verdict}`, m, m - 10, fg)
  },
  click(s, P, w, h) {
    const m = 36
    const u = clamp((P.x - m) / (w - 2 * m))
    const v = clamp((h - m - 24 - P.y) / (h - 2 * m - 56))
    const near = s.beats.findIndex(([a, b]) => Math.hypot((a - u) * (w - 2 * m), (b - v) * (h - 2 * m - 56)) < 14)
    if (near >= 0 && s.beats.length > 2) s.beats.splice(near, 1)
    else if (s.beats.length < 14) s.beats.push([u, v])
  },
}

// XIX · Detective: an evidence board. Click two pins to tie a string; connect the scene to the suspect.
const CLUES = ['Footprint', 'Letter', 'Ticket', 'Glove', 'Witness', 'Alibi', 'Key', 'Photograph']
const detective = {
  init(w, h) {
    const r = rng(19)
    const pins = [{ name: 'THE SCENE', x: 0.1, y: 0.5 }, { name: 'THE SUSPECT', x: 0.9, y: 0.5 }]
    CLUES.forEach((name, i) => pins.push({ name, x: 0.26 + (i % 4) * 0.16 + (r() - 0.5) * 0.06, y: (i < 4 ? 0.28 : 0.72) + (r() - 0.5) * 0.14 }))
    return { pins, ties: [], sel: null, closed: false, path: [] }
  },
  step(s, ctx, t, dt, P, w, h, { fg, bg }) {
    const at = (p) => [p.x * w, p.y * h]
    ctx.lineWidth = 1.5
    for (const [a, b] of s.ties) {
      const [x1, y1] = at(s.pins[a])
      const [x2, y2] = at(s.pins[b])
      const inPath = s.path.some((v, i) => i && ((s.path[i - 1] === a && v === b) || (s.path[i - 1] === b && v === a)))
      ctx.strokeStyle = RED
      ctx.globalAlpha = s.closed && !inPath ? 0.4 : 1
      ctx.lineWidth = inPath ? 3 : 1.5
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + Math.hypot(x2 - x1, y2 - y1) * 0.08, x2, y2)
      ctx.stroke()
    }
    if (s.sel !== null && P.on) {
      const [x1, y1] = at(s.pins[s.sel])
      ctx.strokeStyle = RED
      ctx.globalAlpha = 0.5
      ctx.setLineDash([4, 4])
      line(ctx, x1, y1, P.x, P.y)
      ctx.setLineDash([])
    }
    ctx.font = MONO
    s.pins.forEach((p, i) => {
      const [x, y] = at(p)
      const big = i < 2
      const hot = P.on && Math.hypot(P.x - x, P.y - y) < 26
      const tw = ctx.measureText(p.name.toUpperCase()).width + 14
      // the card stays on the board even when the pin is near its edge
      const lx = clamp(x, tw / 2 + 4, w - tw / 2 - 4)
      ctx.globalAlpha = 1
      ctx.fillStyle = big || hot || s.sel === i ? fg : bg
      ctx.fillRect(lx - tw / 2, y + 8, tw, 20)
      ctx.strokeStyle = fg
      ctx.lineWidth = 1
      ctx.strokeRect(lx - tw / 2, y + 8, tw, 20)
      ctx.fillStyle = big || hot || s.sel === i ? bg : fg
      ctx.textAlign = 'center'
      ctx.fillText(p.name.toUpperCase(), lx, y + 22)
      ctx.fillStyle = RED
      ctx.beginPath()
      ctx.arc(x, y, s.sel === i ? 7 : 5, 0, TAU)
      ctx.fill()
    })
    readout(ctx, s.closed ? `case closed · ${s.path.length - 2} clues` : `${s.ties.length} string${s.ties.length === 1 ? '' : 's'} · ${w > 560 ? 'connect the scene to the suspect through three clues' : 'scene → 3 clues → suspect'}`, 18, h - 16, fg)
  },
  click(s, P, w, h) {
    const i = s.pins.findIndex((p) => Math.hypot(P.x - p.x * w, P.y - p.y * h) < 26)
    if (i < 0) {
      s.sel = null
      return
    }
    if (s.sel === null) {
      s.sel = i
      return
    }
    if (s.sel !== i) {
      const k = s.ties.findIndex(([a, b]) => (a === s.sel && b === i) || (a === i && b === s.sel))
      if (k >= 0) s.ties.splice(k, 1)
      else s.ties.push([s.sel, i])
    }
    s.sel = null
    // look for a chain from the scene (0) to the suspect (1) through at least three clues
    const adj = s.pins.map(() => [])
    for (const [a, b] of s.ties) {
      adj[a].push(b)
      adj[b].push(a)
    }
    let best = []
    const walk = (v, path) => {
      if (v === 1) {
        if (path.length - 2 >= 3 && path.length > best.length) best = path
        return
      }
      for (const n of adj[v]) if (!path.includes(n)) walk(n, [...path, n])
    }
    walk(0, [0])
    s.closed = best.length > 0
    s.path = best
  },
}

// XX · Archivist: memories surface and fade. Rest on one to keep it; it gets a number.
const archivist = {
  init() {
    return { marks: [], next: 0, kept: 0, lost: 0, r: rng(20) }
  },
  step(s, ctx, t, dt, P, w, h, { fg }) {
    const r = s.r
    s.next -= dt
    if (s.next <= 0 && s.marks.filter((m) => !m.no).length < 9) {
      s.marks.push({ x: 30 + r() * (w - 150), y: 40 + r() * (h - 110), life: 1, dur: 5 + r() * 5, lines: Array.from({ length: 2 + Math.floor(r() * 3) }, () => 0.4 + r() * 0.6), w: 70 + r() * 50, no: 0, hold: 0 })
      s.next = 0.6 + r() * 0.7
    }
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    for (const m of s.marks) {
      const hot = P.on && P.x > m.x - 8 && P.x < m.x + m.w + 8 && P.y > m.y - 12 && P.y < m.y + m.lines.length * 9 + 8
      if (!m.no) {
        if (hot) {
          m.hold += dt
          m.life = Math.min(1, m.life + dt)
          if (m.hold > 0.6) m.no = ++s.kept
        } else m.life -= dt / m.dur
        if (m.life <= 0) s.lost++
      }
      ctx.globalAlpha = m.no ? 1 : clamp(m.life) * 0.85
      ctx.lineWidth = 2
      m.lines.forEach((l, i) => line(ctx, m.x, m.y + i * 9, m.x + m.w * l, m.y + i * 9))
      if (m.no) {
        ctx.lineWidth = 1
        ctx.strokeRect(m.x - 8, m.y - 12, m.w + 16, m.lines.length * 9 + 18)
        readout(ctx, `no. ${String(m.no).padStart(3, '0')}`, m.x + m.w + 8, m.y - 16, fg, 'right')
      } else if (hot) {
        ctx.globalAlpha = 0.6
        ctx.lineWidth = 1
        ctx.strokeRect(m.x - 8, m.y - 12, (m.w + 16) * clamp(m.hold / 0.6), 2)
      }
    }
    s.marks = s.marks.filter((m) => m.no || m.life > 0)
    // the archive is finite: the oldest kept go into storage
    const kept = s.marks.filter((m) => m.no)
    if (kept.length > 14) s.marks.splice(s.marks.indexOf(kept[0]), 1)
    readout(ctx, `kept ${s.kept} · lost ${s.lost}`, 18, h - 16, fg)
    if (w > 520) readout(ctx, 'rest on a memory to keep it', w - 18, h - 16, fg, 'right')
  },
}

export const MORE = { cinephile, musician, entrepreneur, biohacker, looksmaxxer, theologian, gardener, storyteller, detective, archivist }
