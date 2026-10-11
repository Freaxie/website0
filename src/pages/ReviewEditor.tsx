import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { newId } from '../domain/ids'
import { displayTitle } from '../domain/factory'
import { COMMITTED_INTEREST, type AnyRecord, type Check, type RecordOf } from '../domain/types'
import { useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { AutoInput } from '../ui/Editor'
import { ChecksEditor } from '../ui/Fields'
import { RecordLink } from '../ui/RecordLink'

export const REVIEW_PROMPTS: [string, string][] = [
  ['did', 'What did I actually do?'],
  ['finished', 'What did I finish?'],
  ['learned', 'What did I learn?'],
  ['avoided', 'What did I avoid?'],
  ['mattered', 'What mattered more than expected?'],
  ['distraction', 'What was a distraction?'],
  ['invest', 'Which goals still deserve investment?'],
  ['remove', 'What should be paused or removed?'],
  ['next', 'What is the single most useful next step?'],
]

export function periodRange(r: RecordOf<'review'>): [number, number] {
  const start = new Date(`${r.data.periodStart || r.createdAt.slice(0, 10)}T00:00:00+05:30`).getTime()
  const days = r.data.period === 'month' ? 31 : 7
  return [start, start + days * 86400000]
}

/** What the records say happened in the period. Facts only, so the answers have something to stand on. */
function useEvidence(review: RecordOf<'review'>) {
  const records = useVisible()
  return useMemo(() => {
    const [a, b] = periodRange(review)
    const within = (iso: string | null) => !!iso && new Date(iso).getTime() >= a && new Date(iso).getTime() < b
    const all = Object.values(records).filter((r) => r.id !== review.id)
    return {
      done: all.filter((r): r is RecordOf<'task'> => r.kind === 'task' && within(r.data.doneAt)),
      created: all.filter((r) => within(r.createdAt) && r.kind !== 'task' && r.kind !== 'capture'),
      captures: all.filter((r) => r.kind === 'capture' && within(r.createdAt)).length,
      touched: all.filter((r) => within(r.updatedAt) && !within(r.createdAt)).length,
    }
  }, [records, review])
}

export function ReviewEditor({ review }: { review: RecordOf<'review'> }) {
  const update = useStore((s) => s.update)
  const ev = useEvidence(review)
  const answers = review.data.answers
  const setAnswer = (k: string, v: string) => update<'review'>(review.id, { data: { answers: { ...answers, [k]: v } } })

  return (
    <div className="review">
      <section className="review-evidence panel">
        <div className="kicker">What the records show for this period</div>
        <div className="evidence-stats">
          <div>
            <b>{ev.done.length}</b>
            <span>tasks completed</span>
          </div>
          <div>
            <b>{ev.created.length}</b>
            <span>records created</span>
          </div>
          <div>
            <b>{ev.touched}</b>
            <span>records edited</span>
          </div>
          <div>
            <b>{ev.captures}</b>
            <span>captures</span>
          </div>
        </div>
        {(ev.done.length > 0 || ev.created.length > 0) && (
          <ul className="evidence-list">
            {ev.done.slice(0, 12).map((t) => (
              <li key={t.id}>
                <span className="kicker">done</span> <RecordLink rec={t} icon={false} />
              </li>
            ))}
            {ev.created.slice(0, 12).map((r) => (
              <li key={r.id}>
                <span className="kicker">new</span> <RecordLink rec={r} icon={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="review-prompts">
        {REVIEW_PROMPTS.map(([k, q]) => (
          <div key={k} className="prompt">
            <label className="prompt-q serif" htmlFor={`rv-${k}`}>
              {q}
            </label>
            <AutoInput id={`rv-${k}`} key={`${review.id}-${k}`} multiline className="input prompt-a" value={answers[k] ?? ''} onSave={(v) => setAnswer(k, v)} />
            {k === 'next' && answers.next?.trim() && <MakeTask review={review} text={answers.next.trim()} />}
          </div>
        ))}
      </div>

      <Decisions review={review} />

      <section className="section">
        <div className="section-head">
          <h2>Changes this review produced</h2>
        </div>
        <p className="muted small">A review that changes nothing was a diary entry. Decisions made above are logged here automatically; add others by hand.</p>
        <ChecksEditor key={review.id} items={review.data.changes} onChange={(changes) => update<'review'>(review.id, { data: { changes } })} placeholder="Add a concrete change" />
      </section>
    </div>
  )
}

function MakeTask({ review, text }: { review: RecordOf<'review'>; text: string }) {
  const toast = useUi((s) => s.toast)
  const update = useStore((s) => s.update)
  return (
    <button
      className="btn btn--ghost btn--sm"
      onClick={() => {
        useStore.getState().create('task', { title: text, data: { next: true } })
        update<'review'>(review.id, { data: { changes: [...review.data.changes, { id: newId('c'), title: `Next step → task: ${text}`, done: true }] } })
        toast('Added to next actions', 'info')
      }}
    >
      Make it a next action
    </button>
  )
}

/** Keep, pause or drop each live commitment, applied immediately and logged. */
function Decisions({ review }: { review: RecordOf<'review'> }) {
  const records = useVisible()
  const update = useStore((s) => s.update)
  const live = useMemo(
    () =>
      Object.values(records).filter(
        (r): r is RecordOf<'project'> | RecordOf<'topic'> | RecordOf<'goal'> =>
          !r.archived &&
          ((r.kind === 'project' && r.data.status === 'active') ||
            (r.kind === 'topic' && COMMITTED_INTEREST.includes(r.data.status)) ||
            (r.kind === 'goal' && r.data.status === 'active')),
      ),
    [records],
  )
  const log = (title: string) => {
    const cur = useStore.getState().records[review.id] as RecordOf<'review'>
    const change: Check = { id: newId('c'), title, done: true }
    update<'review'>(review.id, { data: { changes: [...cur.data.changes, change] } })
  }
  const act = (r: AnyRecord, label: string, data: Record<string, unknown>) => {
    update(r.id, { data })
    log(`${label}: ${displayTitle(r)}`)
  }
  if (!live.length)
    return (
      <section className="section">
        <div className="section-head">
          <h2>Commitments</h2>
        </div>
        <p className="muted">Nothing is marked active, studying, practicing or building.</p>
      </section>
    )
  return (
    <section className="section">
      <div className="section-head">
        <h2>Commitments</h2>
        <span className="muted small">Still worth it?</span>
      </div>
      <ul className="decisions">
        {live.map((r) => (
          <li key={r.id} className="decision">
            <Link to={`/r/${r.id}`} className="decision-title">
              {displayTitle(r)}
            </Link>
            <span className="kicker">{r.kind}</span>
            <span className="spacer" />
            {r.kind === 'project' && (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Paused project', { status: 'paused', statusReason: `Paused in review` })}>
                  Pause
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Abandoned project', { status: 'abandoned', statusReason: `Deliberately abandoned in review` })}>
                  Abandon
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Completed project', { status: 'completed' })}>
                  Complete
                </button>
              </>
            )}
            {r.kind === 'topic' && (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Back to exploring', { status: 'exploring' })}>
                  Back to exploring
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Archived topic', { status: 'archived' })}>
                  Archive
                </button>
              </>
            )}
            {r.kind === 'goal' && (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Paused goal', { status: 'paused' })}>
                  Pause
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => act(r, 'Dropped goal', { status: 'dropped' })}>
                  Drop
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
