import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { Reveal, Statement } from '../components/Text.jsx'
import { Claim, Claims, Tag } from '../components/Claim.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { approach, clamp, ink, lerp, rng, signal, smooth, TAU } from '../lib/math.js'
import { blip, tone } from '../lib/audio.js'
import { setState } from '../lib/store.js'

const EASE = [0.2, 0.7, 0.1, 1]
const WHITES = 13
const GREYS = 34
const DURATION = 14

/* ───────── part one: count ───────── */

function CountTest() {
  const [phase, setPhase] = useState('intro') // intro | run | answer | noticed | reveal
  const [instruction, setInstruction] = useState('Count the white particles.')
  const [guess, setGuess] = useState(10)
  const [noticed, setNoticed] = useState(null)
  const canvasRef = useRef(null)
  const live = useRef({ phase: 'intro', start: 0 })
  live.current.phase = phase
  const timers = useRef([])

  const begin = () => {
    timers.current.forEach(clearTimeout)
    setPhase('run')
    setNoticed(null)
    live.current.start = performance.now()
    live.current.reset = true
    tone(440, { dur: 0.4, gain: 0.02 })
    timers.current = [
      setTimeout(() => setState({ hudTitle: 'THE OBSERVED' }), 4000),
      setTimeout(() => setInstruction('Ignore the white particles.'), 5200),
      setTimeout(() => setInstruction('Count the white particles.'), 10400),
      setTimeout(() => setState({ hudTitle: 'THE OBSERVER' }), 11200),
      setTimeout(() => {
        setPhase('answer')
        tone(330, { dur: 0.6, gain: 0.02 })
      }, DURATION * 1000),
    ]
  }
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      setState({ hudTitle: 'THE OBSERVER' })
    },
    [],
  )

  useCanvas(canvasRef, (ctx, s) => {
    let parts = []
    const spawn = () => {
      const r = rng(Math.floor(performance.now()))
      parts = Array.from({ length: WHITES + GREYS }, (_, i) => {
        const a = r() * TAU
        const sp = 70 + r() * 70
        return { x: r(), y: r(), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, white: i < WHITES, turn: r() * 100 }
      })
    }
    spawn()
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        if (st.reset) {
          spawn()
          st.reset = false
        }
        const tau = st.phase === 'run' ? (performance.now() - st.start) / 1000 : st.phase === 'intro' ? 0 : DURATION
        const running = st.phase === 'run'
        const reveal = st.phase === 'reveal'
        ctx.clearRect(0, 0, w, h)

        // a grid that turns, slowly, while you count
        const rot = (smooth(1, DURATION - 1, tau) * 14 * Math.PI) / 180
        ctx.save()
        ctx.translate(w / 2, h / 2)
        ctx.rotate(rot)
        ctx.strokeStyle = ink(0.05)
        ctx.beginPath()
        const step = 48
        const ext = Math.hypot(w, h) / 2 + step
        for (let x = -ext; x <= ext; x += step) {
          ctx.moveTo(x, -ext)
          ctx.lineTo(x, ext)
        }
        for (let y = -ext; y <= ext; y += step) {
          ctx.moveTo(-ext, y)
          ctx.lineTo(ext, y)
        }
        ctx.stroke()
        ctx.restore()

        // the observer that crosses the field
        const ox = lerp(w + 80, -80, smooth(3.5, 11.5, tau))
        const oy = h * 0.56 + Math.sin(tau * 0.7) * 16
        if (running && tau > 3.4 && tau < 11.6) {
          ctx.strokeStyle = ink(0.32)
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(ox, oy, 50, 0, TAU)
          ctx.stroke()
          ctx.fillStyle = ink(0.32)
          ctx.beginPath()
          ctx.arc(ox - 14, oy, 11, 0, TAU)
          ctx.fill()
          ctx.lineWidth = 1
        }
        if (reveal) {
          ctx.setLineDash([3, 6])
          ctx.strokeStyle = signal(0.6)
          ctx.beginPath()
          for (let k = 0; k <= 60; k++) {
            const tt = 3.5 + (k / 60) * 8
            const x = lerp(w + 80, -80, smooth(3.5, 11.5, tt))
            const y = h * 0.56 + Math.sin(tt * 0.7) * 16
            k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
          }
          ctx.stroke()
          ctx.setLineDash([])
          ;[0.25, 0.5, 0.75].forEach((f) => {
            const tt = 3.5 + f * 8
            const x = lerp(w + 80, -80, smooth(3.5, 11.5, tt))
            const y = h * 0.56 + Math.sin(tt * 0.7) * 16
            ctx.strokeStyle = signal(0.35 + f * 0.4)
            ctx.beginPath()
            ctx.arc(x, y, 50, 0, TAU)
            ctx.stroke()
          })
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = signal(0.95)
          ctx.fillText('AN OBSERVER CROSSED HERE · 3.5 s → 11.5 s', 24, h * 0.56 - 66)
        }

        // the particles
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i]
          if (running) {
            p.turn += dt
            const ang = Math.sin(p.turn * 0.9) * 0.6 * dt
            const c = Math.cos(ang)
            const sn = Math.sin(ang)
            const vx = p.vx * c - p.vy * sn
            p.vy = p.vx * sn + p.vy * c
            p.vx = vx
            p.x += (p.vx * dt) / w
            p.y += (p.vy * dt) / h
            if (p.x < 0.02 || p.x > 0.98) p.vx *= -1
            if (p.y < 0.03 || p.y > 0.97) p.vy *= -1
            p.x = clamp(p.x, 0.02, 0.98)
            p.y = clamp(p.y, 0.03, 0.97)
          }
          const grow = i === WHITES + 3 ? 1 + 1.9 * smooth(2, 12, tau) : 1
          const rad = 4.2 * grow
          if (reveal && i === WHITES + 3) {
            ctx.strokeStyle = signal(0.9)
            ctx.beginPath()
            ctx.arc(p.x * w, p.y * h, rad + 8, 0, TAU)
            ctx.stroke()
            ctx.fillStyle = signal(0.95)
            ctx.font = '10px "JetBrains Mono Variable", monospace'
            ctx.fillText('THIS ONE GREW ×3', p.x * w + rad + 14, p.y * h + 3)
          }
          ctx.fillStyle = p.white ? ink(running || reveal ? 0.96 : 0.6) : ink(0.3)
          if (st.phase === 'intro') ctx.fillStyle = p.white ? ink(0.5) : ink(0.18)
          ctx.beginPath()
          ctx.arc(p.x * w, p.y * h, rad, 0, TAU)
          ctx.fill()
        }

        // the frame, reddening by degrees
        const fr = smooth(2, 12.5, tau)
        ctx.strokeStyle = `rgba(${Math.round(lerp(232, 255, fr))},${Math.round(lerp(229, 77, fr))},${Math.round(lerp(222, 46, fr))},${lerp(0.16, 0.85, fr)})`
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, w - 2, h - 2)
        ctx.lineWidth = 1

        if (st.phase === 'answer' || st.phase === 'noticed') {
          ctx.fillStyle = 'rgba(4,4,4,0.8)'
          ctx.fillRect(0, 0, w, h)
        }
      },
    }
  })

  const answerText =
    guess === WHITES
      ? 'Exactly right. Your attention did its job — which is the point.'
      : `You counted ${guess}. Tracking many moving things at once is hard; most people manage four or five.`

  return (
    <div className="att__test">
      <div className="att__instr">
        <p className="mono mono--dim">Test 07.1</p>
        <p className="big big--s att__instruction" aria-live="polite">
          {instruction}
        </p>
      </div>
      <div className="att__stage">
        <canvas ref={canvasRef} aria-label="Moving white and grey particles." />
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              className="att__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="prose">
                They will move for {DURATION} seconds. Keep your eyes on the white ones. Do not lose any.
              </p>
              <button className="btn" onClick={begin}>
                <span className="btn__dot" /> Begin counting
              </button>
            </motion.div>
          )}
          {phase === 'answer' && (
            <motion.div
              key="answer"
              className="att__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mono mono--ink">How many white particles?</p>
              <div className="att__stepper">
                <button className="btn" onClick={() => setGuess((g) => Math.max(0, g - 1))} aria-label="Fewer">
                  −
                </button>
                <span className="big big--m att__guess">{guess}</span>
                <button className="btn" onClick={() => setGuess((g) => Math.min(60, g + 1))} aria-label="More">
                  +
                </button>
              </div>
              <button
                className="btn"
                onClick={() => {
                  blip(1200, 0.015)
                  setPhase('noticed')
                }}
              >
                Confirm
              </button>
            </motion.div>
          )}
          {phase === 'noticed' && (
            <motion.div
              key="noticed"
              className="att__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mono mono--ink">While you counted — did you notice anything else happen?</p>
              <div className="choice-row" style={{ justifyContent: 'center' }}>
                {['Nothing', 'Something, not sure what', 'Yes, clearly'].map((c) => (
                  <button
                    key={c}
                    className="btn"
                    onClick={() => {
                      setNoticed(c)
                      setPhase('reveal')
                      tone(220, { dur: 2.4, gain: 0.03, type: 'triangle' })
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            className="att__reveal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <div>
              <p className="mono mono--dim">
                There were {WHITES}. {answerText}
              </p>
              <p className="big big--m att__didnt">You didn’t see everything.</p>
              {noticed && <p className="mono mono--dim">You answered: “{noticed}”.</p>}
            </div>
            <ol className="att__changes">
              {[
                'A large ring with a pupil crossed the whole field, slowly, for eight seconds.',
                'The frame turned from grey to red.',
                'The grid rotated by fourteen degrees.',
                'One grey particle grew to three times its size.',
                'The instruction above changed to “Ignore the white particles.”',
                'The title in the top-left corner read “The Observed”.',
              ].map((c, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 + i * 0.25 }}
                >
                  <span className="mono mono--dim">{String(i + 1).padStart(2, '0')}</span>
                  <span>{c}</span>
                </motion.li>
              ))}
            </ol>
            <button className="btn btn--ghost" onClick={() => setPhase('intro')}>
              ↺ Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────── part two: the map of attention ───────── */

const WORLD = [
  'the weight of your hands',
  'your breathing',
  'the tongue in your mouth',
  'the edge of the screen',
  'a sound in the room',
  'your posture',
  'the temperature of the air',
  'blinking',
  'your heartbeat',
  'what you are sitting on',
  'light on your face',
  'your feet',
  'the next thought',
  'a memory you did not choose',
  'the colour of the wall',
  'your jaw',
  'the nearest door',
  'the time',
  'someone you love',
  'the feeling of reading',
  'your shoulders',
  'the space behind you',
]

function AttentionMap() {
  const canvasRef = useRef(null)
  const [seen, setSeen] = useState([])
  const [world, setWorld] = useState(false)
  const live = useRef({ world: false, onSeen: null })
  live.current.world = world
  live.current.onSeen = (word) => setSeen((s) => (s.includes(word) ? s : [...s, word]))

  useEffect(() => {
    if (world || seen.length < 6) return
    const id = setTimeout(() => setWorld(true), 2500)
    return () => clearTimeout(id)
  }, [seen, world])

  useCanvas(canvasRef, (ctx, s) => {
    const r = rng(77)
    const coarse = matchMedia('(pointer: coarse)').matches
    let items = []
    const GX = 64
    const GY = 36
    const heat = new Float32Array(GX * GY)
    let lx = -999
    let ly = -999
    const layout = (w, h) => {
      ctx.font = '17px "Instrument Serif", serif'
      items = []
      for (const word of WORLD) {
        const tw = ctx.measureText(word).width
        let best = null
        for (let k = 0; k < 60; k++) {
          const x = 30 + r() * Math.max(10, w - tw - 60)
          const y = 40 + r() * (h - 80)
          const ok = items.every((it) => Math.abs(it.y - y) > 26 || x + tw + 24 < it.x || it.x + it.w + 24 < x)
          if (ok) {
            best = { x, y }
            break
          }
        }
        best = best || { x: 30 + r() * (w - tw - 60), y: 40 + r() * (h - 80) }
        items.push({ word, x: best.x, y: best.y, w: tw, seen: 0, trace: 0, done: false })
      }
    }
    return {
      resize(w, h) {
        layout(w, h)
      },
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const R = coarse ? 95 : 125
        const active = s.inside
        lx = approach(lx, active ? s.mx : lx, 14, dt)
        ly = approach(ly, active ? s.my : ly, 14, dt)
        if (active && !st.world) {
          const gx = Math.floor((s.mx / w) * GX)
          const gy = Math.floor((s.my / h) * GY)
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const x = gx + dx
              const y = gy + dy
              if (x >= 0 && y >= 0 && x < GX && y < GY) heat[y * GX + x] += dt * Math.exp(-(dx * dx + dy * dy) / 2)
            }
        }
        ctx.clearRect(0, 0, w, h)
        if (st.world) {
          // only what was attended remains
          const cw = w / GX
          const ch = h / GY
          for (let y = 0; y < GY; y++)
            for (let x = 0; x < GX; x++) {
              const v = heat[y * GX + x]
              if (v < 0.02) continue
              ctx.fillStyle = ink(clamp(v * 0.18, 0, 0.22))
              ctx.beginPath()
              ctx.arc((x + 0.5) * cw, (y + 0.5) * ch, Math.min(cw, ch) * clamp(0.25 + v * 0.5, 0, 0.75), 0, TAU)
              ctx.fill()
            }
        } else {
          // the faint lattice of everything available
          ctx.fillStyle = ink(0.06)
          for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) ctx.fillRect(x, y, 1, 1)
          if (active) {
            const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R)
            g.addColorStop(0, 'rgba(232,229,222,0.07)')
            g.addColorStop(1, 'rgba(232,229,222,0)')
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.arc(lx, ly, R, 0, TAU)
            ctx.fill()
            ctx.strokeStyle = ink(0.18)
            ctx.beginPath()
            ctx.arc(lx, ly, R, 0, TAU)
            ctx.stroke()
          }
        }
        ctx.font = '17px "Instrument Serif", serif'
        for (const it of items) {
          const cx = it.x + it.w / 2
          const d = active ? Math.hypot(cx - lx, it.y - ly) : 9999
          const lit = st.world ? 0 : clamp(1 - d / R)
          if (lit > 0.45 && !it.done) {
            it.seen += dt
            if (it.seen > 0.35) {
              it.done = true
              st.onSeen(it.word)
              blip(900 + Math.random() * 600, 0.006, 0.12)
            }
          }
          it.trace = approach(it.trace, it.done ? 0.32 : 0, 1, dt)
          let a = Math.max(0.05, lit * 0.95, it.trace)
          if (st.world) a = it.done ? 0.9 : 0.025
          ctx.fillStyle = ink(a)
          ctx.fillText(it.word, it.x, it.y)
        }
      },
    }
  })

  const unseen = WORLD.filter((w) => !seen.includes(w))
  return (
    <div className="att__map">
      <div className="att__instr">
        <p className="mono mono--dim">Test 07.2</p>
        <p className="prose">
          This field is full of things. Only what falls under your attention lights up. Wander through it, and stop on
          whatever you like.
        </p>
      </div>
      <div className="att__stage att__stage--map">
        <canvas ref={canvasRef} aria-label="A dark field of words, lit only where the pointer rests." />
        <p className="mono mono--dim att__count">
          Attended {String(seen.length).padStart(2, '0')} / {WORLD.length}
        </p>
        <AnimatePresence>
          {world && (
            <motion.div
              className="att__world"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6 }}
            >
              <motion.p
                className="big big--m"
                initial={{ opacity: 0, filter: 'blur(14px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
              >
                Attention ≠ perception
              </motion.p>
              <motion.p
                className="whisper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.6, delay: 2.6 }}
              >
                What you attend to becomes your world.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {world && (
          <motion.div
            className="att__lists"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 3.6, ease: EASE }}
          >
            <div>
              <p className="mono mono--ink">Your world, just now</p>
              <p className="att__words">{seen.join(' · ')}</p>
            </div>
            <div>
              <p className="mono mono--dim">Present the whole time, unattended</p>
              <p className="att__words att__words--dim">{unseen.join(' · ')}</p>
            </div>
            <div>
              <p className="prose">
                Having read “the weight of your hands”, you may feel them now. They were there all along. Your pointer
                is not your gaze, but it made a usable proxy. None of it leaves this page.
              </p>
              <button
                className="btn btn--ghost"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setSeen([])
                  setWorld(false)
                }}
              >
                ↺ Wander again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Attention() {
  return (
    <section id="attention" className="sec att" data-section>
      <SectionHead n="07" title="Attention" motif="Spotlights · focus fields" />
      <div className="grid12">
        <Statement className="big att__statement" text="You do not see the world. You see the part you *select.*" />
        <Reveal className="att__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Attention is the mind’s selection of what to process more deeply. How much you experience outside it is one
            of the field’s live disputes.
          </p>
        </Reveal>
      </div>
      <CountTest />
      <AttentionMap />
      <Claims>
        <Claim kind="empirical" cite="Simons & Chabris (1999), Gorillas in our midst">
          Asked to count basketball passes, roughly half of viewers failed to notice a person in a gorilla suit walking
          through the scene.
        </Claim>
        <Claim kind="empirical" cite="Rensink, O’Regan & Clark (1997)" delay={0.1}>
          Change blindness: large changes to a scene can go unnoticed when they happen during a brief interruption, or
          slowly enough.
        </Claim>
        <Claim kind="empirical" cite="Pylyshyn & Storm (1988)" delay={0.2}>
          People can track only around four or five independently moving objects at once.
        </Claim>
        <Claim kind="model" cite="Koch & Tsuchiya (2007)" delay={0.3}>
          Attention and consciousness may be distinct processes: each, some argue, can occur without the other.
        </Claim>
        <Claim kind="open" cite="N. Block (2007), the overflow debate" delay={0.4}>
          Is there rich experience outside attention that you simply cannot report? Or is the sense of a rich periphery
          itself an illusion?
        </Claim>
      </Claims>
      <Reveal className="att__james">
        <p className="whisper">“My experience is what I agree to attend to.”</p>
        <p className="mono mono--dim">William James, The Principles of Psychology (1890)</p>
      </Reveal>
    </section>
  )
}
