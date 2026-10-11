import { strToU8, zipSync } from 'fflate'
import { KIND_DEFS, LINK_LABELS } from '../domain/kinds'
import { displayTitle } from '../domain/factory'
import type { AnyRecord, Link, Settings } from '../domain/types'
import { migrate } from './migrations'
import { ExportFileZ, FORMAT, SCHEMA_VERSION, validateImport, type ImportResult } from './schema'

export interface ExportOptions {
  includePrivate: boolean
}

/**
 * The portable format: one JSON object, documented in docs/DATA_FORMAT.md.
 * { format: "krish-atlas", schemaVersion, exportedAt, records: [...], links: [...], settings }
 */
export function buildExport(records: AnyRecord[], links: Link[], settings: Settings, opts: ExportOptions) {
  const kept = opts.includePrivate ? records : records.filter((r) => !r.private)
  const ids = new Set(kept.map((r) => r.id))
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    records: kept,
    links: links.filter((l) => ids.has(l.from) && ids.has(l.to)),
    settings,
  }
}

export function parseBackup(text: string): ImportResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] }
  }
  if (!json || typeof json !== 'object') return { ok: false, errors: ['The file does not contain an object.'] }
  const { file, error } = migrate(json as Record<string, unknown>)
  if (error) return { ok: false, errors: [error] }
  const shape = ExportFileZ.safeParse(file)
  if (!shape.success)
    return {
      ok: false,
      errors: shape.error.issues.map((i) => `${i.path.join('.') || 'file'}: ${i.message}`),
    }
  return validateImport(shape.data)
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 60) || 'untitled'

const yaml = (v: unknown) => JSON.stringify(v) // JSON is valid YAML 1.2, and unambiguous

/** Markdown with front matter, one folder per kind, plus each record's connections as [[wikilinks]]. */
export function buildMarkdownZip(records: AnyRecord[], links: Link[], opts: ExportOptions): Uint8Array {
  const kept = opts.includePrivate ? records : records.filter((r) => !r.private)
  const byId = new Map(kept.map((r) => [r.id, r]))
  const files: Record<string, Uint8Array> = {}
  const used = new Set<string>()
  for (const r of kept) {
    const folder = KIND_DEFS[r.kind].plural.toLowerCase().replace(/[^a-z]+/g, '-')
    let name = `${folder}/${slug(displayTitle(r))}.md`
    if (used.has(name)) name = `${folder}/${slug(displayTitle(r))}-${r.id}.md`
    used.add(name)
    const front = [
      '---',
      `id: ${yaml(r.id)}`,
      `kind: ${yaml(r.kind)}`,
      `title: ${yaml(r.title)}`,
      `tags: ${yaml(r.tags)}`,
      `created: ${yaml(r.createdAt)}`,
      `updated: ${yaml(r.updatedAt)}`,
      `certainty: ${yaml(r.certainty)}`,
      `currency: ${yaml(r.currency)}`,
      `as_of: ${yaml(r.asOf)}`,
      `private: ${yaml(r.private)}`,
      `archived: ${yaml(r.archived)}`,
      `data: ${yaml(r.data)}`,
      '---',
      '',
    ]
    const conn = links
      .filter((l) => l.from === r.id && byId.has(l.to))
      .map((l) => `- ${LINK_LABELS[l.type].out}: [[${displayTitle(byId.get(l.to)!)}]]${l.note ? ` — ${l.note}` : ''}`)
    const text = `${front.join('\n')}# ${displayTitle(r)}\n\n${r.body}${conn.length ? `\n\n## Connections\n\n${conn.join('\n')}\n` : '\n'}`
    files[name] = strToU8(text)
  }
  files['README.md'] = strToU8(
    `# Atlas export\n\nExported ${new Date().toISOString()}.\n\nOne Markdown file per record, grouped by kind. Front matter values are JSON (valid YAML).\n` +
      `Stored relationships are listed under "Connections" as [[wikilinks]]. For a lossless backup that can be re-imported, use the JSON export.\n`,
  )
  return zipSync(files, { level: 6 })
}

export function download(name: string, data: string | Uint8Array, type: string) {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
