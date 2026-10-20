import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims, Tag } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { approach, clamp, ink, TAU } from '@shared/lib/math.js'
import { blip, tone } from '@shared/lib/audio.js'
import { te, ti } from '../color.js'
import { reasoned, session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

const QUESTIONS = [
  {
    q: 'What holds a closed zipper shut?',
    options: [
      'Friction: the slider presses the teeth flat against each other.',
      'Each tooth has a hook on top and a hollow beneath; the hooks of one row sit in the hollows of the other.',
      'The fabric tape is woven tighter where the teeth meet.',
      'The two rows of teeth are magnetised in opposite directions.',
    ],
    right: 1,
    why: 'Each tooth carries a hook on one face and a hollow on the other. Closed, the rows interleave and every hook nests in a hollow on the opposite side.',
  },
  {
    q: 'Why won’t a closed zipper pull apart sideways, when the slider opens it with almost no effort?',
    options: [
      'The slider warms the teeth slightly so that they flex.',
      'Interlocked hooks resist a straight pull. The slider’s wedge bends the rows apart at an angle at which each hook can lift out.',
      'The slider cuts a temporary gap in the tape.',
      'A sideways pull tightens the teeth like a knot; a downward pull loosens them.',
    ],
    right: 1,
    why: 'Pulled straight apart, every hook is caught. Inside the slider a wedge splits a Y-shaped channel, and the rows enter or leave it at an angle that lets each hook clear its hollow, one tooth at a time.',
  },
]

const SCALE = [1, 2, 3, 4, 5, 6, 7]

// one tooth seen from above: a body, a hook on its upper edge, a hollow cut into its lower edge
function tooth(ctx, x, y, w, h, dir, detail) {
  // dir: +1 tooth points right (left row), −1 points left (right row)
  const x0 = dir > 0 ? x - w * 0.6 : x - w * 0.4
  ctx.beginPath()
  ctx.roundRect(x0, y - h / 2, w, h, h * 0.35)
  ctx.fill()
  if (!detail) return
  const hx = x + dir * w * 0.22
  ctx.beginPath()
  ctx.arc(hx, y - h / 2, h * 0.24, Math.PI, 0)
  ctx.fill()
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(hx, y + h / 2, h * 0.26, Math.PI, 0)
  ctx.fill()
  ctx.restore()
}

function Zipper({ unlocked }) {
  const ref = useRef(null)
  const live = useRef({ unlocked: false })
  live.current.unlocked = unlocked
  useCanvas(ref, (ctx, s, canvas) => {
    let ys = 0.55
    let target = 0.55
    let drag = false
    let touched = false
    let lastTooth = null
    const geo = () => {
      const { w, h } = s
      // the canvas is the stage, not the window: on a phone the loupe sits closer and the zipper moves left
      const narrow = w < 560
      return { cx: w * (narrow ? 0.24 : 0.32), top: h * 0.08, bottom: h * 0.92, pitch: narrow ? 12 : 15, narrow }
    }
    const setFrom = (e) => {
      const r = canvas.getBoundingClientRect()
      const { top, bottom } = geo()
      target = clamp((e.clientY - r.top - top) / (bottom - top), 0.06, 0.96)
    }
    const down = (e) => {
      if (!live.current.unlocked) return
      drag = true
      setFrom(e)
      if (!touched) {
        touched = true
        reasoned(1)
      }
    }
    const move = (e) => drag && setFrom(e)
    const up = () => (drag = false)
    canvas.addEventListener('pointerdown', down)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerup', up)
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const { cx, top, bottom, pitch, narrow } = geo()
        ys = approach(ys, target, 9, dt)
        const sy = top + ys * (bottom - top)
        // a soft click for every tooth that passes through the slider
        const passed = Math.floor(sy / pitch)
        if (passed !== lastTooth) {
          if (lastTooth !== null && st.unlocked) blip(2300 + Math.random() * 500, 0.005, 0.025)
          lastTooth = passed
        }
        const spread = Math.tan((9 * Math.PI) / 180)
        ctx.clearRect(0, 0, w, h)

        // the two tapes
        const xAt = (y, side) => {
          const open = Math.max(0, sy - y) // above the slider the rows part in a V
          return cx + side * (pitch * 0.7 + open * spread)
        }
        ctx.strokeStyle = ink(0.16)
        for (const side of [-1, 1]) {
          ctx.beginPath()
          for (let y = top; y <= bottom; y += 6) {
            const x = xAt(y, side) + side * pitch * 1.2
            y === top ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          }
          ctx.stroke()
        }
        // the teeth
        const tw = pitch * 1.5
        const th = pitch * 0.55
        for (let y = top + pitch; y < bottom; y += pitch) {
          for (const side of [-1, 1]) {
            const yy = y + (side > 0 ? pitch / 2 : 0)
            if (yy > bottom) continue
            const closed = yy > sy
            const x = closed ? cx + side * pitch * 0.12 : xAt(yy, side)
            ctx.fillStyle = closed ? ink(0.62) : ink(0.45)
            tooth(ctx, x, yy, tw, th, -side, false)
          }
        }
        // the slider: a body with a Y-shaped channel and a wedge, and a pull tab
        const sw = pitch * 3.6
        ctx.fillStyle = '#060606'
        ctx.strokeStyle = st.unlocked ? te(0.9) : ink(0.7)
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(cx - sw * 0.55, sy - pitch * 1.6)
        ctx.lineTo(cx + sw * 0.55, sy - pitch * 1.6)
        ctx.lineTo(cx + sw * 0.4, sy + pitch * 1.2)
        ctx.lineTo(cx - sw * 0.4, sy + pitch * 1.2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, sy - pitch * 0.2)
        ctx.lineTo(cx - pitch * 0.35, sy - pitch * 1.6)
        ctx.lineTo(cx + pitch * 0.35, sy - pitch * 1.6)
        ctx.closePath()
        ctx.stroke()
        ctx.beginPath()
        ctx.roundRect(cx - pitch * 0.45, sy + pitch * 1.2, pitch * 0.9, pitch * 3.2, pitch * 0.3)
        ctx.stroke()
        ctx.lineWidth = 1

        ctx.font = '9.5px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = ink(0.55)
        ctx.textAlign = 'center'
        ctx.fillText(
          st.unlocked ? 'DRAG THE SLIDER' : 'A ZIPPER · YOU HAVE USED THOUSANDS',
          narrow ? w / 2 : cx,
          bottom + 22,
        )
        ctx.textAlign = 'left'

        // the loupe: what happens inside, once you have tried to say it yourself
        const lx = w * (narrow ? 0.66 : 0.72)
        const ly = h * 0.5
        const R = Math.min(w * (narrow ? 0.31 : 0.22), h * 0.4)
        ctx.save()
        ctx.beginPath()
        ctx.arc(lx, ly, R, 0, TAU)
        ctx.clip()
        ctx.fillStyle = '#050505'
        ctx.fillRect(lx - R, ly - R, R * 2, R * 2)
        if (st.unlocked) {
          const P = R * 0.3 // magnified pitch
          const k = P / pitch
          const spreadL = spread * 1.6
          // the teeth slide past the wedge as the slider moves
          const phase = (((-sy * k) % P) + P) % P
          for (let j = -6; j <= 6; j++) {
            for (const side of [-1, 1]) {
              const yy = ly + j * P + (side > 0 ? P / 2 : 0) + phase
              const open = Math.max(0, ly - P * 0.4 - yy)
              const closed = open === 0
              const x = closed ? lx + side * P * 0.12 : lx + side * (P * 0.7 + open * spreadL)
              ctx.fillStyle = side < 0 ? ti(closed ? 0.85 : 0.55) : ink(closed ? 0.8 : 0.5)
              tooth(ctx, x, yy, P * 1.5, P * 0.55, -side, true)
            }
          }
          // the wedge
          ctx.strokeStyle = te(0.95)
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(lx, ly - P * 0.5)
          ctx.lineTo(lx - P * 0.45, ly - P * 2.6)
          ctx.lineTo(lx + P * 0.45, ly - P * 2.6)
          ctx.closePath()
          ctx.stroke()
          ctx.lineWidth = 1
          // labels
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          const label = (x, y, tx, ty, text, col) => {
            ctx.strokeStyle = col
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(tx, ty)
            ctx.stroke()
            ctx.fillStyle = col
            ctx.fillText(text, tx + 4, ty + 3)
          }
          label(lx + P * 0.3, ly + P * 1.25, lx + R * 0.5, ly + R * 0.38, 'HOOK', ti(0.95))
          label(lx - P * 0.25, ly + P * 2.3, lx + R * 0.3, ly + R * 0.62, 'HOLLOW', ink(0.8))
          label(lx, ly - P * 2.4, lx + R * 0.35, ly - R * 0.62, 'WEDGE', te(0.95))
          ctx.fillStyle = ink(0.5)
          ctx.fillText(`×${k.toFixed(0)}`, lx - R * 0.8, ly - R * 0.75)
        } else {
          ctx.fillStyle = ink(0.05)
          for (let y = -R; y < R; y += 6) ctx.fillRect(lx - R, ly + y, R * 2, 1)
          ctx.font = '10px "JetBrains Mono Variable", monospace'
          ctx.fillStyle = ink(0.5)
          ctx.textAlign = 'center'
          ctx.fillText('LOUPE', lx, ly - 5)
          ctx.fillText('OPENS AFTER YOUR EXPLANATION', lx, ly + 11)
          ctx.textAlign = 'left'
        }
        ctx.restore()
        ctx.strokeStyle = st.unlocked ? ti(0.6) : ink(0.25)
        ctx.beginPath()
        ctx.arc(lx, ly, R, 0, TAU)
        ctx.stroke()
        // a sight line from the slider to the loupe
        ctx.setLineDash([2, 5])
        ctx.strokeStyle = ink(0.2)
        ctx.beginPath()
        ctx.moveTo(cx + sw * 0.6, sy)
        ctx.lineTo(lx - R, ly)
        ctx.stroke()
        ctx.setLineDash([])
      },
      dispose() {
        canvas.removeEventListener('pointerdown', down)
        removeEventListener('pointermove', move)
        removeEventListener('pointerup', up)
      },
    }
  })
  return (
    <canvas
      ref={ref}
      aria-label="A zipper. After you have tried to explain it, a magnified view shows its hooks, hollows and wedge."
    />
  )
}

export default function Mechanism() {
  const [step, setStep] = useState('rate1') // rate1 | q0 | q1 | rate2 | done
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const [picks, setPicks] = useState([])

  const rate = (v) => {
    blip(700 + v * 90, 0.014)
    if (step === 'rate1') {
      setBefore(v)
      setStep('q0')
    } else {
      setAfter(v)
      session.zipper = { before, after: v }
      setStep('done')
      tone(523.25, { dur: 2.4, gain: 0.03 })
    }
  }
  const pick = (qi, oi) => {
    blip(1100, 0.012)
    setPicks((p) => [...p, oi])
    if (oi === QUESTIONS[qi].right) reasoned(1)
    setStep(qi === 0 ? 'q1' : 'rate2')
  }

  const qi = step === 'q0' ? 0 : step === 'q1' ? 1 : -1
  let verdict = ''
  if (step === 'done') {
    if (after < before)
      verdict = `You rated your understanding ${before}, then ${after}. Trying to explain it took something away. That drop is the illusion of explanatory depth.`
    else if (after === before)
      verdict = `Your rating held at ${before}. Either you knew it, or the questions did not press hard enough.`
    else
      verdict = `Your rating rose from ${before} to ${after}. That is unusual: explaining usually exposes gaps rather than filling them.`
  }

  return (
    <section id="mechanism" className="sec mech" data-section>
      <SectionHead n="03" title="Inward · Ti" motif="Mechanism" />
      <div className="grid12">
        <Statement className="big mech__statement" text="To use a thing is not to *understand* it." lens />
        <Reveal className="mech__aside" delay={0.3}>
          <Tag kind="model" />
          <p className="prose" style={{ marginTop: 10 }}>
            Type theorists describe introverted thinking as taking things apart in the head: wanting to know how a thing
            works, exactly, and why it has to work that way.
          </p>
        </Reveal>
      </div>

      <div className="mech__lab">
        <div className="mech__stage">
          <Zipper unlocked={step === 'done'} />
        </div>
        <div className="mech__panel" aria-live="polite">
          <AnimatePresence mode="wait">
            {(step === 'rate1' || step === 'rate2') && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <p className="mono mono--dim">{step === 'rate1' ? 'Step 1 / 3' : 'Step 3 / 3'}</p>
                <p className="mech__q">
                  {step === 'rate1'
                    ? 'How well do you understand how a zipper works?'
                    : 'Now: how well do you understand how a zipper works?'}
                </p>
                <div className="mech__scale">
                  {SCALE.map((v) => (
                    <button key={v} className="btn mech__num" onClick={() => rate(v)}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mech__anchors mono mono--dim">
                  <span>1 · not at all</span>
                  <span>7 · I could build one</span>
                </div>
              </motion.div>
            )}
            {qi >= 0 && (
              <motion.div
                key={`q${qi}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <p className="mono mono--dim">Step 2 / 3 · explain it · question {qi + 1} of 2</p>
                <p className="mech__q">{QUESTIONS[qi].q}</p>
                <div className="mech__options">
                  {QUESTIONS[qi].options.map((o, oi) => (
                    <button key={oi} className="mech__opt" onClick={() => pick(qi, oi)}>
                      <span className="mono mono--dim">{String.fromCharCode(65 + oi)}</span>
                      <span>{o}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <p className="mech__score">
                  <span className="mono mono--dim">Before</span>
                  <span className="big big--m">{before}</span>
                  <span className="mech__arrow t-ti">→</span>
                  <span className="mono mono--dim">After</span>
                  <span className="big big--m t-ti">{after}</span>
                </p>
                <p className="prose">{verdict}</p>
                <ol className="mech__answers">
                  {QUESTIONS.map((q, k) => (
                    <li key={k}>
                      <span className="mono mono--dim">
                        Q{k + 1} ·{' '}
                        {picks[k] === q.right ? (
                          <span className="t-ti">you had it</span>
                        ) : (
                          <span className="t-te">you missed it</span>
                        )}
                      </span>
                      <span>{q.why}</span>
                    </li>
                  ))}
                </ol>
                <p className="mono mono--dim">
                  The loupe is open. Drag the slider and watch the hooks find their hollows.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Claims>
        <Claim kind="empirical" cite="Rozenblit & Keil (2002)">
          The illusion of explanatory depth: people rate their understanding of zippers, flush toilets and cylinder
          locks highly, then lower their ratings after trying to explain how they work.
        </Claim>
        <Claim kind="empirical" cite="Fernbach, Rogers, Fox & Sloman (2013)" delay={0.1}>
          Asking people to explain how a policy would work, step by step, made their positions on it less extreme.
          Asking them for their reasons did not.
        </Claim>
        <Claim kind="model" delay={0.2}>
          On this reading, introverted thinking is the habit of not trusting the feeling of understanding until the
          mechanism has been rebuilt from its parts.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Is the feeling of understanding a measurement, or a guess? It seems to be built from familiarity at least as
          much as from knowledge.
        </Claim>
      </Claims>
    </section>
  )
}
