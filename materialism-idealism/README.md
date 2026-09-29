# Materialism & Idealism

An interactive exhibition in eight rooms on materialism and idealism, from Democritus and Berkeley to Marx and
Chalmers. The sixth in the series, built the same way as the others: React + Vite + Framer Motion + SVG (and canvas
for the atoms and the two descriptions), no 3D. Matter is cadmium yellow on carbon, set in heavy block capitals;
mind is ultramarine on pearl, set in a serif that appears only where you look.

```
npm install
npm run dev              # local dev server
npm run build            # static site in dist/
npm run build:artifact   # one self-contained page in artifact/index.html, for claude.ai Artifacts
```

On Vercel, import the repository and set **Root Directory** to `materialism-idealism`.

## Rooms

| #  | Room                     | File                               | What moves                                                               |
| -- | ------------------------ | ---------------------------------- | ------------------------------------------------------------------------ |
| 01 | Entrance                 | `src/sections/Hero.jsx`            | Atoms in a void that your pointer knocks around; “Idealism” is fully there only inside your lamp |
| 02 | Two Foundations          | `src/sections/Foundations.jsx`     | Atom/Idea, Body/Mind, Object/Perception, Mechanism/Meaning               |
| 03 | Atoms & Void             | `src/sections/Atoms.jsx`           | Pinned: sweet, bitter, hot, cold and colour dissolve into atoms (Democritus, Locke, Berkeley) |
| 04 | To Be Is to Be Perceived | `src/sections/Perceived.jsx`       | A still life seen only inside your lamp; switch between Berkeley, the materialist, and Berkeley’s God |
| 05 | Leibniz’s Mill           | `src/sections/Mill.jsx`            | Pinned: zoom into a thinking machine and find only gears; the hard problem |
| 06 | The Long Dispute         | `src/sections/Dispute.jsx`         | A rally across the net from Democritus to the 2020 PhilPapers survey     |
| 07 | Two Descriptions         | `src/sections/TwoDescriptions.jsx` | Drag a line between the physics of seeing red and the red itself         |
| 08 | Coda                     | `src/sections/Finale.jsx`          | “Mind is something matter does.” / “Matter is something mind finds.”     |
