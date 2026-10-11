import { parseWikilinks, titleIndex, titleKey } from '../domain/wikilinks'
import { PRIVATE_ONLY_KINDS, publicSeed } from './public'

describe('public seed', () => {
  const { records, links } = publicSeed()
  const ids = new Set(records.map((r) => r.id))

  it('contains nothing private', () => {
    expect(records.filter((r) => r.private)).toEqual([])
    expect(records.filter((r) => PRIVATE_ONLY_KINDS.includes(r.kind))).toEqual([])
  })
  it('has unique ids and links between existing records', () => {
    expect(ids.size).toBe(records.length)
    for (const l of links) {
      expect(ids.has(l.from), l.from).toBe(true)
      expect(ids.has(l.to), l.to).toBe(true)
    }
  })
  it('only wikilinks to records that exist', () => {
    const titles = titleIndex(records)
    for (const r of records)
      for (const ref of parseWikilinks(r.body)) expect(titles.has(titleKey(ref.target)), `${r.title} → ${ref.target}`).toBe(true)
  })
  it('is marked as imported history and keeps around 15–35 topics', () => {
    expect(records.every((r) => r.origin === 'seed')).toBe(true)
    const topics = records.filter((r) => r.kind === 'topic').length
    expect(topics).toBeGreaterThanOrEqual(15)
    expect(topics).toBeLessThanOrEqual(35)
  })
  it('never claims finished learning steps without evidence', () => {
    for (const r of records)
      if (r.kind === 'path') for (const s of r.data.steps) if (s.done) expect(s.evidence).toBeTruthy()
  })
})
