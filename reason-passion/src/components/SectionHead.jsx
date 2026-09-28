import { motion } from 'framer-motion'

const ease = [0.76, 0, 0.24, 1]
// The header observes the viewport; its children follow by variant. (A clipped child can't observe itself: it never intersects.)
const rule = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.1, ease } } }
const title = { hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.9, ease, delay: 0.1 } } }
const kick = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.35 } } }

// Wall text for each room: the number, the title, one line of orientation.
export default function SectionHead({ no, title: text, kicker, tone = 'ink', align = 'left' }) {
  return (
    <motion.header className={`shead shead--${tone} shead--${align}`} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
      <motion.div className="shead__rule" variants={rule} />
      <div className="shead__row">
        <span className="shead__no mono">{no}</span>
        <h2 className="shead__title">
          <motion.span variants={title}>{text}</motion.span>
        </h2>
      </div>
      {kicker && (
        <motion.p className="shead__kicker" variants={kick}>
          {kicker}
        </motion.p>
      )}
    </motion.header>
  )
}
