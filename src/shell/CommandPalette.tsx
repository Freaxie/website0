import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS, SECTIONS, type IconName } from '../domain/kinds'
import { search } from '../domain/search'
import type { Kind } from '../domain/types'
import { buildExport, download } from '../data/portable'
import { useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { NAV } from './nav'

interface Item {
  id: string
  icon: IconName
  label: string
  hint?: string
  group: string
  run: () => void
}

const NEW: Kind[] = ['note', 'topic', 'project', 'task', 'question', 'resource', 'goal', 'observation', 'experiment', 'archetype', 'event', 'path', 'skill', 'person']

/** One box for everything: records ranked by full-text search, plus commands. */
export function CommandPalette() {
  const open = useUi((s) => s.palette)
  const ui = useUi()
  const navigate = useNavigate()
  const records = useVisible()
  const recent = useStore((s) => s.recent)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
    }
  }, [open])

  const close = () => ui.set({ palette: false })

  const commands = useMemo<Item[]>(() => {
    const st = useStore.getState()
    const go = (path: string) => () => navigate(path)
    const create = (k: Kind) => () => {
      const r = useStore.getState().create(k, {})
      navigate(`/r/${r.id}?edit=1`)
    }
    return [
      { id: 'cap', icon: 'capture', label: 'Quick capture', group: 'Commands', run: () => ui.set({ capture: true }) },
      ...NEW.map((k) => ({ id: `new-${k}`, icon: KIND_DEFS[k].icon, label: `New ${KIND_DEFS[k].label.toLowerCase()}`, group: 'Create', run: create(k) })),
      ...NAV.map((n) => ({ id: `go-${n.section}`, icon: SECTIONS[n.section].icon, label: `Go to ${SECTIONS[n.section].label}`, hint: `g ${n.key}`, group: 'Go to', run: go(SECTIONS[n.section].path) })),
      { id: 'review', icon: 'review', label: 'Start a weekly review', group: 'Commands', run: go('/review?start=week') },
      {
        id: 'theme', icon: 'eye', label: 'Toggle dark / paper theme', group: 'Commands',
        run: () => useStore.getState().setSettings({ theme: useStore.getState().settings.theme === 'paper' ? 'dark' : 'paper' }),
      },
      {
        id: 'screen', icon: 'lock', label: st.settings.hidePrivate ? 'Show private records' : 'Hide private records (privacy screen)', group: 'Commands',
        run: () => useStore.getState().setSettings({ hidePrivate: !useStore.getState().settings.hidePrivate }),
      },
      {
        id: 'export', icon: 'download', label: 'Export everything as JSON', group: 'Commands',
        run: () => {
          const s = useStore.getState()
          const data = buildExport(Object.values(s.records), Object.values(s.links), s.settings, { includePrivate: true })
          download(`atlas-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')
        },
      },
      { id: 'keys', icon: 'keyboard', label: 'Keyboard shortcuts', hint: '?', group: 'Commands', run: () => ui.set({ shortcuts: true }) },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, open])

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase()
    const recItem = (id: string): Item | null => {
      const r = records[id]
      if (!r) return null
      return {
        id,
        icon: KIND_DEFS[r.kind].icon,
        label: displayTitle(r),
        hint: `${KIND_DEFS[r.kind].label}${r.archived ? ' · archived' : ''} · ${formatTimestamp(r.updatedAt)}`,
        group: term ? 'Records' : 'Recent',
        run: () => navigate(`/r/${id}`),
      }
    }
    if (!term) {
      const rec = recent.map(recItem).filter((x): x is Item => !!x).slice(0, 6)
      return [...rec, ...commands.filter((c) => ['cap', 'new-note', 'new-topic', 'new-project', 'go-graph', 'review'].includes(c.id))]
    }
    const cmd = commands.filter((c) => c.label.toLowerCase().includes(term)).slice(0, 6)
    const hits = search(records, q, 30).map((h) => recItem(h.id)).filter((x): x is Item => !!x)
    const make: Item = {
      id: 'make-note', icon: 'plus', label: `Create note “${q.trim()}”`, group: 'Create',
      run: () => {
        const r = useStore.getState().create('note', { title: q.trim() })
        navigate(`/r/${r.id}?edit=1`)
      },
    }
    return [...hits, ...cmd, make]
  }, [q, records, recent, commands, navigate])

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [i])

  const run = (it: Item | undefined) => {
    if (!it) return
    close()
    it.run()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((x) => (x + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((x) => (x - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(items[i])
    }
  }

  let last = ''
  return (
    <Modal open={open} onClose={close} label="Search and commands" position="top" className="dialog--palette">
      <div className="palette-input">
        <Icon name="search" size={18} />
        <input
          autoFocus
          value={q}
          placeholder="Search everything, or type a command…"
          aria-label="Search and commands"
          role="combobox"
          aria-expanded
          aria-controls="palette-list"
          aria-activedescendant={items[i] ? `pal-${items[i].id}` : undefined}
          onChange={(e) => {
            setQ(e.target.value)
            setI(0)
          }}
          onKeyDown={onKey}
        />
        <kbd>Esc</kbd>
      </div>
      <ul className="palette-list" role="listbox" id="palette-list" ref={list}>
        {items.map((it, j) => {
          const head = it.group !== last ? (last = it.group) : null
          return (
            <li key={it.id} role="presentation">
              {head && <div className="palette-group kicker">{head}</div>}
              <div
                id={`pal-${it.id}`}
                role="option"
                aria-selected={j === i}
                className={`palette-item ${j === i ? 'is-active' : ''}`}
                onMouseMove={() => j !== i && setI(j)}
                onClick={() => run(it)}
              >
                <Icon name={it.icon} size={15} />
                <span className="truncate">{it.label}</span>
                {it.hint && <span className="palette-hint">{it.hint}</span>}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="palette-foot kicker">
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span>Searches titles, text, tags, fields</span>
      </div>
    </Modal>
  )
}
