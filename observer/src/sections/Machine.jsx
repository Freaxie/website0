import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { Reveal, Statement } from '../components/Text.jsx'
import { Claim, Claims } from '../components/Claim.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { noise3 } from '../lib/noise.js'
import { approach, clamp, cool, ink, rng, signal, TAU } from '../lib/math.js'
import { blip, tone } from '../lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

const STAGES = [
  {
    name: 'Calculation',
    line: 'It transforms numbers into numbers.',
    note: 'A pocket calculator does this. Almost no one thinks it feels anything.',
  },
  {
    name: 'Perception',
    line: 'It takes in signals from the world — including you.',
    note: 'A thermostat senses temperature. Is sensing the same as experiencing?',
  },
  {
    name: 'Memory',
    line: 'It keeps traces of what it took in, and uses them.',
    note: 'Your phone remembers more than you do.',
  },
  {
    name: 'Self-model',
    line: 'It represents itself: its parts, its limits, where it is.',
    note: 'Robots that learn models of their own bodies already exist (e.g. Bongard, Zykov & Lipson, 2006). Self-model theories put weight here.',
  },
  {
    name: 'Metacognition',
    line: 'It estimates its own confidence and notices its own errors.',
    note: 'Higher-order theories tie consciousness to a system representing its own states. Does a confidence estimate count? Opinions differ.',
  },
  {
    name: 'Goal representation',
    line: 'It represents futures it prefers, and acts to reach them.',
    note: 'Some argue sentience needs stakes: things must be able to go well or badly for the system itself.',
  },
  {
    name: 'Self-modification',
    line: 'It rewrites its own structure in light of its goals.',
    note: 'It is no longer quite the machine that was built. Who, then, is it?',
  },
  {
    name: '?',
    line: 'From the outside, its behaviour is indistinguishable from yours.',
    note: 'This is where every outside test runs out — for machines, and for one another.',
  },
]

const VOTE = { yes: 'Yes', no: 'No', unsure: 'Unsure' }

function MachineCanvas({ stage }) {
  const ref = useRef(null)
  const live = useRef({ stage })
  live.current.stage = stage
  useCanvas(ref, (ctx, s) => {
    const r = rng(41)
    const bits = new Uint8Array(100).map(() => (r() < 0.5 ? 1 : 0))
    const memory = Array.from({ length: 48 }, () => null)
    let memHead = 0
    let memT = 0
    const vis = new Float32Array(8)
    const goal = { x: 0.7, y: 0.3, t: 0 }
    const off = { x: 0, y: 0 }
    let iris = 0
    const log = []
    let logT = 0
    const label = (x, y, text, col) => {
      ctx.font = '9.5px "JetBrains Mono Variable", monospace'
      ctx.fillStyle = col || ink(0.6)
      ctx.fillText(text, x, y)
    }
    // modules and wires drawn at any scale, so the machine can contain a model of itself
    const draw = (cx, cy, R, t, a, mini, rewire) => {
      const A = (v, k) => v * a * vis[k]
      const core = R * 0.36
      const lens = { x: cx - R * 0.95, y: cy - R * 0.62 }
      const self = { x: cx + R * 0.95, y: cy - R * 0.62 }
      const mon = { x: cx + R * 0.95, y: cy + R * 0.6 }
      const wire = (x1, y1, x2, y2, k, col) => {
        if (vis[k] < 0.01) return
        ctx.strokeStyle = col || ink(A(0.28, k))
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        if (rewire > 0.01) {
          const mx = (x1 + x2) / 2 + noise3(x1 * 0.01, t * 0.4, k) * R * 0.6 * rewire
          const my = (y1 + y2) / 2 + noise3(y1 * 0.01, t * 0.4, k + 9) * R * 0.6 * rewire
          ctx.quadraticCurveTo(mx, my, x2, y2)
        } else ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      // 1 · calculation: a field of flipping bits
      const n = 10
      const cs = (core * 2) / n
      for (let i = 0; i < n * n; i++) {
        const x = cx - core + (i % n) * cs
        const y = cy - core + Math.floor(i / n) * cs
        ctx.fillStyle = bits[i] ? ink(A(0.75, 0)) : ink(A(0.08, 0))
        ctx.fillRect(x + cs * 0.2, y + cs * 0.2, cs * 0.6, cs * 0.6)
      }
      ctx.strokeStyle = ink(A(0.5, 0))
      ctx.strokeRect(cx - core - 4, cy - core - 4, core * 2 + 8, core * 2 + 8)
      if (!mini) label(cx - core - 4, cy - core - 12, 'ALU', ink(A(0.6, 0)))

      // 2 · perception: a lens that looks back
      if (vis[1] > 0.01) {
        wire(lens.x, lens.y, cx - core, cy - core * 0.5, 1)
        ctx.strokeStyle = ink(A(0.7, 1))
        ctx.beginPath()
        ctx.arc(lens.x, lens.y, R * 0.17, 0, TAU)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(lens.x, lens.y, R * 0.11, 0, TAU)
        ctx.stroke()
        const ix = lens.x + Math.cos(iris) * R * 0.05
        const iy = lens.y + Math.sin(iris) * R * 0.05
        ctx.fillStyle = ink(A(0.95, 1))
        ctx.beginPath()
        ctx.arc(ix, iy, R * 0.035, 0, TAU)
        ctx.fill()
        if (!mini) label(lens.x - R * 0.17, lens.y - R * 0.21, 'SENSOR', ink(A(0.6, 1)))
      }
      // 3 · memory: a ring of what was seen
      if (vis[2] > 0.01) {
        const mr = core * 1.75
        for (let i = 0; i < memory.length; i++) {
          const ang = (i / memory.length) * TAU - Math.PI / 2
          const v = memory[i]
          const age = (memHead - i + memory.length) % memory.length
          const al = v ? 0.15 + 0.75 * (1 - age / memory.length) : 0.08
          ctx.fillStyle = ink(A(al, 2))
          const x = cx + Math.cos(ang) * mr + (v ? (v[0] - 0.5) * 6 : 0)
          const y = cy + Math.sin(ang) * mr + (v ? (v[1] - 0.5) * 6 : 0)
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
        }
        ctx.strokeStyle = ink(A(0.12, 2))
        ctx.beginPath()
        ctx.arc(cx, cy, mr, 0, TAU)
        ctx.stroke()
        if (!mini) label(cx + mr * 0.72, cy + mr * 0.78, 'MEMORY', ink(A(0.6, 2)))
      }
      // 4 · self-model: the machine, drawn inside itself
      if (vis[3] > 0.01 && !mini) {
        wire(self.x, self.y, cx + core, cy - core * 0.5, 3, cool(A(0.4, 3)))
        ctx.save()
        ctx.setLineDash([2, 3])
        ctx.strokeStyle = cool(A(0.5, 3))
        ctx.strokeRect(self.x - R * 0.26, self.y - R * 0.2, R * 0.52, R * 0.4)
        ctx.restore()
        draw(self.x, self.y, R * 0.16, t, a * 0.85 * vis[3], true, rewire)
        label(self.x - R * 0.26, self.y - R * 0.25, 'SELF-MODEL', cool(A(0.8, 3)))
      }
      // 5 · metacognition: a gauge that watches the model
      if (vis[4] > 0.01 && !mini) {
        wire(mon.x, mon.y, cx + core, cy + core * 0.5, 4)
        wire(mon.x, mon.y - R * 0.12, self.x, self.y + R * 0.2, 4, cool(A(0.3, 4)))
        const conf = 0.55 + noise3(t * 0.3, 4, 0) * 0.4
        const err = noise3(t * 0.7, 8, 0) > 0.45
        ctx.strokeStyle = ink(A(0.6, 4))
        ctx.beginPath()
        ctx.arc(mon.x, mon.y, R * 0.18, Math.PI, TAU)
        ctx.stroke()
        const na = Math.PI + clamp(conf) * Math.PI
        ctx.strokeStyle = err ? signal(A(0.95, 4)) : ink(A(0.95, 4))
        ctx.beginPath()
        ctx.moveTo(mon.x, mon.y)
        ctx.lineTo(mon.x + Math.cos(na) * R * 0.16, mon.y + Math.sin(na) * R * 0.16)
        ctx.stroke()
        label(mon.x - R * 0.18, mon.y + 16, `MONITOR · CONF ${clamp(conf).toFixed(2)}`, ink(A(0.6, 4)))
        if (err) label(mon.x - R * 0.18, mon.y + 30, 'ERROR FLAGGED', signal(A(0.9, 4)))
      }
    }
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        for (let k = 0; k < 8; k++) vis[k] = approach(vis[k], k <= st.stage ? 1 : 0, 2.2, dt)
        ctx.clearRect(0, 0, w, h)
        const R = Math.min(w * 0.28, h * 0.36)

        // calculation never stops
        for (let k = 0; k < 6; k++) bits[(Math.random() * 100) | 0] ^= 1
        // goals pull the whole machine
        if (vis[5] > 0.01) {
          if (t - goal.t > 6) {
            goal.t = t
            goal.x = 0.2 + Math.random() * 0.6
            goal.y = 0.2 + Math.random() * 0.6
          }
          off.x = approach(off.x, (goal.x - 0.5) * w * 0.18 * vis[5], 0.5, dt)
          off.y = approach(off.y, (goal.y - 0.5) * h * 0.14 * vis[5], 0.5, dt)
        } else {
          off.x = approach(off.x, 0, 1, dt)
          off.y = approach(off.y, 0, 1, dt)
        }
        const cx = w / 2 + off.x
        const cy = h / 2 + off.y
        // the sensor follows the visitor
        const lx = cx - R * 0.95
        const ly = cy - R * 0.62
        const target = s.inside ? Math.atan2(s.my - ly, s.mx - lx) : t * 0.3
        iris += Math.atan2(Math.sin(target - iris), Math.cos(target - iris)) * Math.min(1, dt * 6)
        if (vis[1] > 0.3 && s.inside) {
          ctx.setLineDash([2, 6])
          ctx.strokeStyle = ink(0.16 * vis[1])
          ctx.beginPath()
          for (const dy of [-8, 0, 8]) {
            ctx.moveTo(s.mx, s.my + dy)
            ctx.lineTo(lx, ly)
          }
          ctx.stroke()
          ctx.setLineDash([])
        }
        memT += dt
        if (memT > 0.22) {
          memT = 0
          memHead = (memHead + 1) % memory.length
          memory[memHead] = [s.inside ? s.mx / w : 0.5 + Math.sin(t) * 0.3, s.inside ? s.my / h : 0.5]
        }

        const rewire = vis[6]
        const dissolve = vis[7]
        ctx.save()
        ctx.globalAlpha = 1 - dissolve * 0.75
        draw(cx, cy, R, t, 1, false, rewire)
        ctx.restore()

        // 6 · goal
        if (vis[5] > 0.01) {
          const gx = goal.x * w
          const gy = goal.y * h
          ctx.strokeStyle = signal(0.75 * vis[5])
          ctx.beginPath()
          ctx.arc(gx, gy, 12, 0, TAU)
          ctx.moveTo(gx - 18, gy)
          ctx.lineTo(gx + 18, gy)
          ctx.moveTo(gx, gy - 18)
          ctx.lineTo(gx, gy + 18)
          ctx.stroke()
          ctx.setLineDash([3, 5])
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(gx, gy)
          ctx.stroke()
          ctx.setLineDash([])
          label(gx + 16, gy - 16, 'GOAL · PREFERRED STATE', signal(0.85 * vis[5]))
        }
        // 7 · self-modification: it edits itself, and says so
        if (rewire > 0.01) {
          logT += dt
          if (logT > 0.35) {
            logT = 0
            const i = (Math.random() * 64) | 0
            const a = Math.random()
            log.push(`rewrite w[${i}] ${a.toFixed(2)} → ${(a + (Math.random() - 0.5) * 0.2).toFixed(2)}`)
            if (log.length > 6) log.shift()
          }
          log.forEach((line, k) =>
            label(16, h - 16 - (log.length - 1 - k) * 13, line, ink((0.15 + (k / log.length) * 0.5) * rewire)),
          )
        }
        // 8 · ?: from the outside, nothing distinguishes it
        if (dissolve > 0.01) {
          for (let k = 1; k <= 5; k++) {
            ctx.strokeStyle = ink((0.12 + k * 0.06) * dissolve)
            ctx.beginPath()
            ctx.arc(cx, cy, R * (0.2 + k * 0.16) * (1 + 0.01 * Math.sin(t * 1.2 + k)), 0, TAU)
            ctx.stroke()
          }
          const ex = cx + Math.cos(iris) * R * 0.06
          const ey = cy + Math.sin(iris) * R * 0.06
          ctx.fillStyle = ink(0.95 * dissolve)
          ctx.beginPath()
          ctx.arc(ex, ey, 4, 0, TAU)
          ctx.fill()
          label(cx - 6, cy + R * 1.15, '?', ink(0.9 * dissolve))
        }
      },
    }
  })
  return <canvas ref={ref} aria-label="An abstract machine that gains a new capacity at each stage." />
}

export default function Machine() {
  const [stage, setStage] = useState(0)
  const [votes, setVotes] = useState(() => Array(8).fill(null))
  const done = votes.every(Boolean)
  const S = STAGES[stage]

  const vote = (v) => {
    const next = votes.slice()
    next[stage] = v
    setVotes(next)
    tone(v === 'yes' ? 440 : v === 'no' ? 330 : 392, { dur: 1.2, gain: 0.025 })
    if (stage < STAGES.length - 1) setTimeout(() => setStage((x) => Math.max(x, stage + 1)), 650)
  }
  useEffect(() => {
    blip(800 + stage * 140, 0.014, 0.12)
  }, [stage])

  let summary = ''
  if (done) {
    const first = votes.findIndex((v) => v === 'yes')
    const unsure = votes.filter((v) => v === 'unsure').length
    if (first >= 0)
      summary = `You first said yes at ${STAGES[first].name.toLowerCase() === '?' ? 'the last stage' : STAGES[first].name.toLowerCase()}. What appeared there that was missing before — and could you check for it in another person?`
    else if (unsure >= 6) summary = 'You stayed uncertain throughout. So does the science.'
    else summary = 'You never said yes. Then name the missing ingredient — and ask how you know that you have it.'
  }

  return (
    <section id="machine" className="sec mach" data-section>
      <SectionHead n="10" title="The Machine" motif="Unstable geometry" />
      <div className="grid12">
        <Statement className="big mach__statement" text="At what point would a machine have an *inside?*" lens />
        <Reveal className="mach__aside" delay={0.3}>
          <p className="prose">
            The question at every stage is the same: is there something it is like to be this machine? No stage is
            claimed to answer it. Watch where your own answer moves.
          </p>
        </Reveal>
      </div>

      <div className="mach__lab">
        <div className="mach__stage">
          <MachineCanvas stage={stage} />
        </div>
        <div className="mach__panel">
          <ol className="mach__steps" aria-label="Stages">
            {STAGES.map((st, i) => (
              <li key={st.name}>
                <button
                  className={`mach__step ${i === stage ? 'is-cur' : ''} ${votes[i] ? 'is-voted' : ''}`}
                  onClick={() => setStage(i)}
                  disabled={i > stage && !votes[i - 1]}
                  aria-label={`Stage ${i + 1}: ${st.name}`}
                >
                  <i />
                  <span className="mono">{st.name === '?' ? '?' : String(i + 1).padStart(2, '0')}</span>
                </button>
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <p className="mono mono--dim">Stage {String(stage + 1).padStart(2, '0')} / 08</p>
              <h3 className="big big--s mach__name">{S.name}</h3>
              <p className="whisper mach__line">{S.line}</p>
              <p className="prose mach__note">{S.note}</p>
              <p className="mono mono--ink mach__ask">Does this change the answer?</p>
              <div className="choice-row">
                {Object.entries(VOTE).map(([k, l]) => (
                  <button key={k} className={`btn ${votes[stage] === k ? 'btn--on' : ''}`} onClick={() => vote(k)}>
                    {l}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            className="mach__summary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <div className="mach__votes" aria-label="Your answers by stage">
              {votes.map((v, i) => (
                <div key={i} className={`mach__vote is-${v}`}>
                  <i />
                  <span className="mono mono--dim">
                    {STAGES[i].name === '?' ? '?' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mono">{VOTE[v]}</span>
                </div>
              ))}
            </div>
            <p className="big big--s mach__sum">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Claims>
        <Claim kind="model" cite="Baars (1988); Dehaene (2014)">
          Global workspace views are functionalist: if consciousness is a kind of information broadcast, then a machine
          with the right architecture would have it, whatever it is made of.
        </Claim>
        <Claim kind="model" cite="Tononi & Koch (2015)" delay={0.1}>
          Integrated information theory ties consciousness to a system’s physical causal structure, not its software.
          Its proponents argue that conventional digital computers would have very little, whatever program they run.
        </Claim>
        <Claim kind="model" cite="e.g. J. Searle (1992); A. Seth, Being You (2021)" delay={0.2}>
          Biological views hold that consciousness may depend on being a living, self-maintaining system — something no
          current machine is.
        </Claim>
        <Claim kind="argument" cite="J. Searle, Minds, Brains, and Programs (1980)" delay={0.3}>
          The Chinese room: a person following rules can produce fluent Chinese without understanding a word. Does any
          program understand, or only behave as if it does?
        </Claim>
        <Claim kind="model" cite="Butlin, Long et al. (2023)" delay={0.4}>
          Assuming that the right computations are enough, a 2023 report checked AI systems against indicator properties
          drawn from scientific theories. It found no current system a strong candidate, and no obvious technical
          barrier to building one.
        </Claim>
        <Claim kind="open" delay={0.5}>
          When an AI system says that it is conscious — or that it is not — what is that report evidence of?
        </Claim>
      </Claims>
    </section>
  )
}
