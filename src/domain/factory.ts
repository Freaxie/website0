import { newId, nowIso } from './ids'
import { KIND_DEFS } from './kinds'
import type { AnyRecord, BaseRecord, DataByKind, Kind, RecordOf } from './types'

export type RecordInit<K extends Kind> = Partial<Omit<BaseRecord, 'id'>> & {
  id?: string
  data?: Partial<DataByKind[K]>
}

/** A complete record with sensible defaults; only the kind is required. */
export function makeRecord<K extends Kind>(kind: K, init: RecordInit<K> = {}): RecordOf<K> {
  const def = KIND_DEFS[kind]
  const t = nowIso()
  const { data, ...base } = init
  return {
    id: base.id ?? newId(kind.slice(0, 2)),
    kind,
    title: base.title ?? '',
    body: base.body ?? '',
    tags: base.tags ?? [],
    createdAt: base.createdAt ?? t,
    updatedAt: base.updatedAt ?? base.createdAt ?? t,
    origin: base.origin ?? 'user',
    certainty: base.certainty ?? null,
    currency: base.currency ?? 'current',
    asOf: base.asOf ?? null,
    private: base.private ?? def.privateByDefault,
    pinned: base.pinned ?? false,
    archived: base.archived ?? false,
    data: { ...def.data(), ...(data ?? {}) } as DataByKind[K],
  } as unknown as RecordOf<K>
}

/** Convert a record to another kind in place (keeps id, text and links). Used to file inbox captures. */
export function convertRecord(rec: AnyRecord, kind: Kind): AnyRecord {
  const def = KIND_DEFS[kind]
  return {
    ...rec,
    kind,
    private: rec.private || def.privateByDefault,
    data: def.data(),
    updatedAt: nowIso(),
  } as AnyRecord
}

export const displayTitle = (r: { title: string; body?: string }) =>
  r.title.trim() || (r.body ?? '').trim().split('\n')[0].slice(0, 80) || 'Untitled'
