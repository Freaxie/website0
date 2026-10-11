import { z } from 'zod'
import { KIND_DEFS } from '../domain/kinds'
import { newId, nowIso } from '../domain/ids'
import {
  ACCENTS,
  CERTAINTIES,
  CURRENCIES,
  DEFAULT_SETTINGS,
  KINDS,
  LINK_TYPES,
  ORIGINS,
  type AnyRecord,
  type Link,
  type Settings,
} from '../domain/types'

/** Version of the portable format and of the stored record shape. Bump with a migration in migrations.ts. */
export const SCHEMA_VERSION = 1
export const FORMAT = 'krish-atlas'

const str = z.string()
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'not a date')

const CheckZ = z.object({
  id: str.default(() => newId('c')),
  title: str,
  done: z.boolean().default(false),
  evidence: str.optional(),
  date: str.nullable().optional(),
})
const PartZ = z.object({
  id: str.default(() => newId('c')),
  text: str,
  facet: z.enum(['ability', 'value', 'aesthetic', 'behavior']).catch('ability'),
  verdict: z.enum(['undecided', 'genuine', 'fascination', 'fantasy', 'integrable']).catch('undecided'),
})
const num = z.number().finite().nullable().catch(null)
const SetZ = z.object({ id: str.default(() => newId('c')), exercise: str, sets: num, reps: num, weight: num })
const MetricZ = z.object({ id: str.default(() => newId('c')), name: str, value: num, unit: str.default('') })

/** Fields whose elements are objects rather than strings. */
const STRUCTURED: Record<string, z.ZodTypeAny> = {
  milestones: CheckZ,
  actions: CheckZ,
  steps: CheckZ,
  changes: CheckZ,
  parts: PartZ,
  sets: SetZ,
  metrics: MetricZ,
}

/**
 * Kind data is normalised against the kind's defaults: unknown keys are dropped, and a value of the
 * wrong shape falls back to the default with a warning, so a hand-edited backup can never crash the UI.
 */
function normaliseData(kind: AnyRecord['kind'], raw: unknown, warn: (m: string) => void): Record<string, unknown> {
  const defaults = KIND_DEFS[kind].data() as Record<string, unknown>
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const out: Record<string, unknown> = { ...defaults }
  for (const [key, dflt] of Object.entries(defaults)) {
    if (!(key in input)) continue
    const v = input[key]
    let ok = false
    if (Array.isArray(dflt)) {
      if (Array.isArray(v)) {
        const el = STRUCTURED[key]
        const parsed = el ? v.map((x) => el.safeParse(x)) : v.map((x) => z.string().safeParse(x))
        if (parsed.every((p) => p.success)) {
          out[key] = parsed.map((p) => p.data)
          ok = true
        }
      }
    } else if (dflt === null) {
      ok = v === null || typeof v === 'string' || typeof v === 'number'
      if (ok) out[key] = v
    } else if (typeof dflt === 'object') {
      ok = !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'string')
      if (ok) out[key] = v
    } else {
      ok = typeof v === typeof dflt || (typeof dflt === 'string' && v === null)
      if (ok) out[key] = v ?? ''
    }
    if (!ok) warn(`field “${key}” had an unexpected shape and was reset`)
  }
  return out
}

const BaseZ = z.object({
  id: str.min(1),
  kind: z.enum(KINDS),
  title: str.default(''),
  body: str.default(''),
  tags: z.array(str).default([]),
  createdAt: iso.default(() => nowIso()),
  updatedAt: iso.default(() => nowIso()),
  origin: z.enum(ORIGINS).catch('import'),
  certainty: z.enum(CERTAINTIES).nullable().catch(null),
  currency: z.enum(CURRENCIES).catch('unverified'),
  asOf: str.nullable().catch(null),
  private: z.boolean().default(false),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  data: z.unknown().optional(),
})

const LinkZ = z.object({
  id: str.min(1),
  from: str.min(1),
  to: str.min(1),
  type: z.enum(LINK_TYPES),
  note: str.default(''),
  createdAt: iso.default(() => nowIso()),
})

const SettingsZ = z
  .object({
    theme: z.enum(['dark', 'paper', 'system']),
    accent: z.enum(ACCENTS),
    activeProjectLimit: z.number().int().min(1).max(50),
    focusTopicLimit: z.number().int().min(1).max(50),
    hidePrivate: z.boolean(),
    captureShortcut: str,
    ownerName: str,
  })
  .partial()

export const ExportFileZ = z.object({
  format: z.literal(FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: str.optional(),
  records: z.array(z.unknown()),
  links: z.array(z.unknown()).default([]),
  settings: z.unknown().optional(),
})

export interface ValidatedImport {
  records: AnyRecord[]
  links: Link[]
  settings: Partial<Settings> | null
  warnings: string[]
}

export type ImportResult = { ok: true; value: ValidatedImport } | { ok: false; errors: string[] }

/** Validates an already-migrated export object record by record; bad records are skipped, not fatal. */
export function validateImport(file: z.infer<typeof ExportFileZ>): ImportResult {
  const warnings: string[] = []
  const records: AnyRecord[] = []
  const seen = new Set<string>()
  file.records.forEach((raw, i) => {
    const p = BaseZ.safeParse(raw)
    if (!p.success) {
      warnings.push(`record #${i + 1} skipped: ${p.error.issues[0]?.path.join('.')} ${p.error.issues[0]?.message}`)
      return
    }
    if (seen.has(p.data.id)) {
      warnings.push(`record “${p.data.id}” appears twice; kept the first`)
      return
    }
    seen.add(p.data.id)
    const { data, ...base } = p.data
    const label = base.title || base.id
    records.push({ ...base, data: normaliseData(base.kind, data, (m) => warnings.push(`“${label}”: ${m}`)) } as AnyRecord)
  })
  const links: Link[] = []
  file.links.forEach((raw, i) => {
    const p = LinkZ.safeParse(raw)
    if (!p.success) warnings.push(`link #${i + 1} skipped: invalid`)
    else links.push(p.data)
  })
  let settings: Partial<Settings> | null = null
  if (file.settings !== undefined) {
    const s = SettingsZ.safeParse(file.settings)
    if (s.success) settings = s.data
    else warnings.push('settings were invalid and were ignored')
  }
  return { ok: true, value: { records, links, settings, warnings } }
}

export { DEFAULT_SETTINGS }
