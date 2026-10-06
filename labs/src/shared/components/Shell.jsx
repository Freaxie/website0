import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getState, setState, subscribe } from '../lib/store.js'
import { setDrone } from '../lib/audio.js'

const LID = [0.7, 0, 0.2, 1]

// Closing and opening the eye: the only transition between the outside and the laboratory.
export function Eyelids({ closed }) {
  return (
    <div className="lids" aria-hidden="true">
      <motion.div
        className="lid lid--top"
        initial={false}
        animate={{ y: closed ? '0%' : '-102%' }}
        transition={{ duration: closed ? 0.55 : 1.4, ease: LID }}
      />
      <motion.div
        className="lid lid--bottom"
        initial={false}
        animate={{ y: closed ? '0%' : '102%' }}
        transition={{ duration: closed ? 0.55 : 1.4, ease: LID }}
      />
    </div>
  )
}

// Close the eyes, change the world, open them again.
export function useBlink() {
  const [closed, setClosed] = useState(false)
  const busy = useRef(false)
  const blink = useCallback((then) => {
    if (busy.current) return
    busy.current = true
    setClosed(true)
    setTimeout(() => {
      then()
      window.scrollTo(0, 0)
      setTimeout(() => {
        setClosed(false)
        busy.current = false
      }, 380)
    }, 700)
  }, [])
  return { closed, blink }
}

// The room tone shifts with the room. tones: { [sectionId]: [level, cutoff] }; calm: sections without glitches.
export function useRoomTone(tones, calm = []) {
  useEffect(() => {
    let last = null
    return subscribe(() => {
      const sec = getState().section
      if (sec === last) return
      last = sec
      const [level, cutoff] = tones[sec] || [0.06, 380]
      setDrone(level, cutoff, 2.5)
      document.documentElement.classList.toggle('no-glitch', calm.includes(sec))
    })
  }, [tones, calm])
}

// Which section sits under the middle of the viewport.
export function useSectionTracker(sections, active) {
  useEffect(() => {
    if (!active) return
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setState({ section: e.target.id })
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections, active])
}
