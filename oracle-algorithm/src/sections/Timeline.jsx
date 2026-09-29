import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { GLYPHS, glyphPath } from '../lib/glyphs.js'

// o = the oracle's road, a = the algorithm's; bridge marks a place where the two roads touch.
const EVENTS = [
  { lane: 'o', year: 'c. 1250 BCE', title: 'Oracle bones', how: 'Heat · crack · read', text: 'Diviners to the Shang kings heated ox bones and turtle shells and read the cracks. Some bones record the question, the answer, and later what actually happened.', bridge: true },
  { lane: 'o', year: 'c. 1000–750 BCE', title: 'The Book of Changes', how: 'Cast · select · interpret', text: 'The I Ching: sixty-four figures built from broken and unbroken lines. Casting stalks or coins picks one; the text is then read against the question.' },
  { lane: 'o', year: '8th c. BCE – 4th c. CE', title: 'Delphi', how: 'Ask · wait · interpret', text: 'The Pythia spoke for Apollo. Herodotus tells how Croesus was told that if he attacked Persia, a great empire would fall. One did: his own.' },
  { lane: 'o', year: '652 BCE', title: 'Babylonian astronomical diaries', how: 'Watch · record · read omens', text: 'For six centuries, scholars logged the night sky beside the weather, the river level and the price of barley, looking for omens. It is one of the longest data series ever kept.', bridge: true },
  { lane: 'a', year: '1654', title: 'Pascal & Fermat', how: 'Count · divide', text: 'Letters on how to split the stakes of a game broken off before the end. The answer founds the mathematics of probability.' },
  { lane: 'a', year: '1703', title: 'Leibniz and the hexagrams', how: 'Zero · one', text: 'Leibniz publishes his binary arithmetic, and notes that the figures of the I Ching can be read as binary numbers.', bridge: true },
  { lane: 'a', year: '1763', title: 'Bayes', how: 'Believe · observe · update', text: 'An essay, published after his death, on how far to change a belief in the light of new evidence.' },
  { lane: 'a', year: '1814', title: 'Laplace’s intellect', how: 'Know everything · compute', text: 'Laplace imagines an intellect that knew every force and every position. For it, he wrote, nothing would be uncertain, and the future, like the past, would be present to its eyes.' },
  { lane: 'a', year: '1861', title: 'The first forecasts', how: 'Measure · telegraph · warn', text: 'Robert FitzRoy begins publishing daily weather forecasts in The Times, from observations sent in by telegraph. He is credited with the word “forecast”.' },
  { lane: 'o', year: '1950', title: 'Synchronicity', how: 'Coincide · mean', text: 'Carl Jung’s foreword to the English I Ching argues for meaningful coincidence: events linked by meaning rather than by cause.' },
  { lane: 'a', year: '1950', title: 'ENIAC’s weather', how: 'Discretise · integrate', text: 'The first weather forecast computed by machine: a 24-hour prediction that took about as long to calculate.' },
  { lane: 'a', year: '1963', title: 'Lorenz’s horizon', how: 'Compute · diverge', text: 'Edward Lorenz finds that a tiny rounding in the starting numbers changes his weather model completely. Prediction has a horizon.' },
  { lane: 'a', year: '2020s', title: 'The next word', how: 'Predict the next token', text: 'Language models are trained to predict the next word. At scale, people consult them the way they once consulted oracles.', bridge: true },
]
const SIGN = ['eye', 'threshold', 'knot', 'tide', 'key', 'ladder', 'lantern', 'serpent', 'crown', 'seed', 'scales', 'mirror']

export default function Timeline() {
  const ref = useRef(null)
  const track = useRef(null)
  const [span, setSpan] = useState(0)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useEffect(() => {
    const fit = () => track.current && setSpan(Math.max(0, track.current.scrollWidth - window.innerWidth))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // the room holds still briefly at each end
  const u = (p) => Math.min(1, Math.max(0, (p - 0.04) / 0.9))
  const x = useTransform(scrollYProgress, (p) => -u(p) * span)
  const bar = useTransform(scrollYProgress, (p) => `${u(p) * 100}%`)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setActive(Math.round(u(p) * (EVENTS.length - 1))))

  const e = EVENTS[active]
  return (
    <section id="roads" className="tl" ref={ref} style={{ height: `${120 + EVENTS.length * 34}vh` }}>
      <div className="tl__sticky">
        <div className="tl__bg" aria-hidden="true" />
        <header className="tl__head">
          <span className="mono">05</span>
          <h2>
            Two Roads <em>to the Future</em>
          </h2>
          <p>Scroll to walk both roads. Above, the future is read. Below, it is reckoned. Gold marks the places where the roads touch.</p>
        </header>

        <div className="tl__now" aria-live="polite">
          <span className="mono">{e.lane === 'o' ? 'Oracle' : 'Algorithm'}</span>
          <b>{e.year}</b>
        </div>

        <motion.ol className="tl__track" ref={track} style={{ x }}>
          {EVENTS.map((ev, i) => (
            <li key={ev.title} className={`tl__ev tl__ev--${ev.lane} ${i === active ? 'is-active' : ''} ${ev.bridge ? 'is-bridge' : ''}`}>
              <span className="tl__dot" aria-hidden="true" />
              <article className="tl__card">
                <span className="mono tl__year">{ev.year}</span>
                {ev.lane === 'o' && (
                  <svg viewBox="0 0 100 100" className="tl__glyph" aria-hidden="true">
                    <path d={glyphPath(GLYPHS.find((g) => g.id === SIGN[i % 12]).prims)} />
                  </svg>
                )}
                <h3>{ev.title}</h3>
                <span className="mono tl__how">{ev.how}</span>
                <p>{ev.text}</p>
              </article>
            </li>
          ))}
        </motion.ol>

        <div className="tl__progress" aria-hidden="true">
          <motion.i style={{ width: bar }} />
        </div>
      </div>
    </section>
  )
}
