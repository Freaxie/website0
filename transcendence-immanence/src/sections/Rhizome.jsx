import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHead from '../components/SectionHead.jsx'
import { rng } from '../lib/geom.js'

const W = 1600
const H = 760
const START = (() => {
  const r = rng(1980)
  return Array.from({ length: 22 }, () => [80 + r() * (W - 160), 60 + r() * (H - 120)])
})()

// Tree layout: node 0 is the root at the top; everyone else hangs from a parent, three children each.
function treeLayout(n) {
  const depth = (i) => (i === 0 ? 0 : depth(Math.floor((i - 1) / 3)) + 1)
  const levels = {}
  for (let i = 0; i < n; i++) (levels[depth(i)] ||= []).push(i)
  const maxD = Math.max(...Object.keys(levels).map(Number))
  const pos = []
  Object.entries(levels).forEach(([d, ids]) => {
    ids.forEach((id, k) => {
      pos[id] = [((k + 0.5) / ids.length) * (W - 120) + 60, 70 + (Number(d) / Math.max(1, maxD)) * (H - 140)]
    })
  })
  return pos
}

function knnEdges(pts, k = 3) {
  const set = new Set()
  pts.forEach((a, i) => {
    pts
      .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])])
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, k)
      .forEach(([j]) => set.add(i < j ? `${i}-${j}` : `${j}-${i}`))
  })
  return [...set].map((s) => s.split('-').map(Number))
}

export default function Rhizome() {
  const svg = useRef(null)
  const [pts, setPts] = useState(START)
  const [mode, setMode] = useState('rhizome')
  const tree = mode === 'tree'

  const layout = useMemo(() => (tree ? treeLayout(pts.length) : pts), [tree, pts])
  const edges = useMemo(() => (tree ? pts.slice(1).map((_, k) => [Math.floor(k / 3), k + 1]) : knnEdges(pts)), [tree, pts])

  const plant = (e) => {
    if (pts.length >= 60) return
    const pt = svg.current.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const q = pt.matrixTransform(svg.current.getScreenCTM().inverse())
    setPts((p) => [...p, [q.x, q.y]])
  }

  const ease = { type: 'spring', stiffness: 60, damping: 16 }
  return (
    <section id="rhizome" className={`rhz ${tree ? 'is-tree' : ''}`}>
      <div className="rhz__top">
        <SectionHead
          no="04"
          title="Tree & Rhizome"
          tone="inherit"
          kicker="Order imposed from above, or order that grows from within? Click to plant a node. Then switch the same nodes between the two."
        />
        <div className="rhz__panel">
          <div className="rhz__toggle" role="radiogroup" aria-label="Arrangement">
            <button type="button" role="radio" aria-checked={tree} className={tree ? 'is-on' : ''} onClick={() => setMode('tree')}>
              Tree
            </button>
            <button type="button" role="radio" aria-checked={!tree} className={!tree ? 'is-on' : ''} onClick={() => setMode('rhizome')}>
              Rhizome
            </button>
          </div>
          <div className="rhz__stats mono" aria-live="polite">
            <div>
              <span>Nodes</span>
              <b>{pts.length}</b>
            </div>
            <div>
              <span>Connections</span>
              <b>{edges.length}</b>
            </div>
            <div>
              <span>Top</span>
              <b>{tree ? 'one root, above all' : 'none'}</b>
            </div>
            <div>
              <span>Routes between two nodes</span>
              <b>{tree ? 'exactly one' : 'usually several'}</b>
            </div>
          </div>
          <button type="button" className="rhz__reset mono" onClick={() => setPts(START)}>
            Clear planted nodes
          </button>
        </div>
      </div>

      <div className="rhz__stage">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="rhz__svg" onClick={plant} role="img" aria-label={`${pts.length} nodes arranged as a ${mode}, with ${edges.length} connections`}>
          {edges.map(([a, b]) => {
            const [x1, y1] = layout[a]
            const [x2, y2] = layout[b]
            return (
              <motion.line
                key={`${a}-${b}-${mode}`}
                className="rhz__edge"
                initial={{ x1, y1, x2: x1, y2: y1 }}
                animate={{ x1, y1, x2, y2 }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              />
            )
          })}
          {pts.map((_, i) => (
            <motion.circle
              key={i}
              className={`rhz__node ${tree && i === 0 ? 'is-root' : ''}`}
              initial={{ cx: pts[i][0], cy: pts[i][1], r: 0 }}
              animate={{ cx: layout[i][0], cy: layout[i][1], r: tree && i === 0 ? 16 : 7 }}
              transition={ease}
            />
          ))}
          {tree && (
            <text x={layout[0][0] + 26} y={layout[0][1] + 6} className="rhz__label">
              the root: everything answers to it
            </text>
          )}
        </svg>
      </div>

      <div className="rhz__notes">
        <p>
          <span className="mono">The tree</span>
          One root, one trunk, branches that answer upward. Its order comes from a single point above the rest, the way transcendent thought orders the world from outside it.
        </p>
        <p>
          <span className="mono">The rhizome</span>
          Gilles Deleuze and Félix Guattari, A Thousand Plateaus (1980): like couch grass or ginger root, a rhizome has no centre, and any point can be connected to any other. Its order is immanent: it grows from inside.
        </p>
      </div>
    </section>
  )
}
