export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** "mod+shift+k" → { mod, shift, alt, key }. "mod" is ⌘ on macOS and Ctrl elsewhere. */
export function parseCombo(combo: string) {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean)
  return {
    mod: parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
    key: parts.filter((p) => !['mod', 'ctrl', 'cmd', 'shift', 'alt', 'option'].includes(p)).pop() ?? '',
  }
}

/** Compares by physical key for letters and digits, so Alt+C works on macOS (where it types "ç"). */
export function matches(e: KeyboardEvent, combo: string): boolean {
  const c = parseCombo(combo)
  if (!c.key) return false
  const mod = isMac ? e.metaKey : e.ctrlKey
  if (c.mod !== mod || c.alt !== e.altKey) return false
  if (!c.mod && !c.alt && (e.metaKey || e.ctrlKey)) return false
  const k = c.key
  if (/^[a-z]$/.test(k)) return e.code === `Key${k.toUpperCase()}` && c.shift === e.shiftKey
  if (/^[0-9]$/.test(k)) return e.code === `Digit${k}` && c.shift === e.shiftKey
  if (k === 'space') return e.code === 'Space' && c.shift === e.shiftKey
  return e.key.toLowerCase() === k
}

export function formatCombo(combo: string): string {
  const c = parseCombo(combo)
  const bits: string[] = []
  if (c.mod) bits.push(isMac ? '⌘' : 'Ctrl')
  if (c.alt) bits.push(isMac ? '⌥' : 'Alt')
  if (c.shift) bits.push('Shift')
  bits.push(c.key.length === 1 ? c.key.toUpperCase() : c.key[0].toUpperCase() + c.key.slice(1))
  return bits.join(isMac ? '' : '+')
}

/** Converts a keydown into a combo string, for recording a custom shortcut. */
export function comboFromEvent(e: KeyboardEvent | React.KeyboardEvent): string | null {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return null
  let key = e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.code.startsWith('Digit') ? e.code.slice(5) : e.key.toLowerCase()
  if (key === ' ') key = 'space'
  const parts = []
  if (isMac ? e.metaKey : e.ctrlKey) parts.push('mod')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  parts.push(key)
  return parts.join('+')
}

export const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}
