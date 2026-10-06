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
import Lineages from './sections/Lineages.jsx'
import Constellation from './sections/Constellation.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'atlas', no: '02', name: 'The Atlas' },
  { id: 'ten', no: '03', name: 'The Twenty-Four' },
  { id: 'encounters', no: '04', name: 'One World, Twenty-Four Encounters' },
  { id: 'kinships', no: '05', name: 'Kinships' },
  { id: 'lineages', no: '06', name: 'Lineages' },
  { id: 'yours', no: '07', name: 'Your Constellation' },
  { id: 'coda', no: '08', name: 'Coda' },
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
        <Lineages />
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
