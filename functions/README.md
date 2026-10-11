# The Cognitive Functions

One exhibition in four rooms: Ti/Te, Ni/Ne, Fi/Fe and Si/Se, with a lobby. Served at `/functions/`.

`functions/build.mjs` runs after the Vite build and writes `dist/functions/`:

| Route | Source |
| --- | --- |
| `/functions/` | `hub.html`, the lobby |
| `/functions/ti-te` | `exhibitions/ti-te.html`, Internal Coherence × External Effectiveness |
| `/functions/ni-ne` | `exhibitions/ni-ne.html`, Convergence × Divergence |
| `/functions/fi-fe` | `exhibitions/fi-fe.html`, Inner Values × Shared Values |
| `/functions/si-se` | `exhibitions/si-se.html`, Experience × Presence |

The old root URLs (`/ti-te`, `/ti-te.html`, …) redirect permanently to these.

## How the rooms stay intact

The four exhibitions are compiled single-file React builds, copied verbatim from their published artifacts and
never modified. The build adds exactly one inline `<script>` to each, right after `<head>`, from
`exhibit-nav.js`. That script renders the persistent navigation inside a **shadow root** (no CSS passes in either
direction) and plays the room transitions. All links are relative, so the sub-folder needs no rewriting.

`pairs.json` is the single source for the pair names, rooms and colours used by the lobby and the nav.
`dist/functions/hub.html` is the lobby as a page fragment, for hosting as a claude.ai Artifact.
