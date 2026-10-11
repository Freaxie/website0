import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS, humanize, type FieldDef } from '../domain/kinds'
import { CERTAINTIES, CURRENCIES, type AnyRecord, type CaptureType, type Kind, type RecordOf } from '../domain/types'
import { useKind, useRecord } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { isTyping } from '../shell/keys'
import { CERTAINTY_HELP, CURRENCY_HELP, EpistemicChips, KindChip, StatusChip } from '../ui/chips'
import { Connections } from '../ui/Connections'
import { AutoInput, MarkdownEditor } from '../ui/Editor'
import { DateInput, Field, FieldEditor } from '../ui/Fields'
import { Icon } from '../ui/Icon'
import { Markdown } from '../ui/Markdown'
import { confirmAction } from '../ui/Modal'
import { RecordLink } from '../ui/RecordLink'
import { TagsEditor } from '../ui/Tags'
import { AddTask, TaskRow } from '../ui/TaskRow'
import { ReviewEditor } from './ReviewEditor'

/** Fields that get the main column for each kind; the rest go in the side rail. */
const MAIN: Partial<Record<Kind, string[]>> = {
  project: ['nextAction', 'milestones'],
  topic: ['nextAction'],
  path: ['steps'],
  archetype: ['represents', 'parts'],
  goal: ['actions'],
  log: ['sets', 'metrics'],
  hypothesis: ['evidenceFor', 'evidenceAgainst'],
  experiment: ['hypothesis', 'method', 'result'],
  question: ['answer'],
}

export function RecordPage() {
  const { id } = useParams()
  const rec = useRecord(id)
  const exists = useStore((s) => (id ? !!s.records[id] : false))
  const visit = useStore((s) => s.visit)
  useEffect(() => {
    if (id && exists) visit(id)
  }, [id, exists, visit])

  if (!rec)
    return (
      <div className="page">
        <div className="empty">
          <Icon name={exists ? 'lock' : 'question'} size={22} />
          <h1 className="serif">{exists ? 'Hidden by the privacy screen' : 'Not found'}</h1>
          <p className="muted">
            {exists ? 'This record is private. Turn the privacy screen off in Settings to see it.' : 'This record does not exist. It may have been deleted.'}
          </p>
          <Link className="btn" to="/">
            Back to the Observatory
          </Link>
        </div>
      </div>
    )
  return <RecordView key={rec.id} rec={rec} />
}

function RecordView({ rec }: { rec: AnyRecord }) {
  const def = KIND_DEFS[rec.kind]
  const update = useStore((s) => s.update)
  const [params, setParams] = useSearchParams()
  const editing = params.get('edit') === '1'
  const setEditing = (on: boolean) => setParams(on ? { edit: '1' } : {}, { replace: true })

  // "e" opens the editor, like most wikis.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target) && !document.querySelector('[role="dialog"]')) {
        e.preventDefault()
        setParams({ edit: '1' }, { replace: true })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setParams])

  const main = MAIN[rec.kind] ?? []
  const fields = def.fields
  const mainFields = fields.filter((f) => main.includes(f.key))
  // The topic hero renders status as a track, so the rail doesn't repeat it.
  const railFields = fields.filter((f) => !main.includes(f.key) && !(rec.kind === 'topic' && f.key === 'status'))

  return (
    <article className="page record">
      <header className="rec-head">
        <div className="row-flex rec-chips">
          <KindChip rec={rec} />
          <StatusChip rec={rec} />
          <EpistemicChips rec={rec} />
          {rec.archived && <span className="chip chip--hist">Archived</span>}
        </div>
        <AutoInput
          className="rec-title"
          value={rec.title}
          onSave={(title) => update(rec.id, { title })}
          placeholder={rec.kind === 'task' ? 'What needs doing?' : 'Untitled'}
          aria-label="Title"
        />
        <RecordActions rec={rec} editing={editing} setEditing={setEditing} />
      </header>

      <div className="cols cols-main-rail">
        <div className="rec-main">
          {rec.kind !== 'project' && <KindHero rec={rec} />}
          {mainFields.length > 0 && (
            <div className={`main-fields ${rec.kind === 'hypothesis' ? 'cols cols-2' : 'stack'}`}>
              {mainFields.map((f) => (
                <FieldEditor key={f.key} rec={rec} field={f} />
              ))}
            </div>
          )}
          {rec.kind === 'project' && <KindHero rec={rec} />}

          <section className="rec-body" aria-label="Text">
            {editing ? (
              <MarkdownEditor value={rec.body} onSave={(body) => update(rec.id, { body })} onDone={() => setEditing(false)} autoFocus={!!rec.title} />
            ) : rec.body.trim() ? (
              <div className="body-view">
                <Markdown text={rec.body} className="md--read" />
              </div>
            ) : (
              <button className="body-empty" onClick={() => setEditing(true)}>
                <Icon name="edit" size={14} /> Write something… <span className="muted">(press e)</span>
              </button>
            )}
            {editing && (
              <div className="editor-foot muted small">
                Markdown · <code>[[</code> links a record · <kbd>Esc</kbd> to finish · saves automatically
              </div>
            )}
          </section>

          {rec.kind === 'review' && <ReviewEditor review={rec} />}
          {rec.kind === 'hypothesis' && <Competing rec={rec} />}
          <Connections rec={rec} />
        </div>

        <aside className="rec-rail" aria-label="Details">
          {railFields.length > 0 && (
            <div className="panel stack">
              {railFields.map((f: FieldDef) => (
                <FieldEditor key={f.key} rec={rec} field={f} />
              ))}
            </div>
          )}
          <InfoStatus rec={rec} />
          <div className="panel stack">
            <Field label="Tags">
              <TagsEditor tags={rec.tags} onChange={(tags) => update(rec.id, { tags })} />
            </Field>
            <dl className="meta">
              <div>
                <dt>Created</dt>
                <dd>{formatTimestamp(rec.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatTimestamp(rec.updatedAt)}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{rec.origin === 'seed' || rec.origin === 'seed-private' ? 'Imported from the handoff' : humanize(rec.origin)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </article>
  )
}

function RecordActions({ rec, editing, setEditing }: { rec: AnyRecord; editing: boolean; setEditing: (b: boolean) => void }) {
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)
  const navigate = useNavigate()
  const toast = useUi((s) => s.toast)
  return (
    <div className="rec-actions">
      <button className={`btn btn--sm ${editing ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setEditing(!editing)}>
        <Icon name={editing ? 'check' : 'edit'} size={14} /> {editing ? 'Done' : 'Edit text'}
      </button>
      <button className={`btn btn--ghost btn--sm ${rec.pinned ? 'is-on' : ''}`} aria-pressed={rec.pinned} onClick={() => update(rec.id, { pinned: !rec.pinned })}>
        <Icon name="pin" size={14} /> {rec.pinned ? 'Pinned' : 'Pin'}
      </button>
      <button
        className={`btn btn--ghost btn--sm ${rec.private ? 'is-on' : ''}`}
        aria-pressed={rec.private}
        title="Private records are left out of public exports by default and hidden by the privacy screen"
        onClick={() => update(rec.id, { private: !rec.private })}
      >
        <Icon name="lock" size={14} /> {rec.private ? 'Private' : 'Make private'}
      </button>
      <button
        className="btn btn--ghost btn--sm"
        onClick={() => {
          update(rec.id, { archived: !rec.archived })
          toast(rec.archived ? 'Restored from archive' : 'Archived. It stays searchable and can be restored.')
        }}
      >
        <Icon name="archive" size={14} /> {rec.archived ? 'Unarchive' : 'Archive'}
      </button>
      <button
        className="btn btn--ghost btn--sm btn--danger-text"
        onClick={async () => {
          const ok = await confirmAction({
            title: `Delete “${displayTitle(rec)}”?`,
            body: 'This removes the record and its connections permanently. Archiving keeps it out of the way without losing it.',
            confirm: 'Delete permanently',
            danger: true,
          })
          if (!ok) return
          remove(rec.id)
          toast('Deleted')
          navigate(-1)
        }}
      >
        <Icon name="trash" size={14} /> Delete
      </button>
    </div>
  )
}

/** Fact vs report vs hypothesis, and whether it still holds. */
function InfoStatus({ rec }: { rec: AnyRecord }) {
  const update = useStore((s) => s.update)
  return (
    <div className="panel stack">
      <div className="kicker">Status of this information</div>
      <Field label="Certainty" hint={rec.certainty ? CERTAINTY_HELP[rec.certainty] : 'No claim, e.g. an ordinary note.'} htmlFor="f-cert">
        <select id="f-cert" className="input" value={rec.certainty ?? ''} onChange={(e) => update(rec.id, { certainty: (e.target.value || null) as AnyRecord['certainty'] })}>
          <option value="">—</option>
          {CERTAINTIES.map((c) => (
            <option key={c} value={c}>
              {humanize(c)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Currency" hint={CURRENCY_HELP[rec.currency]} htmlFor="f-cur">
        <select id="f-cur" className="input" value={rec.currency} onChange={(e) => update(rec.id, { currency: e.target.value as AnyRecord['currency'] })}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {humanize(c)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="As of" hint="When this was observed or true, if known.">
        <DateInput value={rec.asOf} onSave={(asOf) => update(rec.id, { asOf })} />
      </Field>
    </div>
  )
}

function KindHero({ rec }: { rec: AnyRecord }) {
  switch (rec.kind) {
    case 'project':
      return <ProjectHero rec={rec} />
    case 'capture':
      return <CaptureFiling rec={rec} />
    case 'task':
      return <TaskHero rec={rec} />
    case 'topic':
      return <TopicHero rec={rec} />
    default:
      return null
  }
}

function ProjectHero({ rec }: { rec: RecordOf<'project'> }) {
  const tasks = useKind('task').filter((t) => t.data.projectId === rec.id)
  const open = tasks.filter((t) => !t.data.done)
  const done = tasks.filter((t) => t.data.done)
  const limit = useStore((s) => s.settings.activeProjectLimit)
  const active = useKind('project').filter((p) => p.data.status === 'active').length
  return (
    <section className="hero-block">
      {rec.data.status === 'active' && active > limit && (
        <p className="notice notice--warn">
          {active} active projects against a limit of {limit}. Consider pausing one.
        </p>
      )}
      {(rec.data.status === 'abandoned' || rec.data.status === 'paused') && !rec.data.statusReason && (
        <p className="notice">Record why it was {rec.data.status}: a deliberate ending is a decision, not a failure.</p>
      )}
      <div className="section-head">
        <h2>
          Tasks <span className="count">{open.length} open</span>
        </h2>
      </div>
      <ul className="tasks">
        {open.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
        <AddTask projectId={rec.id} />
        {done.slice(0, 8).map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </ul>
    </section>
  )
}

function TaskHero({ rec }: { rec: RecordOf<'task'> }) {
  return (
    <section className="hero-block">
      <ul className="tasks tasks--hero">
        <TaskRow task={rec} showProject />
      </ul>
    </section>
  )
}

function TopicHero({ rec }: { rec: RecordOf<'topic'> }) {
  const update = useStore((s) => s.update)
  const statuses = ['curious', 'exploring', 'studying', 'practicing', 'building', 'maintaining', 'archived'] as const
  return (
    <section className="hero-block">
      <div className="status-track" role="radiogroup" aria-label="Interest status">
        {statuses.map((s) => (
          <button key={s} role="radio" aria-checked={rec.data.status === s} className={`track-step ${rec.data.status === s ? 'is-on' : ''}`} onClick={() => update<'topic'>(rec.id, { data: { status: s } })}>
            {humanize(s)}
          </button>
        ))}
      </div>
    </section>
  )
}

const FILE_AS: Record<CaptureType, { kind: Kind; label: string }> = {
  thought: { kind: 'note', label: 'Note' },
  question: { kind: 'question', label: 'Question' },
  link: { kind: 'resource', label: 'Resource' },
  book: { kind: 'resource', label: 'Book' },
  project: { kind: 'project', label: 'Project idea' },
  task: { kind: 'task', label: 'Task' },
  observation: { kind: 'observation', label: 'Observation' },
}

/** Inbox processing: turn a capture into the record it really is. */
export function CaptureFiling({ rec, compact = false }: { rec: RecordOf<'capture'>; compact?: boolean }) {
  const convert = useStore((s) => s.convert)
  const update = useStore((s) => s.update)
  const toast = useUi((s) => s.toast)
  const options = useMemo(() => {
    const first = FILE_AS[rec.data.captureType]
    const rest = (['note', 'question', 'topic', 'resource', 'project', 'task', 'observation'] as Kind[]).filter((k) => k !== first.kind)
    return [first, ...rest.map((k) => ({ kind: k, label: KIND_DEFS[k].label }))]
  }, [rec.data.captureType])
  const file = (kind: Kind, label: string) => {
    const t = rec.title.trim()
    const isUrl = /^https?:\/\/\S+$/.test(t)
    const data =
      kind === 'resource'
        ? { type: rec.data.captureType === 'book' ? 'book' : 'link', url: isUrl ? t : '' }
        : kind === 'project'
          ? { status: 'idea' }
          : kind === 'task'
            ? { next: true }
            : {}
    convert(rec.id, kind, data as never)
    toast(`Filed as ${label.toLowerCase()}`)
  }
  return (
    <section className={`filing ${compact ? 'filing--compact' : 'panel'}`}>
      {!compact && <div className="kicker">File this capture as</div>}
      <div className="row-flex">
        {options.map((o, i) => (
          <button key={o.kind + o.label} className={`btn btn--sm ${i === 0 ? 'btn--primary' : 'btn--ghost'}`} onClick={() => file(o.kind, o.label)}>
            {o.label}
          </button>
        ))}
        <button className="btn btn--sm btn--ghost" onClick={() => update<'capture'>(rec.id, { archived: true, data: { processed: true } })}>
          Done, archive it
        </button>
      </div>
    </section>
  )
}

function Competing({ rec }: { rec: RecordOf<'hypothesis'> }) {
  const all = useKind('hypothesis')
  const key = rec.data.phenomenon.trim().toLowerCase()
  const rivals = key ? all.filter((h) => h.id !== rec.id && h.data.phenomenon.trim().toLowerCase() === key) : []
  if (!rivals.length) return null
  return (
    <section className="section">
      <div className="section-head">
        <h2>Competing explanations</h2>
      </div>
      <ul className="rivals">
        {rivals.map((h) => (
          <li key={h.id}>
            <RecordLink rec={h} />
            <span className="muted small">
              {h.data.evidenceFor.length} for · {h.data.evidenceAgainst.length} against · {h.data.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
