import { useEffect, useRef, useState } from 'react'
import { ARCHETYPES } from '../lib/archetypes.js'

// Six modes, one for each order: the same room tone would be wrong for the monk and the rebel.
const SCALES = {
  knowing: [0, 2, 7, 9, 14],
  making: [0, 4, 7, 11, 14],
  self: [0, 5, 7, 12, 17],
  city: [0, 3, 7, 10, 15],
  beholding: [0, 2, 5, 9, 12],
  tending: [0, 4, 9, 12, 16],
}
const hz = (semi) => 110 * 2 ** (semi / 12)

// A quiet chord for the plate on screen. It is off until asked for, sounds only over a plate's
// coloured top, and falls silent over anything meant to be read.
export default function Sound() {
  const [on, setOn] = useState(false)
  const rig = useRef(null)

  useEffect(() => {
    if (!on) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ac = new AC()
    const out = ac.createGain()
    out.gain.value = 0.9
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    out.connect(lp).connect(ac.destination)
    let voice = null
    const stop = (v, t = 1.6) => {
      if (!v) return
      v.g.gain.cancelScheduledValues(ac.currentTime)
      v.g.gain.setTargetAtTime(0, ac.currentTime, t / 4)
      setTimeout(() => v.os.forEach((o) => o.stop()), t * 1000 + 400)
    }
    const play = (a) => {
      stop(voice)
      voice = null
      if (!a) return
      const i = ARCHETYPES.indexOf(a)
      const sc = SCALES[a.order]
      const root = [0, 3, 5, 7][i % 4] - 12
      const g = ac.createGain()
      g.gain.value = 0
      g.gain.setTargetAtTime(0.05, ac.currentTime, 0.9)
      g.connect(out)
      const os = [sc[0], sc[2], sc[(i % 3) + 2]].flatMap((n, k) => {
        const o = ac.createOscillator()
        o.type = k === 0 ? 'sine' : 'triangle'
        o.frequency.value = hz(root + n + (k ? 12 : 0))
        o.detune.value = (k - 1) * 5
        const og = ac.createGain()
        og.gain.value = k === 0 ? 1 : 0.35
        // each note breathes at its own slow rate
        const lfo = ac.createOscillator()
        lfo.frequency.value = 0.07 + k * 0.045 + (i % 5) * 0.01
        const lg = ac.createGain()
        lg.gain.value = og.gain.value * 0.45
        lfo.connect(lg).connect(og.gain)
        o.connect(og).connect(g)
        o.start()
        lfo.start()
        return [o, lfo]
      })
      voice = { g, os }
    }
    rig.current = play
    let current = null
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          const id = e.target.parentElement.id.replace('plate-', '')
          if (e.isIntersecting) current = id
          else if (current === id) current = null
        }
        play(current ? ARCHETYPES.find((a) => a.id === current) : null)
      },
      { rootMargin: '-35% 0px -35% 0px' },
    )
    document.querySelectorAll('.plate__hero').forEach((el) => io.observe(el))
    const hide = () => (document.hidden ? ac.suspend() : ac.resume())
    document.addEventListener('visibilitychange', hide)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', hide)
      stop(voice, 0.4)
      setTimeout(() => ac.close(), 900)
    }
  }, [on])

  return (
    <button type="button" className={`sound-btn mono ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => setOn((v) => !v)} title="A quiet chord for each plate. Silent over the text.">
      <i aria-hidden="true" />
      Sound {on ? 'on' : 'off'}
    </button>
  )
}
