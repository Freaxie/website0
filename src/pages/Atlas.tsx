import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { DOMAIN_COLORS, DOMAIN_LABELS, humanize } from '../domain/kinds'
import { orphans } from '../domain/graph'
import { COMMITTED_INTEREST, DOMAINS, INTEREST_STATUSES, type RecordOf } from '../domain/types'
import { useGraphIndex, useKind, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useCreate } from '../shell/useCreate'
import { CONFIDENCE_LABELS } from '../ui/Fields'
import { Icon } from '../ui/Icon'
import { Empty, PageHead, SectionHead } from '../ui/Page'
import { RecordLink } from '../ui/RecordLink'

type Filter = 'all' | 'committed' | 'exploring' | 'curious' | 'archived'

export function Atlas() {
  const topics = useKind('topic', { archived: true })
  const notes = useKind('note')
  const people = useKind('person')
  const questions = useKind('question')
  const create = useCreate()
  const records = useVisible()
  const index = useGraphIndex()
  const focusLimit = useStore((s) => s.settings.focusTopicLimit)
  const [filter, setFilter] = useState<Filter>('all')

  const shown = topics.filter((t) => {
    const s = t.data.status
    if (filter === 'archived') return s === 'archived' || t.archived
    if (t.archived || s === 'archived') return false
    if (filter === 'committed') return COMMITTED_INTEREST.includes(s)
    if (filter === 'exploring') return s === 'exploring'
    if (filter === 'curious') return s === 'curious'
    return true
  })
  const byDomain = DOMAINS.map((d) => ({ d, items: shown.filter((t) => t.data.domain === d).sort(order) })).filter((g) => g.items.length)
  const committed = topics.filter((t) => !t.archived && COMMITTED_INTEREST.includes(t.data.status)).length
  const lonely = useMemo(() => orphans(records, index).length, [records, index])
  const counts = (f: Filter) =>
    f === 'all'
      ? topics.filter((t) => !t.archived && t.data.status !== 'archived').length
      : topics.filter((t) =>
          f === 'committed' ? COMMITTED_INTEREST.includes(t.data.status) : f === 'archived' ? t.data.status === 'archived' || t.archived : t.data.status === f,
        ).length

  return (
    <div className="page atlas">
      <PageHead
        mode="Atlas · Knowledge"
        title="Knowledge Atlas"
        lede={
          <>
            Every subject as a page, connected by real relationships. Being curious about something costs nothing;{' '}
            <b className="accent-text">
              {committed} of {focusLimit}
            </b>{' '}
            focus slots are taken.
          </>
        }
        actions={
          <>
            <Link to="/graph" className="btn btn--ghost">
              <Icon name="graph" size={15} /> Graph
            </Link>
            <button className="btn btn--ghost" onClick={() => create('note', {})}>
              <Icon name="note" size={15} /> New note
            </button>
            <button className="btn btn--primary" onClick={() => create('topic', {})}>
              <Icon name="plus" size={15} /> New topic
            </button>
          </>
        }
      />

      <div className="filters" role="group" aria-label="Filter topics by status">
        {(['all', 'committed', 'exploring', 'curious', 'archived'] as Filter[]).map((f) => (
          <button key={f} aria-pressed={filter === f} className={`filter ${filter === f ? 'is-on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'committed' ? 'Studying · practicing · building' : humanize(f)}
            <span className="filter-count">{counts(f)}</span>
          </button>
        ))}
        {lonely > 0 && (
          <Link to="/graph?orphans=1" className="filter filter--link">
            {lonely} unconnected <Icon name="arrow" size={12} />
          </Link>
        )}
      </div>

      {byDomain.length === 0 && <Empty icon="topic" title="No topics here" />}
      <div className="domains">
        {byDomain.map(({ d, items }) => (
          <section key={d} className="domain">
            <h2 className="domain-head">
              <span className="domain-dot" style={{ background: DOMAIN_COLORS[d] }} />
              {DOMAIN_LABELS[d]}
              <span className="count">{items.length}</span>
            </h2>
            <ul className="topic-list">
              {items.map((t) => (
                <TopicRow key={t.id} t={t} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="cols cols-3 section">
        <section>
          <SectionHead title="Notes" count={notes.length} more={{ to: '/index?kind=note', label: 'All' }} />
          <ul className="plain-list">
            {notes
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .slice(0, 10)
              .map((n) => (
                <li key={n.id}>
                  <RecordLink rec={n} />
                  <span className="muted small nowrap">{formatTimestamp(n.updatedAt)}</span>
                </li>
              ))}
          </ul>
        </section>
        <section>
          <SectionHead title="Open questions" count={questions.filter((q) => q.data.status === 'open').length} />
          <ul className="plain-list">
            {questions
              .filter((q) => q.data.status === 'open')
              .map((q) => (
                <li key={q.id}>
                  <RecordLink rec={q} />
                </li>
              ))}
          </ul>
        </section>
        <section>
          <SectionHead title="People" count={people.length}>
            <button className="btn btn--ghost btn--sm" onClick={() => create('person', {})}>
              Add
            </button>
          </SectionHead>
          <ul className="plain-list">
            {people.map((p) => (
              <li key={p.id}>
                <RecordLink rec={p} />
                <span className="muted small">{p.data.era}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

const RANK = Object.fromEntries(INTEREST_STATUSES.map((s, i) => [s, [4, 3, 0, 1, 2, 5, 6][i]]))
const order = (a: RecordOf<'topic'>, b: RecordOf<'topic'>) => RANK[a.data.status] - RANK[b.data.status] || a.title.localeCompare(b.title)

function TopicRow({ t }: { t: RecordOf<'topic'> }) {
  const hot = COMMITTED_INTEREST.includes(t.data.status)
  const c = t.data.confidence
  return (
    <li className={`topic ${hot ? 'is-hot' : ''} topic--${t.data.status}`}>
      <Link to={`/r/${t.id}`} className="topic-link">
        <span className="topic-title">{t.title}</span>
        <span className="topic-meta">
          <span className={`topic-status ${hot ? 'accent-text' : ''}`}>{t.data.status}</span>
          <span className="conf" title={c === null ? 'Understanding not assessed' : `Understanding: ${CONFIDENCE_LABELS[c]}`} aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={c !== null && i < c ? 'on' : ''} />
            ))}
          </span>
        </span>
        {t.data.nextAction && hot && <span className="topic-next">→ {t.data.nextAction}</span>}
      </Link>
    </li>
  )
}
