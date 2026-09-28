# Space & Time

An interactive exhibition in eight rooms on space and time, from Augustine to general relativity.
A companion to `../apollonian-dionysian/`, built the same way: React + Vite + Framer Motion + SVG, no 3D.

```
npm install
npm run dev              # local dev server
npm run build            # static site in dist/
npm run build:artifact   # one self-contained page in artifact/index.html, for claude.ai Artifacts
```

On Vercel, import the repository and set **Root Directory** to `space-time`.

## Rooms

| #  | Room            | File                          | What moves                                                              |
| -- | --------------- | ----------------------------- | ----------------------------------------------------------------------- |
| 01 | Entrance        | `src/sections/Hero.jsx`       | SPACE on a coordinate lattice (the pointer reads its coordinates); TIME with afterimages; a clock sector showing the real current minute |
| 02 | Two Axes        | `src/sections/TwoAxes.jsx`    | Here/Now, There/Then, Beside/After, Distance/Duration; hover pairs them |
| 03 | The Frozen Leap | `src/sections/Chrono.jsx`     | Pinned: Marey-style frames of a leap, then a wipe into Bergson's continuous durée |
| 04 | Velocity        | `src/sections/Relativity.jsx` | Slider from rest to 0.995 c: rod contraction, a slowed clock, Minkowski axes folding; real γ values |
| 05 | A Timeline      | `src/sections/Thinkers.jsx`   | Pinned horizontal scroll: Augustine, Newton, Leibniz, Kant, Bergson, Einstein, Minkowski |
| 06 | Spacetime       | `src/sections/Spacetime.jsx`  | Pinned: Newton's stage and river merge into worldlines and a light cone |
| 07 | Here, Now       | `src/sections/HereNow.jsx`    | Move your event; 72 others sort into your past, your future, or elsewhere |
| 08 | Coda            | `src/sections/Finale.jsx`     | One line arrives all at once, the other one letter at a time            |

Scroll-linked values use function transforms (`range()` in `src/lib/geom.js`) rather than array
transforms, which Framer Motion may hand to a native ScrollTimeline that mis-measures pinned rooms.
