import { useState } from 'react'
import { Link } from 'react-router-dom'
import { humanize } from '../domain/kinds'
import { RESOURCE_STATUSES, RESOURCE_TYPES, type RecordOf } from '../domain/types'
import { useGraphIndex, useKind } from '../store/hooks'
import { useCreate } from '../shell/useCreate'
import { Icon } from '../ui/Icon'
import { Empty, PageHead, SectionHead } from '../ui/Page'

const GROUPS: { status: (typeof RESOURCE_STATUSES)[number]; title: string }[] = [
  { status: 'reading', title: 'Reading now' },
  { status: 'want', title: 'Want to read' },
  { status: 'finished', title: 'Finished' },
  { status: 'reference', title: 'Reference' },
  { status: 'abandoned', title: 'Abandoned' },
]

export function Library() {
  const all = useKind('resource')
  const create = useCreate()
  const [type, setType] = useState<string>('all')
  const items = all.filter((r) => type === 'all' || r.data.type === type)
  return (
    <div className="page library">
      <PageHead
        mode="Archive · Library"
        title="Library"
        lede="Not a shelf of covers: each entry keeps its arguments, disagreements, questions and whether it changed anything."
        actions={
          <button className="btn btn--primary" onClick={() => create('resource', {})}>
            <Icon name="plus" size={15} /> Add resource
          </button>
        }
      />
      <div className="filters" role="group" aria-label="Filter by type">
        {['all', ...RESOURCE_TYPES].map((t) => (
          <button key={t} aria-pressed={type === t} className={`filter ${type === t ? 'is-on' : ''}`} onClick={() => setType(t)}>
            {humanize(t)}
            <span className="filter-count">{t === 'all' ? all.length : all.filter((r) => r.data.type === t).length}</span>
          </button>
        ))}
      </div>
      {items.length === 0 && <Empty icon="resource" title="Nothing here yet" />}
      {GROUPS.map((g) => {
        const xs = items.filter((r) => r.data.status === g.status)
        if (!xs.length) return null
        return (
          <section key={g.status} className="section">
            <SectionHead title={g.title} count={xs.length} />
            <ul className="shelf">
              {xs.map((r) => (
                <Shelf key={r.id} r={r} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function Shelf({ r }: { r: RecordOf<'resource'> }) {
  const index = useGraphIndex()
  const links = (index.out.get(r.id)?.length ?? 0) + (index.in.get(r.id)?.length ?? 0)
  const notes = r.data.arguments.length + r.data.disagreements.length + r.data.questions.length + r.data.ideasToTest.length
  return (
    <li>
      <Link to={`/r/${r.id}`} className="shelf-item">
        <span className="shelf-type kicker">{r.data.type}</span>
        <span className="shelf-main">
          <span className="shelf-title">{r.title || 'Untitled'}</span>
          <span className="muted small">
            {[r.data.author, r.data.year].filter(Boolean).join(', ')}
          </span>
        </span>
        <span className="shelf-meta">
          {r.data.sourceType && <span className="chip chip--quiet">{r.data.sourceType}</span>}
          {r.tags.includes('suggested') && <span className="chip chip--hist">suggested</span>}
          {r.data.impact.trim() && <span className="chip chip--accent" title={r.data.impact}>changed me</span>}
          <span className="kicker">{notes} notes · {links} links</span>
        </span>
      </Link>
    </li>
  )
}
