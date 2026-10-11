import { useEffect, useRef, useState } from 'react'
import { buildExport, buildMarkdownZip, download, parseBackup } from '../data/portable'
import { SCHEMA_VERSION, type ValidatedImport } from '../data/schema'
import { humanize } from '../domain/kinds'
import { ACCENTS, type Accent, type Theme } from '../domain/types'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { comboFromEvent, formatCombo } from '../shell/keys'
import { Field } from '../ui/Fields'
import { Icon } from '../ui/Icon'
import { confirmAction } from '../ui/Modal'
import { PageHead } from '../ui/Page'

export function Settings() {
  return (
    <div className="page settings">
      <PageHead mode="System · Settings" title="Settings" lede="Appearance, focus limits, shortcuts, privacy, and your data." />
      <div className="settings-grid">
        <Appearance />
        <Focus />
        <Shortcuts />
        <Privacy />
        <Data />
      </div>
    </div>
  )
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="settings-block" aria-labelledby={id}>
      <h2 id={id} className="serif">
        {title}
      </h2>
      <div className="stack">{children}</div>
    </section>
  )
}

function Appearance() {
  const s = useStore((st) => st.settings)
  const setSettings = useStore((st) => st.setSettings)
  return (
    <Block id="s-appearance" title="Appearance">
      <Field label="Theme">
        <div className="seg-choice" role="radiogroup" aria-label="Theme">
          {(['dark', 'paper', 'system'] as Theme[]).map((t) => (
            <button key={t} role="radio" aria-checked={s.theme === t} className={`chip-btn ${s.theme === t ? 'is-on' : ''}`} onClick={() => setSettings({ theme: t })}>
              {t === 'dark' ? 'Atlas (dark)' : t === 'paper' ? 'Paper (light)' : 'Follow system'}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Accent" hint="One accent colour, reserved for live commitments and actions.">
        <div className="seg-choice" role="radiogroup" aria-label="Accent">
          {ACCENTS.map((a: Accent) => (
            <button key={a} role="radio" aria-checked={s.accent === a} className={`chip-btn swatch-btn ${s.accent === a ? 'is-on' : ''}`} data-accent-swatch={a} onClick={() => setSettings({ accent: a })}>
              <span className="swatch" />
              {humanize(a)}
            </button>
          ))}
        </div>
      </Field>
    </Block>
  )
}

function Focus() {
  const s = useStore((st) => st.settings)
  const setSettings = useStore((st) => st.setSettings)
  const num = (v: string, d: number) => Math.max(1, Math.min(50, Number(v) || d))
  return (
    <Block id="s-focus" title="Focus limits">
      <p className="muted small">Soft limits. Going over shows a warning; nothing is blocked.</p>
      <Field label="Active projects" htmlFor="lim-p">
        <input id="lim-p" className="input input--num" type="number" min={1} max={50} value={s.activeProjectLimit} onChange={(e) => setSettings({ activeProjectLimit: num(e.target.value, 3) })} />
      </Field>
      <Field label="Focus topics (studying · practicing · building)" htmlFor="lim-t">
        <input id="lim-t" className="input input--num" type="number" min={1} max={50} value={s.focusTopicLimit} onChange={(e) => setSettings({ focusTopicLimit: num(e.target.value, 4) })} />
      </Field>
    </Block>
  )
}

function Shortcuts() {
  const combo = useStore((st) => st.settings.captureShortcut)
  const setSettings = useStore((st) => st.setSettings)
  const [recording, setRecording] = useState(false)
  const set = useUi((s) => s.set)
  return (
    <Block id="s-keys" title="Shortcuts">
      <Field label="Quick capture" hint="A single key works everywhere except while typing; add Alt or Ctrl/⌘ to make it work inside text fields too.">
        <div className="row-flex">
          <button
            className={`btn ${recording ? 'btn--primary' : ''}`}
            onClick={() => setRecording(true)}
            onKeyDown={(e) => {
              if (!recording) return
              e.preventDefault()
              e.stopPropagation()
              if (e.key === 'Escape') return setRecording(false)
              const c = comboFromEvent(e)
              if (!c) return
              if (c === 'mod+k') return
              setSettings({ captureShortcut: c })
              setRecording(false)
            }}
            onBlur={() => setRecording(false)}
          >
            {recording ? 'Press a key…' : <kbd>{formatCombo(combo)}</kbd>}
          </button>
          {combo !== 'c' && (
            <button className="btn btn--ghost btn--sm" onClick={() => setSettings({ captureShortcut: 'c' })}>
              Reset to C
            </button>
          )}
        </div>
      </Field>
      <button className="btn btn--ghost btn--sm" onClick={() => set({ shortcuts: true })}>
        <Icon name="keyboard" size={14} /> All shortcuts
      </button>
    </Block>
  )
}

function Privacy() {
  const hide = useStore((st) => st.settings.hidePrivate)
  const setSettings = useStore((st) => st.setSettings)
  const count = useStore((st) => Object.values(st.records).filter((r) => r.private).length)
  return (
    <Block id="s-privacy" title="Privacy">
      <div className="prose small">
        <p>
          <b>Where your data lives.</b> Only in this browser’s IndexedDB, on this device. Nothing is sent to a server; there is no account and no analytics. Another
          browser or device starts from the public seed and has none of your edits.
        </p>
        <p>
          <b>What the public site contains.</b> The deployed site ships only the public seed (topics, projects, learning paths). Health, family, finances and
          psychological notes are never committed or bundled; they come from a private file you import yourself.
        </p>
        <p>
          <b>The privacy screen</b> hides private records from every view (for screen-sharing). It is not security: anyone with access to this browser profile can
          turn it off or read the database.
        </p>
      </div>
      <label className="switch">
        <input type="checkbox" checked={hide} onChange={(e) => setSettings({ hidePrivate: e.target.checked })} />
        <span>Hide private records ({count})</span>
      </label>
    </Block>
  )
}

function Data() {
  const records = useStore((s) => s.records)
  const links = useStore((s) => s.links)
  const settings = useStore((s) => s.settings)
  const importData = useStore((s) => s.importData)
  const resetToSeed = useStore((s) => s.resetToSeed)
  const toast = useUi((s) => s.toast)
  const [includePrivate, setIncludePrivate] = useState(true)
  const [pending, setPending] = useState<{ name: string; data: ValidatedImport } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [storage, setStorage] = useState<{ usage?: number; persisted?: boolean } | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const nav = navigator.storage
    if (!nav?.estimate) return
    Promise.all([nav.estimate(), nav.persisted?.() ?? Promise.resolve(false)]).then(([e, p]) => setStorage({ usage: e.usage, persisted: p }))
  }, [])

  const stamp = new Date().toISOString().slice(0, 10)
  const all = Object.values(records)
  const exportJson = () => {
    const data = buildExport(all, Object.values(links), settings, { includePrivate })
    download(`atlas-${includePrivate ? 'full' : 'public'}-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json')
  }
  const exportMd = () => download(`atlas-markdown-${stamp}.zip`, buildMarkdownZip(all, Object.values(links), { includePrivate }), 'application/zip')

  const onFile = async (f: File) => {
    setErrors([])
    setPending(null)
    const res = parseBackup(await f.text())
    if (!res.ok) setErrors(res.errors)
    else setPending({ name: f.name, data: res.value })
  }
  const apply = async (mode: 'merge' | 'replace') => {
    if (!pending) return
    if (mode === 'replace') {
      const ok = await confirmAction({
        title: 'Replace everything?',
        body: `All ${all.length} current records will be deleted and replaced by the ${pending.data.records.length} in “${pending.name}”. Export first if unsure.`,
        confirm: 'Replace all data',
        danger: true,
      })
      if (!ok) return
    }
    const r = importData(pending.data, mode)
    toast(`Imported ${r.records} records and ${r.links} links${r.dropped ? ` (${r.dropped} links skipped: missing endpoints)` : ''}.`)
    setPending(null)
    if (file.current) file.current.value = ''
  }
  const overlap = pending ? pending.data.records.filter((r) => records[r.id]).length : 0

  return (
    <Block id="s-data" title="Data">
      <p className="muted small">
        Export is the only backup. The JSON file is complete and re-importable (format: <code>krish-atlas</code>, schema {SCHEMA_VERSION}, documented in{' '}
        <code>docs/DATA_FORMAT.md</code>). Markdown is a readable copy.
      </p>
      <label className="switch">
        <input type="checkbox" checked={includePrivate} onChange={(e) => setIncludePrivate(e.target.checked)} />
        <span>Include private records in exports</span>
      </label>
      <div className="row-flex">
        <button className="btn" onClick={exportJson}>
          <Icon name="download" size={14} /> Export JSON
        </button>
        <button className="btn btn--ghost" onClick={exportMd}>
          <Icon name="download" size={14} /> Export Markdown (.zip)
        </button>
      </div>

      <Field label="Import a backup" hint="The file is validated record by record before anything is written.">
        <input ref={file} type="file" accept="application/json,.json" className="input" aria-label="Choose backup file" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </Field>
      {errors.length > 0 && (
        <div className="notice notice--error" role="alert">
          <b>This file can’t be imported.</b>
          <ul>
            {errors.slice(0, 6).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {pending && (
        <div className="notice import-preview" role="status">
          <b>
            {pending.name}: {pending.data.records.length} records, {pending.data.links.length} links.
          </b>
          {overlap > 0 && <div className="small">{overlap} records already exist here; merging overwrites them with the file’s version.</div>}
          {pending.data.warnings.length > 0 && (
            <details className="small">
              <summary>{pending.data.warnings.length} warnings (repaired or skipped)</summary>
              <ul>
                {pending.data.warnings.slice(0, 30).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="row-flex">
            <button className="btn btn--primary btn--sm" onClick={() => apply('merge')}>
              Merge into current data
            </button>
            <button className="btn btn--ghost btn--sm btn--danger-text" onClick={() => apply('replace')}>
              Replace all data
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="muted small">
        {all.length} records · {Object.keys(links).length} links
        {storage?.usage !== undefined && ` · ${(storage.usage / 1024).toFixed(0)} KB used`}
        {storage && (storage.persisted ? ' · persistent storage granted' : '')}
      </div>
      {storage && !storage.persisted && navigator.storage?.persist && (
        <button
          className="btn btn--ghost btn--sm"
          onClick={async () => {
            const ok = await navigator.storage.persist()
            setStorage((s) => ({ ...s, persisted: ok }))
            toast(ok ? 'The browser will keep this data unless you clear it yourself.' : 'The browser declined. Exports remain the backup.', ok ? 'info' : 'warn')
          }}
        >
          Ask the browser not to evict this data
        </button>
      )}

      <div className="danger-zone">
        <div className="kicker">Reset</div>
        <p className="muted small">Delete everything in this browser and start again from the public seed.</p>
        <button
          className="btn btn--ghost btn--sm btn--danger-text"
          onClick={async () => {
            const ok = await confirmAction({
              title: 'Reset to the public seed?',
              body: `This permanently deletes all ${all.length} records in this browser, including private ones. Export first if you want to keep anything.`,
              confirm: 'Delete and reset',
              danger: true,
            })
            if (ok) {
              await resetToSeed()
              toast('Reset to the public seed.')
            }
          }}
        >
          <Icon name="trash" size={14} /> Reset all data
        </button>
      </div>
    </Block>
  )
}
