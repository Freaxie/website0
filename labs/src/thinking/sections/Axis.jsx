import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { clamp } from '@shared/lib/math.js'
import { blip } from '@shared/lib/audio.js'
import { session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

// a: the outward (Te) half, b: the inward (Ti) half
const PAIRS = [
  { q: 'A new tool arrives. You first want to know…', a: 'what it is good for', b: 'how it works' },
  { q: 'In an argument, you care most that…', a: 'a decision gets made', b: 'the reasoning has no holes' },
  {
    q: 'A rule at work makes no sense to you, but it works…',
    a: 'you follow it and move on',
    b: 'you need to know why before you can follow it',
  },
  { q: 'A satisfying morning is…', a: 'a cleared list', b: 'an hour inside one interesting problem' },
  { q: 'When a plan fails, you first ask…', a: 'what would get it done now', b: 'where the logic went wrong' },
  { q: 'The best explanation is…', a: 'the most useful one', b: 'the most precise one' },
]

// −1 is fully outward, +1 fully inward
const toX = (v) => 40 + ((v + 1) / 2) * 520
// a marker's label stays over the axis even when the marker sits at one end
const labX = (v) => clamp(toX(v), 110, 490) - toX(v)

function behaviour() {
  const out = clamp(session.te / 6)
  const inn = clamp(session.ti / 6)
  if (!out && !inn) return null
  return clamp(inn - out, -1, 1)
}

export default function Axis() {
  const [picks, setPicks] = useState(() => PAIRS.map(() => 0))
  const [seen, setSeen] = useState({ did: null, te: 0, ti: 0 })
  const did = seen.did

  // what the visitor did elsewhere on the page keeps arriving while they are here
  useEffect(() => {
    const id = setInterval(() => {
      setSeen((prev) =>
        prev.te === session.te && prev.ti === session.ti ? prev : { did: behaviour(), te: session.te, ti: session.ti },
      )
    }, 800)
    return () => clearInterval(id)
  }, [])

  const answered = picks.filter(Boolean).length
  const said = answered ? picks.reduce((s, v) => s + v, 0) / answered : null
  const gap = said != null && did != null ? Math.abs(said - did) : null

  const pick = (i, v) => {
    blip(v < 0 ? 1500 : 700, 0.012)
    setPicks((p) => p.map((x, j) => (j === i ? (x === v ? 0 : v) : x)))
  }

  return (
    <section id="axis" className="sec axis" data-section>
      <SectionHead n="07" title="Which Way?" motif="Not a type test" />
      <div className="grid12">
        <Statement className="big axis__statement" text="This will not tell you your *type.*" />
        <Reveal className="axis__aside" delay={0.3}>
          <p className="prose">
            Six pairs. Pick the half that sounds more like you, or neither. Then compare what you said with what you did
            on this page.
          </p>
        </Reveal>
      </div>

      <div className="axis__pairs">
        {PAIRS.map((p, i) => (
          <div key={i} className="axis__row">
            <p className="mono mono--dim axis__q">
              {String(i + 1).padStart(2, '0')} · {p.q}
            </p>
            <div className="axis__opts">
              <button
                className={`axis__opt axis__opt--te ${picks[i] === -1 ? 'is-on' : ''}`}
                onClick={() => pick(i, -1)}
                aria-pressed={picks[i] === -1}
              >
                {p.a}
              </button>
              <button
                className={`axis__opt axis__opt--ti ${picks[i] === 1 ? 'is-on' : ''}`}
                onClick={() => pick(i, 1)}
                aria-pressed={picks[i] === 1}
              >
                {p.b}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="axis__result">
        <svg
          viewBox="0 0 600 150"
          className="axis__svg"
          role="img"
          aria-label="An axis from outward (Te) to inward (Ti) thinking, with your answers and your behaviour marked on it"
        >
          <defs>
            {/* user-space units: a horizontal line has no height for a bounding-box gradient to use */}
            <linearGradient id="axis-grad" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="560" y2="0">
              <stop offset="0" stopColor="#f06a2e" />
              <stop offset="1" stopColor="#6880ff" />
            </linearGradient>
          </defs>
          <line x1="40" x2="560" y1="75" y2="75" stroke="url(#axis-grad)" strokeWidth="1.5" />
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <line key={v} x1={toX(v)} x2={toX(v)} y1="70" y2="80" className="axis__tick" />
          ))}
          <text x="40" y="112" className="axis__end axis__end--te">
            OUTWARD · TE
          </text>
          <text x="560" y="112" textAnchor="end" className="axis__end axis__end--ti">
            INWARD · TI
          </text>
          {said != null && (
            <motion.g initial={false} animate={{ x: toX(said) }} transition={{ duration: 0.9, ease: EASE }}>
              <circle cx="0" cy="75" r="7" className="axis__said" />
              <text x={labX(said)} y="50" textAnchor="middle" className="axis__lab">
                WHAT YOU SAID
              </text>
            </motion.g>
          )}
          {did != null && (
            <motion.g initial={false} animate={{ x: toX(did) }} transition={{ duration: 0.9, ease: EASE }}>
              <rect x="-6" y="69" width="12" height="12" transform="rotate(45 0 75)" className="axis__did" />
              <text x={labX(did)} y="140" textAnchor="middle" className="axis__lab">
                WHAT YOU DID HERE
              </text>
            </motion.g>
          )}
        </svg>
        <div className="axis__read">
          {said == null && <p className="mono mono--dim">Pick a few halves to place your answer.</p>}
          {said != null && did == null && (
            <p className="prose">
              Your answers are placed. Your behaviour is not yet: try the zipper, the production line or the 2 · 4 · 6
              rule above.
            </p>
          )}
          {gap != null && (
            <p className="prose">
              {gap < 0.35
                ? 'What you said and what you did point the same way here. That agreement is less common than it sounds.'
                : 'What you said and what you did point different ways. Self-description and behaviour diverge more often than people expect.'}
            </p>
          )}
          <p className="mono mono--dim axis__basis">
            Behaviour: {seen.ti} reasons checked · {seen.te} results pushed, on this page
          </p>
        </div>
      </div>

      <Claims>
        <Claim kind="empirical" cite="McCrae & Costa (1989)">
          The MBTI’s thinking–feeling scale correlates mostly with the Big Five trait agreeableness: “thinking” scorers
          tend to be less agreeable. Preferring logic on a questionnaire is not the same as reasoning better.
        </Claim>
        <Claim kind="empirical" cite="Cacioppo & Petty (1982)" delay={0.1}>
          People differ reliably in need for cognition: how much they enjoy effortful thinking for its own sake. It
          predicts how closely they examine arguments, which is a measured trait and not a type.
        </Claim>
        <Claim kind="model" cite="post-Jungian typology, e.g. J. Beebe (2017)" delay={0.2}>
          Function stacks such as Ti–Ne–Si–Fe or Te–Ni–Se–Fi, and the split of thinking into Ti and Te, come from type
          theory. They have had little direct experimental testing.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Is the difference between Ti and Te about how people think, or about what satisfies them: an answer that is
          clean, or a result that ships?
        </Claim>
      </Claims>
    </section>
  )
}
