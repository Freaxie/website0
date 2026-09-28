import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Fragments from './sections/Fragments.jsx'
import River from './sections/River.jsx'
import Paradox from './sections/Paradox.jsx'
import Ship from './sections/Ship.jsx'
import Argument from './sections/Argument.jsx'
import Flame from './sections/Flame.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'fragments', no: '02', name: 'Two Fragments' },
  { id: 'river', no: '03', name: 'The River' },
  { id: 'paradox', no: '04', name: 'Zeno’s Wall' },
  { id: 'ship', no: '05', name: 'The Ship' },
  { id: 'argument', no: '06', name: 'The Long Argument' },
  { id: 'flame', no: '07', name: 'Form in Flux' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Fragments />
        <River />
        <Paradox />
        <Ship />
        <Argument />
        <Flame />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
