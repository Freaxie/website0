import { create } from 'zustand'
import { convertRecord, makeRecord, type RecordInit } from '../domain/factory'
import { newId, nowIso } from '../domain/ids'
import {
  DEFAULT_SETTINGS,
  type AnyRecord,
  type BaseRecord,
  type DataByKind,
  type Kind,
  type Link,
  type LinkType,
  type RecordOf,
  type Settings,
} from '../domain/types'
import { loadAll, openAtlasDb, write, type Db, type Write } from '../data/db'
import { SCHEMA_VERSION, type ValidatedImport } from '../data/schema'
import { publicSeed } from '../seed/public'

type Records = Record<string, AnyRecord>
type Links = Record<string, Link>

export type RecordPatch<K extends Kind = Kind> = Partial<Omit<BaseRecord, 'id' | 'createdAt'>> & {
  data?: Partial<DataByKind[K]>
}

export interface SaveState {
  pending: number
  error: string | null
  lastSaved: number | null
}

interface State {
  status: 'loading' | 'ready' | 'error'
  loadError: string | null
  records: Records
  links: Links
  settings: Settings
  recent: string[]
  save: SaveState
}

interface Actions {
  init(opts?: { dbName?: string; seed?: boolean }): Promise<void>
  create<K extends Kind>(kind: K, init?: RecordInit<K>): RecordOf<K>
  update<K extends Kind>(id: string, patch: RecordPatch<K>): void
  remove(id: string): void
  /** Re-file a record as another kind, keeping its id, text and connections. */
  convert<K extends Kind>(id: string, kind: K, data?: Partial<DataByKind[K]>): void
  link(from: string, to: string, type: LinkType, note?: string): Link | null
  updateLink(id: string, patch: Partial<Pick<Link, 'type' | 'note'>>): void
  unlink(id: string): void
  setSettings(patch: Partial<Settings>): void
  visit(id: string): void
  importData(data: ValidatedImport, mode: 'merge' | 'replace'): { records: number; links: number; dropped: number }
  resetToSeed(): Promise<void>
}

export type Store = State & Actions

let db: Db | null = null
const TAB = newId('tab')
let channel: BroadcastChannel | null = null

const toMap = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x])) as Record<string, T>

export const useStore = create<Store>()((set, get) => {
  /** Writes through to IndexedDB and tracks the save status shown in the top bar. */
  function persist(w: Write) {
    if (!db) return
    set((s) => ({ save: { ...s.save, pending: s.save.pending + 1 } }))
    write(db, w)
      .then(() => {
        set((s) => ({ save: { pending: s.save.pending - 1, error: null, lastSaved: Date.now() } }))
        channel?.postMessage({ from: TAB })
      })
      .catch((e: unknown) => {
        console.error('save failed', e)
        set((s) => ({
          save: { ...s.save, pending: s.save.pending - 1, error: e instanceof Error ? e.message : 'Could not save' },
        }))
      })
  }

  async function reloadFromDb() {
    if (!db) return
    const snap = await loadAll(db)
    set({
      records: toMap(snap.records),
      links: toMap(snap.links),
      settings: { ...DEFAULT_SETTINGS, ...snap.settings },
      recent: snap.recent,
    })
  }

  return {
    status: 'loading',
    loadError: null,
    records: {},
    links: {},
    settings: DEFAULT_SETTINGS,
    recent: [],
    save: { pending: 0, error: null, lastSaved: null },

    async init(opts = {}) {
      try {
        db = await openAtlasDb(opts.dbName)
        let snap = await loadAll(db)
        if (!snap.seededAt && snap.records.length === 0 && opts.seed !== false) {
          const seed = publicSeed()
          await write(db, {
            putRecords: seed.records,
            putLinks: seed.links,
            meta: { seededAt: nowIso(), schemaVersion: SCHEMA_VERSION },
          })
          snap = await loadAll(db)
        }
        set({
          status: 'ready',
          records: toMap(snap.records),
          links: toMap(snap.links),
          settings: { ...DEFAULT_SETTINGS, ...snap.settings },
          recent: snap.recent,
        })
        if (typeof BroadcastChannel !== 'undefined' && !channel) {
          channel = new BroadcastChannel(`atlas:${opts.dbName ?? 'default'}`)
          let t: ReturnType<typeof setTimeout> | undefined
          channel.onmessage = (ev) => {
            if (ev.data?.from === TAB) return
            clearTimeout(t)
            t = setTimeout(reloadFromDb, 150)
          }
        }
      } catch (e) {
        console.error(e)
        set({
          status: 'error',
          loadError:
            e instanceof Error
              ? e.message
              : 'IndexedDB is unavailable. Private browsing or blocked site data can cause this.',
        })
      }
    },

    create(kind, init) {
      const rec = makeRecord(kind, init)
      set((s) => ({ records: { ...s.records, [rec.id]: rec as AnyRecord } }))
      persist({ putRecords: [rec as AnyRecord] })
      return rec
    },

    update(id, patch) {
      const cur = get().records[id]
      if (!cur) return
      const { data, ...base } = patch
      const next = {
        ...cur,
        ...base,
        data: data ? { ...cur.data, ...data } : cur.data,
        updatedAt: nowIso(),
      } as AnyRecord
      set((s) => ({ records: { ...s.records, [id]: next } }))
      persist({ putRecords: [next] })
    },

    remove(id) {
      const s = get()
      if (!s.records[id]) return
      const records = { ...s.records }
      delete records[id]
      const dropLinks = Object.values(s.links).filter((l) => l.from === id || l.to === id)
      const links = { ...s.links }
      for (const l of dropLinks) delete links[l.id]
      // Tasks of a deleted project survive, unassigned.
      const orphanedTasks: AnyRecord[] = []
      for (const r of Object.values(records))
        if (r.kind === 'task' && r.data.projectId === id) {
          const t = { ...r, data: { ...r.data, projectId: null }, updatedAt: nowIso() }
          records[r.id] = t
          orphanedTasks.push(t)
        }
      set({ records, links, recent: s.recent.filter((x) => x !== id) })
      persist({
        deleteRecords: [id],
        deleteLinks: dropLinks.map((l) => l.id),
        putRecords: orphanedTasks,
        meta: { recent: s.recent.filter((x) => x !== id) },
      })
    },

    convert(id, kind, data) {
      const cur = get().records[id]
      if (!cur) return
      const base = convertRecord(cur, kind)
      const next = { ...base, data: { ...base.data, ...(data ?? {}) } } as AnyRecord
      set((s) => ({ records: { ...s.records, [id]: next } }))
      persist({ putRecords: [next] })
    },

    link(from, to, type, note = '') {
      const s = get()
      if (from === to || !s.records[from] || !s.records[to]) return null
      const dup = Object.values(s.links).find((l) => l.from === from && l.to === to && l.type === type)
      if (dup) return dup
      const l: Link = { id: newId('ln'), from, to, type, note, createdAt: nowIso() }
      set({ links: { ...s.links, [l.id]: l } })
      persist({ putLinks: [l] })
      return l
    },

    updateLink(id, patch) {
      const cur = get().links[id]
      if (!cur) return
      const next = { ...cur, ...patch }
      set((s) => ({ links: { ...s.links, [id]: next } }))
      persist({ putLinks: [next] })
    },

    unlink(id) {
      const links = { ...get().links }
      if (!links[id]) return
      delete links[id]
      set({ links })
      persist({ deleteLinks: [id] })
    },

    setSettings(patch) {
      const settings = { ...get().settings, ...patch }
      set({ settings })
      persist({ meta: { settings } })
    },

    visit(id) {
      const recent = [id, ...get().recent.filter((x) => x !== id)].slice(0, 12)
      set({ recent })
      persist({ meta: { recent } })
    },

    importData(data, mode) {
      const s = get()
      const records: Records = mode === 'replace' ? {} : { ...s.records }
      for (const r of data.records) records[r.id] = r
      const links: Links = mode === 'replace' ? {} : { ...s.links }
      let dropped = 0
      for (const l of data.links) {
        if (records[l.from] && records[l.to]) links[l.id] = l
        else dropped++
      }
      const settings = data.settings ? { ...s.settings, ...data.settings } : s.settings
      set({ records, links, settings })
      persist({
        clear: mode === 'replace',
        putRecords: data.records,
        putLinks: Object.values(links).filter((l) => data.links.includes(l)),
        meta: { settings, schemaVersion: SCHEMA_VERSION, seededAt: nowIso() },
      })
      return { records: data.records.length, links: data.links.length - dropped, dropped }
    },

    async resetToSeed() {
      if (!db) return
      const seed = publicSeed()
      await write(db, {
        clear: true,
        putRecords: seed.records,
        putLinks: seed.links,
        meta: { seededAt: nowIso(), schemaVersion: SCHEMA_VERSION, recent: [] },
      })
      await reloadFromDb()
      channel?.postMessage({ from: TAB })
    },
  }
})

/** For tests: forget the open database so init() can open a fresh one. */
export function __resetStoreForTests() {
  db?.close()
  db = null
  channel?.close()
  channel = null
  useStore.setState({
    status: 'loading',
    loadError: null,
    records: {},
    links: {},
    settings: DEFAULT_SETTINGS,
    recent: [],
    save: { pending: 0, error: null, lastSaved: null },
  })
}
