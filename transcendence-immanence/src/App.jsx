import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Directions from './sections/Directions.jsx'
import Ladder from './sections/Ladder.jsx'
import Rhizome from './sections/Rhizome.jsx'
import Divine from './sections/Divine.jsx'
import Strata from './sections/Strata.jsx'
import Grain_ from './sections/GrainOfSand.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'directions', no: '02', name: 'Two Directions' },
  { id: 'ladder', no: '03', name: 'The Ladder' },
  { id: 'rhizome', no: '04', name: 'Tree & Rhizome' },
  { id: 'divine', no: '05', name: 'Where Is It?' },
  { id: 'strata', no: '06', name: 'Heights' },
  { id: 'grain', no: '07', name: 'A World in a Grain' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Directions />
        <Ladder />
        <Rhizome />
        <Divine />
        <Strata />
        <Grain_ />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
