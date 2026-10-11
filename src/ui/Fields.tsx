import { useId, useRef, useState, type ReactNode } from 'react'
import { isPartialDate, today } from '../domain/dates'
import { newId } from '../domain/ids'
import { humanize, type FieldDef } from '../domain/kinds'
import { ARCHETYPE_VERDICTS, FACETS, type AnyRecord, type ArchetypePart, type Check, type Metric, type SetEntry } from '../domain/types'
import { useKind } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { AutoInput } from './Editor'
import { Icon } from './Icon'

export const CONFIDENCE_LABELS = ['None', 'Vague', 'Can follow', 'Can explain', 'Can teach']

type DataRec = Record<string, unknown>
const dataOf = (rec: AnyRecord) => rec.data as unknown as DataRec

export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

/** Renders and saves one kind-specific field. */
export function FieldEditor({ rec, field }: { rec: AnyRecord; field: FieldDef }) {
  const id = useId()
  const update = useStore((s) => s.update)
  const value = dataOf(rec)[field.key]
  const save = (v: unknown) => update(rec.id, { data: { [field.key]: v } })

  const control = (() => {
    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <div className="input-row">
            <AutoInput id={id} key={rec.id} value={(value as string) ?? ''} onSave={save} placeholder={field.placeholder} />
            {field.type === 'url' && typeof value === 'string' && value && (
              <a className="icon-btn" href={value} target={value.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" aria-label="Open link">
                <Icon name="external" />
              </a>
            )}
          </div>
        )
      case 'textarea':
        return <AutoInput id={id} key={rec.id} multiline value={(value as string) ?? ''} onSave={save} placeholder={field.placeholder} />
      case 'select':
        return (
          <select id={id} className="input" value={(value as string) ?? ''} onChange={(e) => save(e.target.value === '' && field.nullable ? null : e.target.value)}>
            {field.nullable && <option value="">—</option>}
            {field.options.map((o) => (
              <option key={o} value={o}>
                {field.labels?.[o] ?? humanize(o)}
              </option>
            ))}
          </select>
        )
      case 'number':
        return (
          <input
            id={id}
            className="input"
            type="number"
            inputMode="decimal"
            defaultValue={(value as number | null) ?? ''}
            key={`${rec.id}:${String(value)}`}
            onBlur={(e) => save(e.target.value === '' ? null : Number(e.target.value))}
          />
        )
      case 'bool':
        return (
          <label className="switch">
            <input id={id} type="checkbox" checked={!!value} onChange={(e) => save(e.target.checked)} />
            <span>{value ? 'Yes' : 'No'}</span>
          </label>
        )
      case 'date':
        return <DateInput id={id} value={(value as string | null) ?? null} onSave={save} />
      case 'confidence':
        return <Confidence value={value as number | null} onChange={save} />
      case 'list':
        return <ListEditor key={rec.id} items={(value as string[]) ?? []} onChange={save} placeholder={field.placeholder} />
      case 'checks':
        return <ChecksEditor key={rec.id} items={(value as Check[]) ?? []} onChange={save} evidence={field.evidence} placeholder={field.placeholder} />
      case 'project':
        return <ProjectSelect id={id} value={(value as string | null) ?? null} onChange={save} />
      case 'parts':
        return <PartsEditor key={rec.id} items={(value as ArchetypePart[]) ?? []} onChange={save} />
      case 'sets':
        return <SetsEditor key={rec.id} items={(value as SetEntry[]) ?? []} onChange={save} />
      case 'metrics':
        return <MetricsEditor key={rec.id} items={(value as Metric[]) ?? []} onChange={save} />
    }
  })()
  return (
    <Field label={field.label} hint={field.hint} htmlFor={id}>
      {control}
    </Field>
  )
}

export function DateInput({ id, value, onSave }: { id?: string; value: string | null; onSave: (v: string | null) => void }) {
  const [draft, setDraft] = useState(value ?? '')
  const [bad, setBad] = useState(false)
  const last = useRef(value)
  if (last.current !== value) {
    last.current = value
    setDraft(value ?? '')
  }
  const commit = (v: string) => {
    const t = v.trim()
    if (!t) {
      setBad(false)
      if (value !== null) onSave(null)
    } else if (isPartialDate(t)) {
      setBad(false)
      if (t !== value) onSave(t)
    } else setBad(true)
  }
  return (
    <div className="input-row">
      <input
        id={id}
        className={`input mono ${bad ? 'is-invalid' : ''}`}
        value={draft}
        placeholder="YYYY, YYYY-MM or YYYY-MM-DD"
        aria-invalid={bad}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          setDraft(today())
          commit(today())
        }}
      >
        Today
      </button>
    </div>
  )
}

export function Confidence({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Understanding">
      {CONFIDENCE_LABELS.map((l, i) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={value === i}
          className={`seg-btn ${value !== null && i <= value ? 'is-filled' : ''}`}
          title={l}
          onClick={() => onChange(value === i ? null : i)}
        >
          <span className="seg-bar" />
          <span className="seg-label">{i}</span>
        </button>
      ))}
      <span className="seg-caption">{value === null ? 'Not assessed' : CONFIDENCE_LABELS[value]}</span>
    </div>
  )
}

function ProjectSelect({ id, value, onChange }: { id: string; value: string | null; onChange: (v: string | null) => void }) {
  const projects = useKind('project')
  return (
    <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">No project</option>
      {projects
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
    </select>
  )
}

function AddRow({ placeholder, onAdd }: { placeholder?: string; onAdd: (text: string) => void }) {
  const [v, setV] = useState('')
  return (
    <form
      className="add-row"
      onSubmit={(e) => {
        e.preventDefault()
        if (v.trim()) onAdd(v.trim())
        setV('')
      }}
    >
      <Icon name="plus" size={14} />
      <input className="input input--bare" value={v} placeholder={placeholder ?? 'Add…'} aria-label={placeholder ?? 'Add item'} onChange={(e) => setV(e.target.value)} />
    </form>
  )
}

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="icon-btn icon-btn--sm" onClick={onClick} aria-label={label} title={label}>
      <Icon name="close" size={13} />
    </button>
  )
}

export function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  // Positional keys are safe: rows only change through this component, and removal re-keys the tail.
  const [keys, setKeys] = useState(() => items.map(() => newId('k')))
  if (keys.length !== items.length) setKeys(items.map((_, i) => keys[i] ?? newId('k')))
  return (
    <div className="list-ed">
      {items.map((it, i) => (
        <div className="list-ed-row" key={keys[i] ?? i}>
          <span className="list-ed-dot" aria-hidden />
          <AutoInput className="input input--bare" value={it} onSave={(v) => onChange(v.trim() ? items.map((x, j) => (j === i ? v : x)) : items.filter((_, j) => j !== i))} aria-label={`Item ${i + 1}`} />
          <RemoveBtn label="Remove" onClick={() => {
            setKeys(keys.filter((_, j) => j !== i))
            onChange(items.filter((_, j) => j !== i))
          }} />
        </div>
      ))}
      <AddRow placeholder={placeholder} onAdd={(t) => onChange([...items, t])} />
    </div>
  )
}

export function ChecksEditor({
  items,
  onChange,
  evidence,
  placeholder,
}: {
  items: Check[]
  onChange: (v: Check[]) => void
  evidence?: boolean
  placeholder?: string
}) {
  const toast = useUi((s) => s.toast)
  const set = (id: string, patch: Partial<Check>) => onChange(items.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const done = items.filter((c) => c.done).length
  return (
    <div className="checks">
      {items.length > 0 && (
        <div className="checks-progress" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} aria-label={`${done} of ${items.length} done`}>
          <span style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}
      {items.map((c) => (
        <div key={c.id} className={`check-row ${c.done ? 'is-done' : ''}`}>
          <input
            type="checkbox"
            className="checkbox"
            checked={c.done}
            aria-label={`Done: ${c.title}`}
            onChange={(e) => {
              if (e.target.checked && evidence && !c.evidence?.trim()) {
                toast('Add evidence first: what can you show for this step?', 'warn')
                document.getElementById(`ev-${c.id}`)?.focus()
                return
              }
              set(c.id, { done: e.target.checked, date: e.target.checked ? today() : null })
            }}
          />
          <div className="check-main">
            <AutoInput className="input input--bare" value={c.title} onSave={(v) => set(c.id, { title: v })} aria-label="Step" />
            {evidence && (
              <AutoInput
                id={`ev-${c.id}`}
                className="input input--bare check-evidence"
                value={c.evidence ?? ''}
                placeholder="Evidence: a link, a build, an explanation"
                onSave={(v) => set(c.id, { evidence: v })}
                aria-label="Evidence"
              />
            )}
          </div>
          <RemoveBtn label="Remove step" onClick={() => onChange(items.filter((x) => x.id !== c.id))} />
        </div>
      ))}
      <AddRow placeholder={placeholder ?? 'Add a step'} onAdd={(t) => onChange([...items, { id: newId('c'), title: t, done: false, evidence: '' }])} />
    </div>
  )
}

const VERDICT_HELP: Record<string, string> = {
  undecided: 'Not sorted yet',
  genuine: 'A genuine long-term aspiration',
  fascination: 'A temporary fascination',
  fantasy: 'Mostly fantasy or status-seeking',
  integrable: 'Can be integrated into one life',
}

export function PartsEditor({ items, onChange }: { items: ArchetypePart[]; onChange: (v: ArchetypePart[]) => void }) {
  const set = (id: string, patch: Partial<ArchetypePart>) => onChange(items.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  return (
    <div className="parts">
      {items.map((p) => (
        <div key={p.id} className={`part part--${p.verdict}`}>
          <div className="part-top">
            <select className="input input--bare part-facet" value={p.facet} aria-label="Facet" onChange={(e) => set(p.id, { facet: e.target.value as ArchetypePart['facet'] })}>
              {FACETS.map((f) => (
                <option key={f} value={f}>
                  {humanize(f)}
                </option>
              ))}
            </select>
            <AutoInput className="input input--bare" value={p.text} onSave={(v) => set(p.id, { text: v })} aria-label="Part" />
            <RemoveBtn label="Remove part" onClick={() => onChange(items.filter((x) => x.id !== p.id))} />
          </div>
          <div className="verdicts" role="radiogroup" aria-label={`Verdict for ${p.text}`}>
            {ARCHETYPE_VERDICTS.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={p.verdict === v} title={VERDICT_HELP[v]} className={`verdict ${p.verdict === v ? 'is-on' : ''}`} onClick={() => set(p.id, { verdict: v })}>
                {humanize(v)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <AddRow placeholder="Add an ability, value, aesthetic or behaviour" onAdd={(t) => onChange([...items, { id: newId('c'), text: t, facet: 'ability', verdict: 'undecided' }])} />
    </div>
  )
}

const numOrNull = (s: string) => (s.trim() === '' || Number.isNaN(Number(s)) ? null : Number(s))

function NumCell({ value, onSave, label }: { value: number | null; onSave: (v: number | null) => void; label: string }) {
  return <input className="input input--bare num" type="number" inputMode="decimal" aria-label={label} defaultValue={value ?? ''} onBlur={(e) => numOrNull(e.target.value) !== value && onSave(numOrNull(e.target.value))} />
}

export function SetsEditor({ items, onChange }: { items: SetEntry[]; onChange: (v: SetEntry[]) => void }) {
  const set = (id: string, patch: Partial<SetEntry>) => onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="table-ed">
      {items.length > 0 && (
        <div className="table-ed-head sets-grid">
          <span>Exercise</span><span>Sets</span><span>Reps</span><span>kg</span><span />
        </div>
      )}
      {items.map((s) => (
        <div key={s.id} className="sets-grid">
          <AutoInput className="input input--bare" value={s.exercise} onSave={(v) => set(s.id, { exercise: v })} aria-label="Exercise" />
          <NumCell value={s.sets} label="Sets" onSave={(v) => set(s.id, { sets: v })} />
          <NumCell value={s.reps} label="Reps" onSave={(v) => set(s.id, { reps: v })} />
          <NumCell value={s.weight} label="Weight (kg)" onSave={(v) => set(s.id, { weight: v })} />
          <RemoveBtn label="Remove exercise" onClick={() => onChange(items.filter((x) => x.id !== s.id))} />
        </div>
      ))}
      <AddRow placeholder="Add exercise" onAdd={(t) => onChange([...items, { id: newId('c'), exercise: t, sets: null, reps: null, weight: null }])} />
    </div>
  )
}

export function MetricsEditor({ items, onChange }: { items: Metric[]; onChange: (v: Metric[]) => void }) {
  const set = (id: string, patch: Partial<Metric>) => onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  return (
    <div className="table-ed">
      {items.map((m) => (
        <div key={m.id} className="metrics-grid">
          <AutoInput className="input input--bare" value={m.name} onSave={(v) => set(m.id, { name: v })} aria-label="Measurement" />
          <NumCell value={m.value} label="Value" onSave={(v) => set(m.id, { value: v })} />
          <AutoInput className="input input--bare" value={m.unit} onSave={(v) => set(m.id, { unit: v })} aria-label="Unit" placeholder="unit" />
          <RemoveBtn label="Remove measurement" onClick={() => onChange(items.filter((x) => x.id !== m.id))} />
        </div>
      ))}
      <AddRow placeholder="Add measurement (e.g. Weight)" onAdd={(t) => onChange([...items, { id: newId('c'), name: t, value: null, unit: '' }])} />
    </div>
  )
}
