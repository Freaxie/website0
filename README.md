# The Cognitive Functions

One website for the four exhibitions: Ti/Te, Ni/Ne, Fi/Fe and Si/Se. A lobby at `/` leads into each room.
Alongside them are two interactive laboratories built from `labs/`: **The Observer** at `/observer`, on
metacognition and sentience, and **The Leap** at `/intuition`, on extraverted (Ne) and introverted (Ni) intuition.

```
npm --prefix labs ci   # once, for the laboratories
npm run build          # writes dist/
npx serve dist
```

| Route          | Source                                          |
| -------------- | ----------------------------------------------- |
| `/`            | `src/hub.html`, the lobby                       |
| `/ti-te.html`  | `exhibitions/ti-te.html`, Internal Coherence × External Effectiveness |
| `/ni-ne.html`  | `exhibitions/ni-ne.html`, Convergence × Divergence |
| `/fi-fe.html`  | `exhibitions/fi-fe.html`, Inner Values × Shared Values |
| `/si-se.html`  | `exhibitions/si-se.html`, Experience × Presence  |
| `/observer/`   | `labs/`, The Observer (React + Vite)            |
| `/intuition/`  | `labs/`, The Leap (React + Vite)                |

## Deploying to Vercel

`vercel.json` in this folder holds the whole setup (no framework preset; only `labs/` has dependencies):

1. In Vercel, **Add New → Project** and import this repository.
2. Leave every setting at its default; `vercel.json` sets the install command, build command and output folder.
3. Deploy. The lobby is served at `/`, the rooms at `/ti-te`, `/ni-ne`, `/fi-fe` and `/si-se`, The Observer
   at `/observer` and The Leap at `/intuition`.

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

## The laboratories

Two single-page React + Vite experiences in `labs/`, built as one multi-page project that shares its engine: the
HUD, the canvas loop, the synthesised sound, the text effects and the claim tags. Every visual is procedural (Canvas
2D, one WebGL shader, SVG) and every sound is made with Web Audio once the visitor enters. Nothing leaves the browser:
the pointer is read only to animate the page, and the only thing stored is the sound on/off setting. Statements are
tagged as **empirical claim**, **theoretical model**, **philosophical argument** or **open question**.

- **The Observer** (`/observer`): “What is it like to be a mind that knows it is a mind?” An opening, ten sections
  and a closing mirror: recursive observers, metacognition, the strange loop, sentience, the qualia chamber, the self
  model, attention, the predictive mind, “are you conscious?”, the machine.
- **The Leap** (`/intuition`): extraverted intuition (Ne) branching outward, introverted intuition (Ni) converging
  inward. The gap, two directions, outward (an alternative-uses test), inward (remote associates, with one problem
  set aside to incubate until the end), shadows (pattern in noise, the door that never closes), which way (not a
  type test) and the return. It uses the Ni violet and Ne lime from `src/pairs.json`, and sits alongside the
  existing `/ni-ne` room rather than replacing it.

```
cd labs
npm ci
npm run dev                         # http://localhost:5173/observer/ and /intuition/
npm run build                       # writes ../dist/observer, ../dist/intuition and ../dist/labs-assets
PAGE=intuition npm run build:single  # writes dist-single/intuition.html, one self-contained file
```

| Path                     | What it holds                                               |
| ------------------------ | ----------------------------------------------------------- |
| `observer/index.html`    | The Observer's page; `intuition/index.html` is The Leap's   |
| `src/observer/`          | The Observer: app shell, one file per section, its styles   |
| `src/intuition/`         | The Leap: app shell, one file per section, its styles       |
| `src/shared/components/` | HUD, eyelid shell, statements and text effects, claim tags  |
| `src/shared/lib/`        | canvas loop, pointer, synthesised sound, noise, small store |
