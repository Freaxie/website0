import { useSyncExternalStore } from 'react'

// A tiny global store: which section is in view, and a few things the visitor did.
const state = {
  section: null, // id of the section under the viewport's centre
  sectionSince: performance.now(),
  hud: 'on', // 'on' | 'dim' | 'off'
  hudTitle: 'THE OBSERVER',
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

export const SECTIONS = [
  { id: 'observer', n: '01', name: 'The Observer' },
  { id: 'metacognition', n: '02', name: 'Metacognition' },
  { id: 'loop', n: '03', name: 'The Strange Loop' },
  { id: 'sentience', n: '04', name: 'Sentience' },
  { id: 'qualia', n: '05', name: 'The Qualia Chamber' },
  { id: 'self', n: '06', name: 'The Self Model' },
  { id: 'attention', n: '07', name: 'Attention' },
  { id: 'predictive', n: '08', name: 'The Predictive Mind' },
  { id: 'conscious', n: '09', name: 'Are You Conscious?' },
  { id: 'machine', n: '10', name: 'The Machine' },
  { id: 'mirror', n: '∞', name: 'The Mirror' },
]
