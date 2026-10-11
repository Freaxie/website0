# Architecture

```
src/
  domain/   pure logic: types, kind definitions, factories, dates, wikilinks, graph, search, signals
  data/     IndexedDB access, import/export, validation (zod), migrations
  store/    zustand store (in-memory mirror + write-through persistence), hooks, UI state
  seed/     the public seed
  shell/    layout, navigation, command palette, quick capture, shortcuts
  ui/       reusable components: editor, markdown, fields, connections, pickers, charts
  pages/    one file per section, plus the generic record page
  styles/   tokens.css (themes), base.css, components.css, pages.css
functions/  The Cognitive Functions exhibition and its build script
scripts/    build-time privacy check
e2e/        Playwright: acceptance criteria, mobile, accessibility (axe)
```

## Why local-first IndexedDB

For one person on one device it gives instant reads and writes, works offline, needs no server or account,
and keeps sensitive data off any third party. The costs: no sync between devices, and data lives only as long
as the browser keeps it. Mitigations: export (JSON and Markdown), a request for persistent storage in
Settings, and an unload guard while a save is in flight.

Data is small (thousands of records at most), so the whole store is loaded into memory at start. Search
(MiniSearch) and the graph index are rebuilt from that state and memoised per state object.

## Records and links

A record is a discriminated union over `kind`: a shared base plus typed `data`. Relationships are a separate
`Link` table, so backlinks and traversal work across all kinds. The graph index (`domain/graph.ts`) combines
stored links, `[[wikilink]]` mentions and task membership; every edge comes from real data.

Kinds are declared once in `domain/kinds.ts` (label, icon, section, defaults, editable fields). The record page
renders any kind from that declaration, with a few kind-specific panels (project tasks, topic status track,
capture filing, review, competing hypotheses).

## Saving

Editors keep a local draft and hand it to the store after a short pause, on blur, when the page is hidden, and
on unmount (`ui/useDraft.ts`). Each store mutation writes the affected rows in one IndexedDB transaction and
updates the save indicator. Other tabs reload from IndexedDB when told over `BroadcastChannel`.

## Adding sync later

The cleanest path is to keep IndexedDB as the primary store and add a sync layer that pushes and pulls
changed rows (records and links already have stable ids and `updatedAt`). That needs a backend with real
authentication and per-user access control; see PRIVACY.md. It isn't built because it adds a server, an
account and a security surface, and the single-device workflow should prove itself first.
