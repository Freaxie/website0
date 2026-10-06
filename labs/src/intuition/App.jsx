import { useCallback, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Atmosphere from '@shared/components/Atmosphere.jsx'
import HUD from '@shared/components/HUD.jsx'
import { Eyelids, useBlink, useRoomTone, useSectionTracker } from '@shared/components/Shell.jsx'
import { setState } from '@shared/lib/store.js'
import { startAudio } from '@shared/lib/audio.js'
import { SECTIONS } from './sections.js'
import Opening from './sections/Opening.jsx'
import Gap from './sections/Gap.jsx'
import Directions from './sections/Directions.jsx'
import Outward from './sections/Outward.jsx'
import Inward from './sections/Inward.jsx'
import Shadows from './sections/Shadows.jsx'
import Axis from './sections/Axis.jsx'
import Return from './sections/Return.jsx'

const TONES = {
  directions: [0.07, 300],
  outward: [0.055, 560],
  inward: [0.065, 230],
  shadows: [0.05, 320],
  return: [0.02, 170],
}
const CALM = ['return']
const MODES = { return: 'off' }
// in this room, stillness is incubation and speed is divergence
const MOODS = {
  base: 'LISTENING',
  moving: 'SEARCHING',
  idle: 'INCUBATING…',
  fast: 'DIVERGING',
  long: 'YOU ARE STILL HERE.',
  returned: 'YOU WERE ELSEWHERE.',
}

export default function App() {
  const [inside, setInside] = useState(false)
  const { closed, blink } = useBlink()

  useSectionTracker(SECTIONS, inside)
  useRoomTone(TONES, CALM)

  const enter = useCallback(() => {
    startAudio()
    blink(() => {
      setState({ entered: performance.now(), section: 'gap', hud: 'on', hudTitle: 'THE LEAP' })
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
      <Atmosphere dark={CALM} />
      <AnimatePresence>{!inside && <Opening key="opening" onEnter={enter} />}</AnimatePresence>
      {inside && (
        <>
          <HUD
            sections={SECTIONS}
            subtitle="a laboratory for intuition, outward and inward"
            modes={MODES}
            moods={MOODS}
            quiet={CALM}
          />
          <main>
            <Gap />
            <Directions />
            <Outward />
            <Inward />
            <Shadows />
            <Axis />
            <Return onRestart={restart} />
          </main>
        </>
      )}
      <Eyelids closed={closed} />
    </MotionConfig>
  )
}
