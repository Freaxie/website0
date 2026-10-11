import { useMemo } from 'react'
import { graphIndex } from '../domain/graph'
import type { AnyRecord, Kind, RecordOf } from '../domain/types'
import { useStore } from './store'

/** Records the UI may show: private ones disappear while the privacy screen is on. */
export function useVisible(): Record<string, AnyRecord> {
  const records = useStore((s) => s.records)
  const hide = useStore((s) => s.settings.hidePrivate)
  return useMemo(() => {
    if (!hide) return records
    return Object.fromEntries(Object.entries(records).filter(([, r]) => !r.private))
  }, [records, hide])
}

export function useKind<K extends Kind>(kind: K, opts: { archived?: boolean } = {}): RecordOf<K>[] {
  const records = useVisible()
  const archived = opts.archived ?? false
  return useMemo(
    () =>
      Object.values(records).filter(
        (r): r is RecordOf<K> => r.kind === kind && (archived || !r.archived),
      ),
    [records, kind, archived],
  )
}

export function useRecord(id: string | undefined): AnyRecord | undefined {
  const visible = useVisible()
  return id ? visible[id] : undefined
}

export function useGraphIndex() {
  const records = useVisible()
  const links = useStore((s) => s.links)
  return useMemo(() => graphIndex(records, links), [records, links])
}
