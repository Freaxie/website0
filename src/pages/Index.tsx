import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS } from '../domain/kinds'
import { search } from '../domain/search'
import { KINDS, type AnyRecord, type Kind } from '../domain/types'
import { useVisible } from '../store/hooks'
import { EpistemicChips, StatusChip } from '../ui/chips'
import { Icon } from '../ui/Icon'
import { PageHead } from '../ui/Page'

type Sort = 'updated' | 'created' | 'title'

/** Archive mode: every record in one dense, filterable table. Filters live in the URL. */
export function Index() {
  const records = useVisible()
  const [params, setParams] = useSearchParams()
  const kind = (params.get('kind') ?? '') as Kind | ''
  const q = params.get('q') ?? ''
  const tag = params.get('tag') ?? ''
  const archived = params.get('archived') === '1'
  const sort = (params.get('sort') ?? 'updated') as Sort
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const rows = useMemo(() => {
    let xs: AnyRecord[] = q.trim() ? search(records, q, 500).map((h) => records[h.id]) : Object.values(records)
    xs = xs.filter((r) => (!kind || r.kind === kind) && (archived || !r.archived) && (!tag || r.tags.includes(tag)))
    if (!q.trim())
      xs.sort((a, b) =>
        sort === 'title' ? displayTitle(a).localeCompare(displayTitle(b)) : sort === 'created' ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt),
      )
    return xs
  }, [records, q, kind, archived, tag, sort])
  const tags = useMemo(() => [...new Set(Object.values(records).flatMap((r) => r.tags))].sort(), [records])

  return (
    <div className="page page--wide index-page">
      <PageHead mode="Archive · Index" title="Index" lede={`${Object.keys(records).length} records. Everything, densely.`} />
      <div className="index-filters">
        <div className="picker-input index-q">
          <Icon name="search" size={14} />
          <input className="input input--bare" placeholder="Filter by text…" aria-label="Filter by text" value={q} onChange={(e) => setParam('q', e.target.value)} />
        </div>
        <select className="input" aria-label="Kind" value={kind} onChange={(e) => setParam('kind', e.target.value)}>
          <option value="">All kinds</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_DEFS[k].plural}
            </option>
          ))}
        </select>
        {tags.length > 0 && (
          <select className="input" aria-label="Tag" value={tag} onChange={(e) => setParam('tag', e.target.value)}>
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
        <select className="input" aria-label="Sort" value={sort} disabled={!!q.trim()} onChange={(e) => setParam('sort', e.target.value === 'updated' ? '' : e.target.value)}>
          <option value="updated">Recently updated</option>
          <option value="created">Recently created</option>
          <option value="title">Title</option>
        </select>
        <label className="switch">
          <input type="checkbox" checked={archived} onChange={(e) => setParam('archived', e.target.checked ? '1' : '')} />
          <span>Include archived</span>
        </label>
        <span className="kicker">{rows.length} shown</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Kind</th>
              <th>Status</th>
              <th>Information</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.archived ? 'is-archived' : ''}>
                <td>
                  <Link to={`/r/${r.id}`} className="table-title">
                    <Icon name={KIND_DEFS[r.kind].icon} size={14} />
                    <span>{displayTitle(r)}</span>
                  </Link>
                </td>
                <td className="kicker">{KIND_DEFS[r.kind].label}</td>
                <td>
                  <StatusChip rec={r} />
                </td>
                <td>
                  <span className="row-flex">
                    <EpistemicChips rec={r} compact />
                  </span>
                </td>
                <td className="muted small nowrap">{formatTimestamp(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="muted" style={{ padding: 24 }}>No records match.</p>}
      </div>
    </div>
  )
}
