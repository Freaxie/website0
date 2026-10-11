# Atlas

A personal wiki, knowledge graph and life OS: one place to see and connect goals, knowledge, identity,
projects and action. Built for one person (Krish), local-first, and private by construction.

> Explore broadly. Organize rigorously. Execute selectively. Preserve curiosity.
> Build a coherent life through accumulated action.

The repository also hosts **The Cognitive Functions**, an exhibition in four rooms, now served at
[`/functions/`](functions/README.md).

## Run it

```
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck → Vite build → exhibition → privacy check, into dist/
npm run preview      # serve dist/ on :4173
npm test             # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright): acceptance, mobile, accessibility
npm run lint
```

## What's where

| Route | Section | What it is for |
| --- | --- | --- |
| `/` | Observatory | What matters now: focus, next actions, active projects, learning threads, honest signals, the week |
| `/inbox` | Inbox | Quick captures waiting to be filed |
| `/identity` | Identity Lab | Possible selves and their parts, the integration board, observations, competing explanations, experiments |
| `/atlas` | Knowledge Atlas | Every subject as a page, grouped by domain, with interest status and understanding |
| `/graph` | Graph | Interactive knowledge graph: search, filter, neighbourhoods, path finding, unconnected records, list view |
| `/learning` | Learning Studio | The output ladder, learning paths with evidence, review queue, knowledge gaps, skills |
| `/projects` | Project Forge | Active projects with next actions; backlog, paused, finished and deliberately ended work |
| `/life` | Life Systems | Goals, routines, fitness, health & care, social practice, environment & tools |
| `/library` | Library | Books and other sources, with arguments, disagreements and whether they changed anything |
| `/timeline` | Timeline | Dated events (undated ones are kept apart, never guessed) |
| `/review` | Review Room | Weekly and monthly reviews that end in concrete changes |
| `/index` | Index | Every record in one dense, filterable table |
| `/r/:id` | Record | Any record: text, kind-specific fields, typed connections, backlinks |

**Keyboard:** `Ctrl/⌘ K` search and commands · `c` quick capture (configurable) · `Alt N` new note ·
`/` search · `g` + letter to jump · `e` edit · `Esc` close or leave the editor · `?` all shortcuts.

## How it works

- **Stack:** Vite, React 18, TypeScript (strict), React Router, zustand, plain CSS with design tokens.
  Libraries: `idb` (IndexedDB), `minisearch` (search), `zod` (import validation), `marked` + `DOMPurify`
  (Markdown), `react-force-graph-2d` (graph, lazy-loaded), `d3-force` (mini-map), `fflate` (Markdown zip).
  Fonts are self-hosted, so the app makes no third-party requests.
- **Persistence:** local-first. Every record and link lives in this browser's IndexedDB. The in-memory store
  writes through on each change (debounced while typing) and shows its state in the top bar. Tabs stay in
  sync over a `BroadcastChannel`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Data model:** typed records (`topic`, `note`, `project`, `task`, `resource`, `goal`, `observation`,
  `hypothesis`, `experiment`, `archetype`, `path`, `event`, `review`, …) plus a separate table of typed links.
  `[[wikilinks]]` in any text become graph edges and backlinks. Every record says how sure it is
  (*fact, report, inference, suspicion, hypothesis, aspiration*) and whether it still holds
  (*current, historical, unverified*).
- **Portable data:** JSON export/import with validation and migrations ([docs/DATA_FORMAT.md](docs/DATA_FORMAT.md)),
  plus a Markdown export.

## Privacy

This repository is **public**, and so is the deployed site. Only the *public seed* (topics, projects,
learning paths, possible selves) is committed and bundled. Health, medication, family, finances,
psychological notes and body measurements live in a private import file that is **never committed and never
bundled**; `npm run build` fails if any of its text shows up in `dist/`. Details: [docs/PRIVACY.md](docs/PRIVACY.md).

## Deploying

`vercel.json` holds the setup: `npm run build`, output `dist/`, SPA rewrites for the app, `/functions/` for the
exhibition, and permanent redirects from the exhibition's old URLs (`/ti-te` → `/functions/ti-te`, etc.).

The deployed site has no server and no accounts: each visitor's browser starts from the public seed, and
nothing anyone types leaves their browser. That also means **no sync between devices**. Use export/import to
move data until a sync backend exists (see the architecture notes for what that would take).
