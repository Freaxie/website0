import { useCallback, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Atmosphere from '@shared/components/Atmosphere.jsx'
import HUD from '@shared/components/HUD.jsx'
import { Eyelids, useBlink, useRoomTone, useSectionTracker } from '@shared/components/Shell.jsx'
import { setState } from '@shared/lib/store.js'
import { startAudio } from '@shared/lib/audio.js'
import { SECTIONS } from './sections.js'
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

const TONES = {
  loop: [0.07, 260],
  qualia: [0.035, 220],
  self: [0.06, 320],
  conscious: [0.05, 300],
  machine: [0.06, 520],
  mirror: [0.018, 160],
}
const CALM = ['qualia', 'mirror']
const DARK = ['mirror']
const MODES = { mirror: 'off', qualia: 'dim' }

export default function App() {
  const [inside, setInside] = useState(false)
  const { closed, blink } = useBlink()

  useSectionTracker(SECTIONS, inside)
  useRoomTone(TONES, CALM)

  const enter = useCallback(() => {
    startAudio()
    blink(() => {
      setState({ entered: performance.now(), section: 'observer', hud: 'on', hudTitle: 'THE OBSERVER' })
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
      <Atmosphere dark={DARK} />
      <AnimatePresence>{!inside && <Opening key="opening" onEnter={enter} />}</AnimatePresence>
      {inside && (
        <>
          <HUD
            sections={SECTIONS}
            subtitle="a laboratory for a mind that knows it is a mind"
            modes={MODES}
            quiet={CALM}
          />
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
