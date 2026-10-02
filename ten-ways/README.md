# Ten Ways of Encountering Reality

An interactive atlas and digital museum of ten archetypal modes of being: Scientist, Engineer, Warrior,
Artist, Philosopher, Explorer, Monk, Sovereign, Hedonist and Trickster. React + Vite + Framer Motion,
SVG, canvas and CSS.

```
npm install
npm run dev              # local development
npm run build            # static site in dist/
npm run build:artifact   # single-file page in artifact/index.html
```

## Rooms

1. **Entrance.** Ten rays converge on REALITY, carrying streams of coloured particles. Point at a sign, or let them turn: "To understand it",
   "To build it", each verb set in its archetype's own type.
2. **The Atlas.** A map of the ten on two chosen axes out of five (Inward–Outward, Change–Order,
   Body–Mind, Alone–Together, Present–Future). Change an axis and they move. Drag the YOU marker to
   find the archetype nearest you.
3. **The Ten.** Ten full-colour plates, each with its question, instrument, gift, shadow, exemplars and a
   quotation, and a live instrument:
   the Scientist fits a line to your observations; the Engineer's truss sags under a moving load; the
   Warrior cuts a current; the Artist's marks are answered five more times; the Philosopher's statement
   grows questions; the Explorer clears fog from a map; the Monk's circle forms only in stillness; the
   Sovereign's crowd falls into ranks; the Hedonist's touches bloom and fade; the Trickster's sentence
   comes undone.
   Every plate has a shadow switch that turns its colours, instrument and name inside out, a mirrored
   reflection of its name, and its sign turning slowly behind it. A spectrum bar of the ten colours rides
   along the top while you walk the plates.
4. **One World, Ten Encounters.** A mountain, the sea or a stranger, redrawn by each of the ten: measured,
   blueprinted, climbed, painted, questioned, explored, let go of, partitioned, savoured and turned over.
5. **Kinships.** A ring of allies, opposites and unlikely unions (the warrior-monk, the philosopher-king).
6. **Your Constellation.** Answer seven questions, or spend fifteen points by hand, and see your shape.
7. **Coda.** Ten imperatives, and one sentence.

## Ten physical laws

Each plate is a world as well as a page. Behind its text runs an environment with its own physics
(`src/lib/worlds.js`): an observatory where clicked bodies become observations and a model emerges; a
floating truss with gears whose nodes can be grabbed; a field of shards a fast cursor cuts in two; a
canvas whose symmetry grows with every stroke; statements that sprout questions; a fogged map lit by a
lantern; one breathing circle that ripples when disturbed; a crowd that falls into ranks, rings, wedges or
columns; blooms of light; a floor that glitches by rows and twists around the cursor.

- **Cursor.** Inside a plate the pointer becomes that world's instrument: a crosshair, a node, a blade
  that turns with the stroke, a brush, a question mark, a lantern, a breathing ring, a diamond, a bloom,
  a split square.
- **Typography.** Each name enters and behaves the way its archetype moves: the scientist's letters settle
  onto a grid, the engineer's lock in, the warrior's snap, the artist's flow like ink, the philosopher's
  are typed, the monk's breathe, the sovereign's arrive as one rank, the trickster's scramble.
- **Passages.** Between plates, scrolling turns one world's geometry into the next (`src/lib/forms.js`).
  Any link to a plate plays a passage first: equations come apart into particles and settle as ink;
  blades freeze into silence and leave one circle.
- **Whispers.** Rare lines appear when the site notices how you behave. Each appears once.
- **Secrets.** Not listed here.

Everything respects `prefers-reduced-motion`: worlds slow almost to a stop, and passages are skipped.

All data lives in `src/lib/archetypes.js`; the instruments in `src/lib/instruments.js`. The atlas
positions and kinships are a curator's interpretation, not a measurement.
