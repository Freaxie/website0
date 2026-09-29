import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Oppositions from './sections/Oppositions.jsx'
import Transmutation from './sections/Transmutation.jsx'
import NextQuestion from './sections/NextQuestion.jsx'
import Timeline from './sections/Timeline.jsx'
import Failure from './sections/Failure.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'oppositions', no: '02', name: 'Oppositions' },
  { id: 'transmutation', no: '03', name: 'Transmutation' },
  { id: 'next', no: '04', name: 'What Happens Next?' },
  { id: 'roads', no: '05', name: 'Two Roads to the Future' },
  { id: 'failure', no: '06', name: 'Failure Modes' },
  { id: 'reality', no: '07', name: 'Reality Decides' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Oppositions />
        <Transmutation />
        <NextQuestion />
        <Timeline />
        <Failure />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
