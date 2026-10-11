import { buildExport, parseBackup } from '../data/portable'
import { __resetStoreForTests, useStore } from './store'

let n = 0
const fresh = async (seed = false) => {
  __resetStoreForTests()
  const dbName = `test-${++n}`
  await useStore.getState().init({ dbName, seed })
  return dbName
}
const settle = async () => {
  for (let i = 0; i < 50 && useStore.getState().save.pending > 0; i++) await new Promise((r) => setTimeout(r, 5))
}
/** Simulates a page reload: drop the in-memory state and read everything back from IndexedDB. */
const reload = async (dbName: string) => {
  await settle()
  __resetStoreForTests()
  await useStore.getState().init({ dbName, seed: false })
}

describe('store persistence', () => {
  it('seeds a fresh database once', async () => {
    const name = await fresh(true)
    const count = Object.keys(useStore.getState().records).length
    expect(count).toBeGreaterThan(40)
    useStore.getState().create('note', { title: 'mine' })
    await reload(name)
    __resetStoreForTests()
    await useStore.getState().init({ dbName: name })
    expect(Object.keys(useStore.getState().records).length).toBe(count + 1)
  })

  it('keeps created, edited and linked records across a reload', async () => {
    const name = await fresh()
    const s = useStore.getState()
    const a = s.create('topic', { title: 'Emergence' })
    const b = s.create('topic', { title: 'Thermodynamics' })
    s.update(a.id, { body: 'edited', data: { status: 'studying' } })
    const l = s.link(a.id, b.id, 'related')!
    expect(s.link(a.id, b.id, 'related')!.id).toBe(l.id) // no duplicates
    await reload(name)
    const st = useStore.getState()
    const ra = st.records[a.id]
    expect(ra.body).toBe('edited')
    expect(ra.kind === 'topic' && ra.data.status).toBe('studying')
    expect(st.links[l.id]).toMatchObject({ from: a.id, to: b.id })
    expect(st.save.error).toBeNull()
  })

  it('deletes a record with its links and unassigns its tasks', async () => {
    const name = await fresh()
    const s = useStore.getState()
    const p = s.create('project', { title: 'P' })
    const o = s.create('topic', { title: 'T' })
    const t = s.create('task', { title: 'step', data: { projectId: p.id } })
    s.link(p.id, o.id, 'applies_to')
    s.remove(p.id)
    await reload(name)
    const st = useStore.getState()
    expect(st.records[p.id]).toBeUndefined()
    expect(Object.keys(st.links)).toHaveLength(0)
    const task = st.records[t.id]
    expect(task.kind === 'task' && task.data.projectId).toBeNull()
  })
})

describe('export and import', () => {
  it('round-trips through JSON and can exclude private records', async () => {
    await fresh()
    const s = useStore.getState()
    const pub = s.create('note', { title: 'public' })
    const priv = s.create('observation', { title: 'secret' })
    expect(priv.private).toBe(true)
    s.link(pub.id, priv.id, 'related')
    const st = useStore.getState()
    const all = Object.values(st.records)
    const full = parseBackup(JSON.stringify(buildExport(all, Object.values(st.links), st.settings, { includePrivate: true })))
    expect(full.ok && full.value.records).toHaveLength(2)
    expect(full.ok && full.value.links).toHaveLength(1)
    const pubOnly = buildExport(all, Object.values(st.links), st.settings, { includePrivate: false })
    expect(pubOnly.records.map((r) => r.title)).toEqual(['public'])
    expect(pubOnly.links).toEqual([])

    const name = await fresh()
    if (!full.ok) throw new Error('import failed')
    useStore.getState().importData(full.value, 'replace')
    await reload(name)
    expect(Object.values(useStore.getState().records).map((r) => r.title).sort()).toEqual(['public', 'secret'])
  })

  it('rejects files that are not backups and repairs malformed records', () => {
    expect(parseBackup('nope').ok).toBe(false)
    expect(parseBackup('{"format":"other","schemaVersion":1,"records":[]}').ok).toBe(false)
    expect(parseBackup('{"format":"krish-atlas","schemaVersion":99,"records":[]}')).toMatchObject({ ok: false })
    const r = parseBackup(
      JSON.stringify({
        format: 'krish-atlas',
        schemaVersion: 1,
        records: [
          { id: 'x', kind: 'topic', title: 'X', data: { status: 'studying', questions: 'not a list', bogus: 1 } },
          { id: 'y', kind: 'nonsense' },
          { id: 'x', kind: 'note' },
        ],
        links: [{ id: 'l', from: 'x', to: 'z', type: 'related' }, { id: 'bad' }],
      }),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.records).toHaveLength(1)
    const x = r.value.records[0]
    expect(x.kind === 'topic' && x.data).toMatchObject({ status: 'studying', questions: [] })
    expect(x.data).not.toHaveProperty('bogus')
    expect(r.value.links).toHaveLength(1)
    expect(r.value.warnings.length).toBeGreaterThanOrEqual(3)
  })

  it('drops imported links whose endpoints do not exist', async () => {
    await fresh()
    const r = parseBackup(JSON.stringify({
      format: 'krish-atlas', schemaVersion: 1,
      records: [{ id: 'a', kind: 'note', title: 'A' }],
      links: [{ id: 'l', from: 'a', to: 'ghost', type: 'related' }],
    }))
    if (!r.ok) throw new Error()
    expect(useStore.getState().importData(r.value, 'merge')).toMatchObject({ records: 1, links: 0, dropped: 1 })
  })
})
