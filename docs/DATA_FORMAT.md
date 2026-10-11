# Data format

The JSON export is the complete, lossless backup. It is plain JSON, so nothing is locked in.

```jsonc
{
  "format": "krish-atlas",       // always this string
  "schemaVersion": 1,            // bumped when the record shape changes; older files are migrated on import
  "exportedAt": "2026-10-11T12:00:00.000Z",
  "records": [ /* Record */ ],
  "links":   [ /* Link */ ],
  "settings": { /* optional */ }
}
```

## Record

Every record has the same base fields and a `data` object whose shape depends on `kind`.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable identifier. Never reused. |
| `kind` | string | `page`, `topic`, `note`, `project`, `task`, `resource`, `person`, `goal`, `skill`, `question`, `observation`, `hypothesis`, `experiment`, `archetype`, `path`, `event`, `review`, `capture`, `routine`, `log`, `medication`, `item` |
| `title` | string | |
| `body` | string | Markdown. `[[Title]]` or `[[Title\|label]]` links another record by title. |
| `tags` | string[] | Lower-case. |
| `createdAt`, `updatedAt` | ISO timestamp | |
| `origin` | string | `seed` (public handoff), `seed-private` (private handoff), `user`, `capture`, `import` |
| `certainty` | string \| null | `fact`, `report`, `inference`, `suspicion`, `hypothesis`, `aspiration`, or null (no claim) |
| `currency` | string | `current`, `historical`, `unverified` |
| `asOf` | partial date \| null | When the information was observed or true: `"2026"`, `"2026-10"` or `"2026-10-11"` |
| `private` | boolean | Excluded from public exports; hidden by the privacy screen |
| `pinned`, `archived` | boolean | |
| `data` | object | Kind-specific fields. The authoritative list with defaults is `KIND_DEFS` in `src/domain/kinds.ts`; types are in `src/domain/types.ts`. |

Partial dates are used wherever a date may be only partly known. A missing date is `null`; nothing is
ever guessed.

## Link

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | |
| `from`, `to` | record id | Direction matters for asymmetric types. |
| `type` | string | `related`, `depends_on`, `part_of`, `supports`, `contradicts`, `applies_to`, `inspired_by`, `used_in`, `learned_from` |
| `note` | string | Optional explanation. |
| `createdAt` | ISO timestamp | |

Wikilink mentions and task → project membership are *derived* from records and are not stored as links.

## Import rules

- The file must be valid JSON with `format: "krish-atlas"` and a `schemaVersion` this app can read.
  Newer files are rejected rather than half-read.
- Each record is validated on its own. A record with a missing id or unknown kind is skipped; a field with
  the wrong shape is reset to its default. Every repair is reported before anything is written.
- **Merge** upserts by id (a record in the file replaces the one with the same id). **Replace** clears
  everything first and asks for confirmation.
- Links whose endpoints don't exist after the import are dropped and counted.

## Changing the format

Bump `SCHEMA_VERSION` in `src/data/schema.ts` and add a step to `src/data/migrations.ts` that turns a
version-n file into version n + 1. Never edit an existing step. The IndexedDB structure has its own version in
`src/data/db.ts` for store/index changes.

## Markdown export

A zip with one `.md` file per record, grouped into folders by kind. Front matter values are JSON (valid YAML).
Stored links are listed under a "Connections" heading as `[[wikilinks]]`. It is a readable copy; for a backup
that can be re-imported, use JSON.
