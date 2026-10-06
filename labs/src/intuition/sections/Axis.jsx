import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal, Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { clamp } from '@shared/lib/math.js'
import { blip } from '@shared/lib/audio.js'
import { session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

const PAIRS = [
  {
    q: 'A new idea arrives. Your first move:',
    a: 'Where else could this apply?',
    b: 'What is this really pointing at?',
  },
  { q: 'A good conversation…', a: 'jumps between topics', b: 'goes deeper into one' },
  { q: 'When you are stuck, the answer…', a: 'comes from trying many angles', b: 'arrives whole once you stop trying' },
  { q: 'Thinking about next year, you see…', a: 'many ways it could go', b: 'where it is heading' },
  { q: 'Your notes are mostly…', a: 'many beginnings', b: 'one idea, rewritten' },
  {
    q: 'A symbol that keeps coming back in your dreams…',
    a: 'could mean a dozen things',
    b: 'means one thing you already knew',
  },
]

// −1 is fully outward, +1 fully inward
const toX = (v) => 40 + ((v + 1) / 2) * 520

function behaviour() {
  const out = clamp(session.opened / 20)
  const inn = clamp(session.converged / 4)
  if (!out && !inn) return null
  return clamp(inn - out, -1, 1)
}

export default function Axis() {
  const [picks, setPicks] = useState(() => PAIRS.map(() => 0))
  const [seen, setSeen] = useState({ did: null, opened: 0, converged: 0 })
  const did = seen.did

  // what the visitor did elsewhere on the page keeps arriving while they are here
  useEffect(() => {
    const id = setInterval(() => {
      setSeen((prev) =>
        prev.opened === session.opened && prev.converged === session.converged
          ? prev
          : { did: behaviour(), opened: session.opened, converged: session.converged },
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
      <SectionHead n="06" title="Which Way?" motif="Not a type test" />
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
                className={`axis__opt axis__opt--ne ${picks[i] === -1 ? 'is-on' : ''}`}
                onClick={() => pick(i, -1)}
                aria-pressed={picks[i] === -1}
              >
                {p.a}
              </button>
              <button
                className={`axis__opt axis__opt--ni ${picks[i] === 1 ? 'is-on' : ''}`}
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
          aria-label="An axis from outward to inward with your answers and your behaviour marked on it"
        >
          <defs>
            {/* user-space units: a horizontal line has no height for a bounding-box gradient to use */}
            <linearGradient id="axis-grad" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="560" y2="0">
              <stop offset="0" stopColor="#c6f02e" />
              <stop offset="1" stopColor="#8b74ff" />
            </linearGradient>
          </defs>
          <line x1="40" x2="560" y1="75" y2="75" stroke="url(#axis-grad)" strokeWidth="1.5" />
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <line key={v} x1={toX(v)} x2={toX(v)} y1="70" y2="80" className="axis__tick" />
          ))}
          <text x="40" y="112" className="axis__end axis__end--ne">
            OUTWARD · NE
          </text>
          <text x="560" y="112" textAnchor="end" className="axis__end axis__end--ni">
            INWARD · NI
          </text>
          {said != null && (
            <motion.g initial={false} animate={{ x: toX(said) }} transition={{ duration: 0.9, ease: EASE }}>
              <circle cx="0" cy="75" r="7" className="axis__said" />
              <text x="0" y="50" textAnchor="middle" className="axis__lab">
                WHAT YOU SAID
              </text>
            </motion.g>
          )}
          {did != null && (
            <motion.g initial={false} animate={{ x: toX(did) }} transition={{ duration: 0.9, ease: EASE }}>
              <rect x="-6" y="69" width="12" height="12" transform="rotate(45 0 75)" className="axis__did" />
              <text x="0" y="140" textAnchor="middle" className="axis__lab">
                WHAT YOU DID HERE
              </text>
            </motion.g>
          )}
        </svg>
        <div className="axis__read">
          {said == null && <p className="mono mono--dim">Pick a few halves to place your answer.</p>}
          {said != null && did == null && (
            <p className="prose">
              Your answers are placed. Your behaviour is not yet: try the paperclip or the three words above.
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
            Behaviour: {seen.opened} possibilities opened · {seen.converged} patterns closed, on this page
          </p>
        </div>
      </div>

      <Claims>
        <Claim kind="empirical" cite="D. Pittenger (1993; 2005)">
          On retest after a few weeks, a large share of people — around half in some studies — are assigned a different
          four-letter MBTI type.
        </Claim>
        <Claim kind="empirical" cite="McCrae & Costa (1989)" delay={0.1}>
          The MBTI’s sensing–intuition scale correlates with the Big Five trait openness to experience. It is the
          best-supported bridge between “intuition” in type theory and mainstream personality research.
        </Claim>
        <Claim kind="model" cite="post-Jungian typology, e.g. J. Beebe (2017)" delay={0.2}>
          Function stacks such as Ni–Te–Fi–Se, and the split of intuition into Ne and Ni, come from type theory. They
          have had little direct experimental testing.
        </Claim>
        <Claim kind="open" delay={0.3}>
          Is outward-versus-inward intuition a stable trait, a habit, or a mode everyone switches between within a
          minute — as you may have done on this page?
        </Claim>
      </Claims>
    </section>
  )
}
