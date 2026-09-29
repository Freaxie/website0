import { MotionConfig } from 'framer-motion'
import Intro from './components/Intro.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Foundations from './sections/Foundations.jsx'
import Atoms from './sections/Atoms.jsx'
import Perceived from './sections/Perceived.jsx'
import Mill from './sections/Mill.jsx'
import Dispute from './sections/Dispute.jsx'
import TwoDescriptions from './sections/TwoDescriptions.jsx'
import Finale from './sections/Finale.jsx'

export const ROOMS = [
  { id: 'entrance', no: '01', name: 'Entrance' },
  { id: 'foundations', no: '02', name: 'Two Foundations' },
  { id: 'atoms', no: '03', name: 'Atoms & Void' },
  { id: 'perceived', no: '04', name: 'To Be Is to Be Perceived' },
  { id: 'mill', no: '05', name: 'Leibniz’s Mill' },
  { id: 'dispute', no: '06', name: 'The Long Dispute' },
  { id: 'two', no: '07', name: 'Two Descriptions' },
  { id: 'coda', no: '08', name: 'Coda' },
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Intro />
      <Nav rooms={ROOMS} />
      <main>
        <Hero />
        <Foundations />
        <Atoms />
        <Perceived />
        <Mill />
        <Dispute />
        <TwoDescriptions />
        <Finale />
      </main>
      <Grain />
    </MotionConfig>
  )
}
