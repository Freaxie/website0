import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { daysSince, formatTimestamp, TIME_ZONE } from '../domain/dates'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS } from '../domain/kinds'
import { computeSignals } from '../domain/signals'
import { COMMITTED_INTEREST, type RecordOf } from '../domain/types'
import { useKind, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { AutoInput } from '../ui/Editor'
import { Icon } from '../ui/Icon'
import { Markdown } from '../ui/Markdown'
import { MiniMap } from '../ui/MiniMap'
import { Empty, SectionHead } from '../ui/Page'
import { RecordLink } from '../ui/RecordLink'
import { TaskRow } from '../ui/TaskRow'

/** The first real paragraph of the priorities page: skips the setup note and headings. */
function focusParagraph(md: string) {
  return (
    md
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('>') && !p.startsWith('#')) ?? ''
  )
}

export function Home() {
  const records = useVisible()
  const settings = useStore((s) => s.settings)
  const set = useUi((s) => s.set)
  const now = useStore((s) => s.records['pg_now'])
  const projects = useKind('project')
  const tasks = useKind('task')
  const topics = useKind('topic')
  const paths = useKind('path')

  const active = projects.filter((p) => p.data.status === 'active')
  const focus = topics.filter((t) => COMMITTED_INTEREST.includes(t.data.status))
  const nextTasks = tasks
    .filter((t) => !t.data.done && t.data.next)
    .sort((a, b) => (a.data.due ?? '9').localeCompare(b.data.due ?? '9') || a.createdAt.localeCompare(b.createdAt))
  const signals = useMemo(() => computeSignals(Object.values(records), settings), [records, settings])
  const recent = useMemo(
    () => Object.values(records).filter((r) => r.kind !== 'capture' && !r.archived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [records],
  )
  const backlog = {
    ideas: projects.filter((p) => p.data.status === 'idea' || p.data.status === 'evaluating').length,
    curious: topics.filter((t) => t.data.status === 'curious' || t.data.status === 'exploring').length,
  }
  const week = useMemo(() => {
    const all = Object.values(records)
    const d7 = (iso: string | null) => !!iso && daysSince(iso) < 7
    return {
      done: all.filter((r) => r.kind === 'task' && d7(r.data.doneAt)).length,
      created: all.filter((r) => d7(r.createdAt) && r.origin !== 'seed').length,
      captures: all.filter((r) => r.kind === 'capture' && d7(r.createdAt)).length,
      lastReview: all
        .filter((r): r is RecordOf<'review'> => r.kind === 'review')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    }
  }, [records])

  const date = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const learning = paths
    .map((p) => ({ p, done: p.data.steps.filter((s) => s.done).length, next: p.data.steps.find((s) => !s.done) }))
    .filter((x) => x.p.data.steps.length)

  return (
    <div className="page home">
      <header className="home-head">
        <div className="kicker">
          Observatory · {date} · Lucknow
        </div>
        <h1 className="home-title">
          What matters now, <em>and what can I do next?</em>
        </h1>
      </header>

      <section className="focus" aria-labelledby="focus-h">
        <div className="focus-label">
          <span className="kicker" id="focus-h">
            Current focus
          </span>
          {now && (
            <Link to="/r/pg_now" className="more-link">
              Priorities <Icon name="arrow" size={13} />
            </Link>
          )}
        </div>
        {now ? (
          <div className="focus-text">
            <Markdown text={focusParagraph(now.body) || '_No focus written yet._'} />
            {now.currency !== 'current' || now.certainty === 'hypothesis' ? (
              <p className="focus-note">Proposed during setup, not yet confirmed. Rewrite it in your own words.</p>
            ) : null}
          </div>
        ) : (
          <p className="muted">The priorities page was deleted. Create a page titled “Current priorities” to show a focus here.</p>
        )}
      </section>

      <div className="cols cols-main-rail home-grid">
        <div className="home-main">
          <section className="section">
            <SectionHead title="Next actions" count={nextTasks.length + active.filter((p) => p.data.nextAction).length} />
            {active.length + nextTasks.length + focus.length === 0 ? (
              <Empty icon="task" title="Nothing queued" action={<button className="btn btn--sm" onClick={() => set({ capture: true })}>Capture a task</button>}>
                Mark a project active or add a task with “show as next action”.
              </Empty>
            ) : (
              <div className="next">
                {active.map((p) => (
                  <ProjectNext key={p.id} p={p} />
                ))}
                {nextTasks.length > 0 && (
                  <ul className="tasks">
                    {nextTasks.slice(0, 8).map((t) => (
                      <TaskRow key={t.id} task={t} showProject />
                    ))}
                  </ul>
                )}
                {focus
                  .filter((t) => t.data.nextAction.trim())
                  .map((t) => (
                    <div key={t.id} className="next-row">
                      <span className="kicker">study</span>
                      <Link to={`/r/${t.id}`} className="next-text">
                        {t.data.nextAction}
                      </Link>
                      <span className="muted small">{t.title}</span>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="section">
            <SectionHead title="Active projects" count={active.length} more={{ to: '/projects', label: `Forge · ${backlog.ideas} ideas waiting` }}>
              <span className={`limit ${active.length > settings.activeProjectLimit ? 'is-over' : ''}`}>
                {active.length}/{settings.activeProjectLimit}
              </span>
            </SectionHead>
            {active.length ? (
              <div className="cards">
                {active.map((p) => {
                  const ms = p.data.milestones
                  const open = tasks.filter((t) => t.data.projectId === p.id && !t.data.done).length
                  return (
                    <Link key={p.id} to={`/r/${p.id}`} className="card">
                      <div className="card-title">{p.title}</div>
                      <p className="card-text">{p.data.purpose || p.body.split('\n')[0]}</p>
                      <div className="card-foot">
                        <span className="kicker">{open} open tasks</span>
                        {ms.length > 0 && (
                          <span className="kicker">
                            {ms.filter((m) => m.done).length}/{ms.length} milestones
                          </span>
                        )}
                        <span className="kicker">upd. {formatTimestamp(p.updatedAt)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Empty icon="project" title="No active project">
                Pick one idea from the Forge and make it active.
              </Empty>
            )}
          </section>

          <section className="section">
            <SectionHead title="Learning threads" more={{ to: '/learning', label: 'Learning Studio' }} />
            <div className="threads">
              {focus.map((t) => (
                <Link key={t.id} to={`/r/${t.id}`} className="thread">
                  <span className="thread-status chip chip--accent">{t.data.status}</span>
                  <span className="thread-title">{t.title}</span>
                  <span className="muted small">{t.data.lastStudied ? `last studied ${t.data.lastStudied}` : 'no study logged'}</span>
                </Link>
              ))}
              {learning.map(({ p, done, next }) => (
                <Link key={p.id} to={`/r/${p.id}`} className="thread">
                  <span className="thread-progress" aria-label={`${done} of ${p.data.steps.length} steps shown`}>
                    <span style={{ width: `${(done / p.data.steps.length) * 100}%` }} />
                  </span>
                  <span className="thread-title">{p.title}</span>
                  <span className="muted small truncate">{next ? `next: ${next.title}` : 'all steps done'}</span>
                </Link>
              ))}
            </div>
            {!focus.length && (
              <p className="muted small">
                No topic is marked studying, practicing or building. {backlog.curious} topics are curious or exploring, which is fine.
              </p>
            )}
          </section>
        </div>

        <aside className="home-rail">
          <section className="panel">
            <div className="kicker">Worth noticing</div>
            {signals.length ? (
              <ul className="signals">
                {signals.slice(0, 6).map((s) => (
                  <li key={s.id} className={`signal signal--${s.tone}`}>
                    <Link to={s.href}>{s.text}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Nothing drifting. Patterns appear here from your records, not from guesses.</p>
            )}
          </section>

          <section className="panel">
            <div className="row-flex">
              <span className="kicker">This week</span>
              <span className="spacer" />
              <Link to="/review" className="more-link">
                Review <Icon name="arrow" size={13} />
              </Link>
            </div>
            <div className="week">
              <div>
                <b>{week.done}</b>
                <span>tasks done</span>
              </div>
              <div>
                <b>{week.created}</b>
                <span>records added</span>
              </div>
              <div>
                <b>{week.captures}</b>
                <span>captures</span>
              </div>
            </div>
            <p className="muted small">
              {week.lastReview ? `Last review ${formatTimestamp(week.lastReview.createdAt)}.` : 'No review yet. One short weekly review keeps plans honest.'}
            </p>
          </section>

          <section className="panel panel--map">
            <div className="row-flex">
              <span className="kicker">Map of interests</span>
              <span className="spacer" />
              <Link to="/graph" className="more-link">
                Graph <Icon name="arrow" size={13} />
              </Link>
            </div>
            <MiniMap />
          </section>

          <section className="panel">
            <div className="kicker">Recently updated</div>
            <ul className="plain-list">
              {recent.map((r) => (
                <li key={r.id}>
                  <RecordLink rec={r} />
                  <span className="muted small nowrap">{formatTimestamp(r.updatedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function ProjectNext({ p }: { p: RecordOf<'project'> }) {
  const update = useStore((s) => s.update)
  return (
    <div className="next-row next-row--project">
      <span className="kicker" title={KIND_DEFS.project.label}>
        <Icon name="project" size={13} />
      </span>
      <div className="next-main">
        <AutoInput
          key={p.id}
          className="input input--bare next-input"
          value={p.data.nextAction}
          placeholder="No next action: what is the very next physical step?"
          onSave={(v) => update<'project'>(p.id, { data: { nextAction: v } })}
          aria-label={`Next action for ${p.title}`}
        />
        <Link to={`/r/${p.id}`} className="muted small">
          {displayTitle(p)}
        </Link>
      </div>
    </div>
  )
}
