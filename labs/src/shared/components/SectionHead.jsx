import { motion } from 'framer-motion'

// "§03 ·(dividing cell)· ───────── THE STRANGE LOOP · RECURSION"
export default function SectionHead({ n, title, motif }) {
  return (
    <header className="sec-head">
      <span className="mono mono--ink">§{n}</span>
      <svg className="sec-head__cell" viewBox="0 0 30 14" aria-hidden="true">
        <g className="mitosis">
          <circle className="mitosis__a" cx="15" cy="7" r="4.2" />
          <circle className="mitosis__b" cx="15" cy="7" r="4.2" />
        </g>
      </svg>
      <motion.span
        className="sec-head__rule"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2.2, ease: [0.65, 0, 0.15, 1] }}
      />
      <span className="mono">
        <span className="mono--ink">{title}</span>
        {motif && <span className="mono--dim sec-head__motif"> · {motif}</span>}
      </span>
    </header>
  )
}
