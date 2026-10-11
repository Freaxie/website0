/** Every human-readable string inside a value: used to make kind-specific fields searchable. */
export function collectText(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') {
    if (v && !/^[a-z]{2}_[0-9a-z]{10}$/.test(v)) out.push(v)
  } else if (Array.isArray(v)) {
    for (const x of v) collectText(x, out)
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (k !== 'id') collectText(x, out)
  }
  return out
}
