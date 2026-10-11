import { makeRecord } from './factory'
import { graphIndex, neighbors, orphans, shortestPath } from './graph'
import { search } from './search'
import { formatPartial, isPartialDate, weekStart } from './dates'
import { parseWikilinks } from './wikilinks'
import type { AnyRecord, Link } from './types'

const map = (rs: AnyRecord[]) => Object.fromEntries(rs.map((r) => [r.id, r]))
const L = (from: string, to: string, type: Link['type'] = 'related'): Link => ({
  id: `${from}-${to}`, from, to, type, note: '', createdAt: '2026-01-01T00:00:00Z',
})

describe('wikilinks', () => {
  it('parses titles and aliases', () => {
    expect(parseWikilinks('see [[Emergence]] and [[Statistical mechanics|stat mech]]')).toEqual([
      { target: 'Emergence', label: 'Emergence' },
      { target: 'Statistical mechanics', label: 'stat mech' },
    ])
  })
})

describe('graph', () => {
  const a = makeRecord('topic', { id: 'a', title: 'Alpha' })
  const b = makeRecord('note', { id: 'b', title: 'Beta', body: 'links to [[alpha]] twice [[Alpha]]' })
  const c = makeRecord('topic', { id: 'c', title: 'Gamma' })
  const d = makeRecord('topic', { id: 'd', title: 'Delta' })
  const p = makeRecord('project', { id: 'p', title: 'Proj' })
  const t = makeRecord('task', { id: 't', title: 'Do', data: { projectId: 'p' } })
  const records = map([a, b, c, d, p, t] as AnyRecord[])
  const links = { x: L('a', 'c', 'depends_on'), dangling: L('a', 'missing') }

  it('builds edges from stored links, mentions and task membership only', () => {
    const g = graphIndex(records, links)
    expect(g.edges.map((e) => `${e.source}>${e.target}:${e.type}`).sort()).toEqual(['a>c:depends_on', 'b>a:mentions', 't>p:part_of'])
    expect(neighbors(g, 'a')).toEqual(new Set(['b', 'c']))
  })
  it('memoises per state', () => {
    expect(graphIndex(records, links)).toBe(graphIndex(records, links))
  })
  it('finds shortest paths and reports disconnection', () => {
    const g = graphIndex(records, links)
    expect(shortestPath(g, 'b', 'c')).toEqual(['b', 'a', 'c'])
    expect(shortestPath(g, 'b', 'd')).toBeNull()
  })
  it('lists orphans among graph kinds', () => {
    expect(orphans(records, graphIndex(records, links)).map((r) => r.id)).toEqual(['d'])
  })
})

describe('search', () => {
  const recs = map([
    makeRecord('topic', { id: 'e', title: 'Emergence', body: 'microstates' }),
    makeRecord('note', { id: 'n', title: 'Thermo notes', body: 'emergence appears here' }),
    makeRecord('project', { id: 'p', title: 'Robot', data: { purpose: 'An ESP32 rover' } }),
  ] as AnyRecord[])
  it('ranks title matches first', () => {
    expect(search(recs, 'emergence').map((h) => h.id)).toEqual(['e', 'n'])
  })
  it('searches kind-specific fields and prefixes', () => {
    expect(search(recs, 'esp3').map((h) => h.id)).toEqual(['p'])
  })
})

describe('dates', () => {
  it('validates and formats partial dates', () => {
    expect(isPartialDate('2026')).toBe(true)
    expect(isPartialDate('2026-13')).toBe(false)
    expect(formatPartial('2026-10')).toBe('Oct 2026')
    expect(formatPartial('2026-10-11')).toBe('11 Oct 2026')
    expect(formatPartial(null)).toBe('Date unknown')
    expect(weekStart('2026-10-11')).toBe('2026-10-05')
  })
})
