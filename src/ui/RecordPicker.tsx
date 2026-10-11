import { useMemo, useState, type KeyboardEvent } from 'react'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS } from '../domain/kinds'
import { search } from '../domain/search'
import type { AnyRecord } from '../domain/types'
import { useVisible } from '../store/hooks'
import { Icon } from './Icon'

/** Type-ahead search over records; Enter or click picks one. */
export function RecordPicker({
  onPick,
  exclude = [],
  placeholder = 'Search records…',
  autoFocus,
  filter,
  label = 'Find a record',
}: {
  onPick: (r: AnyRecord) => void
  exclude?: string[]
  placeholder?: string
  autoFocus?: boolean
  filter?: (r: AnyRecord) => boolean
  label?: string
}) {
  const records = useVisible()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const results = useMemo(() => {
    const ok = (r: AnyRecord | undefined): r is AnyRecord => !!r && !exclude.includes(r.id) && (!filter || filter(r))
    if (!q.trim())
      return Object.values(records)
        .filter((r) => ok(r) && !r.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 7)
    return search(records, q, 30).map((h) => records[h.id]).filter(ok).slice(0, 7)
  }, [records, q, exclude, filter])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((x) => Math.min(x + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((x) => Math.max(x - 1, 0))
    } else if (e.key === 'Enter' && results[i]) {
      e.preventDefault()
      onPick(results[i])
      setQ('')
    }
  }
  return (
    <div className="picker">
      <div className="picker-input">
        <Icon name="search" size={14} />
        <input
          className="input input--bare"
          value={q}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-expanded
          aria-controls="picker-list"
          onChange={(e) => {
            setQ(e.target.value)
            setI(0)
          }}
          onKeyDown={onKey}
        />
      </div>
      <ul className="picker-list" role="listbox" id="picker-list">
        {results.map((r, j) => (
          <li key={r.id} role="option" aria-selected={j === i}>
            <button type="button" className={`picker-item ${j === i ? 'is-active' : ''}`} onMouseEnter={() => setI(j)} onClick={() => onPick(r)}>
              <Icon name={KIND_DEFS[r.kind].icon} size={14} />
              <span className="truncate">{displayTitle(r)}</span>
              <span className="kicker">{KIND_DEFS[r.kind].label}</span>
            </button>
          </li>
        ))}
        {!results.length && <li className="picker-empty muted small">No matching records.</li>}
      </ul>
    </div>
  )
}
