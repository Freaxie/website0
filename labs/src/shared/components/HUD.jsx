import { useEffect, useRef, useState } from 'react'
import { pointer } from '../lib/pointer.js'
import { isMuted, onMuteChange, setMuted, blip, startAudio } from '../lib/audio.js'
import { getState, useStore } from '../lib/store.js'
import { Scramble } from './Text.jsx'

const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0')

export const MOODS = {
  base: 'OBSERVING',
  moving: 'TRACKING',
  idle: 'ATTENTION LOST?',
  fast: 'RESTLESS',
  long: 'YOU ARE STILL HERE.',
  returned: 'YOU WERE ELSEWHERE.',
}

// What the instrument notices about its visitor. Read-only, local, never stored.
function useMood(words, quiet) {
  const [mood, setMood] = useState(words.base)
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
      root.classList.toggle('is-idle', idle > 14000 && !quiet.includes(st.section))
      if (pointer.speed > 2300 && pointer.type === 'mouse') restlessUntil = now + 2000
      if (st.section && now - st.sectionSince > 75000 && !stillShown.has(st.section)) {
        stillShown.add(st.section)
        stillUntil = now + 6500
      }
      let m = words.base
      if (returnedAt && now - returnedAt < 4500) m = words.returned
      else if (idle > 7000) m = words.idle
      else if (now < restlessUntil) m = words.fast
      else if (now < stillUntil) m = words.long
      else if (now - pointer.lastMove < 400 && pointer.speed > 40) m = words.moving
      setMood((prev) => (prev === m ? prev : m))
    }, 280)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])
  return mood
}

// sections: [{ id, n, name }]; modes: { [sectionId]: 'dim' | 'off' }; quiet: sections the idle dimmer leaves alone
export default function HUD({ sections, subtitle, modes = {}, moods = MOODS, quiet = [] }) {
  const section = useStore((s) => s.section)
  const hud = useStore((s) => s.hud)
  const title = useStore((s) => s.hudTitle)
  const entered = useStore((s) => s.entered)
  const [muted, setM] = useState(isMuted())
  const coord = useRef(null)
  const clock = useRef(null)
  const mood = useMood(moods, quiet)

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

  const idx = sections.findIndex((s) => s.id === section)
  const cur = sections[idx]

  const go = (id) => {
    blip(2200, 0.012)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`hud hud--${modes[section] || hud}`}>
      <i className="crop" style={{ left: 10, top: 10 }} />
      <i className="crop" style={{ right: 10, top: 10 }} />
      <i className="crop" style={{ left: 10, bottom: 10 }} />
      <i className="crop" style={{ right: 10, bottom: 10 }} />

      <div className="hud__tl mono">
        <span className="hud__eye" aria-hidden="true" />
        <Scramble text={title} className="mono--ink" />
        <span className="mono--dim hud__sub"> — {subtitle}</span>
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
        <span className={`hud__pulse ${mood !== moods.base && mood !== moods.moving ? 'is-alert' : ''}`} />
        <span className="mono--dim">State </span>
        <Scramble text={mood} className="mono--ink" />
      </div>

      <div className="hud__br mono mono--dim">
        {cur ? <Scramble text={`§${cur.n}  ${cur.name.toUpperCase()}`} /> : <span>§00</span>}
      </div>

      <nav className="hud__rail" aria-label="Sections">
        {sections.map((s, i) => (
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
