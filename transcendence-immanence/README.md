# Transcendence & Immanence

An interactive exhibition in eight rooms on transcendence and immanence, the beyond and the within,
from Plato's Good "beyond being" to Deleuze's plane of immanence. The fourth in the series after
`../apollonian-dionysian/`, `../space-time/` and `../being-becoming/`, built the same way:
React + Vite + Framer Motion + SVG (and canvas for the grain), no 3D.

```
npm install
npm run dev              # local dev server
npm run build            # static site in dist/
npm run build:artifact   # one self-contained page in artifact/index.html, for claude.ai Artifacts
```

On Vercel, import the repository and set **Root Directory** to `transcendence-immanence`.

## Rooms

| #  | Room               | File                             | What moves                                                              |
| -- | ------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| 01 | Entrance           | `src/sections/Hero.jsx`          | Rays converge on a point above the frame that withdraws as you reach for it; a ground network grows toward the pointer |
| 02 | Two Directions     | `src/sections/Directions.jsx`    | Beyond/Within, Above/Among, Apart/Throughout, Other/Here                |
| 03 | The Ladder         | `src/sections/Ladder.jsx`        | Pinned: Diotima's ladder of love from the Symposium, climbing out of the frame |
| 04 | Tree & Rhizome     | `src/sections/Rhizome.jsx`       | Plant nodes; switch the same nodes between a rooted tree and a flat rhizome |
| 05 | Where Is It?       | `src/sections/Divine.jsx`        | Slider through deism, classical theism, panentheism and pantheism       |
| 06 | Heights            | `src/sections/Strata.jsx`        | Thinkers placed at the height where they locate what matters most       |
| 07 | A World in a Grain | `src/sections/GrainOfSand.jsx`   | Pinned: an endless self-similar zoom into a grain, after Blake          |
| 08 | Coda               | `src/sections/Finale.jsx`        | "There is more than this." / "There is more in this."                   |
