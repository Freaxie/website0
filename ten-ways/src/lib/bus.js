// The exhibition's nervous system: a tiny event bus, and the memory of what the visitor has done.
// Whispers are shown once per visit; reactions should feel like discoveries, not notifications.

import { ARCHETYPES } from './archetypes.js'

const TOTAL = ARCHETYPES.length
const subs = new Set()

export const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const bus = {
  current: null, // the archetype whose world is on screen, or null
  seen: new Set(),
  experienced: new Set(),
  on(fn) {
    subs.add(fn)
    return () => subs.delete(fn)
  },
  emit(type, data) {
    subs.forEach((f) => f(type, data))
  },
  whisper(key, text, color) {
    if (this.seen.has(key)) return
    this.seen.add(key)
    this.emit('whisper', { text, color })
  },
  experience(id) {
    if (this.experienced.has(id)) return
    this.experienced.add(id)
    this.emit('experienced', id)
    if (this.experienced.size === TOTAL) this.emit('all')
  },
  // kept as a no-op so the places that report switching need not change
  switched() {},

}
