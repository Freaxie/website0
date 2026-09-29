import { useRef, useState } from 'react'
import SectionHead from '../components/SectionHead.jsx'

const W = 1600
const H = 820
const R = 190

// A still life: each object is a set of shapes plus a bounding circle for "is it being perceived?"
const OBJECTS = [
  { id: 'window', name: 'window', c: [300, 250], r: 170, draw: <><rect x="160" y="100" width="280" height="300" /><path d="M300 100V400M160 250H440" /></> },
  { id: 'tree', name: 'tree outside', c: [300, 250], r: 90, draw: <><circle cx="300" cy="215" r="70" className="fill" /><rect x="292" y="270" width="16" height="110" className="fill" /></> },
  { id: 'table', name: 'table', c: [880, 560], r: 330, draw: <><rect x="560" y="500" width="640" height="26" className="fill" /><path d="M600 526V760M1160 526V760M620 700H1140" /></> },
  { id: 'apple', name: 'apple', c: [720, 455], r: 50, draw: <><circle cx="720" cy="458" r="40" className="fill" /><path d="M720 418C722 404 730 396 742 392" /></> },
  { id: 'jug', name: 'jug', c: [900, 420], r: 90, draw: <path d="M860 498C850 440 858 400 872 370L866 340H938L930 370C946 400 954 440 942 498ZM942 390C978 392 982 450 944 460" className="fill" /> },
  { id: 'book', name: 'book', c: [1080, 480], r: 70, draw: <><rect x="1020" y="470" width="130" height="30" className="fill" /><rect x="1030" y="444" width="110" height="26" /></> },
  { id: 'cup', name: 'cup', c: [1170, 470], r: 36, draw: <path d="M1150 440H1190L1184 498H1156Z" className="fill" /> },
  { id: 'chair', name: 'chair', c: [1400, 560], r: 160, draw: <><rect x="1330" y="560" width="150" height="22" className="fill" /><path d="M1470 560V380M1340 582V770M1470 582V770M1470 420H1340" /></> },
  { id: 'lamp', name: 'lamp', c: [540, 400], r: 110, draw: <><path d="M500 300H580L600 350H480Z" className="fill" /><path d="M540 350V498M500 500H580" /></> },
]

const MODES = [
  { id: 'berkeley', label: 'Berkeley', note: '“Their esse is percipi”: for things like tables and apples, to be is to be perceived. Outside your attention, on this view, there is nothing left over.' },
  { id: 'matter', label: 'Materialist', note: 'The objects go on existing when no one looks, as matter in space. Perception is a way of finding them, not what makes them real.' },
  { id: 'god', label: 'Berkeley + God', note: 'Berkeley’s own answer to the empty room: things persist because they are always perceived by an infinite mind.' },
]

export default function Perceived() {
  const svg = useRef(null)
  const [lamp, setLamp] = useState({ x: 820, y: 460 })
  const [mode, setMode] = useState('berkeley')

  const move = (e) => {
    const pt = svg.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const q = pt.matrixTransform(svg.current.getScreenCTM().inverse())
    setLamp({ x: q.x, y: q.y })
  }

  const seen = OBJECTS.filter((o) => Math.hypot(o.c[0] - lamp.x, o.c[1] - lamp.y) < o.r + R)
  const exist = mode === 'berkeley' ? seen.length : OBJECTS.length
  const m = MODES.find((x) => x.id === mode)

  return (
    <section id="perceived" className={`per per--${mode}`}>
      <div className="per__top">
        <SectionHead no="04" title="To Be Is to Be Perceived" kicker="A room, and your attention moving through it. Point to look. Then change who is asking." />
        <div className="per__panel">
          <div className="per__modes" role="radiogroup" aria-label="Point of view">
            {MODES.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={mode === x.id} className={mode === x.id ? 'is-on' : ''} onClick={() => setMode(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <div className="per__stats mono" aria-live="polite">
            <div>
              <span>Perceived by you</span>
              <b>
                {seen.length} of {OBJECTS.length}
              </b>
            </div>
            <div>
              <span>Existing right now</span>
              <b>
                {exist} of {OBJECTS.length}
              </b>
            </div>
          </div>
          <p className="per__note">{m.note}</p>
        </div>
      </div>

      <div className="per__stage">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="per__svg"
          onPointerMove={move}
          onPointerDown={move}
          role="img"
          aria-label={`A still life of ${OBJECTS.length} objects. You are perceiving: ${seen.map((o) => o.name).join(', ') || 'nothing'}.`}
        >
          <defs>
            <clipPath id="lamp">
              <circle cx={lamp.x} cy={lamp.y} r={R} />
            </clipPath>
          </defs>
          <rect width={W} height={H} className="per__bg" />
          {mode === 'matter' && (
            <g className="per__matter">
              {OBJECTS.map((o) => (
                <g key={o.id}>{o.draw}</g>
              ))}
            </g>
          )}
          {mode === 'god' && (
            <g className="per__god">
              {OBJECTS.map((o) => (
                <g key={o.id}>{o.draw}</g>
              ))}
            </g>
          )}
          <circle cx={lamp.x} cy={lamp.y} r={R} className="per__light" />
          <g clipPath="url(#lamp)" className="per__seen">
            <path d={`M0 760H${W}`} />
            {OBJECTS.map((o) => (
              <g key={o.id}>{o.draw}</g>
            ))}
          </g>
          <circle cx={lamp.x} cy={lamp.y} r={R} className="per__ring" />
          {seen.map((o) => (
            <text key={o.id} x={o.c[0]} y={o.c[1] - o.r * 0.6 - 16} textAnchor="middle" className="per__tag">
              {o.name}
            </text>
          ))}
        </svg>
      </div>

      {mode === 'god' && (
        <figure className="per__limerick">
          <blockquote>
            There was a young man who said, “God
            <br />
            Must think it exceedingly odd
            <br />
            If he finds that this tree
            <br />
            Continues to be
            <br />
            When there’s no one about in the Quad.”
          </blockquote>
          <blockquote>
            Dear Sir: Your astonishment’s odd:
            <br />
            I am always about in the Quad.
            <br />
            And that’s why the tree
            <br />
            Will continue to be,
            <br />
            Since observed by, Yours faithfully, God.
          </blockquote>
          <figcaption className="mono">The limerick is usually attributed to Ronald Knox; the reply is anonymous.</figcaption>
        </figure>
      )}
    </section>
  )
}
