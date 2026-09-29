# Oracle vs Algorithm

An interactive exhibition in seven rooms on two ways of facing the future: reading it, or reckoning it.
Intuition and computation, interpretation and prediction, mystery and measurement, with no winner declared.
React + Vite + Framer Motion, SVG, canvas and CSS.

```
npm install
npm run dev              # local development
npm run build            # static site in dist/
npm run build:artifact   # single-file page in artifact/index.html
```

## Rooms

1. **Entrance.** Obsidian and gold on one side, a white grid on the other. Move through the stars and a
   constellation forms around your hand; move across the grid and the distribution follows you.
2. **Oppositions.** Intuition / Computation, Interpretation / Prediction, Mystery / Measurement,
   Symbol / Data, Ritual / Procedure.
3. **Transmutation.** A pinned scroll: the twelve signs on their wheel come apart into points, and the
   points settle into a computational grid as the wall turns from obsidian to white.
4. **What Happens Next?** Ask a question. The oracle draws three signs and reads them; the algorithm gives
   P(yes), an interval, a distribution and feature weights. Both are generated from the question's
   letters by the same rule, and the room says so.
5. **Two Roads to the Future.** A horizontal timeline in two lanes, from Shang oracle bones to language
   models, marking where the roads touch: the Babylonian diaries, Leibniz reading the I Ching as binary.
6. **Failure Modes.** Pattern where there is none: the oracle finds a constellation in every random sky
   (apophenia). Prediction without understanding: Russell's chicken, whose confidence rises every day
   by Laplace's rule of succession, until the day it is wrong.
7. **Reality Decides.** Oracle interprets. Algorithm calculates. Reality decides.

The twelve signs were invented for this exhibition and belong to no tradition (`src/lib/glyphs.js`).
