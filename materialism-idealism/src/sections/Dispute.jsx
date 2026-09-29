import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// side: m (matter first), i (mind first), n (neither side can simply win)
const ENTRIES = [
  { year: 'c. 420 BCE', who: 'Democritus', side: 'm', idea: 'Everything is atoms moving in the void. Colours and tastes are how atoms affect us, not what they are.' },
  { year: 'c. 380 BCE', who: 'Plato', side: 'i', idea: 'The Forms, grasped by thought, are more real than the changing material things that copy them. An idealism of a different kind from Berkeley’s: the ideas are not in anyone’s head.' },
  { year: 'c. 55 BCE', who: 'Lucretius', side: 'm', idea: 'On the Nature of Things. Even the soul is made of fine atoms, and scatters at death: so death is nothing to us.' },
  { year: '1710', who: 'George Berkeley', side: 'i', idea: 'A Treatise Concerning the Principles of Human Knowledge. There is no unthinking matter; there are minds and their ideas.', quote: '“Their esse is percipi.”' },
  { year: '1747', who: 'Julien Offray de La Mettrie', side: 'm', idea: 'L’Homme machine. The human being is a machine, and the soul an effect of the body’s organisation.' },
  { year: '1781', who: 'Immanuel Kant', side: 'n', idea: 'Transcendental idealism: we know things only as they appear, shaped by the forms of our own mind. Yet within experience, tables and stones are fully real.' },
  { year: '1818', who: 'Arthur Schopenhauer', side: 'i', idea: 'The World as Will and Representation opens with a first sentence that says it all:', quote: '“The world is my representation.”' },
  { year: '1820', who: 'G. W. F. Hegel', side: 'i', idea: 'Absolute idealism. Reality is spirit, Geist, working itself out through history and coming to know itself.', quote: '“What is rational is actual; and what is actual is rational.”' },
  {
    year: '1859',
    who: 'Karl Marx',
    side: 'm',
    idea: 'He kept Hegel’s dialectic but set it “right side up”: material life comes first.',
    quote: '“It is not the consciousness of men that determines their being, but, on the contrary, their social being that determines their consciousness.”',
  },
  { year: '1995', who: 'David Chalmers', side: 'n', idea: 'The hard problem of consciousness: why should physical processing feel like anything from the inside?' },
  { year: '2020', who: 'The PhilPapers survey', side: 'm', idea: 'Asked about the mind, about half of the philosophers surveyed accepted or leaned toward physicalism. The quarrel is far from over.' },
]

export default function Dispute() {
  return (
    <section id="dispute" className="dsp">
      <SectionHead no="06" title="The Long Dispute" kicker="A rally across the net, for twenty-four centuries. Matter on the left, mind on the right." />

      <div className="dsp__net mono" aria-hidden="true">
        <span>Matter first</span>
        <span>Mind first</span>
      </div>

      <ol className="dsp__list">
        {ENTRIES.map((e, i) => (
          <motion.li
            key={e.who}
            className={`dsp__item dsp__item--${e.side}`}
            initial={{ opacity: 0, x: e.side === 'm' ? -60 : e.side === 'i' ? 60 : 0, y: e.side === 'n' ? 30 : 0 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="dsp__ball" aria-hidden="true" />
            <div className="dsp__year">{e.year}</div>
            <h3>{e.who}</h3>
            <p className="dsp__idea">{e.idea}</p>
            {e.quote && <blockquote>{e.quote}</blockquote>}
            <span className="dsp__side mono">{e.side === 'm' ? 'Matter first' : e.side === 'i' ? 'Mind first' : 'On the net'}</span>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
