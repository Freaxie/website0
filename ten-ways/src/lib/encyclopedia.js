// The encyclopedia: one entry per archetype, in three files by order.
import one from './entries-1.js'
import two from './entries-2.js'
import three from './entries-3.js'
import extraOne from './extras-1.js'
import extraTwo from './extras-2.js'
import days from './days.js'

// each entry joins its encyclopedia text with its extras (a scene, curiosities, myths and a field guide)
// and a day in its life
const BASE = { ...one, ...two, ...three }
const EXTRA = { ...extraOne, ...extraTwo }
export const ENTRIES = Object.fromEntries(Object.entries(BASE).map(([id, e]) => [id, { ...e, ...EXTRA[id], day: days[id] }]))

// every dated moment, in order, with the archetype it belongs to
export const EVENTS = Object.entries(ENTRIES)
  .flatMap(([id, d]) => d.lineage.map(([year, label, text]) => ({ id, year, label, text })))
  .sort((a, b) => a.year - b.year)
