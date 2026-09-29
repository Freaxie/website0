import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import TwoFigures from './sections/TwoFigures.jsx'
import Provisional from './sections/Provisional.jsx'
import MiddleCourse from './sections/MiddleCourse.jsx'
import OneArchetype from './sections/OneArchetype.jsx'
import Lineage from './sections/Lineage.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'figures', no: '02', name: 'Two Figures' },
  { id: 'provisional', no: '03', name: 'The Provisional Life' },
  { id: 'course', no: '04', name: 'The Middle Course' },
  { id: 'archetype', no: '05', name: 'One Archetype' },
  { id: 'lineage', no: '06', name: 'Lineage' },
  { id: 'coda', no: '07', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <TwoFigures />
        <Provisional />
        <MiddleCourse />
        <OneArchetype />
        <Lineage />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
