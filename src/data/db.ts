import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AnyRecord, Link, Settings } from '../domain/types'

/**
 * Local-first persistence: one IndexedDB database in this browser. Nothing is sent anywhere.
 * The in-memory store mirrors it; every mutation is written through immediately.
 */
export const DB_NAME = 'krish-atlas'
const DB_VERSION = 1

interface MetaValues {
  settings: Settings
  recent: string[]
  /** Version of the record format stored here; see migrations.ts. */
  schemaVersion: number
  seededAt: string
}
type MetaKey = keyof MetaValues

interface AtlasDB extends DBSchema {
  records: { key: string; value: AnyRecord }
  links: { key: string; value: Link }
  meta: { key: MetaKey; value: MetaValues[MetaKey] }
}

export type Db = IDBPDatabase<AtlasDB>

export function openAtlasDb(name = DB_NAME): Promise<Db> {
  return openDB<AtlasDB>(name, DB_VERSION, {
    upgrade(db) {
      // Structural upgrades go here as DB_VERSION grows; record-format changes live in migrations.ts.
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('links')) db.createObjectStore('links', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    },
  })
}

export interface Snapshot {
  records: AnyRecord[]
  links: Link[]
  settings: Settings | undefined
  recent: string[]
  schemaVersion: number | undefined
  seededAt: string | undefined
}

export async function loadAll(db: Db): Promise<Snapshot> {
  const tx = db.transaction(['records', 'links', 'meta'])
  const [records, links, settings, recent, schemaVersion, seededAt] = await Promise.all([
    tx.objectStore('records').getAll(),
    tx.objectStore('links').getAll(),
    tx.objectStore('meta').get('settings'),
    tx.objectStore('meta').get('recent'),
    tx.objectStore('meta').get('schemaVersion'),
    tx.objectStore('meta').get('seededAt'),
  ])
  await tx.done
  return {
    records,
    links,
    settings: settings as Settings | undefined,
    recent: (recent as string[] | undefined) ?? [],
    schemaVersion: schemaVersion as number | undefined,
    seededAt: seededAt as string | undefined,
  }
}

export interface Write {
  putRecords?: AnyRecord[]
  deleteRecords?: string[]
  putLinks?: Link[]
  deleteLinks?: string[]
  meta?: Partial<MetaValues>
  /** Wipe records and links first (used by replace-import and reset). */
  clear?: boolean
}

/** Applies one logical change atomically: either all of it is stored or none of it. */
export async function write(db: Db, w: Write): Promise<void> {
  const tx = db.transaction(['records', 'links', 'meta'], 'readwrite')
  const recs = tx.objectStore('records')
  const links = tx.objectStore('links')
  const meta = tx.objectStore('meta')
  const ops: Promise<unknown>[] = []
  if (w.clear) ops.push(recs.clear(), links.clear())
  for (const r of w.putRecords ?? []) ops.push(recs.put(r))
  for (const id of w.deleteRecords ?? []) ops.push(recs.delete(id))
  for (const l of w.putLinks ?? []) ops.push(links.put(l))
  for (const id of w.deleteLinks ?? []) ops.push(links.delete(id))
  for (const [k, v] of Object.entries(w.meta ?? {})) ops.push(meta.put(v as MetaValues[MetaKey], k as MetaKey))
  await Promise.all([...ops, tx.done])
}
