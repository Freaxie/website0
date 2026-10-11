import type { IconName } from '../domain/kinds'

/** A small hand-drawn stroke icon set on a 20px grid. */
const PATHS: Record<IconName, string> = {
  home: 'M10 3.5 3.5 9v7.5h4.5v-4.5h4v4.5h4.5V9z',
  atlas: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM3 10h14M10 3c2 2 3 4.3 3 7s-1 5-3 7M10 3C8 5 7 7.3 7 10s1 5 3 7',
  graph: 'M5 5.5a1.75 1.75 0 1 0 0-.01M15 4.5a1.75 1.75 0 1 0 0-.01M10.5 15.5a1.75 1.75 0 1 0 0-.01M6.5 6.3l2.9 7.6M13.6 5.6l-2.4 8.2M6.7 5.3l6.6-.6',
  identity: 'M10 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 16.5c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5',
  learning: 'M3 6.5 10 3.5l7 3-7 3zM6 8v4.2c1.1 1.2 2.4 1.8 4 1.8s2.9-.6 4-1.8V8M17 6.5V11',
  forge: 'M4 12.5h12l-1.5 4h-9zM6 12.5V9.5h8v3M8 9.5V6.5l2-3 2 3v3',
  life: 'M10 16.5s-6-3.6-6-8a3.2 3.2 0 0 1 6-1.6A3.2 3.2 0 0 1 16 8.5c0 4.4-6 8-6 8z',
  library: 'M4 3.5h3v13H4zM8.5 3.5h3v13h-3zM13 4.3l2.8-.8 2.2 12.5-2.8.8z',
  timeline: 'M4 10h12M6 7v6M10 5v10M14 8v4',
  review: 'M4 4.5h12v9H8l-4 3zM7 8h6M7 10.5h4',
  inbox: 'M3.5 11.5 5.5 4.5h9l2 7v4h-13zM3.5 11.5h4l1 2h3l1-2h4',
  index: 'M4 5h12M4 8.5h12M4 12h12M4 15.5h8',
  settings: 'M10 7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4',
  search: 'M8.5 3.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12.2 12.2l4.3 4.3',
  plus: 'M10 4v12M4 10h12',
  capture: 'M10 3.5v6M7 6.5l3 3 3-3M4 11.5v4h12v-4',
  note: 'M5 3.5h7l3 3v10H5zM12 3.5v3h3M7.5 10h5M7.5 13h5',
  topic: 'M10 3.5 16.5 10 10 16.5 3.5 10z',
  project: 'M3.5 6h13v10h-13zM7.5 6V4h5v2',
  task: 'M4 4h12v12H4zM7 10l2 2 4-4.5',
  resource: 'M5 3.5h8.5v13H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5zM3.5 14a1.5 1.5 0 0 1 1.5-1.5h8.5',
  person: 'M10 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM5.5 16c.5-2.7 2.3-4.2 4.5-4.2s4 1.5 4.5 4.2',
  goal: 'M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM10 10h.01',
  skill: 'M4 16 9 11M8 5.5l6.5 6.5M11.5 3.5l5 5-2 2-5-5z',
  question: 'M7.5 7.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7M10 14.5h.01',
  observation: 'M2.5 10s3-5.5 7.5-5.5 7.5 5.5 7.5 5.5-3 5.5-7.5 5.5S2.5 10 2.5 10zM10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  hypothesis: 'M7 3.5h6M8 3.5v5L4 16h12l-4-7.5v-5',
  experiment: 'M8 3.5h4M9 3.5v4.5l-4.5 8.5h11L11 8V3.5M6.5 12.5h7',
  archetype: 'M10 3.5l1.9 4.1 4.6.5-3.4 3.1.9 4.5-4-2.3-4 2.3.9-4.5-3.4-3.1 4.6-.5z',
  path: 'M4.5 15.5a1.5 1.5 0 1 0 0-.01M15.5 4.5a1.5 1.5 0 1 0 0-.01M5.5 14.5c2-1 1-4 4.5-4.5s2.5-3.5 4.5-4.5',
  event: 'M4 5h12v11H4zM4 8.5h12M7.5 3.5v3M12.5 3.5v3',
  routine: 'M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 4.5v2.5H13',
  log: 'M4 15.5 8 10l3 3 5-7',
  lock: 'M5.5 9h9v7.5h-9zM7.5 9V6.5a2.5 2.5 0 0 1 5 0V9',
  pin: 'M7.5 3.5h5l-.7 4.5 2.7 2.5h-9L8.2 8zM10 10.5v6',
  archive: 'M3.5 4.5h13v3h-13zM4.5 7.5v8h11v-8M8.5 10.5h3',
  trash: 'M4 6h12M8 6V4h4v2M5.5 6l.8 10h7.4l.8-10',
  link: 'M8.5 11.5a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-.8.8M11.5 8.5a3 3 0 0 0-4.2 0L5 10.8A3 3 0 0 0 9.2 15l.8-.8',
  close: 'M5 5l10 10M15 5 5 15',
  check: 'M4.5 10.5 8 14l7.5-8',
  menu: 'M3.5 6h13M3.5 10h13M3.5 14h13',
  chevron: 'M8 5l5 5-5 5',
  external: 'M11 4.5h4.5V9M15.5 4.5 9 11M13.5 12v3.5h-9v-9H8',
  edit: 'M4 16l.6-3.2L12.8 4.6l2.6 2.6-8.2 8.2zM11.3 6.1l2.6 2.6',
  eye: 'M2.5 10s3-5.5 7.5-5.5 7.5 5.5 7.5 5.5-3 5.5-7.5 5.5S2.5 10 2.5 10zM10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  download: 'M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4 16.5h12',
  upload: 'M10 12.5v-9M6.5 7 10 3.5 13.5 7M4 16.5h12',
  item: 'M4.5 7h11l-1 9.5h-9zM7.5 7V5.5a2.5 2.5 0 0 1 5 0V7',
  keyboard: 'M2.5 5.5h15v9h-15zM5.5 8.5h.01M8.5 8.5h.01M11.5 8.5h.01M14.5 8.5h.01M6.5 11.5h7',
  arrow: 'M4 10h12M11.5 5.5 16 10l-4.5 4.5',
  dot: 'M10 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
}

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
