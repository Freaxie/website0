import { useState } from 'react'
import { LINK_LABELS, humanize } from '../domain/kinds'
import type { Edge } from '../domain/graph'
import { LINK_TYPES, type AnyRecord, type LinkType } from '../domain/types'
import { useGraphIndex, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { RecordLink } from './RecordLink'
import { RecordPicker } from './RecordPicker'

interface Group {
  key: string
  label: string
  items: { edge: Edge; other: AnyRecord }[]
}

/** Every relationship a record has, grouped by meaning, in both directions. */
export function useConnections(id: string): Group[] {
  const index = useGraphIndex()
  const records = useVisible()
  const groups = new Map<string, Group>()
  const push = (key: string, label: string, edge: Edge, otherId: string) => {
    const other = records[otherId]
    if (!other) return
    if (!groups.has(key)) groups.set(key, { key, label, items: [] })
    groups.get(key)!.items.push({ edge, other })
  }
  for (const e of index.out.get(id) ?? []) {
    if (e.type === 'mentions') push('mentions-out', 'Mentions', e, e.target)
    else if (e.derived === 'task') push('task-of', 'Task of', e, e.target)
    else push(`out:${e.type}`, LINK_LABELS[e.type].out, e, e.target)
  }
  for (const e of index.in.get(id) ?? []) {
    if (e.type === 'mentions') push('mentions-in', 'Mentioned in', e, e.source)
    else if (e.derived === 'task') push('tasks', 'Tasks', e, e.source)
    else push(e.type === 'related' ? `out:related` : `in:${e.type}`, LINK_LABELS[e.type].in, e, e.source)
  }
  const order = (k: string) => (k.startsWith('mentions') ? 2 : k === 'tasks' || k === 'task-of' ? 1 : 0)
  return [...groups.values()].sort((a, b) => order(a.key) - order(b.key))
}

export function Connections({ rec }: { rec: AnyRecord }) {
  const groups = useConnections(rec.id).filter((g) => g.key !== 'tasks')
  const [adding, setAdding] = useState(false)
  const unlink = useStore((s) => s.unlink)
  const links = useStore((s) => s.links)
  const updateLink = useStore((s) => s.updateLink)
  return (
    <section className="section connections" aria-labelledby="conn-h">
      <div className="section-head">
        <h2 id="conn-h">Connections</h2>
        <button className="btn btn--ghost btn--sm" onClick={() => setAdding(true)}>
          <Icon name="link" size={14} /> Add connection
        </button>
      </div>
      {!groups.length && (
        <p className="empty-line muted">
          Not connected to anything yet. Add a typed connection, or type <code>[[</code> in the text to link by title.
        </p>
      )}
      <div className="conn-groups">
        {groups.map((g) => (
          <div key={g.key} className="conn-group">
            <div className="kicker">{g.label}</div>
            <ul>
              {g.items.map(({ edge, other }) => {
                const stored = edge.linkId ? links[edge.linkId] : undefined
                return (
                  <li key={edge.id} className="conn-item">
                    <RecordLink rec={other} />
                    {stored?.note && <span className="conn-note muted small">{stored.note}</span>}
                    {stored && (
                      <span className="conn-actions">
                        <select
                          className="input input--bare input--tiny"
                          aria-label="Relationship type"
                          value={stored.type}
                          onChange={(e) => updateLink(stored.id, { type: e.target.value as LinkType })}
                        >
                          {LINK_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {humanize(t)}
                            </option>
                          ))}
                        </select>
                        <button className="icon-btn icon-btn--sm" aria-label={`Remove connection to ${other.title}`} title="Remove connection" onClick={() => unlink(stored.id)}>
                          <Icon name="close" size={13} />
                        </button>
                      </span>
                    )}
                    {edge.derived === 'mention' && <span className="kicker conn-derived">text link</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      <AddConnection rec={rec} open={adding} onClose={() => setAdding(false)} />
    </section>
  )
}

export function AddConnection({ rec, open, onClose }: { rec: AnyRecord; open: boolean; onClose: () => void }) {
  const [type, setType] = useState<LinkType>('related')
  const [note, setNote] = useState('')
  const link = useStore((s) => s.link)
  const toast = useUi((s) => s.toast)
  return (
    <Modal open={open} onClose={onClose} label="Add connection" position="top" className="dialog--picker">
      <div className="dialog-head">
        <span className="kicker">Connect “{rec.title || 'Untitled'}”</span>
      </div>
      <div className="conn-form">
        <select className="input" aria-label="Relationship" value={type} onChange={(e) => setType(e.target.value as LinkType)}>
          {LINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {LINK_LABELS[t].out}…
            </option>
          ))}
        </select>
        <input className="input" placeholder="Note (optional)" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <RecordPicker
        autoFocus
        exclude={[rec.id]}
        onPick={(target) => {
          link(rec.id, target.id, type, note)
          toast(`Connected: ${LINK_LABELS[type].out.toLowerCase()} “${target.title}”`)
          setNote('')
          onClose()
        }}
      />
    </Modal>
  )
}
