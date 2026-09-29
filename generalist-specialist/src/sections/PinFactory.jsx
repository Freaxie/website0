import { useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'
import { useLoop } from '../lib/useLoop.js'

const DAY = 12 // seconds of this page per working day
const OPS = ['Draw the wire', 'Straighten it', 'Cut it', 'Point it', 'Grind the top', 'Make the head', 'Fit the head', 'Whiten', 'Pierce the paper', 'Put in paper']
// Smith's figures: ten workers dividing about eighteen operations made upwards of 48,000 pins a day;
// working alone, each "could not ... have made twenty, perhaps not one".
const RATE = { divided: 48000, whole: 10 * 20 }

export default function PinFactory() {
  const wrap = useRef(null)
  const [mode, setMode] = useState('whole')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const state = useRef({ pins: 0, day: 1, clock: 0 })
  const [view, setView] = useState({ pins: 0, day: 1, clock: 0 })
  const beads = useRef([])
  const arcs = useRef([])

  useLoop(wrap, (t, dt) => {
    const s = state.current
    s.clock += dt
    if (s.clock >= DAY) {
      s.clock = 0
      s.day += 1
      s.pins = 0
    }
    s.pins += (RATE[modeRef.current] / DAY) * dt
    setView({ pins: s.pins, day: s.day, clock: s.clock })
    const divided = modeRef.current === 'divided'
    beads.current.forEach((el, i) => {
      if (!el) return
      const u = (t * 0.35 + i / beads.current.length) % 1
      el.setAttribute('transform', `translate(${60 + u * 880} 150)`)
      el.setAttribute('opacity', divided ? 1 : 0)
    })
    arcs.current.forEach((el, i) => {
      if (!el) return
      // a lone worker gets through all nine steps slowly, one pin at a time
      const k = ((t / (DAY / 20)) + i * 0.13) % 1
      const a = k * Math.PI * 2
      el.setAttribute('d', `M0 -22A22 22 0 ${k > 0.5 ? 1 : 0} 1 ${Math.sin(a) * 22} ${-Math.cos(a) * 22}`)
      el.setAttribute('opacity', divided ? 0 : 1)
    })
  })

  const divided = mode === 'divided'
  const hh = 8 + Math.floor((view.clock / DAY) * 10)
  return (
    <section id="pins" className="pin" ref={wrap}>
      <div className="pin__top">
        <SectionHead no="04" title="The Pin Factory" kicker="Adam Smith, 1776: ten workers making pins. Let each make whole pins, or divide the work among them." />
        <div className="pin__toggle" role="radiogroup" aria-label="How the work is organised">
          <button type="button" role="radio" aria-checked={!divided} className={!divided ? 'is-on' : ''} onClick={() => setMode('whole')}>
            Each makes whole pins
          </button>
          <button type="button" role="radio" aria-checked={divided} className={divided ? 'is-on' : ''} onClick={() => setMode('divided')}>
            Divide the labour
          </button>
        </div>
      </div>

      <div className="pin__stage">
        <svg viewBox="0 0 1000 300" className="pin__svg" role="img" aria-label={divided ? 'Ten workers along one line, each doing one operation, with pins streaming past' : 'Ten workers each at their own bench, slowly finishing single pins'}>
          <path d="M40 150H960" className={`pin__belt ${divided ? 'is-on' : ''}`} />
          {Array.from({ length: 10 }, (_, i) => {
            const x = 90 + i * 91
            return (
              <g key={i} transform={`translate(${x} 150)`}>
                <circle r="30" className={`pin__worker ${divided ? 'is-spec' : 'is-gen'}`} style={{ '--c': i }} />
                <path ref={(el) => (arcs.current[i] = el)} className="pin__arc" />
                <text y={i % 2 ? 84 : 62} textAnchor="middle" className="pin__op">
                  {divided ? OPS[i] : 'every step'}
                </text>
              </g>
            )
          })}
          {Array.from({ length: 40 }, (_, i) => (
            <g key={i} ref={(el) => (beads.current[i] = el)} opacity="0">
              <path d="M0 -8V8" className="pin__pin" />
              <circle cy="-8" r="2.5" className="pin__head" />
            </g>
          ))}
        </svg>
      </div>

      <div className="pin__readout" aria-live="off">
        <div>
          <span className="mono">Day {view.day} · {String(hh).padStart(2, '0')}:00</span>
          <b>{Math.floor(view.pins).toLocaleString('en-US')}</b>
          <span className="mono">pins made today</span>
        </div>
        <div>
          <span className="mono">Per worker, per day</span>
          <b>{(RATE[mode] / 10).toLocaleString('en-US')}</b>
          <span className="mono">{divided ? 'Smith: 48,000 among ten' : 'Smith: “not twenty, perhaps not one”'}</span>
        </div>
      </div>

      <div className="pin__notes">
        <p>
          <span className="mono">The Wealth of Nations, Book I</span>
          Divided into about eighteen distinct operations, pin-making let ten workers make “upwards of forty-eight thousand pins in a day”. Specialisation is where modern productivity comes from.
        </p>
        <p className="pin__warn">
          <span className="mono">The same book, Book V</span>
          “The man whose whole life is spent in performing a few simple operations … generally becomes as stupid and ignorant as it is possible for a human creature to become.” Smith saw both sides, and wanted public education as the remedy.
        </p>
      </div>
    </section>
  )
}
