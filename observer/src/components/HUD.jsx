import { useEffect, useRef, useState } from 'react'
import { pointer } from '../lib/pointer.js'
import { isMuted, onMuteChange, setMuted, blip, startAudio } from '../lib/audio.js'
import { getState, SECTIONS, useStore } from '../lib/store.js'
import { Scramble } from './Text.jsx'

const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0')

// What the instrument notices about its visitor. Read-only, local, never stored.
function useMood() {
  const [mood, setMood] = useState('OBSERVING')
  useEffect(() => {
    let restlessUntil = 0
    let stillUntil = 0
    let returnedAt = 0
    let hiddenAt = 0
    const stillShown = new Set()
    const vis = () => {
      if (document.hidden) hiddenAt = performance.now()
      else if (hiddenAt && performance.now() - hiddenAt > 2500) returnedAt = performance.now()
    }
    document.addEventListener('visibilitychange', vis)
    const id = setInterval(() => {
      const now = performance.now()
      const st = getState()
      const idle = now - pointer.lastActivity
      const root = document.documentElement
      root.classList.toggle('is-idle', idle > 14000 && st.section !== 'mirror' && st.section !== 'qualia')
      if (pointer.speed > 2300 && pointer.type === 'mouse') restlessUntil = now + 2000
      if (st.section && now - st.sectionSince > 75000 && !stillShown.has(st.section)) {
        stillShown.add(st.section)
        stillUntil = now + 6500
      }
      let m = 'OBSERVING'
      if (returnedAt && now - returnedAt < 4500) m = 'YOU WERE ELSEWHERE.'
      else if (idle > 7000) m = 'ATTENTION LOST?'
      else if (now < restlessUntil) m = 'RESTLESS'
      else if (now < stillUntil) m = 'YOU ARE STILL HERE.'
      else if (now - pointer.lastMove < 400 && pointer.speed > 40) m = 'TRACKING'
      setMood((prev) => (prev === m ? prev : m))
    }, 280)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])
  return mood
}

export default function HUD() {
  const section = useStore((s) => s.section)
  const hud = useStore((s) => s.hud)
  const title = useStore((s) => s.hudTitle)
  const entered = useStore((s) => s.entered)
  const [muted, setM] = useState(isMuted())
  const coord = useRef(null)
  const clock = useRef(null)
  const mood = useMood()

  useEffect(() => onMuteChange(setM), [])

  useEffect(() => {
    const id = setInterval(() => {
      if (coord.current) {
        const x = (pointer.x / innerWidth).toFixed(3)
        const y = (pointer.y / innerHeight).toFixed(3)
        coord.current.textContent = `X ${x}  Y ${y}`
      }
      if (clock.current) {
        const s = (performance.now() - entered) / 1000
        clock.current.textContent = `T+ ${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}`
      }
    }, 100)
    return () => clearInterval(id)
  }, [entered])

  const idx = SECTIONS.findIndex((s) => s.id === section)
  const cur = SECTIONS[idx]

  const go = (id) => {
    blip(2200, 0.012)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`hud hud--${section === 'mirror' ? 'off' : section === 'qualia' ? 'dim' : hud}`}>
      <i className="crop" style={{ left: 10, top: 10 }} />
      <i className="crop" style={{ right: 10, top: 10 }} />
      <i className="crop" style={{ left: 10, bottom: 10 }} />
      <i className="crop" style={{ right: 10, bottom: 10 }} />

      <div className="hud__tl mono">
        <span className="hud__eye" aria-hidden="true" />
        <Scramble text={title} className="mono--ink" />
        <span className="mono--dim hud__sub"> — a laboratory for a mind that knows it is a mind</span>
      </div>

      <div className="hud__tr mono mono--dim">
        <span ref={coord} className="hud__coord" />
        <span ref={clock} className="hud__clock" />
        <button
          className="hud__sound"
          onClick={() => {
            startAudio()
            setMuted(!muted)
          }}
          aria-pressed={!muted}
        >
          <span className={`hud__bars ${muted ? '' : 'is-on'}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {muted ? 'Sound off' : 'Sound on'}
        </button>
      </div>

      <div className="hud__bl mono">
        <span className={`hud__pulse ${mood !== 'OBSERVING' && mood !== 'TRACKING' ? 'is-alert' : ''}`} />
        <span className="mono--dim">State </span>
        <Scramble text={mood} className="mono--ink" />
      </div>

      <div className="hud__br mono mono--dim">
        {cur ? <Scramble text={`§${cur.n}  ${cur.name.toUpperCase()}`} /> : <span>§00</span>}
      </div>

      <nav className="hud__rail" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            className={`hud__tick ${i === idx ? 'is-cur' : ''} ${i < idx ? 'is-past' : ''}`}
            onClick={() => go(s.id)}
            aria-label={`${s.n} ${s.name}`}
          >
            <span className="hud__tick-label mono">
              {s.n} {s.name}
            </span>
            <i />
          </button>
        ))}
      </nav>
    </div>
  )
}
