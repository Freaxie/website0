// Validates the local private import file when it exists (it is gitignored, so CI skips this).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { publicSeed } from '../seed/public'
import { parseBackup } from './portable'

const path = join(process.cwd(), 'private', 'krish.private.json')

describe.skipIf(!existsSync(path))('private import file', () => {
  it('parses cleanly, is entirely private, and links only to known records', () => {
    const r = parseBackup(readFileSync(path, 'utf8'))
    if (!r.ok) throw new Error(r.errors.join('\n'))
    expect(r.value.warnings).toEqual([])
    expect(r.value.records.every((x) => x.private)).toBe(true)
    const ids = new Set([...r.value.records, ...publicSeed().records].map((x) => x.id))
    for (const l of r.value.links) {
      expect(ids.has(l.from), l.from).toBe(true)
      expect(ids.has(l.to), l.to).toBe(true)
    }
    const pub = new Set(publicSeed().records.map((x) => x.id))
    expect(r.value.records.filter((x) => pub.has(x.id))).toEqual([])
  })
})
