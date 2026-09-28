import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { range } from '../lib/geom.js'

const ENTRIES = [
  {
    year: 'c. 400',
    who: 'Augustine',
    work: 'Confessions, Book XI',
    tag: 'time',
    idea: 'Time lives in the mind: a present of past things (memory), of present things (attention), of future things (expectation).',
    quote: '“What then is time? If no one asks me, I know; if I wish to explain it to one who asks, I know not.”',
    glyph: 'augustine',
  },
  {
    gap: '1,287 years',
  },
  {
    year: '1687',
    who: 'Isaac Newton',
    work: 'Principia, Scholium',
    tag: 'both',
    idea: 'Absolute space is a fixed container; absolute time ticks the same everywhere. Things move within them, and they are not changed by it.',
    quote: '“Absolute, true, and mathematical time, of itself, and from its own nature, flows equably without relation to anything external.”',
    glyph: 'newton',
  },
  {
    year: '1715',
    who: 'G. W. Leibniz',
    work: 'Letters to Samuel Clarke',
    tag: 'both',
    idea: 'There is no container. Space is only the order of things that exist together; time, the order of things that follow one another.',
    quote: '“…space is an order of coexistences, as time is an order of successions.”',
    glyph: 'leibniz',
  },
  {
    year: '1781',
    who: 'Immanuel Kant',
    work: 'Critique of Pure Reason',
    tag: 'both',
    idea: 'Space and time are not things we find in the world but the forms through which we find anything: space, the form of outer sense; time, of inner sense.',
    glyph: 'kant',
  },
  {
    year: '1889',
    who: 'Henri Bergson',
    work: 'Time and Free Will',
    tag: 'time',
    idea: 'Clock time is time imagined as space, a row of identical units. Lived time, durée, is a flow in which each moment carries the others.',
    glyph: 'bergson',
  },
  {
    year: '1905',
    who: 'Albert Einstein',
    work: 'On the Electrodynamics of Moving Bodies',
    tag: 'both',
    idea: 'Whether two distant events are simultaneous depends on how you move. Moving clocks run slow; moving rods are shorter.',
    glyph: 'einstein',
  },
  {
    year: '1908',
    who: 'Hermann Minkowski',
    work: '“Space and Time”, lecture at Cologne',
    tag: 'both',
    idea: 'Einstein’s results make one geometry. Space and time are two views of a single four-dimensional continuum: spacetime.',
    glyph: 'minkowski',
  },
  {
    year: '1915',
    who: 'Albert Einstein',
    work: 'General relativity',
    tag: 'both',
    idea: 'Spacetime is not a fixed stage either. Mass and energy curve it, and what we feel as gravity is that curvature.',
    glyph: 'curved',
  },
]

function Glyph({ kind }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 }
  return (
    <svg viewBox="0 0 120 80" className="tl__glyph" aria-hidden="true">
      {kind === 'augustine' && (
        <>
          <path d="M20 40A40 40 0 0 1 60 10" {...s} strokeDasharray="3 4" />
          <circle cx="60" cy="40" r="6" fill="currentColor" />
          <path d="M100 40A40 40 0 0 0 60 10" {...s} />
          <path d="M10 70H110" {...s} strokeWidth="0.7" />
        </>
      )}
      {kind === 'newton' && (
        <>
          <rect x="10" y="8" width="100" height="56" {...s} />
          {Array.from({ length: 4 }, (_, i) => (
            <path key={i} d={`M${30 + i * 20} 8V64`} {...s} strokeWidth="0.6" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <path key={i} d={`M${10 + i * 10} 70V76`} {...s} />
          ))}
        </>
      )}
      {kind === 'leibniz' && (
        <>
          {[[20, 50], [50, 20], [80, 56], [102, 26], [60, 44]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="currentColor" />
          ))}
          <path d="M20 50L50 20L60 44L80 56L102 26M50 20L102 26M20 50L60 44" {...s} strokeWidth="0.8" />
        </>
      )}
      {kind === 'kant' && (
        <>
          <path d="M16 8H6V72H16M104 8H114V72H104" {...s} strokeWidth="2" />
          {Array.from({ length: 5 }, (_, i) =>
            Array.from({ length: 3 }, (_, j) => <circle key={`${i}${j}`} cx={28 + i * 16} cy={22 + j * 18} r="2" fill="currentColor" />),
          )}
        </>
      )}
      {kind === 'bergson' && <path d="M4 44C18 20 26 64 40 40S62 16 74 40 96 62 116 34" {...s} strokeWidth="2" />}
      {kind === 'einstein' && (
        <>
          <circle cx="32" cy="40" r="24" {...s} />
          <circle cx="88" cy="40" r="24" {...s} />
          <path d="M32 40V20M88 40L100 30" {...s} strokeWidth="2" />
        </>
      )}
      {kind === 'minkowski' && (
        <>
          <path d="M20 76L100 4M20 4L100 76" {...s} strokeDasharray="3 3" />
          <path d="M60 4V76M10 40H110" {...s} strokeWidth="0.7" />
          <circle cx="60" cy="40" r="5" fill="currentColor" />
        </>
      )}
      {kind === 'curved' && (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={`M4 ${14 + i * 12}Q60 ${14 + i * 12 + 26 - Math.abs(i - 2) * 6} 116 ${14 + i * 12}`} {...s} strokeWidth="0.8" />
          ))}
          <circle cx="60" cy="52" r="9" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

export default function Thinkers() {
  const ref = useRef(null)
  const track = useRef(null)
  const [dist, setDist] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useEffect(() => {
    const measure = () => setDist(Math.max(0, track.current.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const x = useTransform(scrollYProgress, (p) => -range(0.08, 0.95)(p) * dist)
  const bar = useTransform(scrollYProgress, (p) => `${range(0.08, 0.95)(p) * 100}%`)

  return (
    <section id="thinkers" className="tl" ref={ref} style={{ height: `calc(100svh + ${dist * 1.15}px)` }}>
      <div className="tl__sticky">
        <div className="tl__head">
          <SectionHead no="05" title="A Timeline" kicker="A timeline is time drawn as space. Scroll to walk along it." />
        </div>
        <motion.ol className="tl__track" ref={track} style={{ x }}>
          {ENTRIES.map((e, i) =>
            e.gap ? (
              <li key={i} className="tl__gap mono" aria-label={`Gap of ${e.gap}`}>
                <span>//</span>
                {e.gap}
              </li>
            ) : (
              <li key={i} className={`tl__card tl__card--${e.tag}`}>
                <div className="tl__year">{e.year}</div>
                <div className="tl__meta">
                  <span className={`tl__tag mono tl__tag--${e.tag}`}>{e.tag === 'both' ? 'Space + Time' : e.tag}</span>
                  <Glyph kind={e.glyph} />
                </div>
                <h3>{e.who}</h3>
                <p className="tl__work">{e.work}</p>
                <p className="tl__idea">{e.idea}</p>
                {e.quote && <blockquote>{e.quote}</blockquote>}
              </li>
            ),
          )}
        </motion.ol>
        <div className="tl__axis mono" aria-hidden="true">
          <span>c. 400</span>
          <div>
            <motion.i style={{ width: bar }} />
          </div>
          <span>1915</span>
        </div>
      </div>
    </section>
  )
}
