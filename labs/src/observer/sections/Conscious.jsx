import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Tag } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { noise3 } from '@shared/lib/noise.js'
import { approach, cool, ink, signal, TAU } from '@shared/lib/math.js'
import { blip, hiss, swell, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]
const A = ['yes', 'no', 'unsure']
const ALABEL = { yes: 'Yes', no: 'No', unsure: 'I don’t know' }

const QUESTIONS = [
  {
    id: 'colour',
    q: 'Do you experience colour?',
    tag: 'COLOUR',
    r: {
      yes: [
        'argument',
        'Then describe red to someone who has never seen it. Everything you say will be about relations — warm, like fire, the opposite of green. The redness itself will not go into words.',
      ],
      no: [
        'argument',
        'Some people genuinely lack colour vision. But you are seeing this text as something. Whatever that something is, it is the question.',
      ],
      unsure: [
        'empirical',
        'A reasonable answer. Introspection is not a precise instrument; people are often confidently wrong about their own current experience.',
        'e.g. Schwitzgebel (2008)',
      ],
    },
  },
  {
    id: 'pain',
    q: 'Do you experience pain?',
    tag: 'PAIN',
    r: {
      yes: [
        'empirical',
        'Pain seems the clearest case: it is hard to imagine a pain that does not hurt. Yet people with pain asymbolia describe pain that does not bother them.',
        'e.g. Berthier et al. (1988)',
      ],
      no: [
        'empirical',
        'Congenital insensitivity to pain exists, and it is dangerous. Pain is information. Something else would have to warn you.',
      ],
      unsure: [
        'argument',
        'Perhaps not right now. But you can imagine pain, and imagining it does not hurt. What is the difference between the two?',
      ],
    },
  },
  {
    id: 'continuity',
    q: 'Do you have a continuous self?',
    tag: 'CONTINUITY',
    r: {
      yes: [
        'model',
        'Each night it switches off. During every eye movement your visual input is suppressed, and you never notice the gaps. Continuity may be stitched together after the fact.',
      ],
      no: [
        'argument',
        'Hume agreed: looking inward, he found only perceptions, never a self that has them. Then who is answering?',
        'D. Hume (1739)',
      ],
      unsure: [
        'open',
        'The “stream of consciousness” feels continuous. Whether it is a stream or a rapid series of moments is still debated.',
        'W. James (1890)',
      ],
    },
  },
  {
    id: 'decade',
    q: 'Are you the same person you were ten years ago?',
    tag: 'TEN YEARS',
    r: {
      yes: [
        'argument',
        'Same name, same body — rebuilt in many of its parts — and overlapping memories. But many of your beliefs, tastes and fears have changed. What exactly stayed?',
      ],
      no: [
        'argument',
        'Then who owns your memories of ten years ago? They feel like yours. On some views, identity fades by degrees rather than switching off.',
        'D. Parfit, Reasons and Persons (1984)',
      ],
      unsure: [
        'argument',
        'Perhaps identity is the wrong question. Parfit argued that what matters is continuity and connectedness, and those come in degrees.',
        'D. Parfit (1984)',
      ],
    },
  },
  {
    id: 'copy',
    q: 'Could an exact copy of you also be you?',
    tag: 'COPY',
    r: {
      yes: [
        'argument',
        'Then if the copy is made and you are not destroyed, there are two of you. Which one goes home tonight?',
      ],
      no: [
        'argument',
        'Then something besides your pattern makes you you. Your particular atoms? They are exchanged constantly. A continuous path through space and time?',
      ],
      unsure: [
        'argument',
        'The copy would be just as certain that it is you. It would remember answering this question.',
      ],
    },
  },
  {
    id: 'memory',
    q: 'If your memories were replaced, would you remain the same person?',
    tag: 'MEMORY',
    r: {
      yes: [
        'argument',
        'Then you are not your memories. Something else carries you — a body, a temperament, a point of view. Which?',
      ],
      no: [
        'argument',
        'Locke tied personal identity to memory. But you have already forgotten most of your life. Are you a different person from the child you cannot remember being?',
        'After J. Locke (1690) and T. Reid (1785)',
      ],
      unsure: [
        'empirical',
        'People with profound amnesia keep personalities, preferences and a sense of “I”. Memory may be one strand among several.',
      ],
    },
  },
]

function SelfStructure({ answers, done }) {
  const ref = useRef(null)
  const live = useRef({ answers, done })
  live.current.answers = answers
  live.current.done = done
  useCanvas(ref, (ctx, s) => {
    const sm = { shift: 0, copy: 0, ghost: 0, ghostOff: 0, scan: -1, swap: 0 }
    const mem = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * TAU, k: Math.random() }))
    const ring = (cx, cy, r, opts = {}) => {
      const { gaps = 0, gapSize = 0, spikes = 0, spikeFrom = 0, spikeTo = TAU, rot = 0, t = 0, dash = null } = opts
      if (dash) ctx.setLineDash(dash)
      ctx.beginPath()
      const N = 220
      let pen = false
      for (let k = 0; k <= N; k++) {
        const a = (k / N) * TAU
        if (gaps) {
          const seg = ((a + rot) / TAU) * gaps
          if (seg - Math.floor(seg) > 1 - gapSize) {
            pen = false
            continue
          }
        }
        let rr = r
        if (spikes && a >= spikeFrom && a <= spikeTo)
          rr += Math.abs(noise3(Math.cos(a) * 3, Math.sin(a) * 3, t * 1.5)) * spikes * (k % 3 === 0 ? 1.6 : 0.6)
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr
        if (pen) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
        pen = true
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    const label = (x, y, text, col) => {
      ctx.font = '9.5px "JetBrains Mono Variable", monospace'
      ctx.fillStyle = col || ink(0.55)
      ctx.fillText(text, x, y)
    }
    const structure = (cx, cy, R, t, alpha, ans, withLabels) => {
      const a = (v) => v * alpha
      // colour
      const c = ans.colour
      const rc = R * 0.95
      if (!c) {
        ctx.strokeStyle = ink(a(0.16))
        ring(cx, cy, rc, { dash: [1, 5] })
      } else {
        const coloured = c === 'yes' || (c === 'unsure' && Math.sin(t * 2.4) > 0)
        if (coloured) {
          for (let k = 0; k < 48; k++) {
            ctx.strokeStyle = `hsla(${(k / 48) * 360 + t * 20}, 42%, 68%, ${a(0.7)})`
            ctx.beginPath()
            ctx.arc(cx, cy, rc, (k / 48) * TAU, ((k + 1) / 48) * TAU + 0.01)
            ctx.stroke()
          }
        } else {
          ctx.strokeStyle = ink(a(0.4))
          ring(cx, cy, rc, { dash: [4, 4] })
        }
      }
      // pain
      const p = ans.pain
      ctx.strokeStyle = !p ? ink(a(0.16)) : p === 'no' ? ink(a(0.35)) : signal(a(0.75))
      if (!p) ring(cx, cy, R * 0.78, { dash: [1, 5] })
      else
        ring(cx, cy, R * 0.78, {
          spikes: p === 'no' ? 0 : R * 0.07,
          spikeFrom: 0,
          spikeTo: p === 'yes' ? TAU : Math.PI,
          t,
        })
      // continuity
      const q = ans.continuity
      ctx.strokeStyle = !q ? ink(a(0.16)) : ink(a(0.8))
      if (!q) ring(cx, cy, R * 0.6, { dash: [1, 5] })
      else if (q === 'yes') {
        ring(cx, cy, R * 0.6)
        ctx.strokeStyle = ink(a(0.35))
        for (let k = 0; k < 60; k++) {
          const aa = (k / 60) * TAU + t * 0.3
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(aa) * R * 0.6, cy + Math.sin(aa) * R * 0.6)
          ctx.lineTo(cx + Math.cos(aa) * R * 0.63, cy + Math.sin(aa) * R * 0.63)
          ctx.stroke()
        }
      } else if (q === 'no') ring(cx, cy, R * 0.6, { gaps: 7, gapSize: 0.42, rot: t * 0.2 })
      else ring(cx, cy, R * 0.6, { gaps: 7, gapSize: 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3)), rot: t * 0.2 })
      // memory: particles on an orbit
      const m = ans.memory
      ctx.strokeStyle = ink(a(m ? 0.25 : 0.16))
      ring(cx, cy, R * 0.42, { dash: m ? null : [1, 5] })
      for (const pt of mem) {
        pt.a += 0.0025
        const x = cx + Math.cos(pt.a + t * 0.15) * R * 0.42
        const y = cy + Math.sin(pt.a + t * 0.15) * R * 0.42
        const swapped = m && sm.swap > pt.k
        ctx.fillStyle = swapped ? cool(a(0.9)) : ink(a(0.85))
        if (swapped) ctx.fillRect(x - 2, y - 2, 4, 4)
        else {
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, TAU)
          ctx.fill()
        }
      }
      // core
      const coreDim = m === 'no' ? 0.35 + 0.3 * Math.abs(Math.sin(t * 3)) : m === 'unsure' ? 0.65 : 1
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22)
      g.addColorStop(0, ink(a(0.4 * coreDim)))
      g.addColorStop(1, ink(0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.22, 0, TAU)
      ctx.fill()
      ctx.fillStyle = ink(a(coreDim))
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = ink(a(0.5))
      ring(cx, cy, R * 0.2)

      if (withLabels) {
        const word = (v) => (v === 'yes' ? 'AFFIRMED' : v === 'no' ? 'DENIED' : v === 'unsure' ? 'UNCERTAIN' : '—')
        const lx = cx + R * 1.02
        label(lx, cy - R * 0.9, `COLOUR ····· ${word(ans.colour)}`)
        label(lx, cy - R * 0.7, `PAIN ······· ${word(ans.pain)}`)
        label(lx, cy - R * 0.5, `CONTINUITY · ${word(ans.continuity)}`)
        label(lx, cy - R * 0.3, `MEMORY ····· ${word(ans.memory)}`)
      }
    }
    return {
      frame(dt) {
        const { w, h, t } = s
        const st = live.current
        const ans = st.answers
        ctx.clearRect(0, 0, w, h)
        const copy = ans.copy
        sm.shift = approach(sm.shift, copy ? 1 : 0, 2, dt)
        const R = Math.min(w * 0.27, h * 0.34) * (1 - 0.3 * sm.shift)
        sm.copy = approach(sm.copy, copy ? 1 : 0, 1.5, dt)
        const dec = ans.decade
        sm.ghost = approach(sm.ghost, dec ? 1 : 0, 1.5, dt)
        const off = dec === 'yes' ? 0.04 : dec === 'no' ? 0.9 : 0.45 + 0.4 * Math.sin(t * 0.7)
        sm.ghostOff = approach(sm.ghostOff, off, 1.2, dt)
        sm.swap = ans.memory ? (Math.sin(t * 0.5) * 0.5 + 0.5) * (ans.memory === 'unsure' ? 0.5 : 1) : 0
        const cx = w / 2 - sm.shift * R * 0.62
        const cy = h / 2

        // the past self
        if (sm.ghost > 0.01) {
          const gx = Math.max(R * 0.6, cx - sm.ghostOff * R * 0.9)
          const gy = cy + sm.ghostOff * R * 0.25
          ctx.save()
          ctx.globalAlpha = 0.3 * sm.ghost
          structure(gx, gy, R * 0.92, t - 3, 0.9, { ...ans, copy: null }, false)
          ctx.restore()
          if (sm.ghostOff > 0.2) {
            ctx.strokeStyle = cool(0.35 * sm.ghost)
            ctx.setLineDash([2, 5])
            ctx.beginPath()
            ctx.moveTo(gx, gy)
            ctx.lineTo(cx, cy)
            ctx.stroke()
            ctx.setLineDash([])
          }
          label(Math.max(8, gx - R * 0.3), gy + R * 1.0, 'YOU, TEN YEARS AGO', cool(0.6 * sm.ghost))
        }
        structure(cx, cy, R, t, 1, ans, !copy)
        label(cx - 14, cy + R * 1.12, 'YOU', ink(0.8))

        // the copy
        if (sm.copy > 0.01) {
          const kx = cx + R * 1.3
          ctx.save()
          ctx.globalAlpha = sm.copy * (copy === 'no' ? 0.35 : copy === 'unsure' ? 0.55 + 0.25 * Math.sin(t * 3) : 1)
          structure(kx, cy, R, t, 1, ans, false)
          ctx.restore()
          const name = copy === 'yes' ? 'ALSO YOU' : copy === 'no' ? 'NOT YOU' : 'YOU?'
          label(kx - 26, cy + R * 1.12, name, copy === 'no' ? ink(0.4) : ink(0.8))
        }

        // the verdict: a scan that finds nothing to measure
        if (st.done) {
          sm.scan = sm.scan < 0 ? 0 : sm.scan + dt * 0.35
          const y = (sm.scan % 1) * h
          const grd = ctx.createLinearGradient(0, y - 40, 0, y)
          grd.addColorStop(0, 'rgba(255,77,46,0)')
          grd.addColorStop(1, 'rgba(255,77,46,0.18)')
          ctx.fillStyle = grd
          ctx.fillRect(0, y - 40, w, 40)
          ctx.fillStyle = signal(0.9)
          ctx.fillRect(0, y, w, 1)
          label(16, y - 8, sm.scan < 1.2 ? 'SCANNING FOR EXPERIENCE…' : 'RESULT: INDETERMINATE', signal(0.95))
        } else sm.scan = -1
      },
    }
  })
  return <canvas ref={ref} aria-label="A concentric model of you that changes with each answer." />
}

export default function Conscious() {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [phase, setPhase] = useState('ask') // ask | reflect | end
  const [ending, setEnding] = useState(0)
  const Q = QUESTIONS[idx]
  const given = answers[Q.id]

  useEffect(() => {
    if (phase !== 'end') return
    setEnding(0)
    hiss(0.02, 2.4, 1200)
    const t1 = setTimeout(() => setEnding(1), 3400)
    const t2 = setTimeout(() => {
      setEnding(2)
      swell([73.4, 110, 146.8], 0.04, 6)
    }, 6200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase])

  const answer = (a) => {
    setAnswers((prev) => ({ ...prev, [Q.id]: a }))
    setPhase('reflect')
    tone(a === 'yes' ? 392 : a === 'no' ? 293.7 : 349.2, { dur: 1.6, gain: 0.03 })
  }
  const next = () => {
    blip(1400, 0.012)
    if (idx < QUESTIONS.length - 1) {
      setIdx(idx + 1)
      setPhase('ask')
    } else setPhase('end')
  }
  const reset = () => {
    setAnswers({})
    setIdx(0)
    setPhase('ask')
  }

  const [kind, text, cite] = given ? Q.r[given] : []

  return (
    <section id="conscious" className="sec con" data-section>
      <SectionHead n="09" title="Are You Conscious?" motif="A test with no pass mark" />
      <div className="grid12">
        <Statement className="big con__statement" text="The instrument now turns toward *you.*" />
        <Reveal className="con__aside" delay={0.3}>
          <p className="prose">
            Six questions. There are no correct answers, and the instrument will not pretend otherwise. Each answer
            changes its model of you.
          </p>
        </Reveal>
      </div>

      <div className="con__lab">
        <div className="con__stage">
          <SelfStructure answers={answers} done={phase === 'end'} />
        </div>
        <div className="con__card" aria-live="polite">
          <p className="mono mono--dim">
            Q {String(Math.min(idx + 1, 6)).padStart(2, '0')} / 06 · {phase === 'end' ? 'complete' : Q.tag}
          </p>
          <AnimatePresence mode="wait">
            {phase !== 'end' ? (
              <motion.div
                key={`${idx}-${phase}`}
                initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <h3 className="con__q">{Q.q}</h3>
                {phase === 'ask' ? (
                  <div className="choice-row">
                    {A.map((a) => (
                      <button key={a} className="btn" onClick={() => answer(a)}>
                        {ALABEL[a]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="con__reflect">
                    <p className="mono mono--ink">You answered: {ALABEL[given]}</p>
                    <p className="prose">{text}</p>
                    <p className="con__tag">
                      <Tag kind={kind} />
                      {cite && <span className="claim__cite"> · {cite}</span>}
                    </p>
                    <div className="choice-row">
                      <button className="btn" onClick={next}>
                        {idx < QUESTIONS.length - 1 ? 'Next question →' : 'Ask the instrument →'}
                      </button>
                      <button className="btn btn--ghost" onClick={() => setPhase('ask')}>
                        Change answer
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                <p className="prose">
                  The instrument has your answers. It is now looking for the thing they were about.
                </p>
                <button className="btn btn--ghost" style={{ marginTop: 18 }} onClick={reset}>
                  ↺ Answer again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="con__verdict" aria-live="polite">
        <AnimatePresence>
          {phase === 'end' && ending >= 1 && (
            <motion.p
              key="v1"
              className="big big--m"
              initial={{ opacity: 0, filter: 'blur(16px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2, ease: EASE }}
            >
              The system cannot determine whether you are conscious.
            </motion.p>
          )}
          {phase === 'end' && ending >= 2 && (
            <motion.p
              key="v2"
              className="big con__neither"
              initial={{ opacity: 0, filter: 'blur(20px)', letterSpacing: '0.3em' }}
              animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '-0.01em' }}
              transition={{ duration: 2.4, ease: EASE }}
            >
              Neither can <em>you.</em>
            </motion.p>
          )}
          {phase === 'end' && ending >= 2 && (
            <motion.div
              key="v3"
              className="con__fine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.6, delay: 2.6 }}
            >
              <Tag kind="open" />
              <p className="claim__text">
                Strictly: many philosophers hold that your own experience is the one thing you cannot doubt — “I think,
                therefore I am”. Others, the illusionists, argue that introspection misdescribes what experience is.
                What nobody has is a test that works from the outside, or a way to check the inside against anything but
                itself.
              </p>
              <p className="claim__cite">R. Descartes (1637; 1641); K. Frankish (2016); D. Dennett (1991)</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
