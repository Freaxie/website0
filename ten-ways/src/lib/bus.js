// The exhibition's nervous system: a tiny event bus, and the memory of what the visitor has done.
// Whispers are shown once per visit; reactions should feel like discoveries, not notifications.

const subs = new Set()

export const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const bus = {
  current: null, // the archetype whose world is on screen, or null
  seen: new Set(),
  experienced: new Set(),
  switches: [],
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
    if (this.experienced.size === 10) this.emit('all')
  },
  // rapid switching between archetypes wakes the trickster
  switched() {
    const now = performance.now()
    this.switches = this.switches.filter((t) => now - t < 4000)
    this.switches.push(now)
    if (this.switches.length >= 8) {
      this.switches = []
      this.emit('trick')
    }
  },
}
