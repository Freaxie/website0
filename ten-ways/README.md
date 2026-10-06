# Twenty-Four Ways of Encountering Reality

An interactive encyclopedia and digital museum of twenty-four archetypal modes of being, arranged in six
orders of four. React + Vite + Framer Motion, SVG, canvas and CSS. (The folder keeps its first name: the
exhibition began with ten.)

```
npm install
npm run dev              # local development
npm run build            # static site in dist/
npm run build:artifact   # single-file page in artifact/index.html
```

## The taxonomy

Each order is defined by what its four ways attend to.

| Order | Attends to | Archetypes |
| --- | --- | --- |
| I · Knowing | the true | Scientist, Philosopher, Theologian, Detective |
| II · Making | the made | Engineer, Artist, Musician, Storyteller |
| III · Disciplines | the self | Warrior, Monk, Biohacker, Looksmaxxer |
| IV · The City | the shared order | Sovereign, Rebel, Entrepreneur, Trickster |
| V · Beholding | the given world | Explorer, Hedonist, Cinephile, Archivist |
| VI · Tending | the other | Healer, Teacher, Lover, Gardener |

The last four to be added (Healer, Teacher, Lover, Rebel) fill the gaps the first twenty left: almost
every other way faces the world, the self or the order, and none cared for another person, passed
understanding on, or bound itself to one other; the City had a ruler, a dealer and a mocker, but no one
who openly refuses.

## Rooms

1. **Entrance.** Twenty-four rays converge on REALITY. Point at a sign, or let them turn.
2. **The Atlas.** The twenty-four on two chosen axes out of five (Inward–Outward, Change–Order,
   Body–Mind, Alone–Together, Present–Future). Drag the YOU marker to find the archetype nearest you.
3. **The Twenty-Four.** An index by order, then twenty-four full-colour plates. Each plate has its
   question, instrument, gift, shadow, exemplars and a quotation, a live instrument, and a world behind it.
   Below each plate is an **encyclopedia entry** (`src/lib/entries-*.js`):
   - headword, etymology and definition
   - five numbered sections: Overview, History, Distinctions, Criticism, Now
   - a margin with its figure in myth, a lineage of eight dated moments, four figures with dates, five
     terms, practice and signs, five works of further reading, and cross-references to its kin
4. **One World, Twenty-Four Encounters.** A mountain, the sea or a stranger, redrawn by each archetype.
5. **Kinships.** Allies, opposites and unlikely unions (the warrior-monk, the philosopher-king, Ibn Sina
   the physician-philosopher, the mystics who spoke of God as a lover).
6. **Lineages.** All 192 dated moments on one logarithmic timeline, from a pig painted on a Sulawesi cave
   wall at least 45,000 years ago to a word coined online, with a reader and an era-filtered list.
7. **Your Constellation.** Answer eight questions, or spend thirty points by hand, and see your shape.
8. **Coda.** Twenty-four imperatives, and one sentence.

## Worlds

Each plate's top is a world with its own physics, and its own cursor and typography: an observatory, a
truss, a field of shards, a fogged map, ranks, blooms, a heart monitor, a mirror, a vine, a dark room
searched by torchlight, a wall of fading index cards, a network of vessels with a resting pulse, a
blackboard, two points that follow each other, ranks of bars that a click can crack
(`src/lib/worlds.js`, `worlds-more.js`, `worlds-four.js`; instruments in the matching `instruments*` files).

The world stops at the top of the plate. Nothing moves behind an encyclopedia entry, and over an entry
the cursor is an ordinary pointer again. Nothing interrupts reading or navigation: there are no
page-wide effects. Rare whispers appear when you do something in a world, once each.

Between plates, scrolling turns one world's geometry into the next (`src/lib/forms.js`). Everything
respects `prefers-reduced-motion`.

All archetype data lives in `src/lib/archetypes.js`. The atlas positions and kinships are a curator's
interpretation, not a measurement. The encyclopedia text was written for this exhibition; dates marked
c. are approximate, and the further-reading lists are places to begin rather than sources cited.
