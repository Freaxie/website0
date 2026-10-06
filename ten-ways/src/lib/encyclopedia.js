// The encyclopedia: one entry per archetype, in three files by order.
import one from './entries-1.js'
import two from './entries-2.js'
import three from './entries-3.js'

export const ENTRIES = { ...one, ...two, ...three }

// every dated moment, in order, with the archetype it belongs to
export const EVENTS = Object.entries(ENTRIES)
  .flatMap(([id, d]) => d.lineage.map(([year, label, text]) => ({ id, year, label, text })))
  .sort((a, b) => a.year - b.year)
