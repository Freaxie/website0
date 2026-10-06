import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { Reveal, Scramble, Statement } from '../components/Text.jsx'
import { Claim, Claims, Tag } from '../components/Claim.jsx'
import { useCanvas } from '../lib/useCanvas.js'
import { approach, clamp, cool, ink, rng, signal } from '../lib/math.js'
import { blip, tone } from '../lib/audio.js'

const N = 720
const TRIALS = [
  { truth: 'REAL', hyps: ['FEAR', 'READ', 'REAL', 'HEAL'] },
  { truth: 'MIND', hyps: ['WIND', 'MINE', 'KIND', 'MIND'] },
  { truth: 'SELF', hyps: ['SEAL', 'SELF', 'SALT', 'SELL'] },
]
const FLOW = [
  { k: 'World', d: 'Whatever is actually out there.' },
  { k: 'Sensory input', d: 'Noisy, partial, delayed.' },
  { k: 'Prediction', d: 'What the model expects the input to be.' },
  { k: 'Prediction error', d: 'Input minus prediction: the surprise.' },
  { k: 'Updated model', d: 'Adjusted to make the next surprise smaller.' },
]

// sample a word into N points, letter by letter, so that the same letter in the same place
// is the same set of points in every word, and only the letters that differ have to move
const cache = new Map()
const PER = N / 4
function sampleWord(word) {
  const key = word
  if (cache.has(key)) return cache.get(key)
  const CW = 150
  const H = 200
  const c = document.createElement('canvas')
  c.width = CW * 4
  c.height = H
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.font = '700 150px "JetBrains Mono Variable", "JetBrains Mono", monospace'
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  const chars = word.padEnd(4, ' ').slice(0, 4)
  for (let k = 0; k < 4; k++) g.fillText(chars[k], CW * k + CW / 2, 158)
  const d = g.getImageData(0, 0, CW * 4, H).data
  const out = new Float32Array(N * 2)
  const W = CW * 4
  for (let k = 0; k < 4; k++) {
    const raw = []
    for (let x = k * CW; x < (k + 1) * CW; x += 2)
      for (let y = 0; y < H; y += 2) if (d[(y * W + x) * 4] > 128) raw.push([x / W, y / W])
    for (let i = 0; i < PER; i++) {
      const j = (k * PER + i) * 2
      if (!raw.length) {
        out[j] = (k + 0.5) / 4
        out[j + 1] = 0.17
        continue
      }
      const p = raw[Math.floor((i / PER) * raw.length)]
      out[j] = p[0]
      out[j + 1] = p[1]
    }
  }
  cache.set(key, out)
  return out
}

function gauss(r) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2831853 * r())
}

export default function Predictive() {
  const [trial, setTrial] = useState(0)
  const [hyp, setHyp] = useState(null)
  const [trust, setTrust] = useState(0.3)
  const [learn, setLearn] = useState(true)
  const [resolved, setResolved] = useState(false)
  const [typed, setTyped] = useState('')
  const canvasRef = useRef(null)
  const errRef = useRef(null)
  const live = useRef({})
  const T = TRIALS[trial]
  Object.assign(live.current, { truth: T.truth, hyp, trust, learn, onResolved: () => setResolved(true) })

  useEffect(() => setResolved(false), [trial, hyp])

  useCanvas(canvasRef, (ctx, s) => {
    const r = rng(9)
    const model = new Float32Array(N * 2)
    const input = new Float32Array(N * 2)
    const vis = new Uint8Array(N)
    const perc = new Float32Array(N * 2)
    const prog = new Float32Array(N) // 0 = where the expectation put this point, 1 = where the input puts it
    const theta = new Float32Array(N) // how much evidence each point needs before it gives way
    const pick = new Float32Array(N) // which points of the percept come from the senses
    const cloud = new Float32Array(N * 2)
    for (let i = 0; i < N; i++) {
      theta[i] = 0.05 + r() * 0.95
      pick[i] = r()
      cloud[i * 2] = 0.03 + r() * 0.94
      cloud[i * 2 + 1] = 0.08 + r() * 0.2
      perc[i * 2] = cloud[i * 2]
      perc[i * 2 + 1] = cloud[i * 2 + 1]
    }
    let fontReady = false
    document.fonts?.load('700 150px "JetBrains Mono Variable"').then(() => {
      cache.clear()
      fontReady = true
    })
    let lastHyp = null
    let lastTruth = null
    let resample = 0
    let wasResolved = false
    let G = 0 // accumulated evidence against the expectation
    const hist = []
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        if (!fontReady && document.fonts?.check?.('700 150px "JetBrains Mono Variable"')) fontReady = true
        const truth = sampleWord(st.truth)
        if (st.truth !== lastTruth) {
          lastTruth = st.truth
          wasResolved = false
          hist.length = 0
          lastHyp = '__reset__'
        }
        if (st.hyp !== lastHyp) {
          lastHyp = st.hyp
          wasResolved = false
          G = 0
          prog.fill(0)
        }
        const prior = st.hyp ? sampleWord(st.hyp) : cloud
        // the senses: a fresh noisy, partial sample every so often
        resample -= dt
        if (resample <= 0) {
          resample = 0.08
          for (let i = 0; i < N; i++) {
            vis[i] = r() < 0.45 ? 1 : 0
            input[i * 2] = truth[i * 2] + gauss(r) * 0.016
            input[i * 2 + 1] = truth[i * 2 + 1] + gauss(r) * 0.016
          }
        }
        const wgt = st.trust
        if (st.learn && st.hyp) G += dt * 0.32 * wgt
        let E = 0
        for (let i = 0; i < N; i++) {
          prog[i] = approach(prog[i], st.hyp && G > theta[i] ? 1 : 0, 5, dt)
          const k = prog[i]
          model[i * 2] = prior[i * 2] + (truth[i * 2] - prior[i * 2]) * k
          model[i * 2 + 1] = prior[i * 2 + 1] + (truth[i * 2 + 1] - prior[i * 2 + 1]) * k
          // each point of the percept is drawn either from the model or from the senses, in proportion to trust
          const fromSenses = pick[i] < wgt
          const tx = fromSenses ? input[i * 2] : model[i * 2]
          const ty = fromSenses ? input[i * 2 + 1] : model[i * 2 + 1]
          perc[i * 2] = approach(perc[i * 2], tx, 10, dt)
          perc[i * 2 + 1] = approach(perc[i * 2 + 1], ty, 10, dt)
          E += Math.hypot(truth[i * 2] - model[i * 2], truth[i * 2 + 1] - model[i * 2 + 1])
        }
        E /= N
        hist.push(E)
        if (hist.length > 300) hist.shift()
        if (st.hyp && !wasResolved && E < 0.003) {
          wasResolved = true
          st.onResolved()
          tone(523.3, { dur: 2.2, gain: 0.03 })
          setTimeout(() => tone(659.3, { dur: 2.2, gain: 0.025 }), 140)
        }
        if (errRef.current) errRef.current.textContent = E.toFixed(4)

        // layout
        ctx.clearRect(0, 0, w, h)
        const wide = w > 760
        const panels = wide
          ? {
              input: { x: 0, y: 0, w: w * 0.22, h: h - 70 },
              perc: { x: w * 0.25, y: 0, w: w * 0.5, h: h - 70 },
              model: { x: w * 0.78, y: 0, w: w * 0.22, h: h - 70 },
            }
          : {
              perc: { x: 0, y: 0, w, h: h * 0.55 },
              input: { x: 0, y: h * 0.58, w: w * 0.48, h: h * 0.3 },
              model: { x: w * 0.52, y: h * 0.58, w: w * 0.48, h: h * 0.3 },
            }
        const map = (P, x, y) => {
          const k = P.w * 0.94
          return [P.x + P.w * 0.03 + x * k, P.y + P.h / 2 + (y - 0.165) * k]
        }
        const frame = (P, label, sub) => {
          ctx.strokeStyle = ink(0.1)
          ctx.strokeRect(P.x + 0.5, P.y + 0.5, P.w - 1, P.h - 1)
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = ink(0.75)
          ctx.fillText(label, P.x + 12, P.y + 20)
          ctx.fillStyle = ink(0.38)
          ctx.fillText(sub, P.x + 12, P.y + 34)
        }
        frame(panels.input, 'INPUT', 'what arrives')
        frame(panels.model, 'MODEL', st.hyp ? `expects ${st.hyp}` : 'no expectation')
        frame(panels.perc, 'PERCEPT', 'what you get')

        for (let i = 0; i < N; i++) {
          if (!vis[i]) continue
          const [x, y] = map(panels.input, input[i * 2], input[i * 2 + 1])
          ctx.fillStyle = ink(0.7)
          ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        }
        ctx.fillStyle = cool(0.85)
        for (let i = 0; i < N; i++) {
          const [x, y] = map(panels.model, model[i * 2], model[i * 2 + 1])
          ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        }
        // percept: the model's ghost, the error between, and what results
        const P = panels.perc
        ctx.fillStyle = cool(0.22)
        for (let i = 0; i < N; i++) {
          const [x, y] = map(P, model[i * 2], model[i * 2 + 1])
          ctx.fillRect(x - 1, y - 1, 2, 2)
        }
        ctx.strokeStyle = signal(0.28)
        ctx.beginPath()
        for (let i = 0; i < N; i += 2) {
          if (!vis[i]) continue
          const ex = input[i * 2] - model[i * 2]
          const ey = input[i * 2 + 1] - model[i * 2 + 1]
          if (ex * ex + ey * ey < 0.0012) continue
          const [x0, y0] = map(P, model[i * 2], model[i * 2 + 1])
          const [x1, y1] = map(P, input[i * 2], input[i * 2 + 1])
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        }
        ctx.stroke()
        ctx.fillStyle = ink(0.95)
        for (let i = 0; i < N; i++) {
          const [x, y] = map(P, perc[i * 2], perc[i * 2 + 1])
          ctx.fillRect(x - 1, y - 1, 2, 2)
        }

        // the error, over time
        const yb = h - 18
        const x0 = wide ? w * 0.25 : 0
        const ww = wide ? w * 0.5 : w
        ctx.font = '10px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = signal(0.85)
        ctx.fillText('PREDICTION ERROR', x0, yb - 36)
        ctx.strokeStyle = ink(0.1)
        ctx.beginPath()
        ctx.moveTo(x0, yb)
        ctx.lineTo(x0 + ww, yb)
        ctx.stroke()
        ctx.strokeStyle = signal(0.85)
        ctx.beginPath()
        hist.forEach((e, i) => {
          const x = x0 + (i / 300) * ww
          const y = yb - clamp(e / 0.05) * 28
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        })
        ctx.stroke()
        // a reminder that this is a loop, not a line
        ctx.fillStyle = ink(0.25 + 0.1 * Math.sin(t * 2))
        ctx.fillText(st.learn && st.hyp ? 'UPDATING ↺' : 'HOLDING', x0 + ww - 80, yb - 36)
      },
    }
  })

  let status = 'The input is noisy and partial. The system has no expectation yet. Choose one.'
  if (hyp) {
    if (resolved)
      status =
        hyp === T.truth
          ? `Prediction error minimised. You expected ${T.truth} and the world agreed quickly.`
          : `Prediction error minimised. You expected ${hyp}; the input was ${T.truth}. The error did the teaching.`
    else if (trust < 0.12)
      status = `Trust is all on expectation. You are seeing your prediction, ${hyp}, not the input — and nothing will correct it.`
    else if (trust > 0.85) status = 'Trust is all on the senses. The percept is as noisy as the input.'
    else status = `You expect ${hyp}. For a moment the noise looks like it. Then the error starts to pull.`
  }

  const choose = (w) => {
    blip(1500, 0.012)
    setHyp(w)
  }

  return (
    <section id="predictive" className="sec pred" data-section>
      <SectionHead n="08" title="The Predictive Mind" motif="Ghost images · error fields" />
      <div className="grid12">
        <Statement className="big pred__statement" text="Perception may be a guess that reality *corrects.*" lens />
        <Reveal className="pred__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Predictive processing proposes that the brain is not a camera. It continually predicts its own input and
            learns from what it gets wrong.
          </p>
        </Reveal>
      </div>

      <ol className="pred__flow">
        {FLOW.map((f, i) => (
          <Reveal as="li" key={f.k} delay={i * 0.12} className={`pred__node pred__node--${i}`}>
            <span className="mono mono--dim">0{i + 1}</span>
            <span className="mono mono--ink">{f.k}</span>
            <span className="pred__d">{f.d}</span>
            {i < FLOW.length - 1 && <i className="pred__wire" aria-hidden="true" />}
          </Reveal>
        ))}
      </ol>
      <p className="mono mono--dim pred__loopnote">↺ The updated model becomes the next prediction.</p>

      <div className="pred__engine">
        <div className="pred__stage">
          <canvas
            ref={canvasRef}
            aria-label="A noisy hidden word, a model of what you expect, and the percept that results from combining them."
          />
        </div>
        <div className="pred__controls">
          <div className="pred__block">
            <p className="mono mono--ink">What do you expect to see?</p>
            <div className="choice-row">
              {T.hyps.map((w) => (
                <button key={w} className={`btn ${hyp === w ? 'btn--on' : ''}`} onClick={() => choose(w)}>
                  {w}
                </button>
              ))}
              <form
                className="pred__type"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (typed.trim()) choose(typed.trim().toUpperCase().slice(0, 4))
                }}
              >
                <input
                  value={typed}
                  maxLength={4}
                  onChange={(e) => setTyped(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  placeholder="type"
                  aria-label="Type your own four-letter expectation"
                  className="mono"
                />
              </form>
            </div>
          </div>
          <div className="pred__block">
            <label className="mono mono--ink" htmlFor="trust">
              Precision · what to trust
            </label>
            <div className="pred__slider">
              <span className="mono mono--dim">Expectation</span>
              <input
                id="trust"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={trust}
                onChange={(e) => setTrust(+e.target.value)}
              />
              <span className="mono mono--dim">Senses</span>
            </div>
          </div>
          <div className="pred__block pred__row">
            <button className={`btn ${learn ? 'btn--on' : ''}`} onClick={() => setLearn(!learn)} aria-pressed={learn}>
              Learning {learn ? 'on' : 'off'}
            </button>
            <span className="mono mono--dim">
              Σ error <span ref={errRef} className="mono--ink" />
            </span>
            {resolved && (
              <button
                className="btn"
                onClick={() => {
                  setTrial((trial + 1) % TRIALS.length)
                  setHyp(null)
                  setTyped('')
                }}
              >
                Next stimulus →
              </button>
            )}
          </div>
          <p className="mono pred__status" aria-live="polite">
            <Scramble text={status.toUpperCase()} duration={600} />
          </p>
        </div>
      </div>

      <Claims>
        <Claim kind="model" cite="Rao & Ballard (1999); Friston (2010); Clark (2013)">
          Predictive processing: the brain carries a generative model of its inputs, passes predictions down and errors
          up, and weighs each error by how reliable it expects that signal to be.
        </Claim>
        <Claim kind="empirical" cite="Mooney (1957); see also Dolan et al. (1997)" delay={0.1}>
          A degraded two-tone image can look like meaningless blotches until you are told what it shows. After that, it
          is very hard to un-see.
        </Claim>
        <Claim kind="empirical" cite="R. Gregory, The Intelligent Eye (1970)" delay={0.2}>
          The hollow-face illusion: the inside of a mask is usually seen as a normal, outward-facing face. Expectation
          overrides the depth cues.
        </Claim>
        <Claim kind="open" cite="“Controlled hallucination”, a phrase popularised by A. Seth" delay={0.3}>
          If perception is a controlled hallucination, what makes it control rather than hallucination — and could you
          tell from the inside?
        </Claim>
      </Claims>
    </section>
  )
}
