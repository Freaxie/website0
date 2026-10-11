import { SCHEMA_VERSION } from './schema'

/**
 * Upgrades an export file (or stored snapshot) from an older schemaVersion, one step at a time.
 * Each step receives the plain object of version n and returns version n + 1. Add a step whenever
 * the record shape changes; never edit an old step.
 */
type Step = (file: Record<string, unknown>) => Record<string, unknown>
const STEPS: Record<number, Step> = {
  // 1: (file) => ({ ...file, schemaVersion: 2, records: ... }),
}

export function migrate(file: Record<string, unknown>): { file: Record<string, unknown>; error?: string } {
  let v = Number(file.schemaVersion)
  if (!Number.isInteger(v) || v < 1) return { file, error: 'missing or invalid schemaVersion' }
  if (v > SCHEMA_VERSION)
    return { file, error: `this backup is from a newer version (schema ${v}); this app reads up to ${SCHEMA_VERSION}` }
  let cur = file
  while (v < SCHEMA_VERSION) {
    const step = STEPS[v]
    if (!step) return { file, error: `no migration from schema ${v}` }
    cur = step(cur)
    v = Number(cur.schemaVersion)
  }
  return { file: cur }
}
