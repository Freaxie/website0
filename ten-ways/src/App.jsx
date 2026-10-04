import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Cursor from './components/Cursor.jsx'
import Whisper from './components/Whisper.jsx'
import Passage from './components/Passage.jsx'
import Secrets from './components/Secrets.jsx'
import Hero from './sections/Hero.jsx'
import Atlas from './sections/Atlas.jsx'
import Plates from './sections/Plates.jsx'
import Encounters from './sections/Encounters.jsx'
import Kinships from './sections/Kinships.jsx'
import Constellation from './sections/Constellation.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'atlas', no: '02', name: 'The Atlas' },
  { id: 'ten', no: '03', name: 'The Twenty' },
  { id: 'encounters', no: '04', name: 'One World, Twenty Encounters' },
  { id: 'kinships', no: '05', name: 'Kinships' },
  { id: 'yours', no: '06', name: 'Your Constellation' },
  { id: 'coda', no: '07', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Atlas />
        <Plates />
        <Encounters />
        <Kinships />
        <Constellation />
        <Finale />
      </main>
      <Grain />
      <Passage />
      <Secrets />
      <Whisper />
      <Cursor />
    </MotionConfig>
  )
}
