import { useCallback, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Atmosphere from '@shared/components/Atmosphere.jsx'
import HUD from '@shared/components/HUD.jsx'
import { Eyelids, useBlink, useRoomTone, useSectionTracker } from '@shared/components/Shell.jsx'
import { setState } from '@shared/lib/store.js'
import { startAudio } from '@shared/lib/audio.js'
import { SECTIONS } from './sections.js'
import Opening from './sections/Opening.jsx'
import Judge from './sections/Judge.jsx'
import Orders from './sections/Orders.jsx'
import Mechanism from './sections/Mechanism.jsx'
import Line from './sections/Line.jsx'
import Wason from './sections/Wason.jsx'
import Shadows from './sections/Shadows.jsx'
import Axis from './sections/Axis.jsx'
import Balance from './sections/Balance.jsx'

const TONES = {
  judge: [0.055, 340],
  orders: [0.07, 300],
  mechanism: [0.06, 260],
  line: [0.06, 600],
  shadows: [0.05, 320],
  balance: [0.02, 170],
}
const CALM = ['balance']
const MODES = { balance: 'off' }
// in this room, stillness is deliberation and speed is execution
const MOODS = {
  base: 'REASONING',
  moving: 'MEASURING',
  idle: 'DELIBERATING…',
  fast: 'EXECUTING',
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
      setState({ entered: performance.now(), section: 'judge', hud: 'on', hudTitle: 'PROOF & LEVER' })
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
            subtitle="a laboratory for thinking, inward and outward"
            modes={MODES}
            moods={MOODS}
            quiet={CALM}
          />
          <main>
            <Judge />
            <Orders />
            <Mechanism />
            <Line />
            <Wason />
            <Shadows />
            <Axis />
            <Balance onRestart={restart} />
          </main>
        </>
      )}
      <Eyelids closed={closed} />
    </MotionConfig>
  )
}
