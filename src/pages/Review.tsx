import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatPartial, today, weekStart } from '../domain/dates'
import { computeSignals } from '../domain/signals'
import { useKind, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { Icon } from '../ui/Icon'
import { Empty, PageHead, SectionHead } from '../ui/Page'

export function Review() {
  const reviews = useKind('review').sort((a, b) => b.data.periodStart.localeCompare(a.data.periodStart) || b.createdAt.localeCompare(a.createdAt))
  const records = useVisible()
  const settings = useStore((s) => s.settings)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const signals = useMemo(() => computeSignals(Object.values(records), settings), [records, settings])

  const start = (period: 'week' | 'month') => {
    const d = today()
    const periodStart = period === 'week' ? weekStart(d) : `${d.slice(0, 7)}-01`
    const existing = reviews.find((r) => r.data.period === period && r.data.periodStart === periodStart)
    if (existing) return navigate(`/r/${existing.id}`)
    const r = useStore.getState().create('review', {
      title: period === 'week' ? `Week of ${formatPartial(periodStart)}` : `${formatPartial(periodStart.slice(0, 7))} review`,
      data: { period, periodStart },
    })
    navigate(`/r/${r.id}`)
  }

  useEffect(() => {
    const p = params.get('start')
    if (p === 'week' || p === 'month') {
      setParams({}, { replace: true })
      start(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page review-room">
      <PageHead
        mode="Life · Review"
        title="Review Room"
        lede="What actually happened, what to keep, what to stop. A review should end with concrete changes, not just reflection."
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => start('month')}>
              Monthly review
            </button>
            <button className="btn btn--primary" onClick={() => start('week')}>
              <Icon name="review" size={15} /> Weekly review
            </button>
          </>
        }
      />
      <div className="cols cols-main-rail">
        <section>
          <SectionHead title="Past reviews" count={reviews.length} />
          {reviews.length ? (
            <ul className="plain-list reviews">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Link to={`/r/${r.id}`}>{r.title}</Link>
                  <span className="kicker">
                    {r.data.period} · {r.data.changes.length} changes · {Object.values(r.data.answers).filter((a) => a.trim()).length}/9 answered
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="review" title="No reviews yet">
              Fifteen minutes a week. The review opens with what your records show for the period.
            </Empty>
          )}
        </section>
        <aside className="panel">
          <div className="kicker">Patterns to bring to the review</div>
          {signals.length ? (
            <ul className="signals">
              {signals.map((s) => (
                <li key={s.id} className={`signal signal--${s.tone}`}>
                  <Link to={s.href}>{s.text}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Nothing notable.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
