/**
 * The domain model. Every record shares a small base (identity, text, provenance, epistemic status)
 * and carries kind-specific `data`. Relationships live in their own table (`Link`) so the graph,
 * backlinks and traversal work across every kind without one enormous generic object.
 */

export const KINDS = [
  'page',
  'topic',
  'note',
  'project',
  'task',
  'resource',
  'person',
  'goal',
  'skill',
  'question',
  'observation',
  'hypothesis',
  'experiment',
  'archetype',
  'path',
  'event',
  'review',
  'capture',
  'routine',
  'log',
  'medication',
  'item',
] as const
export type Kind = (typeof KINDS)[number]

/** "2026", "2026-10" or "2026-10-11". Null means the date is not known. */
export type PartialDate = string

/** How sure the claim is. Optional: an ordinary note makes no claim. */
export const CERTAINTIES = ['fact', 'report', 'inference', 'suspicion', 'hypothesis', 'aspiration'] as const
export type Certainty = (typeof CERTAINTIES)[number]

/** Whether the information describes the present. */
export const CURRENCIES = ['current', 'historical', 'unverified'] as const
export type Currency = (typeof CURRENCIES)[number]

/** Where the record came from. Seeds are imported history, not things typed in this app. */
export const ORIGINS = ['seed', 'seed-private', 'user', 'capture', 'import'] as const
export type Origin = (typeof ORIGINS)[number]

export interface BaseRecord {
  id: string
  title: string
  /** Markdown. May contain [[wikilinks]]. */
  body: string
  tags: string[]
  createdAt: string
  updatedAt: string
  origin: Origin
  certainty: Certainty | null
  currency: Currency
  /** When the information was observed or true, if known. */
  asOf: PartialDate | null
  private: boolean
  pinned: boolean
  archived: boolean
}

// ---------- kind-specific data ----------

export const INTEREST_STATUSES = [
  'curious',
  'exploring',
  'studying',
  'practicing',
  'building',
  'maintaining',
  'archived',
] as const
export type InterestStatus = (typeof INTEREST_STATUSES)[number]
/** Statuses that count as a commitment rather than a fascination. */
export const COMMITTED_INTEREST: InterestStatus[] = ['studying', 'practicing', 'building']

export const DOMAINS = [
  'ai',
  'math',
  'electronics',
  'physics',
  'human',
  'philosophy',
  'history',
  'other',
] as const
export type Domain = (typeof DOMAINS)[number]

export const PROJECT_STATUSES = ['idea', 'evaluating', 'active', 'paused', 'completed', 'archived', 'abandoned'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const RESOURCE_TYPES = ['book', 'article', 'paper', 'video', 'course', 'podcast', 'link'] as const
export const RESOURCE_STATUSES = ['want', 'reading', 'finished', 'abandoned', 'reference'] as const
export const SOURCE_TYPES = ['primary', 'secondary', 'popular', 'speculative'] as const

export const GOAL_AREAS = [
  'intellectual',
  'technology',
  'electronics',
  'physical',
  'social',
  'effectiveness',
  'career',
  'creative',
] as const
export type GoalArea = (typeof GOAL_AREAS)[number]
export const GOAL_STATUSES = ['aspiration', 'active', 'paused', 'achieved', 'dropped'] as const
export const PRIORITIES = ['now', 'next', 'later', 'someday'] as const

export const SKILL_LEVELS = ['unknown', 'none', 'aware', 'beginner', 'working', 'proficient'] as const

export const ARCHETYPE_VERDICTS = ['undecided', 'genuine', 'fascination', 'fantasy', 'integrable'] as const
export type ArchetypeVerdict = (typeof ARCHETYPE_VERDICTS)[number]
export const FACETS = ['ability', 'value', 'aesthetic', 'behavior'] as const

export const LOG_AREAS = [
  'workout',
  'body',
  'cardio',
  'sleep',
  'nutrition',
  'recovery',
  'care',
  'health',
  'injury',
  'social',
] as const
export type LogArea = (typeof LOG_AREAS)[number]

export const EVENT_CATEGORIES = [
  'project',
  'skill',
  'decision',
  'discovery',
  'goal',
  'interest',
  'experiment',
  'milestone',
  'life',
] as const

export const CAPTURE_TYPES = ['thought', 'question', 'link', 'book', 'project', 'task', 'observation'] as const
export type CaptureType = (typeof CAPTURE_TYPES)[number]

export interface Check {
  id: string
  title: string
  done: boolean
  /** What proves it: a link, an artifact, a sentence. Used by learning paths for demonstrated competence. */
  evidence?: string
  date?: PartialDate | null
}

export interface ArchetypePart {
  id: string
  text: string
  facet: (typeof FACETS)[number]
  verdict: ArchetypeVerdict
}

export interface SetEntry {
  id: string
  exercise: string
  sets: number | null
  reps: number | null
  weight: number | null
}

export interface Metric {
  id: string
  name: string
  value: number | null
  unit: string
}

export interface DataByKind {
  page: Record<string, never>
  topic: {
    domain: Domain
    status: InterestStatus
    why: string
    /** 0 = none … 4 = can teach it. null = not assessed. */
    confidence: number | null
    lastStudied: PartialDate | null
    nextAction: string
    questions: string[]
    openProblems: string[]
    experiments: string[]
  }
  note: {
    sourceType: (typeof SOURCE_TYPES)[number] | null
    sourceTitle: string
    sourceAuthor: string
    sourceDate: string
    sourceUrl: string
    sourcePage: string
  }
  project: {
    status: ProjectStatus
    purpose: string
    outcome: string
    nextAction: string
    milestones: Check[]
    decisions: string[]
    blockers: string[]
    deliverables: string[]
    retrospective: string
    url: string
    startedOn: PartialDate | null
    endedOn: PartialDate | null
    /** Why it was paused or abandoned: deliberate endings are first-class. */
    statusReason: string
  }
  task: {
    done: boolean
    doneAt: string | null
    projectId: string | null
    due: PartialDate | null
    /** Shows on the Observatory as a next concrete action. */
    next: boolean
  }
  resource: {
    type: (typeof RESOURCE_TYPES)[number]
    status: (typeof RESOURCE_STATUSES)[number]
    author: string
    year: string
    url: string
    sourceType: (typeof SOURCE_TYPES)[number] | null
    arguments: string[]
    disagreements: string[]
    questions: string[]
    ideasToTest: string[]
    /** Did it change a belief or a behaviour? Only true when it did. */
    impact: string
    startedOn: PartialDate | null
    finishedOn: PartialDate | null
  }
  person: { role: string; era: string }
  goal: {
    area: GoalArea
    status: (typeof GOAL_STATUSES)[number]
    priority: (typeof PRIORITIES)[number]
    why: string
    /** Concrete, checkable actions that turn the goal into work. */
    actions: Check[]
  }
  skill: {
    level: (typeof SKILL_LEVELS)[number]
    /** Things I can show: repositories, builds, explanations. */
    evidence: string[]
    lastPracticed: PartialDate | null
  }
  question: { status: 'open' | 'answered' | 'dropped'; answer: string }
  observation: { area: string }
  hypothesis: {
    /** The behaviour or pattern being explained; hypotheses sharing it compete. */
    phenomenon: string
    evidenceFor: string[]
    evidenceAgainst: string[]
    status: 'open' | 'supported' | 'weakened' | 'rejected'
  }
  experiment: {
    hypothesis: string
    method: string
    measure: string
    start: PartialDate | null
    end: PartialDate | null
    status: 'planned' | 'running' | 'done' | 'abandoned'
    result: string
  }
  archetype: {
    represents: string
    parts: ArchetypePart[]
    /** What real-world practice has shown. */
    evidence: string[]
  }
  path: { area: string; steps: Check[] }
  event: {
    date: PartialDate | null
    category: (typeof EVENT_CATEGORIES)[number]
  }
  review: {
    period: 'week' | 'month'
    periodStart: PartialDate
    answers: Record<string, string>
    /** Concrete changes this review produced. */
    changes: Check[]
  }
  capture: { captureType: CaptureType; processed: boolean }
  routine: {
    cadence: string
    when: string
    /** The smallest version that still counts on a bad day. */
    minimum: string
    active: boolean
  }
  log: { area: LogArea; date: PartialDate | null; sets: SetEntry[]; metrics: Metric[] }
  medication: {
    dose: string
    status: 'current' | 'discontinued' | 'historical' | 'unverified'
    source: string
    startedOn: PartialDate | null
    endedOn: PartialDate | null
  }
  item: {
    status: 'idea' | 'wishlist' | 'bought' | 'rejected' | 'returned'
    need: 'essential' | 'optional' | 'appealing'
    rationale: string
    cost: number | null
    expectedBenefit: string
    actualBenefit: string
    maintenance: string
    reducesFriction: boolean
  }
}

export type AnyRecord = { [K in Kind]: BaseRecord & { kind: K; data: DataByKind[K] } }[Kind]
export type RecordOf<K extends Kind> = Extract<AnyRecord, { kind: K }>

export const LINK_TYPES = [
  'related',
  'depends_on',
  'part_of',
  'supports',
  'contradicts',
  'applies_to',
  'inspired_by',
  'used_in',
  'learned_from',
] as const
export type LinkType = (typeof LINK_TYPES)[number]

export interface Link {
  id: string
  from: string
  to: string
  type: LinkType
  note: string
  createdAt: string
}

export type Theme = 'dark' | 'paper' | 'system'
export const ACCENTS = ['lime', 'blue', 'violet'] as const
export type Accent = (typeof ACCENTS)[number]

export interface Settings {
  theme: Theme
  accent: Accent
  /** Soft limits: the app warns, it does not forbid. */
  activeProjectLimit: number
  focusTopicLimit: number
  /** Hide private records from every view (a privacy screen, not security). */
  hidePrivate: boolean
  /** e.g. "c", "alt+c", "mod+shift+k". */
  captureShortcut: string
  ownerName: string
}

export const DEFAULT_SETTINGS: Settings = {
  // The artifact preview follows the viewer's theme; the site itself opens in the dark atlas.
  theme: import.meta.env?.VITE_ROUTER === 'hash' ? 'system' : 'dark',
  accent: 'lime',
  activeProjectLimit: 3,
  focusTopicLimit: 4,
  hidePrivate: false,
  captureShortcut: 'c',
  ownerName: 'Krish',
}
