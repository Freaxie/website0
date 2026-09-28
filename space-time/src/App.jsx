import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import TwoAxes from './sections/TwoAxes.jsx'
import Chrono from './sections/Chrono.jsx'
import Relativity from './sections/Relativity.jsx'
import Thinkers from './sections/Thinkers.jsx'
import Spacetime from './sections/Spacetime.jsx'
import HereNow from './sections/HereNow.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'axes', no: '02', name: 'Two Axes' },
  { id: 'chrono', no: '03', name: 'The Frozen Leap' },
  { id: 'relativity', no: '04', name: 'Velocity' },
  { id: 'thinkers', no: '05', name: 'A Timeline' },
  { id: 'spacetime', no: '06', name: 'Spacetime' },
  { id: 'herenow', no: '07', name: 'Here, Now' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <TwoAxes />
        <Chrono />
        <Relativity />
        <Thinkers />
        <Spacetime />
        <HereNow />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
