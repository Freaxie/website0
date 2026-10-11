import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { humanize } from '../domain/kinds'
import { CAPTURE_TYPES, type CaptureType } from '../domain/types'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { Modal } from '../ui/Modal'

/** Guess a capture's type from its text. Only a hint: the chips override it. */
export function guessType(text: string): CaptureType {
  const t = text.trim()
  if (/^https?:\/\/\S+$/i.test(t)) return 'link'
  if (/\?\s*$/.test(t.split('\n')[0])) return 'question'
  if (/^(todo|task)[:\s]/i.test(t)) return 'task'
  return 'thought'
}

/** Save a thought in seconds, without deciding where it belongs. It lands in the inbox. */
export function QuickCapture() {
  const open = useUi((s) => s.capture)
  const set = useUi((s) => s.set)
  const toast = useUi((s) => s.toast)
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [type, setType] = useState<CaptureType | null>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setType(null)
    }
  }, [open])

  const effective = type ?? guessType(text)
  const save = (thenOpen = false) => {
    const t = text.trim()
    if (!t) return
    const [first, ...rest] = t.split('\n')
    const rec = useStore.getState().create('capture', {
      title: first.slice(0, 140),
      body: (first.length > 140 ? first.slice(140) + '\n' : '') + rest.join('\n').trim(),
      origin: 'capture',
      // observations about myself start private
      private: effective === 'observation',
      data: { captureType: effective, processed: false },
    })
    set({ capture: false })
    if (thenOpen) navigate(`/r/${rec.id}`)
    else toast('Captured to inbox', 'info', { label: 'Open', run: () => navigate(`/r/${rec.id}`) })
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save(e.metaKey || e.ctrlKey)
    }
  }
  return (
    <Modal open={open} onClose={() => set({ capture: false })} label="Quick capture" position="top" className="dialog--capture">
      <div className="capture">
        <div className="dialog-head">
          <span className="kicker">Capture · lands in the inbox</span>
        </div>
        <textarea
          className="capture-input"
          autoFocus
          rows={3}
          value={text}
          aria-label="Capture text"
          placeholder="A thought, a question, a link, a book, a project idea, a task, an observation…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="capture-types" role="radiogroup" aria-label="Capture type (optional)">
          {CAPTURE_TYPES.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={effective === t} className={`chip-btn ${effective === t ? 'is-on' : ''} ${type === null && effective === t ? 'is-guess' : ''}`} onClick={() => setType(type === t ? null : t)}>
              {humanize(t)}
            </button>
          ))}
        </div>
        <div className="capture-foot">
          <span className="muted small">
            <kbd>↵</kbd> save · <kbd>Shift ↵</kbd> new line · <kbd>Ctrl ↵</kbd> save & open
          </span>
          <button className="btn btn--primary" disabled={!text.trim()} onClick={() => save()}>
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
