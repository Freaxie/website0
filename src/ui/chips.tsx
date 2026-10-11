import { formatPartial } from '../domain/dates'
import { KIND_DEFS, humanize } from '../domain/kinds'
import { COMMITTED_INTEREST, type AnyRecord, type Certainty, type Currency } from '../domain/types'
import { Icon } from './Icon'

export function Chip({
  children,
  tone,
  title,
}: {
  children: React.ReactNode
  tone?: 'accent' | 'warn' | 'hist' | 'quiet' | 'private'
  title?: string
}) {
  return (
    <span className={`chip${tone ? ` chip--${tone}` : ''}`} title={title}>
      {children}
    </span>
  )
}

export function KindChip({ rec }: { rec: AnyRecord }) {
  const d = KIND_DEFS[rec.kind]
  return (
    <Chip tone="quiet">
      <Icon name={d.icon} size={12} />
      {d.label}
    </Chip>
  )
}

const ACTIVE = new Set<string>(['active', 'running', 'reading', 'now', ...COMMITTED_INTEREST])
const DONE = new Set<string>(['completed', 'finished', 'done', 'achieved', 'answered', 'bought'])

/** The kind's status value, with the accent reserved for live commitments. */
export function StatusChip({ rec }: { rec: AnyRecord }) {
  const key = KIND_DEFS[rec.kind].statusKey
  if (!key) return null
  const v = (rec.data as unknown as Record<string, unknown>)[key]
  if (typeof v !== 'string') return null
  const tone = ACTIVE.has(v) ? 'accent' : DONE.has(v) ? undefined : 'quiet'
  return <Chip tone={tone}>{humanize(v)}</Chip>
}

const CERTAINTY_HELP: Record<Certainty, string> = {
  fact: 'Verified or directly observable',
  report: 'Self-reported; not independently verified',
  inference: 'Inferred from evidence',
  suspicion: 'A suspicion, weaker than an inference',
  hypothesis: 'A hypothesis to test',
  aspiration: 'Something wanted, not something true yet',
}
const CURRENCY_HELP: Record<Currency, string> = {
  current: 'Describes the present',
  historical: 'Describes the past; may no longer hold',
  unverified: 'May or may not still hold; needs confirming',
}

/** Fact vs report vs hypothesis, current vs historical, imported vs typed here, private. */
export function EpistemicChips({ rec, compact = false }: { rec: AnyRecord; compact?: boolean }) {
  return (
    <>
      {rec.currency !== 'current' && (
        <Chip tone="hist" title={CURRENCY_HELP[rec.currency]}>
          {rec.currency === 'historical' ? 'Historical' : 'Unverified'}
          {rec.asOf && !compact ? ` · ${formatPartial(rec.asOf)}` : ''}
        </Chip>
      )}
      {rec.certainty && rec.certainty !== 'fact' && (
        <Chip tone="quiet" title={CERTAINTY_HELP[rec.certainty]}>
          {humanize(rec.certainty)}
        </Chip>
      )}
      {rec.private && (
        <Chip tone="private" title="Private: excluded from public exports by default">
          <Icon name="lock" size={11} />
          {!compact && 'Private'}
        </Chip>
      )}
      {!compact && (rec.origin === 'seed' || rec.origin === 'seed-private') && (
        <Chip tone="quiet" title="Imported from the setup handoff, not typed in this app">
          Imported
        </Chip>
      )}
    </>
  )
}

export { CERTAINTY_HELP, CURRENCY_HELP }
