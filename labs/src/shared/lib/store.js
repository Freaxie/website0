import { useSyncExternalStore } from 'react'

// A tiny global store: which section is in view, and a few things the visitor did.
const state = {
  section: null, // id of the section under the viewport's centre
  sectionSince: performance.now(),
  hud: 'on', // 'on' | 'dim' | 'off'
  hudTitle: '',
  entered: 0,
}
const subs = new Set()

export const getState = () => state
export function setState(patch) {
  let changed = false
  for (const k in patch) {
    if (state[k] !== patch[k]) {
      state[k] = patch[k]
      changed = true
    }
  }
  if ('section' in patch && changed) state.sectionSince = performance.now()
  if (changed) subs.forEach((f) => f())
}
export const subscribe = (f) => (subs.add(f), () => subs.delete(f))

export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state))
}
