import { Link } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { humanize } from '../domain/kinds'
import type { ProjectStatus, RecordOf } from '../domain/types'
import { useKind } from '../store/hooks'
import { useStore } from '../store/store'
import { useCreate } from '../shell/useCreate'
import { AutoInput } from '../ui/Editor'
import { Icon } from '../ui/Icon'
import { Empty, PageHead, SectionHead } from '../ui/Page'
import { AddTask, TaskRow } from '../ui/TaskRow'

const LANES: { title: string; statuses: ProjectStatus[]; note: string }[] = [
  { title: 'Ideas & evaluating', statuses: ['idea', 'evaluating'], note: 'A backlog is fine. It is not a to-do list.' },
  { title: 'Paused', statuses: ['paused'], note: 'Deliberately on hold.' },
  { title: 'Finished', statuses: ['completed'], note: 'Done and shipped.' },
  { title: 'Archived & abandoned', statuses: ['archived', 'abandoned'], note: 'Ended on purpose.' },
]

export function Projects() {
  const projects = useKind('project', { archived: true })
  const tasks = useKind('task')
  const limit = useStore((s) => s.settings.activeProjectLimit)
  const create = useCreate()
  const active = projects.filter((p) => p.data.status === 'active' && !p.archived)
  const loose = tasks.filter((t) => !t.data.done && !t.data.projectId)

  return (
    <div className="page forge">
      <PageHead
        mode="Studio · Projects"
        title="Project Forge"
        lede="A small active list and an honest backlog. Pausing or abandoning on purpose is a decision, not a failure."
        actions={
          <button className="btn btn--primary" onClick={() => create('project', { data: { status: 'idea' } })}>
            <Icon name="plus" size={15} /> New project
          </button>
        }
      />

      <section className="section">
        <SectionHead title="Active">
          <span className={`limit ${active.length > limit ? 'is-over' : ''}`} title="Soft limit, set in Settings">
            {active.length}/{limit} active
          </span>
        </SectionHead>
        {active.length > limit && <p className="notice notice--warn">Over the limit. Which of these is really a paused project?</p>}
        {active.length === 0 ? (
          <Empty icon="project" title="Nothing active">
            Choose one idea below and set it to active. One finished project beats five started ones.
          </Empty>
        ) : (
          <div className="active-projects">
            {active.map((p) => (
              <ActiveProject key={p.id} p={p} tasks={tasks.filter((t) => t.data.projectId === p.id)} />
            ))}
          </div>
        )}
      </section>

      <div className="lanes section">
        {LANES.map((lane) => {
          const uniq = projects.filter((p) => (p.archived ? lane.statuses.includes('archived') : lane.statuses.includes(p.data.status)))
          return (
            <section key={lane.title} className="lane">
              <div className="lane-head">
                <h2>{lane.title}</h2>
                <span className="count">{uniq.length}</span>
              </div>
              <p className="muted small">{lane.note}</p>
              <ul className="lane-list">
                {uniq.map((p) => (
                  <li key={p.id}>
                    <Link to={`/r/${p.id}`} className="lane-item">
                      <span className="lane-title">{p.title || 'Untitled'}</span>
                      <span className="kicker">
                        {humanize(p.data.status)}
                        {p.currency === 'historical' ? ' · historical' : ''}
                      </span>
                      {p.data.statusReason && <span className="muted small">{p.data.statusReason}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <section className="section">
        <SectionHead title="Loose tasks" count={loose.length} />
        <ul className="tasks">
          {loose.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          <AddTask placeholder="Add a task without a project" />
        </ul>
      </section>
    </div>
  )
}

function ActiveProject({ p, tasks }: { p: RecordOf<'project'>; tasks: RecordOf<'task'>[] }) {
  const update = useStore((s) => s.update)
  const open = tasks.filter((t) => !t.data.done)
  return (
    <article className="aproj">
      <header className="aproj-head">
        <Link to={`/r/${p.id}`} className="aproj-title serif">
          {p.title}
        </Link>
        <span className="muted small">updated {formatTimestamp(p.updatedAt)}</span>
      </header>
      <label className="field-label" htmlFor={`na-${p.id}`}>
        Next action
      </label>
      <AutoInput
        id={`na-${p.id}`}
        key={p.id}
        className="input next-input"
        value={p.data.nextAction}
        placeholder="What is the very next physical step?"
        onSave={(v) => update<'project'>(p.id, { data: { nextAction: v } })}
      />
      <ul className="tasks tasks--compact">
        {open.slice(0, 5).map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
        <AddTask projectId={p.id} />
      </ul>
    </article>
  )
}
