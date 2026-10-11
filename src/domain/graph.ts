import { KIND_DEFS } from './kinds'
import type { AnyRecord, Link, LinkType } from './types'
import { parseWikilinks, titleIndex, titleKey } from './wikilinks'

export type EdgeType = LinkType | 'mentions'

export interface Edge {
  id: string
  source: string
  target: string
  type: EdgeType
  /** null = a stored Link; otherwise where the edge was read from. Every edge comes from real data. */
  derived: null | 'mention' | 'task'
  linkId?: string
}

export interface GraphIndex {
  edges: Edge[]
  out: Map<string, Edge[]>
  in: Map<string, Edge[]>
  titles: Map<string, string>
}

type Records = Record<string, AnyRecord>
type Links = Record<string, Link>

const cache = new WeakMap<Records, WeakMap<Links, GraphIndex>>()

/** All edges: stored links, [[wikilink]] mentions in bodies, and task → project membership. Memoised per state. */
export function graphIndex(records: Records, links: Links): GraphIndex {
  let inner = cache.get(records)
  if (!inner) cache.set(records, (inner = new WeakMap()))
  const hit = inner.get(links)
  if (hit) return hit

  const edges: Edge[] = []
  for (const l of Object.values(links)) {
    if (records[l.from] && records[l.to] && l.from !== l.to)
      edges.push({ id: l.id, source: l.from, target: l.to, type: l.type, derived: null, linkId: l.id })
  }
  const titles = titleIndex(Object.values(records))
  for (const r of Object.values(records)) {
    if (r.body.includes('[[')) {
      const seen = new Set<string>()
      for (const ref of parseWikilinks(r.body)) {
        const to = titles.get(titleKey(ref.target))
        if (to && to !== r.id && !seen.has(to)) {
          seen.add(to)
          edges.push({ id: `m:${r.id}:${to}`, source: r.id, target: to, type: 'mentions', derived: 'mention' })
        }
      }
    }
    if (r.kind === 'task' && r.data.projectId && records[r.data.projectId])
      edges.push({ id: `t:${r.id}`, source: r.id, target: r.data.projectId, type: 'part_of', derived: 'task' })
  }
  const out = new Map<string, Edge[]>()
  const inn = new Map<string, Edge[]>()
  for (const e of edges) {
    if (!out.has(e.source)) out.set(e.source, [])
    out.get(e.source)!.push(e)
    if (!inn.has(e.target)) inn.set(e.target, [])
    inn.get(e.target)!.push(e)
  }
  const index = { edges, out, in: inn, titles }
  inner.set(links, index)
  return index
}

export function neighbors(index: GraphIndex, id: string): Set<string> {
  const s = new Set<string>()
  for (const e of index.out.get(id) ?? []) s.add(e.target)
  for (const e of index.in.get(id) ?? []) s.add(e.source)
  return s
}

/** Shortest undirected path between two records (breadth-first), or null when they are not connected. */
export function shortestPath(index: GraphIndex, from: string, to: string, allowed?: (id: string) => boolean): string[] | null {
  if (from === to) return [from]
  const prev = new Map<string, string>([[from, from]])
  const queue = [from]
  while (queue.length) {
    const cur = queue.shift()!
    for (const n of neighbors(index, cur)) {
      if (prev.has(n) || (allowed && !allowed(n))) continue
      prev.set(n, cur)
      if (n === to) {
        const path = [to]
        let p = to
        while (p !== from) path.unshift((p = prev.get(p)!))
        return path
      }
      queue.push(n)
    }
  }
  return null
}

/** Records that belong on the map but connect to nothing. */
export function orphans(records: Records, index: GraphIndex): AnyRecord[] {
  return Object.values(records).filter(
    (r) => KIND_DEFS[r.kind].inGraph && !r.archived && !index.out.get(r.id)?.length && !index.in.get(r.id)?.length,
  )
}
