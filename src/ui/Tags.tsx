import { useState } from 'react'
import { Icon } from './Icon'

export function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [v, setV] = useState('')
  const add = (raw: string) => {
    const next = raw
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t && !tags.includes(t))
    if (next.length) onChange([...tags, ...next])
    setV('')
  }
  return (
    <div className="tags">
      {tags.map((t) => (
        <span key={t} className="tag">
          #{t}
          <button aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
            <Icon name="close" size={11} />
          </button>
        </span>
      ))}
      <input
        className="input input--bare tags-input"
        value={v}
        placeholder="Add tag"
        aria-label="Add tag"
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setV(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(v)
          } else if (e.key === 'Backspace' && !v && tags.length) onChange(tags.slice(0, -1))
        }}
        onBlur={() => v && add(v)}
      />
    </div>
  )
}
