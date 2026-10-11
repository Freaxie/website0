import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { forceX, forceY } from 'd3-force'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { displayTitle } from '../domain/factory'
import { orphans, shortestPath, type Edge } from '../domain/graph'
import { DOMAIN_COLORS, DOMAIN_LABELS, KIND_DEFS, LINK_LABELS } from '../domain/kinds'
import { search } from '../domain/search'
import { COMMITTED_INTEREST, DOMAINS, KINDS, type AnyRecord, type Kind } from '../domain/types'
import { useGraphIndex, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { AddConnection, useConnections } from '../ui/Connections'
import { Icon } from '../ui/Icon'
import { Markdown } from '../ui/Markdown'
import { RecordLink } from '../ui/RecordLink'
import { RecordPicker } from '../ui/RecordPicker'

interface GNode {
  id: string
  rec: AnyRecord
  deg: number
}
interface GLink {
  id: string
  source: string | NodeObject<GNode>
  target: string | NodeObject<GNode>
  edge: Edge
}

const endId = (e: GLink['source']) => (typeof e === 'object' ? (e.id as string) : e)
const DIRECTED = new Set(['depends_on', 'part_of', 'applies_to', 'inspired_by', 'used_in', 'learned_from', 'supports', 'contradicts', 'mentions'])

type Shape = 'circle' | 'square' | 'diamond' | 'triangle'
const SHAPE: Partial<Record<Kind, Shape>> = { project: 'square', resource: 'triangle', path: 'diamond', skill: 'diamond', goal: 'diamond' }

/** Canvas can't read CSS variables directly; resolve the theme's tokens once per theme change. */
function useCanvasColors(theme: string) {
  const [c, setC] = useState<Record<string, string>>({})
  useLayoutEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement)
      const v = (n: string) => cs.getPropertyValue(n).trim()
      const out: Record<string, string> = {}
      for (const n of ['--bg', '--bg-1', '--text', '--text-2', '--muted', '--faint', '--line-2', '--line-3', '--accent', '--accent-text'] as const) out[n] = v(n)
      for (const d of DOMAINS) out[d] = v(`--d-${d}`)
      setC(out)
    }
    read()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', read)
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] })
    return () => {
      mq.removeEventListener('change', read)
      obs.disconnect()
    }
  }, [theme])
  return c
}

export function GraphPage() {
  const records = useVisible()
  const index = useGraphIndex()
  const theme = useStore((s) => s.settings.theme)
  const colors = useCanvasColors(theme)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const fg = useRef<ForceGraphMethods<NodeObject<GNode>, LinkObject<GNode, GLink>> | undefined>(undefined)
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  const defaultKinds = useMemo(() => KINDS.filter((k) => KIND_DEFS[k].inGraph), [])
  const [kinds, setKinds] = useState<Set<Kind>>(() => new Set(defaultKinds))
  const [mentions, setMentions] = useState(true)
  const [view, setView] = useState<'graph' | 'list'>('graph')
  const [query, setQuery] = useState('')
  const [hover, setHover] = useState<string | null>(null)
  const selected = params.get('focus')
  const select = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params)
      if (id) next.set('focus', id)
      else next.delete('focus')
      setParams(next, { replace: true })
    },
    [params, setParams],
  )
  const [pathEnds, setPathEnds] = useState<{ from: string | null; to: string | null }>({ from: null, to: null })
  const [panel, setPanel] = useState<'none' | 'path' | 'orphans'>(params.get('orphans') ? 'orphans' : 'none')

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [view])

  // Node objects are reused across renders so the layout doesn't jump when data changes.
  const nodeCache = useRef(new Map<string, NodeObject<GNode>>())
  const data = useMemo(() => {
    const keep = (r: AnyRecord) => kinds.has(r.kind) && !r.archived
    const nodes = Object.values(records)
      .filter(keep)
      .map((rec) => {
        const n = nodeCache.current.get(rec.id) ?? ({ id: rec.id } as NodeObject<GNode>)
        n.rec = rec
        n.deg = 0
        nodeCache.current.set(rec.id, n)
        return n
      })
    const ids = new Set(nodes.map((n) => n.id))
    const links: GLink[] = index.edges
      .filter((e) => ids.has(e.source) && ids.has(e.target) && (mentions || e.type !== 'mentions'))
      .map((e) => ({ id: e.id, source: e.source, target: e.target, edge: e }))
    const byId = new Map(nodes.map((n) => [n.id as string, n]))
    for (const l of links) {
      byId.get(endId(l.source))!.deg++
      byId.get(endId(l.target))!.deg++
    }
    return { nodes, links }
  }, [records, index, kinds, mentions])

  const matches = useMemo(() => (query.trim() ? new Set(search(records, query, 60).map((h) => h.id)) : null), [records, query])
  const path = useMemo(() => {
    if (!pathEnds.from || !pathEnds.to) return null
    const ids = new Set(data.nodes.map((n) => n.id as string))
    return shortestPath(index, pathEnds.from, pathEnds.to, (id) => ids.has(id))
  }, [pathEnds, index, data.nodes])
  const pathSet = useMemo(() => new Set(path ?? []), [path])
  const pathEdges = useMemo(() => {
    const s = new Set<string>()
    if (path) for (let i = 1; i < path.length; i++) s.add([path[i - 1], path[i]].sort().join('|'))
    return s
  }, [path])

  const focus = selected ?? hover
  const hood = useMemo(() => {
    if (!focus) return null
    const s = new Set([focus])
    for (const e of index.out.get(focus) ?? []) s.add(e.target)
    for (const e of index.in.get(focus) ?? []) s.add(e.source)
    return s
  }, [focus, index])

  // Gentle pull toward the middle so unconnected records stay near the map instead of drifting off.
  useEffect(() => {
    const g = fg.current
    if (!g) return
    g.d3Force('x', forceX(0).strength(0.04))
    g.d3Force('y', forceY(0).strength(0.04))
  }, [view, data.nodes.length])

  const centerOn = useCallback((id: string) => {
    const n = nodeCache.current.get(id)
    if (n?.x !== undefined && fg.current) {
      fg.current.centerAt(n.x, n.y, 500)
      fg.current.zoom(Math.max(fg.current.zoom(), 2.2), 500)
    }
  }, [])
  useEffect(() => {
    if (selected) setTimeout(() => centerOn(selected), 600)
    else setTimeout(() => fg.current?.zoomToFit(400, 50), 700)
    // only when arriving with ?focus=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nodeColor = (r: AnyRecord) => (r.kind === 'topic' ? colors[r.data.domain] : colors['--text-2'])
  const isHot = (r: AnyRecord) =>
    (r.kind === 'topic' && COMMITTED_INTEREST.includes(r.data.status)) || (r.kind === 'project' && r.data.status === 'active')

  const draw = (node: NodeObject<GNode>, ctx: CanvasRenderingContext2D, scale: number) => {
    const r = node.rec
    const x = node.x!
    const y = node.y!
    const size = 3 + Math.min(6, Math.sqrt(node.deg) * 1.6)
    const dim = (hood && !hood.has(node.id as string)) || (matches && !matches.has(node.id as string)) || (path && !pathSet.has(node.id as string))
    ctx.globalAlpha = dim ? 0.14 : 1
    // a ring in the surface colour keeps marks legible where they overlap edges
    ctx.lineWidth = 2 / scale + 1
    ctx.strokeStyle = colors['--bg']
    ctx.fillStyle = nodeColor(r)
    const shape = SHAPE[r.kind] ?? 'circle'
    ctx.beginPath()
    if (shape === 'square') ctx.rect(x - size * 0.85, y - size * 0.85, size * 1.7, size * 1.7)
    else if (shape === 'diamond') {
      ctx.moveTo(x, y - size * 1.1)
      ctx.lineTo(x + size * 1.1, y)
      ctx.lineTo(x, y + size * 1.1)
      ctx.lineTo(x - size * 1.1, y)
      ctx.closePath()
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - size * 1.1)
      ctx.lineTo(x + size, y + size * 0.8)
      ctx.lineTo(x - size, y + size * 0.8)
      ctx.closePath()
    } else ctx.arc(x, y, r.kind === 'topic' ? size : size * 0.8, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    if (isHot(r)) {
      ctx.beginPath()
      ctx.arc(x, y, size + 3.2, 0, 2 * Math.PI)
      ctx.strokeStyle = colors['--accent-text']
      ctx.lineWidth = 1.4
      ctx.stroke()
    }
    if (node.id === selected || pathSet.has(node.id as string)) {
      ctx.beginPath()
      ctx.arc(x, y, size + 6, 0, 2 * Math.PI)
      ctx.strokeStyle = colors['--accent-text']
      ctx.lineWidth = 1.5 / scale + 0.5
      ctx.stroke()
    }
    const showLabel =
      !dim && (scale > 1.6 || node.id === focus || (hood && hood.has(node.id as string)) || pathSet.has(node.id as string) || (matches && matches.has(node.id as string)) || (r.kind === 'topic' && node.deg >= 4) || isHot(r))
    if (showLabel) {
      const fs = Math.max(10.5 / scale, 2.4)
      ctx.font = `${node.id === focus ? 600 : 450} ${fs}px "Archivo Variable", system-ui, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const t = displayTitle(r)
      const label = t.length > 34 ? `${t.slice(0, 33)}…` : t
      ctx.lineWidth = 3 / scale
      ctx.strokeStyle = colors['--bg']
      ctx.strokeText(label, x + size + 4, y)
      ctx.fillStyle = node.id === focus ? colors['--text'] : colors['--text-2']
      ctx.fillText(label, x + size + 4, y)
    }
    ctx.globalAlpha = 1
  }

  const linkColor = (l: LinkObject<GNode, GLink>) => {
    const a = endId(l.source as GLink['source'])
    const b = endId(l.target as GLink['target'])
    if (pathEdges.has([a, b].sort().join('|'))) return colors['--accent-text']
    if (focus && (a === focus || b === focus)) return colors['--text-2']
    if (focus || matches || path) return colors['--line-2']
    return colors['--line-3']
  }

  const toggleKind = (k: Kind) => setKinds((s) => {
    const n = new Set(s)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    return n
  })

  const orphanList = useMemo(() => orphans(records, index), [records, index])
  const selRec = selected ? records[selected] : undefined
  const present = new Set(data.nodes.map((n) => n.rec.kind))

  return (
    <div className="graph-page">
      <div className="graph-toolbar">
        <div className="picker-input graph-search">
          <Icon name="search" size={14} />
          <input
            className="input input--bare"
            placeholder="Find in graph…"
            aria-label="Find in graph"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches?.size) {
                const first = [...matches].find((id) => nodeCache.current.has(id))
                if (first) {
                  select(first)
                  centerOn(first)
                }
              }
            }}
          />
          {matches && <span className="kicker">{[...matches].filter((id) => data.nodes.some((n) => n.id === id)).length}</span>}
        </div>
        <details className="kinds-menu">
          <summary className="btn btn--ghost btn--sm">
            Kinds <span className="filter-count">{kinds.size}</span>
          </summary>
          <div className="kinds-pop" role="group" aria-label="Show kinds">
            {KINDS.filter((k) => k !== 'capture' && k !== 'medication').map((k) => (
              <label key={k} className="switch switch--sm">
                <input type="checkbox" checked={kinds.has(k)} onChange={() => toggleKind(k)} />
                <span>{KIND_DEFS[k].plural}</span>
              </label>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={() => setKinds(new Set(defaultKinds))}>
              Reset
            </button>
          </div>
        </details>
        <div className="row-flex graph-tools">
          <label className="switch switch--sm">
            <input type="checkbox" checked={mentions} onChange={(e) => setMentions(e.target.checked)} />
            <span>Text links</span>
          </label>
          <button className={`btn btn--sm ${panel === 'path' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setPanel(panel === 'path' ? 'none' : 'path')}>
            <Icon name="path" size={14} /> Path
          </button>
          <button className={`btn btn--sm ${panel === 'orphans' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setPanel(panel === 'orphans' ? 'none' : 'orphans')}>
            Unconnected <span className="filter-count">{orphanList.length}</span>
          </button>
          <div className="seg-choice" role="radiogroup" aria-label="View">
            <button role="radio" aria-checked={view === 'graph'} className={`chip-btn chip-btn--sm ${view === 'graph' ? 'is-on' : ''}`} onClick={() => setView('graph')}>
              Graph
            </button>
            <button role="radio" aria-checked={view === 'list'} className={`chip-btn chip-btn--sm ${view === 'list' ? 'is-on' : ''}`} onClick={() => setView('list')}>
              List
            </button>
          </div>
          {view === 'graph' && (
            <button className="icon-btn" aria-label="Fit to screen" title="Fit to screen" onClick={() => fg.current?.zoomToFit(500, 40)}>
              <Icon name="atlas" size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="graph-body">
        {view === 'graph' ? (
          <div className="graph-canvas grid-bg" ref={box}>
            {data.nodes.length === 0 ? (
              <p className="muted graph-empty">No records of the selected kinds.</p>
            ) : (
              <ForceGraph2D<GNode, GLink>
                ref={fg}
                width={size.w}
                height={size.h}
                graphData={data}
                nodeId="id"
                backgroundColor="rgba(0,0,0,0)"
                nodeCanvasObject={draw}
                nodePointerAreaPaint={(node, color, ctx) => {
                  ctx.fillStyle = color
                  ctx.beginPath()
                  ctx.arc(node.x!, node.y!, 10, 0, 2 * Math.PI)
                  ctx.fill()
                }}
                nodeLabel={() => ''}
                linkColor={linkColor}
                linkWidth={(l) => (pathEdges.has([endId(l.source as GLink['source']), endId(l.target as GLink['target'])].sort().join('|')) ? 2.5 : focus && (endId(l.source as GLink['source']) === focus || endId(l.target as GLink['target']) === focus) ? 1.4 : 0.8)}
                linkLineDash={(l) => (l.edge.type === 'mentions' ? [2, 2.5] : null)}
                linkDirectionalArrowLength={(l) => (DIRECTED.has(l.edge.type) ? 3 : 0)}
                linkDirectionalArrowRelPos={0.92}
                linkDirectionalArrowColor={linkColor}
                onNodeHover={(n) => setHover(n ? (n.id as string) : null)}
                onNodeClick={(n) => select(n.id as string)}
                onNodeRightClick={(n) => navigate(`/r/${n.id}`)}
                onBackgroundClick={() => select(null)}
                cooldownTicks={140}
                warmupTicks={40}
                d3VelocityDecay={0.32}
                onEngineStop={() => {
                  if (!selected && !nodeCache.current.get('__fitted')) {
                    nodeCache.current.set('__fitted', {} as NodeObject<GNode>)
                    fg.current?.zoomToFit(400, 50)
                  }
                }}
              />
            )}
            <Legend present={present} />
          </div>
        ) : (
          <GraphList nodes={data.nodes.map((n) => n.rec)} onSelect={(id) => select(id)} />
        )}

        {(selRec || panel !== 'none') && (
          <aside className="graph-panel" aria-label="Graph details">
            {panel === 'path' && (
              <PathFinder
                ends={pathEnds}
                setEnds={setPathEnds}
                path={path}
                records={records}
                onSelect={(id) => {
                  select(id)
                  centerOn(id)
                }}
              />
            )}
            {panel === 'orphans' && (
              <section className="gp-section">
                <div className="row-flex">
                  <span className="kicker">Unconnected · {orphanList.length}</span>
                  <span className="spacer" />
                  <button className="icon-btn icon-btn--sm" aria-label="Close" onClick={() => setPanel('none')}>
                    <Icon name="close" size={13} />
                  </button>
                </div>
                <p className="muted small">Records with no links or mentions. Connect them, or leave them: not everything has to relate.</p>
                <ul className="plain-list">
                  {orphanList.map((r) => (
                    <li key={r.id}>
                      <button className="link-btn" onClick={() => { select(r.id); centerOn(r.id) }}>
                        {displayTitle(r)}
                      </button>
                      <span className="kicker">{KIND_DEFS[r.kind].label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {selRec && <NodeDetail rec={selRec} onTraverse={(id) => { select(id); centerOn(id) }} onClose={() => select(null)} />}
          </aside>
        )}
      </div>
    </div>
  )
}

function Legend({ present }: { present: Set<Kind> }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`legend ${open ? '' : 'is-closed'}`}>
      <button className="legend-toggle kicker" onClick={() => setOpen(!open)} aria-expanded={open}>
        Legend
      </button>
      {open && (
        <div className="legend-body">
          {present.has('topic') && (
            <ul>
              {DOMAINS.map((d) => (
                <li key={d}>
                  <span className="lg-dot" style={{ background: DOMAIN_COLORS[d] }} />
                  {DOMAIN_LABELS[d]}
                </li>
              ))}
            </ul>
          )}
          <ul>
            <li>
              <span className="lg-dot lg-dot--neutral" /> Other records
            </li>
            <li>
              <span className="lg-sq" /> Project · <span className="lg-tri" /> Resource · <span className="lg-dia" /> Goal, skill, path
            </li>
            <li>
              <span className="lg-ring" /> Active or studying
            </li>
            <li>
              <span className="lg-line" /> Stored link · <span className="lg-line lg-line--dash" /> Text link
            </li>
          </ul>
          <p className="muted small">Click to select · right-click to open</p>
        </div>
      )}
    </div>
  )
}

function NodeDetail({ rec, onTraverse, onClose }: { rec: AnyRecord; onTraverse: (id: string) => void; onClose: () => void }) {
  const groups = useConnections(rec.id)
  const [adding, setAdding] = useState(false)
  const excerpt = rec.body.split('\n\n')[0].slice(0, 320)
  return (
    <section className="gp-section node-detail">
      <div className="row-flex">
        <span className="kicker">{KIND_DEFS[rec.kind].label}</span>
        <span className="spacer" />
        <button className="icon-btn icon-btn--sm" aria-label="Close details" onClick={onClose}>
          <Icon name="close" size={13} />
        </button>
      </div>
      <h2 className="serif nd-title">{displayTitle(rec)}</h2>
      {excerpt && <Markdown text={excerpt} className="nd-excerpt" />}
      <div className="row-flex">
        <Link to={`/r/${rec.id}`} className="btn btn--primary btn--sm">
          Open page
        </Link>
        <button className="btn btn--ghost btn--sm" onClick={() => setAdding(true)}>
          <Icon name="link" size={13} /> Connect
        </button>
      </div>
      <div className="nd-conns">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="kicker">{g.label}</div>
            <ul>
              {g.items.map(({ edge, other }) => (
                <li key={edge.id}>
                  <button className="link-btn" onClick={() => onTraverse(other.id)}>
                    <Icon name={KIND_DEFS[other.kind].icon} size={13} />
                    {displayTitle(other)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!groups.length && <p className="muted small">No connections.</p>}
      </div>
      <AddConnection rec={rec} open={adding} onClose={() => setAdding(false)} />
    </section>
  )
}

function PathFinder({
  ends,
  setEnds,
  path,
  records,
  onSelect,
}: {
  ends: { from: string | null; to: string | null }
  setEnds: (e: { from: string | null; to: string | null }) => void
  path: string[] | null
  records: Record<string, AnyRecord>
  onSelect: (id: string) => void
}) {
  const end = (k: 'from' | 'to') => {
    const id = ends[k]
    return id && records[id] ? (
      <div className="path-end">
        <span className="kicker">{k}</span>
        <span className="truncate">{displayTitle(records[id])}</span>
        <button className="icon-btn icon-btn--sm" aria-label={`Clear ${k}`} onClick={() => setEnds({ ...ends, [k]: null })}>
          <Icon name="close" size={12} />
        </button>
      </div>
    ) : (
      <div>
        <span className="kicker">{k}</span>
        <RecordPicker label={`Path ${k}`} placeholder={k === 'from' ? 'Start…' : 'Destination…'} onPick={(r) => setEnds({ ...ends, [k]: r.id })} />
      </div>
    )
  }
  return (
    <section className="gp-section">
      <div className="kicker">Find a path between two records</div>
      {end('from')}
      {end('to')}
      {ends.from && ends.to && (
        path ? (
          <ol className="path-result">
            {path.map((id, i) => (
              <li key={id}>
                <button className="link-btn" onClick={() => onSelect(id)}>
                  {displayTitle(records[id])}
                </button>
                {i < path.length - 1 && <EdgeLabel a={id} b={path[i + 1]} />}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted small">Not connected through the records currently shown.</p>
        )
      )}
    </section>
  )
}

function EdgeLabel({ a, b }: { a: string; b: string }) {
  const index = useGraphIndex()
  const e = (index.out.get(a) ?? []).find((x) => x.target === b) ?? (index.out.get(b) ?? []).find((x) => x.target === a)
  if (!e) return null
  const forward = e.source === a
  const label = e.type === 'mentions' ? (forward ? 'mentions' : 'mentioned in') : forward ? LINK_LABELS[e.type].out : LINK_LABELS[e.type].in
  return <span className="kicker path-edge">↓ {label.toLowerCase()}</span>
}

/** The same graph as an ordinary list: every shown record with its connections. */
function GraphList({ nodes, onSelect }: { nodes: AnyRecord[]; onSelect: (id: string) => void }) {
  const index = useGraphIndex()
  const records = useVisible()
  const sorted = [...nodes].sort((a, b) => a.kind.localeCompare(b.kind) || displayTitle(a).localeCompare(displayTitle(b)))
  return (
    <div className="graph-list">
      <table className="table">
        <thead>
          <tr>
            <th>Record</th>
            <th>Connections</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const out = (index.out.get(r.id) ?? []).filter((e) => records[e.target])
            const inn = (index.in.get(r.id) ?? []).filter((e) => records[e.source])
            return (
              <tr key={r.id}>
                <td>
                  <RecordLink rec={r} />
                  <button className="link-btn small muted" onClick={() => onSelect(r.id)}>
                    details
                  </button>
                </td>
                <td className="small">
                  {out.map((e) => (
                    <span key={e.id} className="gl-edge">
                      <span className="kicker">{e.type === 'mentions' ? 'mentions' : LINK_LABELS[e.type].out}</span> {displayTitle(records[e.target])}
                    </span>
                  ))}
                  {inn.map((e) => (
                    <span key={e.id} className="gl-edge">
                      <span className="kicker">{e.type === 'mentions' ? 'mentioned in' : LINK_LABELS[e.type].in}</span> {displayTitle(records[e.source])}
                    </span>
                  ))}
                  {!out.length && !inn.length && <span className="muted">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
