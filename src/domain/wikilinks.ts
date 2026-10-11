import type { AnyRecord } from './types'

/** [[Title]] or [[Title|shown text]]. Titles are matched case-insensitively. */
export const WIKILINK = /\[\[([^\]|\n]+?)(?:\|([^\]\n]+))?\]\]/g

export interface WikiRef {
  target: string
  label: string
}

export function parseWikilinks(md: string): WikiRef[] {
  const out: WikiRef[] = []
  for (const m of md.matchAll(WIKILINK)) {
    const target = m[1].trim()
    if (target) out.push({ target, label: (m[2] ?? m[1]).trim() })
  }
  return out
}

export const titleKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** Title → id. The oldest record wins a title clash, so links stay stable when duplicates appear. */
export function titleIndex(records: Iterable<AnyRecord>): Map<string, string> {
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const map = new Map<string, string>()
  for (const r of sorted) {
    const k = titleKey(r.title)
    if (k && !map.has(k)) map.set(k, r.id)
  }
  return map
}
