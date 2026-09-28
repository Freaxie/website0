import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Faculties from './sections/Faculties.jsx'
import Premise from './sections/Premise.jsx'
import FastSlow from './sections/FastSlow.jsx'
import Algebra from './sections/Algebra.jsx'
import Quarrel from './sections/Quarrel.jsx'
import Overprint from './sections/Overprint.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'faculties', no: '02', name: 'Two Faculties' },
  { id: 'premise', no: '03', name: 'The Missing Premise' },
  { id: 'fastslow', no: '04', name: 'Fast & Slow' },
  { id: 'algebra', no: '05', name: 'Prudential Algebra' },
  { id: 'quarrel', no: '06', name: 'The Long Quarrel' },
  { id: 'overprint', no: '07', name: 'Overprint' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Faculties />
        <Premise />
        <FastSlow />
        <Algebra />
        <Quarrel />
        <Overprint />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
