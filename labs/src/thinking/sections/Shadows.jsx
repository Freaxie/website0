import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Statement } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { ink, rng } from '@shared/lib/math.js'
import { harsh, tone } from '@shared/lib/audio.js'
import { te, ti } from '../color.js'
import { measured, reasoned, session } from '../session.js'

const EASE = [0.2, 0.7, 0.1, 1]

/* ───────── Ti overreaching: a rule too neat to be tested ───────── */

const fits = (a, b, c) => a < b && b < c
const near = (x, y) => Math.abs(x - y) < 1e-9
// each wrong rule comes with a triple that fits the real rule and not it
const RULES = [
  {
    t: 'Even numbers, going up by two',
    test: (a, b, c) => [a, b, c].every((n) => n % 2 === 0) && near(b - a, 2) && near(c - b, 2),
    counter: '1 · 2 · 3',
  },
  { t: 'Numbers going up by the same step', test: (a, b, c) => b > a && near(b - a, c - b), counter: '1 · 2 · 50' },
  { t: 'Any three numbers, each larger than the one before', test: fits, right: true },
  {
    t: 'Multiples of the first number',
    test: (a, b, c) => a !== 0 && b % a === 0 && c % a === 0,
    counter: '2 · 3 · 7',
  },
]

function Triples() {
  const [vals, setVals] = useState(['', '', ''])
  const [tests, setTests] = useState([])
  const [guessing, setGuessing] = useState(false)
  const [guess, setGuess] = useState(null)
  const negatives = tests.filter((x) => !x.ok).length

  const run = (e) => {
    e.preventDefault()
    const nums = vals.map((v) => Number(v))
    if (vals.some((v) => v.trim() === '' || Number.isNaN(Number(v)))) return
    const ok = fits(...nums)
    setTests((t) => [...t, { nums, ok }])
    setVals(['', '', ''])
    if (!ok && negatives < 3) reasoned(1)
    tone(ok ? 783.99 : 196, { dur: 0.7, gain: 0.025, type: ok ? 'sine' : 'triangle' })
  }
  const announce = (r) => {
    // a wrong rule can still agree with every answer the tests gave
    const consistent = tests.every((x) => r.test(...x.nums) === x.ok)
    setGuess({ ...r, consistent })
    session.rule = { t: r.t, right: !!r.right, consistent, counter: r.counter }
    tone(r.right ? 659.25 : 220, { dur: 2, gain: 0.03 })
  }

  return (
    <div className="shd__panel">
      <p className="mono t-ti">Ti overreaching · a rule too neat</p>
      <p className="prose shd__lede">
        <strong>2 · 4 · 6</strong> fits a rule I have in mind. Test other triples to find it. When you are sure, say
        what it is.
      </p>
      <form className="shd__triple" onSubmit={run}>
        {vals.map((v, i) => (
          <input
            key={i}
            id={`triple-${i}`}
            className="field shd__num"
            inputMode="numeric"
            value={v}
            onChange={(e) => setVals((x) => x.map((y, j) => (j === i ? e.target.value.replace(/[^0-9.-]/g, '') : y)))}
            aria-label={`Number ${i + 1}`}
            placeholder={String((i + 1) * 2)}
            disabled={!!guess}
          />
        ))}
        <button className="btn btn--ti" type="submit" disabled={!!guess}>
          Test
        </button>
      </form>
      <ol className="shd__tests">
        {tests.map((x, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="mono">{x.nums.join(' · ')}</span>
            <span className={`mono ${x.ok ? 't-ti' : 't-te'}`}>{x.ok ? 'fits' : 'does not fit'}</span>
          </motion.li>
        ))}
      </ol>
      {!guess && tests.length >= 3 && !guessing && (
        <button className="btn btn--ti" onClick={() => setGuessing(true)}>
          I know the rule
        </button>
      )}
      {!guess && guessing && (
        <div className="shd__rules">
          {RULES.map((r) => (
            <button key={r.t} className="shd__rule" onClick={() => announce(r)}>
              {r.t}
            </button>
          ))}
        </div>
      )}
      <AnimatePresence>
        {guess && (
          <motion.div
            className="shd__verdict"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <p className="big big--s">
              {guess.right
                ? 'That is the rule.'
                : guess.consistent
                  ? 'Consistent with every test. Still wrong.'
                  : 'Not the rule. One of your own tests had already said so.'}
            </p>
            <p className="prose">
              The rule was: any three numbers in rising order.{' '}
              {guess.right
                ? '1 · 2 · 3 fits. So does 5 · 50 · 500.'
                : `${guess.counter} fits it, and your rule says it should not.`}{' '}
              {negatives
                ? `You ran ${tests.length} tests and ${negatives} of them came back “no”. You went looking for a way to be wrong; most people never do.`
                : `You ran ${tests.length} tests, and every one came back “yes”. A test that can only say yes cannot tell you a theory is too narrow.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────── Te overreaching: the number that stopped meaning anything ───────── */

const units = (p) => 600 * (1 + 0.8 * p)
const defects = (p) => 0.02 + 0.6 * Math.pow(p, 2.2)
const good = (p) => units(p) * (1 - defects(p))
const PEAK = (() => {
  let best = 0
  let at = 0
  for (let k = 0; k <= 100; k++) {
    const g = good(k / 100)
    if (g > best) {
      best = g
      at = k
    }
  }
  return at
})()

function Target() {
  const [pressure, setPressure] = useState(0.2)
  const [shown, setShown] = useState(false)
  const pushed = useRef(false)
  const canvasRef = useRef(null)
  const live = useRef({ pressure: 0.2, shown: false })
  live.current.pressure = pressure
  live.current.shown = shown

  const onPress = (v) => {
    setPressure(v)
    if (v > 0.5 && !pushed.current) {
      pushed.current = true
      measured(1)
    }
  }

  useCanvas(canvasRef, (ctx, s) => {
    const r = rng(77)
    const items = []
    let spawn = 0
    return {
      frame(dt) {
        const { w, h } = s
        const st = live.current
        const p = st.pressure
        ctx.clearRect(0, 0, w, h)
        // a belt of finished units, faster under pressure
        const per = units(p) / 3600 // units per real second, scaled up below
        spawn += dt * per * 8
        while (spawn >= 1) {
          spawn -= 1
          items.push({ x: -10, bad: r() < defects(p), y: h * 0.32 + (r() - 0.5) * 6 })
        }
        const speed = w * (0.12 + 0.18 * p)
        ctx.strokeStyle = ink(0.12)
        ctx.beginPath()
        ctx.moveTo(0, h * 0.32 + 8)
        ctx.lineTo(w, h * 0.32 + 8)
        ctx.stroke()
        for (let k = items.length - 1; k >= 0; k--) {
          const it = items[k]
          it.x += speed * dt
          if (it.x > w + 10) {
            items.splice(k, 1)
            continue
          }
          ctx.fillStyle = st.shown && it.bad ? te(0.95) : ink(0.75)
          ctx.fillRect(it.x - 4, it.y - 4, 8, 8)
          if (st.shown && it.bad) {
            ctx.strokeStyle = '#050505'
            ctx.beginPath()
            ctx.moveTo(it.x - 4, it.y - 4)
            ctx.lineTo(it.x + 4, it.y + 4)
            ctx.stroke()
          }
        }
        // the two curves, once revealed: what was counted, and what it was meant to count
        const gx = 30
        const gw = w - 50
        const gy = h - 22
        const gh = h * 0.42
        const y = (v) => gy - (v / 1100) * gh
        ctx.strokeStyle = ink(0.12)
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.lineTo(gx + gw, gy)
        ctx.stroke()
        ctx.font = '9.5px "JetBrains Mono Variable", monospace'
        ctx.fillStyle = ink(0.45)
        ctx.fillText('PRESSURE →', gx + gw - 70, gy + 14)
        const curve = (f, col) => {
          ctx.strokeStyle = col
          ctx.beginPath()
          for (let k = 0; k <= 60; k++) {
            const q = k / 60
            const px = gx + q * gw
            k ? ctx.lineTo(px, y(f(q))) : ctx.moveTo(px, y(f(q)))
          }
          ctx.stroke()
        }
        curve(units, te(0.9))
        ctx.fillStyle = te(0.9)
        ctx.fillText('UNITS SHIPPED', gx + gw - 92, y(units(1)) - 6)
        if (st.shown) {
          curve(good, ti(0.95))
          ctx.fillStyle = ti(0.95)
          ctx.fillText('GOOD UNITS', gx + gw - 74, y(good(1)) + 14)
          ctx.setLineDash([2, 4])
          ctx.strokeStyle = ti(0.5)
          ctx.beginPath()
          ctx.moveTo(gx + (PEAK / 100) * gw, gy)
          ctx.lineTo(gx + (PEAK / 100) * gw, y(good(PEAK / 100)))
          ctx.stroke()
          ctx.setLineDash([])
        }
        const px = gx + p * gw
        ctx.fillStyle = '#fffdf8'
        ctx.beginPath()
        ctx.arc(px, y(units(p)), 3.5, 0, 6.3)
        ctx.fill()
        if (st.shown) {
          ctx.beginPath()
          ctx.arc(px, y(good(p)), 3.5, 0, 6.3)
          ctx.fill()
        }
      },
    }
  })

  const u = Math.round(units(pressure))
  const g = Math.round(good(pressure))
  const bonus = u >= 1000
  return (
    <div className="shd__panel">
      <p className="mono t-te">Te overreaching · the number that stopped meaning anything</p>
      <p className="prose shd__lede">
        Management rewards units shipped per hour. A bonus is paid above 1,000. Turn up the pressure.
      </p>
      <div className="shd__stage">
        <canvas ref={canvasRef} aria-label="A belt of finished units, and a chart of units shipped against pressure." />
        <div className="shd__nums">
          <p>
            <span className="mono mono--dim">Shipped / hour</span>
            <span className="big big--s t-te">{u.toLocaleString('en')}</span>
            {bonus && <span className="mono shd__bonus">Bonus achieved</span>}
          </p>
          {shown && (
            <p>
              <span className="mono mono--dim">Good units / hour</span>
              <span className="big big--s t-ti">{g.toLocaleString('en')}</span>
            </p>
          )}
        </div>
      </div>
      <div className="shd__slider">
        <label className="mono mono--dim" htmlFor="pressure">
          Pressure on output
        </label>
        <input
          id="pressure"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={pressure}
          onChange={(e) => onPress(+e.target.value)}
        />
        <span className="mono mono--ink">{Math.round(pressure * 100)}%</span>
      </div>
      {!shown ? (
        <button
          className="btn btn--te"
          onClick={() => {
            setShown(true)
            harsh(0.03, 0.25)
          }}
          disabled={!pushed.current && pressure <= 0.5}
        >
          Show what customers received
        </button>
      ) : (
        <motion.p className="prose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          The number you were rewarded on kept rising. The thing it was meant to stand for peaked at {PEAK}% pressure
          and then fell. At your setting, {Math.round(defects(pressure) * 100)}% of what shipped was faulty.
        </motion.p>
      )}
      {!shown && !pushed.current && pressure <= 0.5 && (
        <p className="mono mono--dim">Push past 50% to see what the bonus costs.</p>
      )}
    </div>
  )
}

export default function Shadows() {
  return (
    <section id="shadows" className="sec shd" data-section>
      <SectionHead n="06" title="Shadows" motif="Untested · overmeasured" />
      <div className="grid12">
        <Statement
          className="big shd__statement"
          text="Consistent can still be wrong. Efficient can still be *pointless.*"
        />
      </div>
      <div className="shd__panels">
        <Triples />
        <Target />
      </div>
      <Claims>
        <Claim kind="empirical" cite="P. C. Wason (1960)">
          In Wason’s original study only six of twenty-nine people found the rule without first announcing a wrong one.
          Most tested only triples their own guess said would fit.
        </Claim>
        <Claim kind="model" cite="Klayman & Ha (1987)" delay={0.1}>
          Testing cases you expect to fit is often a sensible strategy. It fails in one situation: when the true rule is
          broader than your guess, as it was here.
        </Claim>
        <Claim kind="argument" cite="M. Strathern (1997), after C. Goodhart (1975); D. Campbell (1979)" delay={0.2}>
          “When a measure becomes a target, it ceases to be a good measure.” Once a number is rewarded, people optimise
          the number, and its link to what it stood for weakens.
        </Claim>
        <Claim kind="empirical" cite="US Consumer Financial Protection Bureau (2016)" delay={0.3}>
          Under aggressive sales targets, employees at Wells Fargo opened roughly two million accounts and card
          applications that customers may never have authorised.
        </Claim>
        <Claim kind="argument" delay={0.4}>
          A theory that never meets the world cannot find out that it is wrong. A metric with no theory behind it cannot
          say what it is measuring.
        </Claim>
      </Claims>
    </section>
  )
}
