import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'

// g: where each thinker puts authority, from 0 (reason rules) to 1 (passion rules).
const ENTRIES = [
  { year: 'c. 375 BCE', who: 'Plato', work: 'Republic', g: 0.12, idea: 'The soul has three parts. Reason should rule; spirit should serve it; appetite should obey.' },
  {
    year: 'c. 340 BCE',
    who: 'Aristotle',
    work: 'Nicomachean Ethics',
    g: 0.4,
    idea: 'Virtue is not the absence of feeling but feeling rightly:',
    quote: '“at the right times, about the right things, toward the right people, for the right end, and in the right way.”',
  },
  { year: 'c. 300 BCE', who: 'The Stoics', work: 'Zeno, Chrysippus, later Seneca', g: 0.03, idea: 'Passions are false judgements about what is good or bad. The wise person is free of them: apatheia.' },
  { year: '1649', who: 'René Descartes', work: 'The Passions of the Soul', g: 0.25, idea: 'The passions are good by nature and useful, but the soul must learn to govern them by firm judgements.' },
  { year: '1670', who: 'Blaise Pascal', work: 'Pensées', g: 0.7, idea: 'Some truths are known not by argument but by the heart.', quote: '“The heart has its reasons, which reason does not know.”' },
  {
    year: '1677',
    who: 'Baruch Spinoza',
    work: 'Ethics',
    g: 0.5,
    idea: 'Reason frees us only by becoming a feeling itself.',
    quote: '“An affect cannot be restrained or removed except by an opposite and stronger affect.”',
  },
  { year: '1739', who: 'David Hume', work: 'A Treatise of Human Nature', g: 0.9, idea: 'Reason can inform desire but never produce it or oppose it. Reason is “the slave of the passions”.' },
  { year: '1785', who: 'Immanuel Kant', work: 'Groundwork of the Metaphysics of Morals', g: 0.08, idea: 'Only action done from duty, from respect for a law reason gives itself, has moral worth. Inclination, however kind, does not.' },
  { year: '1790', who: 'William Blake', work: 'The Marriage of Heaven and Hell', g: 0.93, idea: 'Against a cold, restraining reason, the Romantic defence of desire and vitality.', quote: '“Energy is Eternal Delight.”' },
  { year: '1994', who: 'Antonio Damasio', work: 'Descartes’ Error', g: 0.62, idea: 'Emotion is not the enemy of reason but part of how it works: feelings mark options as good or bad before we deliberate.' },
  { year: '2001', who: 'Martha Nussbaum', work: 'Upheavals of Thought', g: 0.55, idea: 'Emotions are intelligent: judgements about what matters to us, which can be true or false, wise or foolish.' },
]

export default function Quarrel() {
  return (
    <section id="quarrel" className="qr">
      <SectionHead no="06" title="The Long Quarrel" kicker="Who should be in charge? Each thinker’s answer, on one dial from reason to passion." />

      <div className="qr__legend mono" aria-hidden="true">
        <span>Reason rules</span>
        <span>Partners</span>
        <span>Passion rules</span>
      </div>

      <ol className="qr__list">
        {ENTRIES.map((e) => (
          <motion.li key={e.who} className="qr__row" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
            <div className="qr__year">{e.year}</div>
            <div className="qr__text">
              <h3>{e.who}</h3>
              <p className="qr__work">{e.work}</p>
              <p className="qr__idea">{e.idea}</p>
              {e.quote && <blockquote>{e.quote}</blockquote>}
            </div>
            <div className="qr__gauge" role="img" aria-label={`${e.who}: ${Math.round((1 - e.g) * 100)}% reason, ${Math.round(e.g * 100)}% passion`}>
              <div className="qr__bar">
                <motion.i
                  className="qr__c"
                  variants={{ hidden: { width: '50%' }, show: { width: `${(1 - e.g) * 100}%`, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 } } }}
                />
                <motion.i
                  className="qr__m"
                  variants={{ hidden: { width: '50%' }, show: { width: `${e.g * 100}%`, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 } } }}
                />
              </div>
              <motion.span className="qr__mark" variants={{ hidden: { left: '50%' }, show: { left: `${(1 - e.g) * 100}%`, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 } } }} />
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
