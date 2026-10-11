import { Link } from 'react-router-dom'
import { COMMITTED_INTEREST, type RecordOf } from '../domain/types'
import { useKind } from '../store/hooks'
import { useCreate } from '../shell/useCreate'
import { CONFIDENCE_LABELS } from '../ui/Fields'
import { Icon } from '../ui/Icon'
import { Empty, PageHead, SectionHead } from '../ui/Page'
import { RecordLink } from '../ui/RecordLink'

const ageDays = (d: string | null) => (d ? (Date.now() - new Date(d.padEnd(10, '-01').slice(0, 10)).getTime()) / 86400000 : Infinity)

export function Learning() {
  const paths = useKind('path')
  const topics = useKind('topic')
  const skills = useKind('skill')
  const resources = useKind('resource')
  const projects = useKind('project')
  const tasks = useKind('task')
  const goals = useKind('goal')
  const questions = useKind('question')
  const create = useCreate()

  const steps = paths.flatMap((p) => p.data.steps)
  // Principle 5: wanted → planned → started → completed → can demonstrate → can explain. Counted, never estimated.
  const ladder = [
    { label: 'Want', n: resources.filter((r) => r.data.status === 'want').length + goals.filter((g) => g.data.status === 'aspiration').length, note: 'resources to read, aspirations' },
    { label: 'Planned', n: tasks.filter((t) => !t.data.done).length + steps.filter((s) => !s.done).length, note: 'open tasks and path steps' },
    { label: 'Started', n: projects.filter((p) => p.data.status === 'active').length + resources.filter((r) => r.data.status === 'reading').length, note: 'active projects, reading now' },
    { label: 'Completed', n: projects.filter((p) => p.data.status === 'completed').length + resources.filter((r) => r.data.status === 'finished').length + tasks.filter((t) => t.data.done).length, note: 'projects, books, tasks' },
    { label: 'Can demonstrate', n: skills.reduce((a, s) => a + s.data.evidence.length, 0) + steps.filter((s) => s.done && s.evidence?.trim()).length, note: 'pieces of evidence' },
    { label: 'Can explain', n: topics.filter((t) => (t.data.confidence ?? 0) >= 3).length, note: 'topics at “can explain” or above' },
  ]

  const focus = topics.filter((t) => COMMITTED_INTEREST.includes(t.data.status))
  const queue = topics
    .filter((t) => COMMITTED_INTEREST.includes(t.data.status) || t.data.status === 'exploring' || t.data.status === 'maintaining')
    .filter((t) => ageDays(t.data.lastStudied) > 14)
    .sort((a, b) => ageDays(b.data.lastStudied) - ageDays(a.data.lastStudied))
  const gaps = [
    ...focus.filter((t) => (t.data.confidence ?? 0) <= 1),
    ...questions.filter((q) => q.data.status === 'open'),
  ]
  const reading = resources.filter((r) => r.data.status === 'reading')

  return (
    <div className="page learning">
      <PageHead
        mode="Studio · Learning"
        title="Learning Studio"
        lede="Measured by what you can show and explain, not by hours spent or material consumed."
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => create('skill', {})}>
              <Icon name="skill" size={15} /> Skill
            </button>
            <button className="btn btn--primary" onClick={() => create('path', {})}>
              <Icon name="plus" size={15} /> Learning path
            </button>
          </>
        }
      />

      <section className="ladder" aria-label="Output ladder">
        {ladder.map((r, i) => (
          <div key={r.label} className={`rung ${i >= 4 ? 'rung--proof' : ''}`}>
            <b>{r.n}</b>
            <span className="rung-label">{r.label}</span>
            <span className="rung-note">{r.note}</span>
          </div>
        ))}
      </section>

      <section className="section">
        <SectionHead title="Learning paths" count={paths.length} />
        <div className="paths">
          {paths.map((p) => (
            <PathCard key={p.id} p={p} />
          ))}
          {!paths.length && <Empty icon="path" title="No learning paths" />}
        </div>
      </section>

      <div className="cols cols-3 section">
        <section>
          <SectionHead title="Review queue" count={queue.length} />
          <p className="muted small">Live topics not studied in two weeks, or never logged.</p>
          <ul className="plain-list">
            {queue.slice(0, 12).map((t) => (
              <li key={t.id}>
                <RecordLink rec={t} />
                <span className="kicker">{t.data.lastStudied ?? 'never'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <SectionHead title="Knowledge gaps" count={gaps.length} />
          <p className="muted small">Focus topics with little understanding, and open questions.</p>
          <ul className="plain-list">
            {gaps.slice(0, 12).map((r) => (
              <li key={r.id}>
                <RecordLink rec={r} />
              </li>
            ))}
          </ul>
        </section>
        <section>
          <SectionHead title="Demonstrated skills" count={skills.length} />
          <ul className="plain-list skills">
            {skills.map((s) => (
              <li key={s.id}>
                <RecordLink rec={s} />
                <span className="kicker" title={s.data.evidence.join('\n')}>
                  {s.data.level} · {s.data.evidence.length} evidence
                </span>
              </li>
            ))}
          </ul>
          {reading.length > 0 && (
            <>
              <div className="kicker" style={{ marginTop: 20 }}>
                Reading now
              </div>
              <ul className="plain-list">
                {reading.map((r) => (
                  <li key={r.id}>
                    <RecordLink rec={r} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {focus.length > 0 && (
        <section className="section">
          <SectionHead title="Focus topics" count={focus.length} />
          <div className="cards">
            {focus.map((t) => (
              <Link key={t.id} to={`/r/${t.id}`} className="card">
                <span className="chip chip--accent">{t.data.status}</span>
                <div className="card-title">{t.title}</div>
                <p className="card-text">{t.data.nextAction || 'No next action yet.'}</p>
                <div className="card-foot">
                  <span className="kicker">{t.data.confidence === null ? 'not assessed' : CONFIDENCE_LABELS[t.data.confidence]}</span>
                  <span className="kicker">{t.data.lastStudied ? `studied ${t.data.lastStudied}` : 'no study logged'}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PathCard({ p }: { p: RecordOf<'path'> }) {
  const s = p.data.steps
  const done = s.filter((x) => x.done).length
  const next = s.find((x) => !x.done)
  return (
    <Link to={`/r/${p.id}`} className="path-card">
      <div className="path-top">
        <span className="kicker">{p.data.area || 'Path'}</span>
        <span className="kicker">
          {done}/{s.length}
        </span>
      </div>
      <div className="path-title serif">{p.title}</div>
      <ol className="path-steps" aria-label={`${done} of ${s.length} steps done`}>
        {s.map((x) => (
          <li key={x.id} className={x.done ? 'is-done' : x === next ? 'is-next' : ''} title={x.title} />
        ))}
      </ol>
      <div className="path-next">{next ? next.title : 'Every step shown. Time for a project.'}</div>
    </Link>
  )
}
