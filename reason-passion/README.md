# Reason & Passion

An interactive exhibition in eight rooms on reason and passion, from Plato and Hume to Kahneman and Nussbaum.
The fifth in the series, built the same way as the others: React + Vite + Framer Motion + SVG (and canvas for
the overprint), no 3D. The two sides are two printing inks: process cyan for reason, magenta for passion.
Where they overlap, they overprint.

```
npm install
npm run dev              # local dev server
npm run build            # static site in dist/
npm run build:artifact   # one self-contained page in artifact/index.html, for claude.ai Artifacts
```

On Vercel, import the repository and set **Root Directory** to `reason-passion`.

## Rooms

| #  | Room                | File                         | What moves                                                                  |
| -- | ------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| 01 | Entrance            | `src/sections/Hero.jsx`      | A proof draws itself; a heart beats, faster when you move quickly; PASSION swells on each beat |
| 02 | Two Faculties       | `src/sections/Faculties.jsx` | Deliberation/Impulse, Principle/Desire, Clarity/Intensity, Distance/Attachment |
| 03 | The Missing Premise | `src/sections/Premise.jsx`   | Pinned: a practical syllogism fails until a want is added (Hume)            |
| 04 | Fast & Slow         | `src/sections/FastSlow.jsx`  | Frederick's three Cognitive Reflection Test questions, timed                |
| 05 | Prudential Algebra  | `src/sections/Algebra.jsx`   | Franklin's 1772 method on a live balance; strike equal weights, or weigh without feelings |
| 06 | The Long Quarrel    | `src/sections/Quarrel.jsx`   | Eleven thinkers on one gauge from “reason rules” to “passion rules”          |
| 07 | Overprint           | `src/sections/Overprint.jsx` | Pinned: two halftone plates come into register; the word appears only where both inks fall |
| 08 | Coda                | `src/sections/Finale.jsx`    | “Reason shows the way.” / “Passion makes us go.”                            |
