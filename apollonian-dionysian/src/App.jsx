import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Filters from './components/Filters.jsx'
import Hero from './sections/Hero.jsx'
import TwoForces from './sections/TwoForces.jsx'
import Individual from './sections/Individual.jsx'
import Spectrum from './sections/Spectrum.jsx'
import Nietzsche from './sections/Nietzsche.jsx'
import Tragedy from './sections/Tragedy.jsx'
import Synthesis from './sections/Synthesis.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'forces', no: '02', name: 'Two Forces' },
  { id: 'individual', no: '03', name: 'The Individual' },
  { id: 'spectrum', no: '04', name: 'Spectrum' },
  { id: 'nietzsche', no: '05', name: 'Nietzsche, 1872' },
  { id: 'tragedy', no: '06', name: 'Tragedy' },
  { id: 'synthesis', no: '07', name: 'Synthesis' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Filters />
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <TwoForces />
        <Individual />
        <Spectrum />
        <Nietzsche />
        <Tragedy />
        <Synthesis />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
