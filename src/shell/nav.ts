import { SECTIONS, type SectionKey } from '../domain/kinds'

/** Primary destinations, in sidebar order. "g" + key jumps to each. */
export const NAV: { section: SectionKey; key: string; group: string }[] = [
  { section: 'home', key: 'h', group: '' },
  { section: 'inbox', key: 'i', group: '' },
  { section: 'identity', key: 'y', group: 'Mind' },
  { section: 'atlas', key: 'a', group: 'Mind' },
  { section: 'graph', key: 'm', group: 'Mind' },
  { section: 'learning', key: 'l', group: 'Mind' },
  { section: 'projects', key: 'p', group: 'Make' },
  { section: 'life', key: 's', group: 'Life' },
  { section: 'review', key: 'r', group: 'Life' },
  { section: 'library', key: 'b', group: 'Records' },
  { section: 'timeline', key: 't', group: 'Records' },
  { section: 'index', key: 'x', group: 'Records' },
  { section: 'settings', key: ',', group: '' },
]

export const sectionForPath = (path: string) =>
  Object.values(SECTIONS).find((s) => s.path !== '/' && path.startsWith(s.path)) ?? (path === '/' ? SECTIONS.home : null)
