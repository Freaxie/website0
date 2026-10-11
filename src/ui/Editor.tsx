import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS } from '../domain/kinds'
import { useVisible } from '../store/hooks'
import { Icon } from './Icon'
import { useDraft } from './useDraft'

interface Menu {
  query: string
  start: number
  index: number
  top: number
  left: number
}

/** Pixel position of a caret inside a textarea, via an off-screen mirror. */
function caretPos(ta: HTMLTextAreaElement, at: number) {
  const div = document.createElement('div')
  const cs = getComputedStyle(ta)
  for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap', 'tabSize'] as const)
    div.style[p] = cs[p]
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.width = `${ta.clientWidth}px`
  div.textContent = ta.value.slice(0, at)
  const span = document.createElement('span')
  span.textContent = '​'
  div.appendChild(span)
  document.body.appendChild(div)
  const top = span.offsetTop - ta.scrollTop + parseFloat(cs.lineHeight || '20')
  const left = Math.min(span.offsetLeft, ta.clientWidth - 260)
  div.remove()
  return { top, left: Math.max(0, left) }
}

/**
 * Markdown textarea with autosave and [[wikilink]] completion.
 * Esc or Ctrl/⌘+Enter leaves the editor (onDone); Esc first closes the completion menu.
 */
export function MarkdownEditor({
  value,
  onSave,
  onDone,
  placeholder = 'Write in Markdown. Type [[ to link a record.',
  autoFocus,
  label = 'Body',
  minHeight = 220,
}: {
  value: string
  onSave: (v: string) => void
  onDone?: () => void
  placeholder?: string
  autoFocus?: boolean
  label?: string
  minHeight?: number
}) {
  const [draft, setDraft, flush] = useDraft(value, onSave)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [menu, setMenu] = useState<Menu | null>(null)
  const records = useVisible()

  const options = useMemo(() => {
    if (!menu) return []
    const q = menu.query.toLowerCase().trim()
    return Object.values(records)
      .filter((r) => r.title && !r.archived && r.title.toLowerCase().includes(q))
      .sort((a, b) => Number(!a.title.toLowerCase().startsWith(q)) - Number(!b.title.toLowerCase().startsWith(q)) || a.title.length - b.title.length)
      .slice(0, 8)
  }, [menu, records])

  useLayoutEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(minHeight, ta.scrollHeight + 2)}px`
  }, [draft, minHeight])

  const detect = (ta: HTMLTextAreaElement) => {
    const caret = ta.selectionStart
    if (caret !== ta.selectionEnd) return setMenu(null)
    const m = /\[\[([^[\]\n|]{0,60})$/.exec(ta.value.slice(0, caret))
    if (!m) return setMenu(null)
    const pos = caretPos(ta, caret)
    setMenu((cur) => ({ query: m[1], start: caret - m[1].length, index: cur?.query === m[1] ? cur.index : 0, ...pos }))
  }

  const choose = (title: string) => {
    const ta = ref.current
    if (!ta || !menu) return
    const caret = ta.selectionStart
    let after = draft.slice(caret)
    if (after.startsWith(']]')) after = after.slice(2)
    const next = `${draft.slice(0, menu.start)}${title}]]${after}`
    setDraft(next)
    setMenu(null)
    const pos = menu.start + title.length + 2
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu) {
      const n = options.length + (menu.query.trim() ? 1 : 0)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (n) setMenu({ ...menu, index: (menu.index + (e.key === 'ArrowDown' ? 1 : n - 1)) % n })
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        const opt = options[menu.index]
        if (opt || menu.query.trim()) {
          e.preventDefault()
          choose(opt ? opt.title : menu.query.trim())
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setMenu(null)
        return
      }
    }
    if ((e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) && onDone) {
      e.preventDefault()
      e.stopPropagation()
      flush()
      onDone()
    }
  }

  return (
    <div className="editor">
      <textarea
        ref={ref}
        className="editor-input"
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck
        onChange={(e) => {
          setDraft(e.target.value)
          detect(e.target)
        }}
        onKeyDown={onKeyDown}
        onClick={(e) => detect(e.currentTarget)}
        onBlur={() => {
          flush()
          setTimeout(() => setMenu(null), 150)
        }}
      />
      {menu && (
        <ul className="ac-menu" role="listbox" aria-label="Link to record" style={{ top: menu.top, left: menu.left }}>
          {options.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === menu.index}
              className={i === menu.index ? 'is-active' : ''}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(r.title)
              }}
            >
              <Icon name={KIND_DEFS[r.kind].icon} size={13} />
              <span className="truncate">{displayTitle(r)}</span>
            </li>
          ))}
          {menu.query.trim() && (
            <li
              role="option"
              aria-selected={menu.index === options.length}
              className={`ac-new ${menu.index === options.length ? 'is-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(menu.query.trim())
              }}
            >
              <Icon name="plus" size={13} />
              <span className="truncate">Link to new “{menu.query.trim()}”</span>
            </li>
          )}
          {!options.length && !menu.query.trim() && <li className="ac-hint">Type a title…</li>}
        </ul>
      )}
    </div>
  )
}

/**
 * Plain text that autosaves. Always an auto-growing textarea so long text wraps instead of hiding;
 * in single-line mode Enter commits (blurs) and pasted line breaks become spaces.
 */
export function AutoInput({
  value,
  onSave,
  multiline,
  className = 'input',
  ...rest
}: {
  value: string
  onSave: (v: string) => void
  multiline?: boolean
  className?: string
  placeholder?: string
  'aria-label'?: string
  id?: string
}) {
  const [draft, setDraft, flush] = useDraft(value, onSave)
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight + 2}px`
  }, [draft])
  return (
    <textarea
      ref={ref}
      rows={multiline ? 2 : 1}
      className={`${className} ${multiline ? 'input--area' : 'input--line'}`}
      value={draft}
      onChange={(e) => setDraft(multiline ? e.target.value : e.target.value.replace(/\s*\n\s*/g, ' '))}
      onBlur={flush}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      {...rest}
    />
  )
}
