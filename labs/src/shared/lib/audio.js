// Synthesised sound: a low room drone plus small instruments the sections play.
// Nothing starts until the visitor enters (a user gesture), and it can be muted at any time.
let ctx = null
let master = null
let drone = null
let droneFilter = null
let muted = false
const listeners = new Set()

try {
  muted = localStorage.getItem('observer:muted') === '1'
} catch {
  /* storage can be unavailable */
}

export const isMuted = () => muted
export const onMuteChange = (fn) => (listeners.add(fn), () => listeners.delete(fn))

export function setMuted(m) {
  muted = m
  try {
    localStorage.setItem('observer:muted', m ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.25)
  listeners.forEach((fn) => fn(m))
}

function noiseBuffer(seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

export function startAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  try {
    ctx = new AC()
  } catch {
    return
  }
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 4
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 1
  master.connect(comp).connect(ctx.destination)

  drone = ctx.createGain()
  drone.gain.value = 0
  droneFilter = ctx.createBiquadFilter()
  droneFilter.type = 'lowpass'
  droneFilter.frequency.value = 380
  droneFilter.Q.value = 0.8
  droneFilter.connect(drone).connect(master)
  ;[
    [55, 'sine', 0.5, -3],
    [82.41, 'sine', 0.3, 4],
    [110.2, 'triangle', 0.07, 0],
    [164.8, 'sine', 0.035, 7],
  ].forEach(([f, type, g, det]) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = f
    o.detune.value = det
    const gn = ctx.createGain()
    gn.gain.value = g
    o.connect(gn).connect(droneFilter)
    o.start()
  })
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.043
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 140
  lfo.connect(lfoGain).connect(droneFilter.frequency)
  lfo.start()

  // a faint room: band-passed noise
  const n = ctx.createBufferSource()
  n.buffer = noiseBuffer(3)
  n.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 700
  bp.Q.value = 0.6
  const ng = ctx.createGain()
  ng.gain.value = 0.012
  n.connect(bp).connect(ng).connect(drone)
  n.start()

  drone.gain.setTargetAtTime(0.06, ctx.currentTime, 2.5)
}

const ready = () => ctx && !muted && ctx.state === 'running'

export function setDrone(level = 0.06, cutoff = 380, time = 2) {
  if (!ctx) return
  drone.gain.setTargetAtTime(level, ctx.currentTime, time)
  droneFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, time)
}

function out(pan = 0) {
  if (!ctx.createStereoPanner) return master
  const p = ctx.createStereoPanner()
  p.pan.value = Math.max(-1, Math.min(1, pan))
  p.connect(master)
  return p
}

export function blip(freq = 1800, gain = 0.018, dur = 0.06) {
  if (!ready()) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, t)
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export function tone(freq, { dur = 1.4, type = 'sine', gain = 0.04, attack = 0.015, pan = 0, detune = 0 } = {}) {
  if (!ready()) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.value = freq
  o.detune.value = detune
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(out(pan))
  o.start(t)
  o.stop(t + dur + 0.05)
}

export function thump(gain = 0.16) {
  if (!ready()) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(78, t)
  o.frequency.exponentialRampToValueAtTime(38, t + 0.18)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + 0.4)
}

let shaper = null
export function harsh(gain = 0.05, dur = 0.28) {
  if (!ready()) return
  const t = ctx.currentTime
  if (!shaper) {
    shaper = ctx.createWaveShaper()
    const c = new Float32Array(1024)
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1
      c[i] = Math.tanh(x * 6)
    }
    shaper.curve = c
    shaper.connect(master)
  }
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  g.connect(shaper)
  ;[311, 329.6, 466].forEach((f) => {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(f * (0.98 + Math.random() * 0.04), t)
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + dur)
    o.connect(g)
    o.start(t)
    o.stop(t + dur + 0.02)
  })
}

export function swell(freqs = [110, 164.8, 220], gain = 0.03, dur = 3) {
  if (!ready()) return
  const t = ctx.currentTime
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  lp.connect(g).connect(master)
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    o.detune.value = (i - 1) * 6
    o.connect(lp)
    o.start(t)
    o.stop(t + dur + 0.05)
  })
}

export function hiss(gain = 0.02, dur = 0.5, freq = 4000) {
  if (!ready()) return
  const t = ctx.currentTime
  const n = ctx.createBufferSource()
  n.buffer = noiseBuffer(1)
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = 1.4
  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  n.connect(f).connect(g).connect(master)
  n.start(t)
  n.stop(t + dur)
}
