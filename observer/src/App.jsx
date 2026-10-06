import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import Atmosphere from './components/Atmosphere.jsx'
import HUD from './components/HUD.jsx'
import Opening from './sections/Opening.jsx'
import Observer from './sections/Observer.jsx'
import Metacognition from './sections/Metacognition.jsx'
import StrangeLoop from './sections/StrangeLoop.jsx'
import Sentience from './sections/Sentience.jsx'
import Qualia from './sections/Qualia.jsx'
import SelfModel from './sections/SelfModel.jsx'
import Attention from './sections/Attention.jsx'
import Predictive from './sections/Predictive.jsx'
import Conscious from './sections/Conscious.jsx'
import Machine from './sections/Machine.jsx'
import Mirror from './sections/Mirror.jsx'
import { getState, setState, subscribe, SECTIONS } from './lib/store.js'
import { setDrone, startAudio } from './lib/audio.js'

// the room tone shifts with the room
const MOOD = {
  loop: [0.07, 260],
  qualia: [0.035, 220],
  self: [0.06, 320],
  conscious: [0.05, 300],
  machine: [0.06, 520],
  mirror: [0.018, 160],
}

const LID = [0.7, 0, 0.2, 1]

// Closing and opening the eye: the only transition between the outside and the laboratory.
function Eyelids({ closed }) {
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

function useRoomTone() {
  useEffect(() => {
    let last = null
    return subscribe(() => {
      const sec = getState().section
      if (sec === last) return
      last = sec
      const [level, cutoff] = MOOD[sec] || [0.06, 380]
      setDrone(level, cutoff, 2.5)
      document.documentElement.classList.toggle('no-glitch', sec === 'qualia' || sec === 'mirror')
    })
  }, [])
}

function useSectionTracker(active) {
  useEffect(() => {
    if (!active) return
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setState({ section: e.target.id })
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [active])
}

export default function App() {
  const [inside, setInside] = useState(false)
  const [closed, setClosed] = useState(false)
  const busy = useRef(false)

  useSectionTracker(inside)
  useRoomTone()

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

  const enter = useCallback(() => {
    startAudio()
    blink(() => {
      setState({ entered: performance.now(), section: 'observer', hud: 'on' })
      setInside(true)
    })
  }, [blink])

  const restart = useCallback(() => {
    blink(() => {
      setState({ section: null, hud: 'on' })
      setInside(false)
    })
  }, [blink])

  return (
    <MotionConfig reducedMotion="user">
      <Atmosphere />
      <AnimatePresence>{!inside && <Opening key="opening" onEnter={enter} />}</AnimatePresence>
      {inside && (
        <>
          <HUD />
          <main>
            <Observer />
            <Metacognition />
            <StrangeLoop />
            <Sentience />
            <Qualia />
            <SelfModel />
            <Attention />
            <Predictive />
            <Conscious />
            <Machine />
            <Mirror onRestart={restart} />
          </main>
        </>
      )}
      <Eyelids closed={closed} />
    </MotionConfig>
  )
}
