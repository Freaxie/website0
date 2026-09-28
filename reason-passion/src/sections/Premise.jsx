import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

const CAPTIONS = [
  { k: 'I', h: 'A fact', p: 'Start with something reason can establish: a claim about how the world works.' },
  { k: 'II', h: 'Another fact', p: 'Add a second. Both can be checked, measured, argued over, proved.' },
  { k: 'III', h: 'A gap', p: 'Now try to conclude what you should do. Nothing follows. Facts alone describe; they do not move.' },
  { k: 'IV', h: 'The missing premise', p: 'Add one thing that is not a fact but a want. Suddenly the argument has a direction, and so do you.' },
  {
    k: 'V',
    h: 'Hume’s verdict',
    p: 'Reason can tell you how to get what you want, and whether what you believe is true. It cannot, by itself, make you want anything.',
  },
]

const ease = [0.2, 0.8, 0.2, 1]

export default function Premise() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => setStep(Math.min(4, Math.floor(p * 5.2))))
  const meter = useTransform(scrollYProgress, (p) => `${p * 100}%`)
  const c = CAPTIONS[step]

  return (
    <section id="premise" className="pre" ref={ref}>
      <div className="pre__sticky">
        <div className="pre__head">
          <SectionHead no="03" title="The Missing Premise" kicker="Why no argument, however good, gets you out of bed." />
        </div>

        <div className="pre__card" aria-live="polite">
          <div className="pre__cardhead mono">
            <span>Practical syllogism</span>
            <span>Sheet 1 of 1</span>
          </div>
          <AnimatePresence>
            {step >= 3 && (
              <motion.div key="p0" className="pre__line pre__line--want" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.8, ease }}>
                <span className="mono">P0</span>
                <em>I want to be healthy.</em>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div className="pre__line" animate={{ opacity: step >= 0 ? 1 : 0 }}>
            <span className="mono">P1</span>
            <span>Running three times a week keeps people healthy.</span>
          </motion.div>
          <motion.div className="pre__line" initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0, x: step >= 1 ? 0 : -20 }} transition={{ duration: 0.5, ease }}>
            <span className="mono">P2</span>
            <span>I am able to run three times a week.</span>
          </motion.div>
          <motion.div className="pre__rule" initial={{ scaleX: 0 }} animate={{ scaleX: step >= 2 ? 1 : 0 }} transition={{ duration: 0.6, ease }} />
          <motion.div className={`pre__line pre__line--c ${step === 2 ? 'is-broken' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: step >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }}>
            <span className="mono">∴</span>
            <span>So I should run three times a week.</span>
          </motion.div>
          <div className="pre__stamps">
            <AnimatePresence mode="wait">
              {step === 2 && (
                <motion.span key="no" className="pre__stamp pre__stamp--no mono" initial={{ scale: 1.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -4 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  Does not follow
                </motion.span>
              )}
              {step >= 3 && (
                <motion.span key="yes" className="pre__stamp pre__stamp--yes mono" initial={{ scale: 1.6, opacity: 0, rotate: 6 }} animate={{ scale: 1, opacity: 1, rotate: 3 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  Follows
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pre__caption" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={c.k} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45, ease }}>
              <span className="pre__k">{c.k}</span>
              <h3>{c.h}</h3>
              {step < 4 ? (
                <p>{c.p}</p>
              ) : (
                <figure className="pre__hume">
                  <blockquote>“Reason is, and ought only to be the slave of the passions, and can never pretend to any other office than to serve and obey them.”</blockquote>
                  <figcaption className="mono">David Hume, A Treatise of Human Nature, 1739–40, 2.3.3</figcaption>
                  <p>{c.p}</p>
                </figure>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pre__meter mono" aria-hidden="true">
          <span>Facts</span>
          <div>
            <motion.i style={{ width: meter }} />
          </div>
          <span>Motive</span>
        </div>
      </div>
    </section>
  )
}
