import { Link } from 'react-router-dom'
import { formatPartial, partialSortKey } from '../domain/dates'
import { humanize } from '../domain/kinds'
import type { PartialDate } from '../domain/types'
import { useGraphIndex, useKind } from '../store/hooks'
import { useCreate } from '../shell/useCreate'
import { EpistemicChips } from '../ui/chips'
import { Icon } from '../ui/Icon'
import { PageHead } from '../ui/Page'
import type { AnyRecord } from '../domain/types'

interface Item {
  key: string
  date: PartialDate | null
  title: string
  category: string
  rec: AnyRecord
  derived: boolean
}

export function Timeline() {
  const events = useKind('event')
  const projects = useKind('project', { archived: true })
  const create = useCreate()
  const index = useGraphIndex()
  // A project that already has its own dated events doesn't also get entries derived from its dates.
  const hasEvents = (projectId: string) => (index.in.get(projectId) ?? []).some((e) => events.some((ev) => ev.id === e.source))
  const items: Item[] = [
    ...events.map((e) => ({ key: e.id, date: e.data.date, title: e.title, category: e.data.category, rec: e as AnyRecord, derived: false })),
    // Project start and end dates are shown too, marked as read from the project.
    ...projects.filter((p) => !hasEvents(p.id)).flatMap((p) => [
      ...(p.data.startedOn ? [{ key: `${p.id}:s`, date: p.data.startedOn, title: `Started ${p.title}`, category: 'project', rec: p as AnyRecord, derived: true }] : []),
      ...(p.data.endedOn && p.data.endedOn !== p.data.startedOn ? [{ key: `${p.id}:e`, date: p.data.endedOn, title: `Ended ${p.title}`, category: 'project', rec: p as AnyRecord, derived: true }] : []),
    ]),
  ]
  const dated = items.filter((i) => i.date).sort((a, b) => partialSortKey(b.date).localeCompare(partialSortKey(a.date)))
  const undated = items.filter((i) => !i.date)
  const years = [...new Set(dated.map((i) => i.date!.slice(0, 4)))]
  return (
    <div className="page timeline">
      <PageHead
        mode="Archive · Timeline"
        title="Timeline"
        lede="Dated where the date is actually known. Old entries describe the past, not the present."
        actions={
          <button className="btn btn--primary" onClick={() => create('event', {})}>
            <Icon name="plus" size={15} /> Add event
          </button>
        }
      />
      <div className="tl">
        {years.map((y) => (
          <section key={y} className="tl-year">
            <h2 className="tl-y serif">{y}</h2>
            <ol>
              {dated
                .filter((i) => i.date!.startsWith(y))
                .map((i) => (
                  <Row key={i.key} i={i} />
                ))}
            </ol>
          </section>
        ))}
        {undated.length > 0 && (
          <section className="tl-year tl-year--undated">
            <h2 className="tl-y serif">Undated</h2>
            <p className="muted small">The date is not recorded. It has not been guessed.</p>
            <ol>
              {undated.map((i) => (
                <Row key={i.key} i={i} />
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}

function Row({ i }: { i: Item }) {
  return (
    <li className="tl-item">
      <span className="tl-date mono">{i.date ? formatPartial(i.date) : '—'}</span>
      <span className="tl-dot" aria-hidden />
      <span className="tl-body">
        <Link to={`/r/${i.rec.id}`} className="tl-title">
          {i.title || 'Untitled event'}
        </Link>
        <span className="row-flex">
          <span className="kicker">{humanize(i.category)}</span>
          {i.derived && <span className="kicker">from project dates</span>}
          {!i.derived && <EpistemicChips rec={i.rec} compact />}
        </span>
      </span>
    </li>
  )
}
