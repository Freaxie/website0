import MiniSearch from 'minisearch'
import { collectText } from './text'
import type { AnyRecord } from './types'

type Records = Record<string, AnyRecord>
interface Doc {
  id: string
  title: string
  body: string
  tags: string
  text: string
}

const cache = new WeakMap<Records, MiniSearch<Doc>>()

function build(records: Records) {
  const ms = new MiniSearch<Doc>({
    fields: ['title', 'tags', 'body', 'text'],
    storeFields: [],
    searchOptions: {
      boost: { title: 4, tags: 2, text: 1.2 },
      prefix: true,
      fuzzy: (term) => (term.length > 4 ? 0.2 : false),
      combineWith: 'AND',
    },
  })
  ms.addAll(
    Object.values(records).map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      tags: r.tags.join(' '),
      text: collectText(r.data).join(' \n '),
    })),
  )
  return ms
}

export interface SearchHit {
  id: string
  score: number
}

/** Ranked full-text search across titles, bodies, tags and every kind-specific field. */
export function search(records: Records, query: string, limit = 40): SearchHit[] {
  const q = query.trim()
  if (!q) return []
  let ms = cache.get(records)
  if (!ms) cache.set(records, (ms = build(records)))
  let hits = ms.search(q)
  if (!hits.length) hits = ms.search(q, { combineWith: 'OR' })
  const ql = q.toLowerCase()
  return hits
    .map((h) => {
      const r = records[h.id as string]
      // An exact or leading title match should beat a long body that mentions the word often.
      const t = r?.title.toLowerCase() ?? ''
      const bonus = t === ql ? 100 : t.startsWith(ql) ? 20 : 0
      const archived = r?.archived ? 0.5 : 1
      return { id: h.id as string, score: (h.score + bonus) * archived }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
