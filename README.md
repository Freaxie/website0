# The Cognitive Functions

One website for the four exhibitions: Ti/Te, Ni/Ne, Fi/Fe and Si/Se. A lobby at `/` leads into each room.
Alongside them, at `/observer`, is **The Observer**, an interactive laboratory on metacognition and sentience.

```
npm --prefix observer ci   # once, for The Observer
npm run build              # writes dist/
npx serve dist
```

| Route          | Source                                          |
| -------------- | ----------------------------------------------- |
| `/`            | `src/hub.html`, the lobby                       |
| `/ti-te.html`  | `exhibitions/ti-te.html`, Internal Coherence × External Effectiveness |
| `/ni-ne.html`  | `exhibitions/ni-ne.html`, Convergence × Divergence |
| `/fi-fe.html`  | `exhibitions/fi-fe.html`, Inner Values × Shared Values |
| `/si-se.html`  | `exhibitions/si-se.html`, Experience × Presence  |
| `/observer/`   | `observer/`, The Observer (React + Vite)        |

## Deploying to Vercel

`vercel.json` in this folder holds the whole setup (no framework preset; only The Observer has dependencies):

1. In Vercel, **Add New → Project** and import this repository.
2. Leave every setting at its default; `vercel.json` sets the install command, build command and output folder.
3. Deploy. The lobby is served at `/`, the rooms at `/ti-te`, `/ni-ne`, `/fi-fe` and `/si-se`, and The Observer
   at `/observer`.

Or, from a machine with the Vercel CLI: `vercel --prod`.

## How the rooms stay intact

The four exhibitions are compiled single-file React builds, copied here verbatim from their published
artifacts. They are not modified. `build.mjs` adds exactly one inline `<script>` to each, right after
`<head>`, from `src/exhibit-nav.js`. That script:

- renders the persistent navigation (← All Functions, plus Ti/Te · Ni/Ne · Fi/Fe · Si/Se) inside a
  **shadow root**, so no CSS passes between it and the exhibition in either direction;
- plays the arrival transition: the room's two colours part like doors;
- plays the exit transitions to the lobby or to another room.

Each room keeps its own document, fonts, stylesheet and React root. So no styles, globals or
animations can collide between exhibitions.

`src/pairs.json` is the single source for the pair names, rooms and colours used by the lobby and the nav.
`dist/hub.html` is the lobby as a page fragment, for hosting as a claude.ai Artifact with the four rooms as
sibling files.

## The Observer

“What is it like to be a mind that knows it is a mind?” A single-page React + Vite app in `observer/`: an opening,
ten sections and a closing mirror (the observer, metacognition, the strange loop, sentience, the qualia chamber, the self
model, attention, the predictive mind, “are you conscious?”, the machine). Every visual is procedural (Canvas 2D, one
WebGL shader in the qualia chamber, SVG) and every sound is synthesised with Web Audio once the visitor enters. Nothing
leaves the browser: the pointer path is kept in memory only to draw the closing mirror, and the only thing stored is the
sound on/off setting.

Statements are tagged as **empirical claim**, **theoretical model**, **philosophical argument** or **open question**.

```
cd observer
npm ci
npm run dev            # http://localhost:5173/observer/
npm run build          # writes ../dist/observer, served at /observer/
npm run build:single   # writes dist-single/observer.html, one self-contained file
```

| Path                   | What it holds                                                   |
| ---------------------- | --------------------------------------------------------------- |
| `src/App.jsx`          | the opening, the eyelid transition, section tracking, room tone |
| `src/sections/`        | one file per section                                            |
| `src/components/`      | HUD, statements and text effects, claim tags, atmosphere        |
| `src/lib/useCanvas.js` | canvas loop that only runs while its canvas is on screen        |
| `src/lib/audio.js`     | the synthesised drone and instruments                           |
| `src/lib/pointer.js`   | the one shared pointer every canvas reads                       |
