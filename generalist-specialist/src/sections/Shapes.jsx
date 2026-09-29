import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { CHIPS } from '../lib/geom.js'

// Each life as a shape: one column per field, its length how deep it went. A curator's sketch, not a measurement.
const PEOPLE = [
  { who: 'Leonardo da Vinci', years: '1452–1519', fields: [['Painting', 5], ['Anatomy', 4], ['Engineering', 4], ['Hydraulics', 3], ['Optics', 3], ['Botany', 2], ['Music', 2]], note: 'Notebooks of thousands of pages, on almost everything, most of it unpublished in his lifetime.' },
  { who: 'Ibn Sina (Avicenna)', years: '980–1037', fields: [['Medicine', 5], ['Philosophy', 5], ['Logic', 3], ['Astronomy', 2], ['Poetry', 2]], note: 'The Canon of Medicine was taught in European universities for centuries; The Book of Healing is a philosophical encyclopedia.' },
  { who: 'Hildegard of Bingen', years: '1098–1179', fields: [['Theology', 4], ['Music', 4], ['Medicine', 3], ['Natural history', 3], ['Drama', 2]], note: 'Abbess, composer and visionary; her Ordo Virtutum is among the earliest surviving morality plays.' },
  { who: 'Benjamin Franklin', years: '1706–1790', fields: [['Printing', 4], ['Electricity', 4], ['Diplomacy', 4], ['Writing', 3], ['Invention', 3]], note: 'Printer, experimenter with lightning, and the diplomat who secured the French alliance.' },
  { who: 'J. W. von Goethe', years: '1749–1832', fields: [['Poetry', 5], ['Drama', 4], ['Colour theory', 3], ['Botany', 3], ['Government', 2], ['Geology', 2]], note: 'Faust, and also a Theory of Colours and an essay on the metamorphosis of plants.' },
  { who: 'Marie Curie', years: '1867–1934', fields: [['Radioactivity', 5], ['Physics', 4], ['Chemistry', 4]], note: 'The first person to win Nobel Prizes in two sciences, physics in 1903 and chemistry in 1911, both from one line of work.' },
  { who: 'Srinivasa Ramanujan', years: '1887–1920', fields: [['Number theory', 5]], note: 'Largely self-taught, he filled notebooks with results on series and partitions that mathematicians are still working through.' },
  { who: 'Herbert Simon', years: '1916–2001', fields: [['Economics', 4], ['Artificial intelligence', 4], ['Psychology', 4], ['Organisations', 4], ['Computing', 3]], note: 'A Nobel in economics in 1978, and also a founder of artificial intelligence and cognitive psychology.' },
  { who: 'Richard Feynman', years: '1918–1988', fields: [['Physics', 5], ['Drawing', 2], ['Bongo drums', 2], ['Safecracking', 1]], note: 'A deep specialist with a famous horizontal bar of hobbies, the classic T.' },
  { who: 'Andrew Wiles', years: 'b. 1953', fields: [['Number theory', 5]], note: 'Spent about seven years working largely alone on Fermat’s Last Theorem before announcing a proof in 1993.' },
]

function Glyph({ fields }) {
  const n = fields.length
  const col = 26
  const w = Math.max(n * col, col)
  const single = n === 1
  return (
    <svg viewBox={`0 0 ${w + 20} 170`} className="shp__glyph" aria-hidden="true">
      <rect x="10" y="10" width={w} height="14" fill={single ? '#002fa7' : '#0b0b0c'} />
      {fields.map(([, d], i) => (
        <motion.rect
          key={i}
          x={10 + i * col + 3}
          y="24"
          width={col - 6}
          initial={{ height: 0 }}
          whileInView={{ height: d * 27 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: i * 0.06, ease: [0.76, 0, 0.24, 1] }}
          fill={single ? '#002fa7' : CHIPS[i % CHIPS.length]}
        />
      ))}
    </svg>
  )
}

export default function Shapes() {
  return (
    <section id="shapes" className="shp">
      <SectionHead no="06" title="Shapes of a Life" kicker="Ten people drawn as the shape of their knowledge: breadth across, depth down. A sketch, not a measurement." />
      <ol className="shp__grid">
        {PEOPLE.map((p) => (
          <motion.li key={p.who} className={`shp__card ${p.fields.length === 1 ? 'is-deep' : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }}>
            <Glyph fields={p.fields} />
            <h3>{p.who}</h3>
            <span className="mono shp__years">{p.years}</span>
            <p className="shp__fields mono">{p.fields.map(([f]) => f).join(' · ')}</p>
            <p className="shp__note">{p.note}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
