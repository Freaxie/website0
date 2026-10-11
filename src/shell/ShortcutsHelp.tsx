import { SECTIONS } from '../domain/kinds'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { Modal } from '../ui/Modal'
import { formatCombo, isMac } from './keys'
import { NAV } from './nav'

export function ShortcutsHelp() {
  const open = useUi((s) => s.shortcuts)
  const set = useUi((s) => s.set)
  const capture = useStore((s) => s.settings.captureShortcut)
  const mod = isMac ? '⌘' : 'Ctrl'
  const rows: [string, string][] = [
    [`${mod} K`, 'Search and commands'],
    ['/', 'Search'],
    [formatCombo(capture), 'Quick capture (change in Settings)'],
    [isMac ? '⌥ N' : 'Alt N', `New note (${mod} N also works where the browser allows)`],
    ['Esc', 'Close overlays; leave the editor'],
    [`${mod} Enter`, 'Leave the editor'],
    ['[[', 'Link a record while writing'],
    ['e', 'Edit the open record'],
    ['?', 'This list'],
  ]
  return (
    <Modal open={open} onClose={() => set({ shortcuts: false })} label="Keyboard shortcuts" className="dialog--help">
      <div className="dialog-head">
        <h2 className="serif">Keyboard</h2>
      </div>
      <div className="help-cols">
        <dl className="keys">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <dl className="keys">
          {NAV.map((n) => (
            <div key={n.key}>
              <dt>
                <kbd>g</kbd> <kbd>{n.key}</kbd>
              </dt>
              <dd>{SECTIONS[n.section].label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  )
}
