import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Knowing from './sections/Knowing.jsx'
import FoxHedgehog from './sections/FoxHedgehog.jsx'
import PinFactory from './sections/PinFactory.jsx'
import KindWicked from './sections/KindWicked.jsx'
import Shapes from './sections/Shapes.jsx'
import YourShape from './sections/YourShape.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'knowing', no: '02', name: 'Two Kinds of Knowing' },
  { id: 'fox', no: '03', name: 'The Fox & the Hedgehog' },
  { id: 'pins', no: '04', name: 'The Pin Factory' },
  { id: 'worlds', no: '05', name: 'Kind & Wicked' },
  { id: 'shapes', no: '06', name: 'Shapes of a Life' },
  { id: 'yours', no: '07', name: 'Your Shape' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Knowing />
        <FoxHedgehog />
        <PinFactory />
        <KindWicked />
        <Shapes />
        <YourShape />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
