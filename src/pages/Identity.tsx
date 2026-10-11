import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatPartial } from '../domain/dates'
import { humanize } from '../domain/kinds'
import { ARCHETYPE_VERDICTS, FACETS, type ArchetypePart, type RecordOf } from '../domain/types'
import { useKind, useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useCreate } from '../shell/useCreate'
import { EpistemicChips } from '../ui/chips'
import { Icon } from '../ui/Icon'
import { Markdown } from '../ui/Markdown'
import { Empty, PageHead, SectionHead } from '../ui/Page'
import { RecordLink } from '../ui/RecordLink'

export function Identity() {
  const records = useVisible()
  const archetypes = useKind('archetype')
  const observations = useKind('observation')
  const hypotheses = useKind('hypothesis')
  const experiments = useKind('experiment')
  const questions = useKind('question')
  // Every wiki page except the priorities page (which lives on the Observatory): profile, direction, principles, and any private ones.
  const pages = useKind('page')
    .filter((p) => p.id !== 'pg_now')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.title.localeCompare(b.title))
  const hidePrivate = useStore((s) => s.settings.hidePrivate)
  const create = useCreate()
  const central = records['qu_identity']

  return (
    <div className="page identity">
      <PageHead
        mode="Character · Identity"
        title="Identity Lab"
        lede="An archetype is a hypothesis about what you want, not a persona to wear. Sort what survives real practice from what is only appealing to imagine."
        actions={
          <>
            <button className="btn btn--ghost" onClick={() => create('observation', { certainty: 'fact' })}>
              <Icon name="observation" size={15} /> Observation
            </button>
            <button className="btn btn--primary" onClick={() => create('archetype', { certainty: 'hypothesis' })}>
              <Icon name="plus" size={15} /> Possible self
            </button>
          </>
        }
      />

      <div className="cols cols-main-rail">
        <div>
          {central && (
            <section className="central">
              <div className="kicker">The central question</div>
              <Link to={`/r/${central.id}`} className="central-title serif">
                {central.title}
              </Link>
              <Markdown text={central.body} />
            </section>
          )}

          <section className="section">
            <SectionHead title="Possible selves" count={archetypes.length} />
            <div className="selves">
              {archetypes.map((a) => (
                <Self key={a.id} a={a} />
              ))}
            </div>
          </section>

          <Integration archetypes={archetypes} />
        </div>
        <aside className="stack">
          <section className="panel">
            <div className="kicker">Foundations</div>
            <ul className="plain-list">
              {pages.map((p) => (
                <li key={p.id}>
                  <RecordLink rec={p} />
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <div className="kicker">Open questions</div>
            <ul className="plain-list">
              {questions
                .filter((q) => q.data.status === 'open')
                .map((q) => (
                  <li key={q.id}>
                    <RecordLink rec={q} />
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="section self-model">
        <SectionHead title="Human nature & self-model" />
        <p className="lede text-2">
          What I know, what I infer and what I merely suspect, kept apart. Models (MBTI, Big Five, attachment) are lenses with very different evidence behind them; none is a verdict.
        </p>
        {hidePrivate && <p className="notice">The privacy screen is on: private observations and hypotheses are hidden.</p>}
        <div className="cols cols-3">
          <div>
            <SectionHead title="Observations" count={observations.length}>
              <button className="btn btn--ghost btn--sm" onClick={() => create('observation', { certainty: 'fact' })}>
                Add
              </button>
            </SectionHead>
            {observations.length ? (
              <ul className="obs-list">
                {observations
                  .sort((a, b) => (b.asOf ?? b.createdAt).localeCompare(a.asOf ?? a.createdAt))
                  .map((o) => (
                    <li key={o.id}>
                      <RecordLink rec={o} icon={false} />
                      <div className="row-flex">
                        <EpistemicChips rec={o} compact />
                        <span className="kicker">{o.asOf ? formatPartial(o.asOf) : 'undated'}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <Empty icon="observation" title="No observations yet">
                Dated notes about your own behaviour. They start private.
              </Empty>
            )}
          </div>
          <div>
            <SectionHead title="Competing explanations" count={hypotheses.length}>
              <button className="btn btn--ghost btn--sm" onClick={() => create('hypothesis', { certainty: 'hypothesis' })}>
                Add
              </button>
            </SectionHead>
            <Hypotheses hypotheses={hypotheses} />
          </div>
          <div>
            <SectionHead title="Experiments" count={experiments.length}>
              <button className="btn btn--ghost btn--sm" onClick={() => create('experiment', {})}>
                Add
              </button>
            </SectionHead>
            {experiments.length ? (
              <ul className="plain-list">
                {experiments.map((e) => (
                  <li key={e.id}>
                    <RecordLink rec={e} />
                    <span className="kicker">{e.data.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="experiment" title="No experiments">
                Test whether an aspiration survives practice: one behaviour, a few weeks, a measurable result.
              </Empty>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

const VERDICT_ORDER = ARCHETYPE_VERDICTS

function Self({ a }: { a: RecordOf<'archetype'> }) {
  const parts = a.data.parts
  const counts = Object.fromEntries(VERDICT_ORDER.map((v) => [v, parts.filter((p) => p.verdict === v).length]))
  return (
    <Link to={`/r/${a.id}`} className="self">
      <div className="self-title serif">{a.title}</div>
      <p className="self-rep">{a.data.represents}</p>
      <div className="verdict-bar" aria-label={VERDICT_ORDER.map((v) => `${counts[v]} ${v}`).join(', ')}>
        {VERDICT_ORDER.map((v) => counts[v] > 0 && <span key={v} className={`vb vb--${v}`} style={{ flexGrow: counts[v] }} title={`${counts[v]} ${v}`} />)}
      </div>
      <div className="kicker">
        {parts.length} parts · {counts.undecided} unsorted{a.data.evidence.length ? ` · ${a.data.evidence.length} tested` : ''}
      </div>
    </Link>
  )
}

/** Parts sorted as genuine or integrable, across all possible selves: a sketch of one coherent life. */
function Integration({ archetypes }: { archetypes: RecordOf<'archetype'>[] }) {
  const all = useMemo(() => archetypes.flatMap((a) => a.data.parts.map((p) => ({ ...p, from: a }))), [archetypes])
  const keep = all.filter((p) => p.verdict === 'genuine' || p.verdict === 'integrable')
  const set = (v: ArchetypePart['verdict']) => all.filter((p) => p.verdict === v)
  const sorted = all.length - set('undecided').length
  return (
    <section className="section integration">
      <SectionHead title="Integration board" />
      <p className="muted small">
        {sorted} of {all.length} parts sorted. Open a possible self and mark each part as genuine, a fascination, mostly fantasy, or integrable. What survives collects here.
      </p>
      {keep.length === 0 ? (
        <Empty icon="archetype" title="Nothing integrated yet">
          The board fills as you sort parts as genuine or integrable.
        </Empty>
      ) : (
        <div className="cols cols-2">
          {FACETS.map((f) => {
            const xs = keep.filter((p) => p.facet === f)
            if (!xs.length) return null
            return (
              <div key={f} className="facet">
                <div className="kicker">{humanize(f)}s</div>
                <ul>
                  {xs.map((p) => (
                    <li key={p.id}>
                      {p.text} <Link to={`/r/${p.from.id}`} className="muted small">— {p.from.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
      {(set('fantasy').length > 0 || set('fascination').length > 0) && (
        <div className="cols cols-2 let-go">
          {(['fascination', 'fantasy'] as const).map((v) =>
            set(v).length ? (
              <div key={v} className="facet facet--dim">
                <div className="kicker">{v === 'fantasy' ? 'Mostly fantasy or status' : 'Temporary fascinations'}</div>
                <ul>
                  {set(v).map((p) => (
                    <li key={p.id}>{p.text}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  )
}

function Hypotheses({ hypotheses }: { hypotheses: RecordOf<'hypothesis'>[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, RecordOf<'hypothesis'>[]>()
    for (const h of hypotheses) {
      const k = h.data.phenomenon.trim() || 'Unassigned'
      m.set(k, [...(m.get(k) ?? []), h])
    }
    return [...m.entries()]
  }, [hypotheses])
  if (!groups.length)
    return (
      <Empty icon="hypothesis" title="No hypotheses">
        Several explanations for one pattern, each with evidence for and against.
      </Empty>
    )
  return (
    <div className="hyp-groups">
      {groups.map(([k, hs]) => (
        <div key={k} className="hyp-group">
          <div className="hyp-phen">{k}</div>
          <ul>
            {hs.map((h) => (
              <li key={h.id}>
                <RecordLink rec={h} icon={false} />
                <span className="hyp-score" title="evidence for / against">
                  <b>{h.data.evidenceFor.length}</b>/<b>{h.data.evidenceAgainst.length}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
