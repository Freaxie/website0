import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// Possible lives, and the age at which each one quietly stops being possible. The ages are invented.
const LIVES = [
  { name: 'Pilot', closes: 34, x: 8, y: 20 },
  { name: 'Composer', closes: 41, x: 30, y: 12 },
  { name: 'Painter', closes: 55, x: 54, y: 26 },
  { name: 'Healer', closes: 44, x: 76, y: 14 },
  { name: 'Traveller', closes: 47, x: 16, y: 56 },
  { name: 'Founder', closes: 52, x: 40, y: 50 },
  { name: 'Architect', closes: 49, x: 63, y: 60 },
  { name: 'Monk', closes: 62, x: 85, y: 48 },
  { name: 'Teacher', closes: 66, x: 27, y: 82 },
  { name: 'Novelist', closes: 72, x: 70, y: 84 },
]
const START = 20
const END = 80
const RATE = 1.25 // years per second of looking

export default function Provisional() {
  const ref = useRef(null)
  const visible = useInView(ref, { amount: 0.35 })
  const [age, setAge] = useState(START)
  const [paused, setPaused] = useState(false)
  const [made, setMade] = useState({}) // name -> years of work

  useEffect(() => {
    if (!visible || paused || age >= END) return
    const id = setInterval(() => {
      setAge((a) => Math.min(END, a + RATE / 10))
      setMade((m) => {
        const names = Object.keys(m)
        if (!names.length) return m
        const next = { ...m }
        for (const n of names) next[n] += RATE / 10 / names.length
        return next
      })
    }, 100)
    return () => clearInterval(id)
  }, [visible, paused, age])

  const chosen = Object.keys(made)
  const open = LIVES.filter((l) => !(l.name in made) && age < l.closes)
  const closed = LIVES.filter((l) => !(l.name in made) && age >= l.closes)
  const total = chosen.reduce((s, n) => s + made[n], 0)
  const done = age >= END

  let verdict
  if (done) verdict = chosen.length ? `Eighty. ${Math.round(total)} years went into ${chosen.length === 1 ? 'one thing' : `${chosen.length} things`}, and ${closed.length} lives went unlived. Both are the price of any life.` : 'Eighty, and still not yet. Every life stayed possible, and none was lived.'
  else if (!chosen.length && age < 30) verdict = 'Everything is still possible. Nothing has been chosen. Click a life to commit to it.'
  else if (!chosen.length) verdict = 'Still not yet. Marie-Louise von Franz called this the provisional life: waiting for the real one to begin.'
  else if (chosen.length > 3) verdict = 'Many commitments share the same years, so each one grows slowly.'
  else verdict = 'Something is being built. Each choice closed other doors, and that is how it got built.'

  return (
    <section id="provisional" className="pv" ref={ref}>
      <div className="pv__top">
        <SectionHead no="03" title="The Provisional Life" kicker="Time runs while you look. Possible lives float by, each with a window that closes. Commit to one and it lands, and starts to grow." />
        <div className="pv__read" aria-live="polite">
          <div>
            <span className="mono">Age</span>
            <b>{Math.floor(age)}</b>
          </div>
          <div>
            <span className="mono">Still open</span>
            <b className="is-p">{open.length}</b>
          </div>
          <div>
            <span className="mono">Years of work</span>
            <b className="is-s">{Math.floor(total)}</b>
          </div>
        </div>
      </div>

      <p className="pv__verdict">{verdict}</p>

      <div className="pv__stage">
        <div className="pv__sky">
          <div className="pv__clock mono" aria-hidden="true">
            <i style={{ width: `${((age - START) / (END - START)) * 100}%` }} />
          </div>
          {LIVES.map((l, i) => {
            const isChosen = l.name in made
            const gone = !isChosen && age >= l.closes
            const left = Math.max(0, l.closes - age)
            return (
              <button
                key={l.name}
                type="button"
                className={`pv__life ${gone ? 'is-gone' : ''} ${isChosen ? 'is-chosen' : ''}`}
                style={{ left: `min(${l.x}%, calc(100% - 132px))`, top: `${l.y}%`, animationDelay: `${i * -0.9}s`, '--fade': Math.min(1, left / 8) }}
                disabled={gone || isChosen || done}
                onClick={() => setMade((m) => ({ ...m, [l.name]: 0 }))}
                aria-label={gone ? `${l.name}: this window closed at ${l.closes}` : `Commit to ${l.name}`}
              >
                <span className="pv__life-name">{l.name}</span>
                <span className="mono">{gone ? `closed at ${l.closes}` : `open until ${l.closes}`}</span>
              </button>
            )
          })}
        </div>
        <div className="pv__ground">
          <AnimatePresence>
            {chosen.map((n) => (
              <motion.div key={n} className="pv__work" initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18, mass: 2 }}>
                <span className="pv__work-bar" style={{ height: `${Math.min(100, (made[n] / 45) * 100)}%` }} />
                <span className="pv__work-name">{n}</span>
                <span className="mono">{made[n].toFixed(1)} yrs</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {!chosen.length && <span className="pv__empty mono">Nothing built yet</span>}
        </div>
      </div>

      <div className="pv__controls">
        <button type="button" className="mono" onClick={() => setPaused((p) => !p)} disabled={done}>
          {paused ? 'Let time run' : 'Stop the clock'}
        </button>
        <button
          type="button"
          className="mono"
          onClick={() => {
            setAge(START)
            setMade({})
            setPaused(false)
          }}
        >
          Begin again at twenty
        </button>
        <span className="mono">The ages when each window closes are invented. One year passes every {1 / RATE < 1 ? `${(1 / RATE).toFixed(1)} seconds` : 'second'}.</span>
      </div>

      <div className="pv__notes">
        <p>
          <span className="mono">Von Franz, 1959–60</span>
          In lectures in Zurich, later the book <em>The Problem of the Puer Aeternus</em> (1970), Marie-Louise von Franz described the puer’s “provisional life”: the feeling that this is not yet real life, and that the real thing will begin some day.
        </p>
        <p>
          <span className="mono">Her prescription</span>
          Blunt, and much quoted: work. Not any particular work, but staying with one thing past the point where it stops being exciting.
        </p>
        <p>
          <span className="mono">The other side</span>
          The senex’s danger is the reverse: a life so settled that nothing new can start in it. Choosing is also a way of closing.
        </p>
      </div>
    </section>
  )
}
