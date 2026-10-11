import {
  CAPTURE_TYPES,
  DOMAINS,
  EVENT_CATEGORIES,
  GOAL_AREAS,
  GOAL_STATUSES,
  INTEREST_STATUSES,
  LOG_AREAS,
  PRIORITIES,
  PROJECT_STATUSES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  SKILL_LEVELS,
  SOURCE_TYPES,
  type DataByKind,
  type Domain,
  type Kind,
  type LinkType,
} from './types'

export type IconName =
  | 'home' | 'atlas' | 'graph' | 'identity' | 'learning' | 'forge' | 'life' | 'library' | 'timeline'
  | 'review' | 'inbox' | 'index' | 'settings' | 'search' | 'plus' | 'capture' | 'note' | 'topic'
  | 'project' | 'task' | 'resource' | 'person' | 'goal' | 'skill' | 'question' | 'observation'
  | 'hypothesis' | 'experiment' | 'archetype' | 'path' | 'event' | 'routine' | 'log' | 'lock'
  | 'pin' | 'archive' | 'trash' | 'link' | 'close' | 'check' | 'menu' | 'chevron' | 'external'
  | 'edit' | 'eye' | 'download' | 'upload' | 'item' | 'keyboard' | 'arrow' | 'dot'

export interface SectionDef {
  key: string
  label: string
  path: string
  icon: IconName
  /** The conceptual mode the section belongs to; shown as a quiet label, not a theme switch. */
  mode: string
}

export const SECTIONS = {
  home: { key: 'home', label: 'Observatory', path: '/', icon: 'home', mode: 'Life' },
  inbox: { key: 'inbox', label: 'Inbox', path: '/inbox', icon: 'inbox', mode: 'Capture' },
  identity: { key: 'identity', label: 'Identity Lab', path: '/identity', icon: 'identity', mode: 'Character' },
  atlas: { key: 'atlas', label: 'Knowledge Atlas', path: '/atlas', icon: 'atlas', mode: 'Atlas' },
  graph: { key: 'graph', label: 'Graph', path: '/graph', icon: 'graph', mode: 'Atlas' },
  learning: { key: 'learning', label: 'Learning Studio', path: '/learning', icon: 'learning', mode: 'Studio' },
  projects: { key: 'projects', label: 'Project Forge', path: '/projects', icon: 'forge', mode: 'Studio' },
  life: { key: 'life', label: 'Life Systems', path: '/life', icon: 'life', mode: 'Life' },
  library: { key: 'library', label: 'Library', path: '/library', icon: 'library', mode: 'Archive' },
  timeline: { key: 'timeline', label: 'Timeline', path: '/timeline', icon: 'timeline', mode: 'Archive' },
  review: { key: 'review', label: 'Review Room', path: '/review', icon: 'review', mode: 'Life' },
  index: { key: 'index', label: 'Index', path: '/index', icon: 'index', mode: 'Archive' },
  settings: { key: 'settings', label: 'Settings', path: '/settings', icon: 'settings', mode: 'System' },
} satisfies Record<string, SectionDef>
export type SectionKey = keyof typeof SECTIONS

// ---------- fields ----------

type Opt = readonly string[]
export type FieldDef =
  | { key: string; label: string; type: 'text' | 'url'; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'textarea'; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'select'; options: Opt; labels?: Record<string, string>; nullable?: boolean; hint?: string }
  | { key: string; label: string; type: 'list'; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'date'; hint?: string }
  | { key: string; label: string; type: 'number'; hint?: string }
  | { key: string; label: string; type: 'bool'; hint?: string }
  | { key: string; label: string; type: 'confidence'; hint?: string }
  | { key: string; label: string; type: 'checks'; evidence?: boolean; placeholder?: string; hint?: string }
  | { key: string; label: string; type: 'project'; hint?: string }
  | { key: string; label: string; type: 'parts' | 'sets' | 'metrics'; hint?: string }

export interface KindDef<K extends Kind = Kind> {
  kind: K
  label: string
  plural: string
  icon: IconName
  section: SectionKey
  /** Kinds whose content is personal by nature start private. */
  privateByDefault: boolean
  /** Shown in the graph by default. Tasks, captures and logs would drown the map. */
  inGraph: boolean
  data: () => DataByKind[K]
  /** The key in `data` that holds a status-like value, for chips and filters. */
  statusKey?: string
  fields: FieldDef[]
}

const def = <K extends Kind>(d: KindDef<K>) => d

const DOMAIN_LABEL_MAP: Record<Domain, string> = {
  ai: 'AI & Computing',
  math: 'Mathematics',
  electronics: 'Electronics & Engineering',
  physics: 'Physics & the Universe',
  human: 'Biology & Human Science',
  philosophy: 'Philosophy',
  history: 'History & Geopolitics',
  other: 'Other interests',
}

export const KIND_DEFS: { [K in Kind]: KindDef<K> } = {
  page: def({
    kind: 'page', label: 'Page', plural: 'Pages', icon: 'note', section: 'index',
    privateByDefault: false, inGraph: true, data: () => ({}), fields: [],
  }),
  topic: def({
    kind: 'topic', label: 'Topic', plural: 'Topics', icon: 'topic', section: 'atlas',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({
      domain: 'other', status: 'curious', why: '', confidence: null, lastStudied: null,
      nextAction: '', questions: [], openProblems: [], experiments: [],
    }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: INTEREST_STATUSES,
        hint: 'Fascination is not commitment. Studying, practicing and building count toward your focus limit.' },
      { key: 'domain', label: 'Domain', type: 'select', options: DOMAINS, labels: DOMAIN_LABEL_MAP },
      { key: 'nextAction', label: 'Next action', type: 'text', placeholder: 'A concrete, observable step' },
      { key: 'confidence', label: 'Understanding', type: 'confidence' },
      { key: 'lastStudied', label: 'Last studied', type: 'date' },
      { key: 'why', label: 'Why it interests me', type: 'textarea' },
      { key: 'questions', label: 'Key questions', type: 'list', placeholder: 'Add a question' },
      { key: 'openProblems', label: 'Open problems', type: 'list' },
      { key: 'experiments', label: 'Practical experiments', type: 'list' },
    ],
  }),
  note: def({
    kind: 'note', label: 'Note', plural: 'Notes', icon: 'note', section: 'atlas',
    privateByDefault: false, inGraph: true,
    data: () => ({ sourceType: null, sourceTitle: '', sourceAuthor: '', sourceDate: '', sourceUrl: '', sourcePage: '' }),
    fields: [
      { key: 'sourceType', label: 'Source type', type: 'select', options: SOURCE_TYPES, nullable: true,
        hint: 'Primary, secondary, popular explanation, or speculative claim.' },
      { key: 'sourceTitle', label: 'Source title', type: 'text' },
      { key: 'sourceAuthor', label: 'Author', type: 'text' },
      { key: 'sourceDate', label: 'Published', type: 'text', placeholder: 'e.g. 1962' },
      { key: 'sourcePage', label: 'Page', type: 'text' },
      { key: 'sourceUrl', label: 'URL', type: 'url' },
    ],
  }),
  project: def({
    kind: 'project', label: 'Project', plural: 'Projects', icon: 'project', section: 'projects',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({
      status: 'idea', purpose: '', outcome: '', nextAction: '', milestones: [], decisions: [], blockers: [],
      deliverables: [], retrospective: '', url: '', startedOn: null, endedOn: null, statusReason: '',
    }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: PROJECT_STATUSES },
      { key: 'statusReason', label: 'Why this status', type: 'text', hint: 'Pausing or abandoning deliberately is a decision worth recording.' },
      { key: 'nextAction', label: 'Next action', type: 'text', placeholder: 'The very next physical step' },
      { key: 'purpose', label: 'Purpose', type: 'textarea' },
      { key: 'outcome', label: 'Desired outcome', type: 'textarea' },
      { key: 'milestones', label: 'Milestones', type: 'checks' },
      { key: 'deliverables', label: 'Deliverables', type: 'list' },
      { key: 'blockers', label: 'Blockers', type: 'list' },
      { key: 'decisions', label: 'Decisions', type: 'list', placeholder: 'Decision — and why' },
      { key: 'url', label: 'Link', type: 'url' },
      { key: 'startedOn', label: 'Started', type: 'date' },
      { key: 'endedOn', label: 'Ended', type: 'date' },
      { key: 'retrospective', label: 'Retrospective', type: 'textarea' },
    ],
  }),
  task: def({
    kind: 'task', label: 'Task', plural: 'Tasks', icon: 'task', section: 'projects',
    privateByDefault: false, inGraph: false,
    data: () => ({ done: false, doneAt: null, projectId: null, due: null, next: true }),
    fields: [
      { key: 'done', label: 'Done', type: 'bool' },
      { key: 'next', label: 'Show as a next action', type: 'bool' },
      { key: 'projectId', label: 'Project', type: 'project' },
      { key: 'due', label: 'Due', type: 'date' },
    ],
  }),
  resource: def({
    kind: 'resource', label: 'Resource', plural: 'Resources', icon: 'resource', section: 'library',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({
      type: 'book', status: 'want', author: '', year: '', url: '', sourceType: null, arguments: [],
      disagreements: [], questions: [], ideasToTest: [], impact: '', startedOn: null, finishedOn: null,
    }),
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: RESOURCE_TYPES },
      { key: 'status', label: 'Status', type: 'select', options: RESOURCE_STATUSES },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'year', label: 'Published', type: 'text' },
      { key: 'url', label: 'URL', type: 'url' },
      { key: 'sourceType', label: 'Source type', type: 'select', options: SOURCE_TYPES, nullable: true },
      { key: 'startedOn', label: 'Started', type: 'date' },
      { key: 'finishedOn', label: 'Finished', type: 'date' },
      { key: 'arguments', label: 'Important arguments', type: 'list' },
      { key: 'disagreements', label: 'Claims I disagree with', type: 'list' },
      { key: 'questions', label: 'Questions raised', type: 'list' },
      { key: 'ideasToTest', label: 'Ideas worth testing', type: 'list' },
      { key: 'impact', label: 'Did it change a belief or behaviour?', type: 'textarea', hint: 'Leave empty unless it actually did.' },
    ],
  }),
  person: def({
    kind: 'person', label: 'Person', plural: 'People', icon: 'person', section: 'atlas',
    privateByDefault: false, inGraph: true, data: () => ({ role: '', era: '' }),
    fields: [
      { key: 'role', label: 'Known for', type: 'text' },
      { key: 'era', label: 'Era', type: 'text' },
    ],
  }),
  goal: def({
    kind: 'goal', label: 'Goal', plural: 'Goals', icon: 'goal', section: 'life',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({ area: 'intellectual', status: 'aspiration', priority: 'later', why: '', actions: [] }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: GOAL_STATUSES },
      { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES },
      { key: 'area', label: 'Area', type: 'select', options: GOAL_AREAS },
      { key: 'why', label: 'Why it matters', type: 'textarea' },
      { key: 'actions', label: 'Observable actions', type: 'checks', placeholder: '"Learn AI" is not executable. What is?' },
    ],
  }),
  skill: def({
    kind: 'skill', label: 'Skill', plural: 'Skills', icon: 'skill', section: 'learning',
    privateByDefault: false, inGraph: true, statusKey: 'level',
    data: () => ({ level: 'unknown', evidence: [], lastPracticed: null }),
    fields: [
      { key: 'level', label: 'Level', type: 'select', options: SKILL_LEVELS, hint: 'Set from evidence, not from how it feels.' },
      { key: 'evidence', label: 'Evidence I can show', type: 'list', placeholder: 'A repo, a build, an explanation' },
      { key: 'lastPracticed', label: 'Last practiced', type: 'date' },
    ],
  }),
  question: def({
    kind: 'question', label: 'Question', plural: 'Questions', icon: 'question', section: 'identity',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({ status: 'open', answer: '' }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'answered', 'dropped'] },
      { key: 'answer', label: 'Current answer', type: 'textarea' },
    ],
  }),
  observation: def({
    kind: 'observation', label: 'Observation', plural: 'Observations', icon: 'observation', section: 'identity',
    privateByDefault: true, inGraph: true, data: () => ({ area: '' }),
    fields: [{ key: 'area', label: 'Area', type: 'text', placeholder: 'e.g. focus, social, energy' }],
  }),
  hypothesis: def({
    kind: 'hypothesis', label: 'Hypothesis', plural: 'Hypotheses', icon: 'hypothesis', section: 'identity',
    privateByDefault: true, inGraph: true, statusKey: 'status',
    data: () => ({ phenomenon: '', evidenceFor: [], evidenceAgainst: [], status: 'open' }),
    fields: [
      { key: 'phenomenon', label: 'Explains', type: 'text', hint: 'Hypotheses explaining the same thing are shown side by side.' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'supported', 'weakened', 'rejected'] },
      { key: 'evidenceFor', label: 'Evidence for', type: 'list' },
      { key: 'evidenceAgainst', label: 'Evidence against', type: 'list' },
    ],
  }),
  experiment: def({
    kind: 'experiment', label: 'Experiment', plural: 'Experiments', icon: 'experiment', section: 'identity',
    privateByDefault: false, inGraph: true, statusKey: 'status',
    data: () => ({ hypothesis: '', method: '', measure: '', start: null, end: null, status: 'planned', result: '' }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'running', 'done', 'abandoned'] },
      { key: 'hypothesis', label: 'What it tests', type: 'textarea' },
      { key: 'method', label: 'Method', type: 'textarea' },
      { key: 'measure', label: 'What counts as a result', type: 'text' },
      { key: 'start', label: 'Start', type: 'date' },
      { key: 'end', label: 'End', type: 'date' },
      { key: 'result', label: 'Result', type: 'textarea' },
    ],
  }),
  archetype: def({
    kind: 'archetype', label: 'Possible self', plural: 'Possible selves', icon: 'archetype', section: 'identity',
    privateByDefault: false, inGraph: true,
    data: () => ({ represents: '', parts: [], evidence: [] }),
    fields: [
      { key: 'represents', label: 'What it represents', type: 'textarea' },
      { key: 'parts', label: 'Parts', type: 'parts',
        hint: 'Sort each part: genuine long-term aim, temporary fascination, mostly fantasy or status, or integrable into one life.' },
      { key: 'evidence', label: 'What real practice showed', type: 'list' },
    ],
  }),
  path: def({
    kind: 'path', label: 'Learning path', plural: 'Learning paths', icon: 'path', section: 'learning',
    privateByDefault: false, inGraph: true, data: () => ({ area: '', steps: [] }),
    fields: [
      { key: 'area', label: 'Area', type: 'text' },
      { key: 'steps', label: 'Steps', type: 'checks', evidence: true,
        hint: 'A step is done when you can show it, not when you watched it.' },
    ],
  }),
  event: def({
    kind: 'event', label: 'Event', plural: 'Events', icon: 'event', section: 'timeline',
    privateByDefault: false, inGraph: false, data: () => ({ date: null, category: 'milestone' }),
    fields: [
      { key: 'date', label: 'Date', type: 'date', hint: 'Year, month or day. Leave empty if unknown; never guess.' },
      { key: 'category', label: 'Category', type: 'select', options: EVENT_CATEGORIES },
    ],
  }),
  review: def({
    kind: 'review', label: 'Review', plural: 'Reviews', icon: 'review', section: 'review',
    privateByDefault: true, inGraph: false,
    data: () => ({ period: 'week', periodStart: '', answers: {}, changes: [] }),
    fields: [],
  }),
  capture: def({
    kind: 'capture', label: 'Capture', plural: 'Captures', icon: 'capture', section: 'inbox',
    privateByDefault: false, inGraph: false, data: () => ({ captureType: 'thought', processed: false }),
    fields: [{ key: 'captureType', label: 'Type', type: 'select', options: CAPTURE_TYPES }],
  }),
  routine: def({
    kind: 'routine', label: 'Routine', plural: 'Routines', icon: 'routine', section: 'life',
    privateByDefault: true, inGraph: false,
    data: () => ({ cadence: '', when: '', minimum: '', active: true }),
    fields: [
      { key: 'active', label: 'Active', type: 'bool' },
      { key: 'cadence', label: 'Cadence', type: 'text', placeholder: 'e.g. 3× a week' },
      { key: 'when', label: 'When', type: 'text' },
      { key: 'minimum', label: 'Minimum version', type: 'text', hint: 'The smallest version that still counts on a bad day.' },
    ],
  }),
  log: def({
    kind: 'log', label: 'Log entry', plural: 'Log entries', icon: 'log', section: 'life',
    privateByDefault: true, inGraph: false, statusKey: 'area',
    data: () => ({ area: 'workout', date: null, sets: [], metrics: [] }),
    fields: [
      { key: 'area', label: 'Area', type: 'select', options: LOG_AREAS },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'sets', label: 'Exercises', type: 'sets' },
      { key: 'metrics', label: 'Measurements', type: 'metrics' },
    ],
  }),
  medication: def({
    kind: 'medication', label: 'Medication record', plural: 'Medication records', icon: 'log', section: 'life',
    privateByDefault: true, inGraph: false, statusKey: 'status',
    data: () => ({ dose: '', status: 'unverified', source: '', startedOn: null, endedOn: null }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: ['current', 'discontinued', 'historical', 'unverified'],
        hint: 'A record, not advice. This app never suggests medication changes.' },
      { key: 'dose', label: 'Dose', type: 'text' },
      { key: 'source', label: 'Source', type: 'text', placeholder: 'Prescription, lab report, self-report…' },
      { key: 'startedOn', label: 'Started', type: 'date' },
      { key: 'endedOn', label: 'Ended', type: 'date' },
    ],
  }),
  item: def({
    kind: 'item', label: 'Item', plural: 'Environment & tools', icon: 'item', section: 'life',
    privateByDefault: true, inGraph: false, statusKey: 'status',
    data: () => ({
      status: 'idea', need: 'optional', rationale: '', cost: null, expectedBenefit: '', actualBenefit: '',
      maintenance: '', reducesFriction: false,
    }),
    fields: [
      { key: 'status', label: 'Status', type: 'select', options: ['idea', 'wishlist', 'bought', 'rejected', 'returned'] },
      { key: 'need', label: 'Need', type: 'select', options: ['essential', 'optional', 'appealing'],
        hint: '"Appealing" = mostly nice to imagine owning.' },
      { key: 'reducesFriction', label: 'Reduces everyday friction', type: 'bool' },
      { key: 'cost', label: 'Estimated cost (₹)', type: 'number' },
      { key: 'rationale', label: 'Rationale', type: 'textarea' },
      { key: 'expectedBenefit', label: 'Expected benefit', type: 'textarea' },
      { key: 'actualBenefit', label: 'Actual benefit', type: 'textarea', hint: 'Fill in after living with it.' },
      { key: 'maintenance', label: 'Maintenance & replacement', type: 'text' },
    ],
  }),
}

export const kindDef = <K extends Kind>(k: K): KindDef<K> => KIND_DEFS[k] as KindDef<K>

export const DOMAIN_LABELS = DOMAIN_LABEL_MAP

/**
 * Categorical colours for topic domains, in fixed slot order (validated palette, see the dataviz
 * reference): stepped separately for the dark and paper surfaces in tokens.css. Other kinds stay
 * neutral and are told apart by shape, so no ninth hue is ever needed.
 */
export const DOMAIN_COLORS: Record<Domain, string> = {
  ai: 'var(--d-ai)',
  math: 'var(--d-math)',
  electronics: 'var(--d-electronics)',
  physics: 'var(--d-physics)',
  human: 'var(--d-human)',
  philosophy: 'var(--d-philosophy)',
  history: 'var(--d-history)',
  other: 'var(--d-other)',
}

export const LINK_LABELS: Record<LinkType, { out: string; in: string }> = {
  related: { out: 'Related to', in: 'Related to' },
  depends_on: { out: 'Depends on', in: 'Prerequisite for' },
  part_of: { out: 'Part of', in: 'Includes' },
  supports: { out: 'Supports', in: 'Supported by' },
  contradicts: { out: 'Contradicts', in: 'Contradicted by' },
  applies_to: { out: 'Applies to', in: 'Applied by' },
  inspired_by: { out: 'Inspired by', in: 'Inspired' },
  used_in: { out: 'Used in', in: 'Uses' },
  learned_from: { out: 'Learned from', in: 'Taught' },
}

export const humanize = (s: string) => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
