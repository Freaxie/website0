import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { approach, ink, TAU } from '@shared/lib/math.js'
import { blip, thump, tone } from '@shared/lib/audio.js'
import { te } from '../color.js'
import { measured } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]
const STATIONS = [
  { name: 'Cut', rate: 5 },
  { name: 'Shape', rate: 2 },
  { name: 'Check', rate: 3 },
  { name: 'Pack', rate: 4 },
]
const PEOPLE = 14
const START = [4, 3, 4, 3]
const TARGET = 10 // the best fourteen people can do on this line
const BUFFER = 10
const SIM_MINUTE = 4 // real seconds per simulated minute

const capacity = (alloc) => alloc.map((n, i) => n * STATIONS[i].rate)
const best = (alloc) => Math.min(...capacity(alloc))

export default function Line() {
  const [alloc, setAlloc] = useState(START)
  const [solved, setSolved] = useState(false)
  const [changes, setChanges] = useState(0)
  const canvasRef = useRef(null)
  const outRef = useRef(null)
  const live = useRef({ alloc: START, onSolved: null })
  live.current.alloc = alloc
  live.current.onSolved = () => setSolved(true)

  const free = PEOPLE - alloc.reduce((a, b) => a + b, 0)
  const caps = capacity(alloc)
  const limit = Math.min(...caps)

  const change = (i, d) => {
    const next = alloc.slice()
    if (d > 0 && free <= 0) return
    if (d < 0 && next[i] <= 1) return
    next[i] += d
    if (best(next) > best(alloc)) measured(1)
    setAlloc(next)
    setChanges((c) => c + 1)
    blip(d > 0 ? 1400 : 800, 0.014)
  }

  useEffect(() => {
    if (solved) {
      measured(2)
      tone(523.25, { dur: 1.6, gain: 0.03 })
      setTimeout(() => tone(783.99, { dur: 2.2, gain: 0.03 }), 160)
    }
  }, [solved])

  useCanvas(canvasRef, (ctx, s) => {
    const queue = [Infinity, 0, 0, 0] // waiting in front of each station; raw material never runs out
    const acc = [0, 0, 0, 0]
    const state = ['working', 'working', 'working', 'working']
    const flying = [] // items travelling between stations
    const shipped = [] // completion times, in simulated minutes
    let simT = 0
    let total = 0
    let shown = 0
    let goodSince = null
    const hist = []
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const caps = capacity(st.alloc)
        const dSim = dt / SIM_MINUTE
        simT += dSim

        // run the line, last station first so space frees up downstream before upstream fills it
        for (let i = 3; i >= 0; i--) {
          acc[i] += caps[i] * dSim
          let did = false
          while (acc[i] >= 1) {
            const hasInput = i === 0 || queue[i] > 0
            const hasRoom = i === 3 || queue[i + 1] < BUFFER
            if (!hasInput) {
              state[i] = 'starved'
              break
            }
            if (!hasRoom) {
              state[i] = 'blocked'
              break
            }
            acc[i] -= 1
            if (i > 0) queue[i]--
            if (i < 3) queue[i + 1]++
            else {
              shipped.push(simT)
              total++
            }
            flying.push({ from: i, t: 0 })
            did = true
          }
          if (acc[i] >= 1) acc[i] = 1 // idle capacity cannot be saved up
          if (did) state[i] = 'working'
        }
        while (shipped.length && simT - shipped[0] > 1) shipped.shift()
        // measured output: what actually came out in the last simulated minute
        const rate = simT > 1 ? shipped.length : shipped.length / Math.max(simT, 0.2)
        shown = approach(shown, rate, 2.5, dt)
        hist.push(shown)
        if (hist.length > 240) hist.shift()
        if (best(st.alloc) >= TARGET && shown > TARGET - 0.6) {
          goodSince = goodSince ?? simT
          if (simT - goodSince > 0.4) st.onSolved()
        } else goodSince = null
        if (outRef.current) outRef.current.textContent = shown.toFixed(1)

        // layout
        ctx.clearRect(0, 0, w, h)
        const narrow = w < 760
        const x0 = w * 0.04
        const x1 = w * (narrow ? 0.86 : 0.88)
        const span = (x1 - x0) / 4
        const sw = span * 0.52
        const sh = Math.min(h * 0.4, 150)
        const cy = h * 0.46
        const sx = (i) => x0 + i * span + span * 0.5 - sw / 2
        const minCap = Math.min(...caps)

        for (let i = 0; i < 4; i++) {
          const x = sx(i)
          const constraint = caps[i] === minCap
          ctx.strokeStyle = constraint ? te(0.85) : ink(0.3)
          ctx.lineWidth = constraint ? 1.4 : 1
          ctx.strokeRect(x, cy - sh / 2, sw, sh)
          ctx.lineWidth = 1
          // the people at this station
          const n = st.alloc[i]
          for (let k = 0; k < n; k++) {
            const col = k % 3
            const row = Math.floor(k / 3)
            ctx.fillStyle = state[i] === 'working' ? ink(0.85) : ink(0.3)
            ctx.beginPath()
            ctx.arc(x + sw * (0.25 + col * 0.25), cy - sh * 0.22 + row * 14, 3.2, 0, TAU)
            ctx.fill()
          }
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = ink(0.8)
          ctx.fillText(STATIONS[i].name.toUpperCase(), x, cy - sh / 2 - 10)
          ctx.fillStyle = state[i] === 'working' ? ink(0.9) : te(0.9)
          ctx.fillText(state[i].toUpperCase(), x, cy + sh / 2 + 16)
          ctx.fillStyle = ink(0.45)
          ctx.fillText(`${caps[i]} / MIN`, x, cy + sh / 2 + 30)
          // the queue in front of it
          if (i > 0) {
            const qx = sx(i) - (span - sw) / 2 - 6
            for (let k = 0; k < queue[i]; k++) {
              ctx.fillStyle = k >= BUFFER - 1 ? te(0.9) : ink(0.7)
              ctx.fillRect(qx - 4, cy + sh / 2 - 8 - k * 9, 8, 7)
            }
          }
        }
        // items moving between stations
        for (let k = flying.length - 1; k >= 0; k--) {
          const f = flying[k]
          f.t += dt / 0.35
          if (f.t >= 1) {
            flying.splice(k, 1)
            continue
          }
          const ax = sx(f.from) + sw
          const bx = f.from < 3 ? sx(f.from + 1) - (span - sw) / 2 - 6 : x1 + 10
          const x = ax + (bx - ax) * f.t
          const y = cy - Math.sin(f.t * Math.PI) * 14
          ctx.fillStyle = f.from === 3 ? te(0.95) : ink(0.75)
          ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
        }
        // the shipped pile
        ctx.fillStyle = te(0.9)
        ctx.font = '10px "JetBrains Mono Variable", monospace'
        ctx.fillText('SHIPPED', x1 + 2, cy - sh / 2 - 10)
        ctx.font = '400 20px "JetBrains Mono Variable", monospace'
        ctx.fillText(String(total).padStart(4, '0'), x1 + 2, cy - sh / 2 + 16)
        // a sparkline of measured output, with the target
        const gy = h - 26
        const gx0 = x0
        const gw = x1 - x0
        const scale = (v) => gy - (v / 14) * 46
        ctx.strokeStyle = ink(0.1)
        ctx.beginPath()
        ctx.moveTo(gx0, gy)
        ctx.lineTo(gx0 + gw, gy)
        ctx.stroke()
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = te(0.5)
        ctx.beginPath()
        ctx.moveTo(gx0, scale(TARGET))
        ctx.lineTo(gx0 + gw, scale(TARGET))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.font = '9.5px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = te(0.7)
        ctx.fillText(`TARGET ${TARGET} / MIN`, gx0 + gw - 110, scale(TARGET) - 5)
        ctx.strokeStyle = te(0.95)
        ctx.beginPath()
        hist.forEach((v, k) => {
          const x = gx0 + (k / 240) * gw
          k ? ctx.lineTo(x, scale(v)) : ctx.moveTo(x, scale(v))
        })
        ctx.stroke()
      },
    }
  })

  return (
    <section id="line" className="sec line" data-section>
      <SectionHead n="04" title="Outward · Te" motif="Throughput" />
      <div className="grid12">
        <Statement className="big line__statement" text="A system is judged by what comes *out* of it." lens />
        <Reveal className="line__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Type theorists describe extraverted thinking as organising the world outside toward measurable ends: plans,
            standards, schedules, and decisions that hold up in practice.
          </p>
        </Reveal>
      </div>

      <div className="line__lab">
        <div className="line__brief">
          <p className="mono mono--ink">
            Fourteen people, four stations. Get this line to {TARGET} finished units a minute.
          </p>
          <p className="line__readout">
            <span className="mono mono--dim">Output</span>
            <span ref={outRef} className="big big--m t-te">
              0.0
            </span>
            <span className="mono mono--dim">/ min</span>
          </p>
        </div>
        <div className="line__stage">
          <canvas
            ref={canvasRef}
            aria-label="A production line of four stations with queues between them and a count of shipped units."
          />
        </div>
        <div className="line__controls">
          {STATIONS.map((st, i) => (
            <div key={st.name} className={`line__station ${caps[i] === limit ? 'is-limit' : ''}`}>
              <span className="mono mono--ink">{st.name}</span>
              <span className="mono mono--dim">{st.rate} / min per person</span>
              <div className="line__stepper">
                <button
                  className="btn"
                  onClick={() => change(i, -1)}
                  disabled={alloc[i] <= 1}
                  aria-label={`Fewer people at ${st.name}`}
                >
                  −
                </button>
                <span className="line__n">{alloc[i]}</span>
                <button
                  className="btn"
                  onClick={() => change(i, 1)}
                  disabled={free <= 0}
                  aria-label={`More people at ${st.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <div className="line__pool mono mono--dim">
            <span>
              Unassigned <span className="mono--ink">{free}</span>
            </span>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setAlloc(START)
                setSolved(false)
                thump(0.08)
              }}
            >
              ↺ Reset the line
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {solved && (
          <motion.div
            className="line__reflect"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <p className="big big--s">
              Ten a minute, from the same fourteen people{changes ? `, in ${changes} moves` : ''}. No allocation does
              better.
            </p>
            <p className="prose">
              Notice what you watched: the queues and the number, not the people. The line was only as fast as its
              slowest station, and every move that did not touch that station changed nothing at all.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Claims>
        <Claim kind="model" cite="E. Goldratt, The Goal (1984)">
          The theory of constraints: a system’s output is set by its tightest constraint, so improving anything else
          leaves the output where it was.
        </Claim>
        <Claim kind="empirical" cite="Kluger & DeNisi (1996), a meta-analysis" delay={0.1}>
          Feedback on performance usually helps, but in about a third of the studies reviewed it made performance worse.
          Measuring is not automatically improving.
        </Claim>
        <Claim kind="model" delay={0.2}>
          On this reading, extraverted thinking is the habit of judging a system by its results and changing whatever
          moves them, whether or not anyone yet knows why.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Is extraverted thinking a skill with systems, or a preference for judging by results? Questionnaires measure
          the preference. Nobody measures the skill.
        </Claim>
      </Claims>
    </section>
  )
}
