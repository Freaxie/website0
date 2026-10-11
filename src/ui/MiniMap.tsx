import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOMAIN_COLORS } from '../domain/kinds'
import { COMMITTED_INTEREST, type RecordOf } from '../domain/types'
import { useGraphIndex, useKind } from '../store/hooks'

interface N extends SimulationNodeDatum {
  id: string
  t: RecordOf<'topic'>
}

/** A small, static constellation of interests, laid out once from the real topic links. */
export function MiniMap({ width = 320, height = 230 }: { width?: number; height?: number }) {
  const topics = useKind('topic')
  const index = useGraphIndex()
  const navigate = useNavigate()
  const layout = useMemo(() => {
    const live = topics.filter((t) => t.data.status !== 'archived')
    const ids = new Set(live.map((t) => t.id))
    const nodes: N[] = live.map((t, i) => ({ id: t.id, t, x: Math.cos(i) * 50, y: Math.sin(i) * 50 }))
    const edges = index.edges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({ source: e.source, target: e.target }))
    const sim = forceSimulation(nodes)
      .force('link', forceLink<N, { source: string | N; target: string | N }>(edges.map((e) => ({ ...e }))).id((d) => d.id).distance(26).strength(0.6))
      .force('charge', forceManyBody().strength(-30).distanceMax(120))
      .force('collide', forceCollide(9))
      // gentle pull to the middle keeps unconnected islands on the map instead of drifting off
      .force('x', forceX(0).strength(0.07))
      .force('y', forceY(0).strength(0.09))
      .stop()
    for (let i = 0; i < 220; i++) sim.tick()
    const xs = nodes.map((n) => n.x!)
    const ys = nodes.map((n) => n.y!)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const s = Math.min((width - 40) / (x1 - x0 || 1), (height - 30) / (y1 - y0 || 1), 2.2)
    const px = (n: N) => (n.x! - (x0 + x1) / 2) * s + width / 2
    const py = (n: N) => (n.y! - (y0 + y1) / 2) * s + height / 2
    const pos = new Map(nodes.map((n) => [n.id, { x: px(n), y: py(n) }]))
    return {
      nodes: nodes.map((n) => ({ ...pos.get(n.id)!, t: n.t })),
      edges: edges.map((e) => ({ a: pos.get(e.source)!, b: pos.get(e.target)! })),
    }
  }, [topics, index, width, height])
  const labelled = useMemo(() => {
    const deg = (id: string) => (index.out.get(id)?.length ?? 0) + (index.in.get(id)?.length ?? 0)
    return new Set(
      [...layout.nodes]
        .sort((a, b) => Number(COMMITTED_INTEREST.includes(b.t.data.status)) - Number(COMMITTED_INTEREST.includes(a.t.data.status)) || deg(b.t.id) - deg(a.t.id))
        .slice(0, 6)
        .map((n) => n.t.id),
    )
  }, [layout, index])

  if (!layout.nodes.length) return null
  return (
    <svg className="minimap" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Map of interests: larger, brighter points are current commitments">
      {layout.edges.map((e, i) => (
        <line key={i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} />
      ))}
      {layout.nodes.map(({ x, y, t }) => {
        const hot = COMMITTED_INTEREST.includes(t.data.status)
        const warm = t.data.status === 'exploring'
        return (
          <g key={t.id} className={`mm-node ${hot ? 'is-hot' : ''}`} transform={`translate(${x},${y})`} onClick={() => navigate(`/r/${t.id}`)}>
            <title>{`${t.title} · ${t.data.status}`}</title>
            {hot && <circle r={8} className="mm-halo" />}
            <circle r={hot ? 4.5 : warm ? 3.4 : 2.4} style={{ fill: hot ? "var(--accent)" : DOMAIN_COLORS[t.data.domain], opacity: hot || warm ? 1 : 0.65 }} />
            {labelled.has(t.id) && (
              <text x={7} y={3.5}>
                {t.title.length > 22 ? `${t.title.slice(0, 21)}…` : t.title}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
