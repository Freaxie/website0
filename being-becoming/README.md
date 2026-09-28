# Being & Becoming

An interactive exhibition in eight rooms on being and becoming, from Parmenides and Heraclitus to Whitehead.
The third in the series after `../apollonian-dionysian/` and `../space-time/`, built the same way:
React + Vite + Framer Motion + SVG (and canvas for the river and the ring), no 3D.

```
npm install
npm run dev              # local dev server
npm run build            # static site in dist/
npm run build:artifact   # one self-contained page in artifact/index.html, for claude.ai Artifacts
```

On Vercel, import the repository and set **Root Directory** to `being-becoming`.

## Rooms

| #  | Room              | File                        | What moves                                                               |
| -- | ----------------- | --------------------------- | ------------------------------------------------------------------------ |
| 01 | Entrance          | `src/sections/Hero.jsx`     | BEING and Parmenides' sphere never move and ignore the pointer; BECOMING's letters keep changing width and weight beside a flame |
| 02 | Two Fragments     | `src/sections/Fragments.jsx`| Permanence/Change, Unity/Multiplicity, Identity/Difference, Rest/Motion  |
| 03 | The River         | `src/sections/River.jsx`    | Click to step in; the page records which drops touched you and compares with your last step |
| 04 | Zeno’s Wall       | `src/sections/Paradox.jsx`  | Cross half of what remains, forever; a magnifier shows the gap looks the same at every scale |
| 05 | The Ship          | `src/sections/Ship.jsx`     | Pinned: planks replaced one by one, then the old ones rebuilt into a second ship (Plutarch, Hobbes) |
| 06 | The Long Argument | `src/sections/Argument.jsx` | Thinkers placed left, centre or right by which side they lean toward      |
| 07 | Form in Flux      | `src/sections/Flame.jsx`    | A ring of short-lived sparks, all constantly replaced; disturb it and it re-forms |
| 08 | Coda              | `src/sections/Finale.jsx`   | “Being is what stays.” / “Becoming is how anything stays.”               |
