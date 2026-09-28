# Apollonian vs Dionysian

An interactive exhibition in eight rooms on the two art-drives of Nietzsche's *The Birth of Tragedy* (1872).
React + Vite + Framer Motion + SVG (plus one canvas for the particle figure). No 3D.

```
npm install
npm run dev       # local dev server
npm run build     # static site in dist/
npm run preview   # serve dist/
```

`vite.config.js` uses a relative `base`, so `dist/` can be hosted from any path. On Vercel, import the
repository and set **Root Directory** to `apollonian-dionysian`. The framework preset is detected as Vite.

## Rooms

| #  | Room           | File                          | What moves                                                           |
| -- | -------------- | ----------------------------- | -------------------------------------------------------------------- |
| 01 | Entrance       | `src/sections/Hero.jsx`       | Gridded APOLLONIAN vs warped DIONYSIAN; circle and blob collide, follow the pointer |
| 02 | Two Forces     | `src/sections/TwoForces.jsx`  | Form/Boundary/Clarity/Measure opposite Becoming/Unity/Instinct/Ecstasy; hover pairs them |
| 03 | The Individual | `src/sections/Individual.jsx` | Pinned: a figure built on the 1:8 canon vs the same figure as particles, dissolving into a vortex |
| 04 | Spectrum       | `src/sections/Spectrum.jsx`   | Draggable (and keyboard) slider from perfect geometry to organic chaos |
| 05 | Nietzsche      | `src/sections/Nietzsche.jsx`  | The book, the two drives, the birth and death of tragedy, four key terms |
| 06 | Tragedy        | `src/sections/Tragedy.jsx`    | Pinned: chaotic chorus lines resolve into the plan of a Greek theatre |
| 07 | Synthesis      | `src/sections/Synthesis.jsx`  | Pinned: circle and blob merge; the circle starts to breathe, the blob takes a contour |
| 08 | Coda           | `src/sections/Finale.jsx`     | The two closing lines: one snaps to a grid, one keeps moving |

`src/lib/geom.js` holds the shared noise, path and colour helpers. `src/lib/figure.js` defines the figure
used by room 03. `src/lib/useLoop.js` runs frame loops only while their room is on screen.

Scroll-linked values use function transforms (`range()` in `geom.js`). Framer Motion can hand array
transforms of `opacity` to a native ScrollTimeline, which measures the sticky rooms incorrectly.

Motion follows `prefers-reduced-motion`: CSS loops stop, and the frame loops slow almost to a standstill.
Fonts (Archivo, Instrument Serif, JetBrains Mono) are self-hosted through Fontsource.
