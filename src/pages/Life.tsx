import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatPartial, partialSortKey, today } from '../domain/dates'
import { humanize } from '../domain/kinds'
import { GOAL_AREAS, PRIORITIES, type LogArea, type RecordOf } from '../domain/types'
import { useKind } from '../store/hooks'
import { useStore } from '../store/store'
import { useCreate } from '../shell/useCreate'
import { EpistemicChips } from '../ui/chips'
import { Icon } from '../ui/Icon'
import { LineChart } from '../ui/LineChart'
import { Empty, PageHead, SectionHead } from '../ui/Page'
import { RecordLink } from '../ui/RecordLink'

const TABS = [
  { id: 'goals', label: 'Goals' },
  { id: 'routines', label: 'Routines' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'care', label: 'Health & care' },
  { id: 'social', label: 'Social practice' },
  { id: 'environment', label: 'Environment & tools' },
]

export function Life() {
  const hidePrivate = useStore((s) => s.settings.hidePrivate)
  return (
    <div className="page life">
      <PageHead
        mode="Life · Systems"
        title="Life Systems"
        lede="Record-keeping, not a scoreboard. Log what helps you notice what works; skip the rest. Everything here except goals starts private."
      />
      <nav className="subnav" aria-label="Life sections">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`}>
            {t.label}
          </a>
        ))}
      </nav>
      {hidePrivate && <p className="notice">The privacy screen is on. Private entries are hidden from every section below.</p>}
      <Goals />
      <Routines />
      <Fitness />
      <Care />
      <Social />
      <Environment />
    </div>
  )
}

function useNewLog() {
  const create = useCreate()
  return (area: LogArea, title = '') => create('log', { title: title || `${humanize(area)} · ${formatPartial(today())}`, data: { area, date: today() } })
}

function Goals() {
  const goals = useKind('goal')
  const create = useCreate()
  return (
    <section className="section" id="goals">
      <SectionHead title="Goals" count={goals.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => create('goal', {})}>
          Add goal
        </button>
      </SectionHead>
      <p className="muted small">Not every aspiration deserves equal priority. Priority and status are separate: an aspiration can wait at “someday” indefinitely.</p>
      <div className="goal-board">
        {PRIORITIES.map((p) => {
          const xs = goals.filter((g) => g.data.priority === p && g.data.status !== 'dropped' && g.data.status !== 'achieved')
          return (
            <div key={p} className="goal-col">
              <div className="kicker">{p}</div>
              <ul>
                {xs.map((g) => (
                  <li key={g.id} className={`goal goal--${g.data.status}`}>
                    <RecordLink rec={g} icon={false} />
                    <span className="row-flex">
                      <span className="kicker">{humanize(g.data.area)}</span>
                      <span className="kicker">{g.data.status}</span>
                      {g.data.actions.length > 0 && (
                        <span className="kicker">
                          {g.data.actions.filter((a) => a.done).length}/{g.data.actions.length} actions
                        </span>
                      )}
                    </span>
                  </li>
                ))}
                {!xs.length && <li className="muted small">—</li>}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="muted small">
        Areas: {GOAL_AREAS.map((a) => `${humanize(a)} (${goals.filter((g) => g.data.area === a).length})`).join(' · ')}
      </p>
    </section>
  )
}

function Routines() {
  const routines = useKind('routine')
  const create = useCreate()
  return (
    <section className="section" id="routines">
      <SectionHead title="Routines" count={routines.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => create('routine', {})}>
          Add routine
        </button>
      </SectionHead>
      {routines.length ? (
        <ul className="routine-list">
          {routines.map((r) => (
            <li key={r.id} className={r.data.active ? '' : 'is-off'}>
              <RecordLink rec={r} />
              <span className="muted small">{[r.data.cadence, r.data.when].filter(Boolean).join(' · ')}</span>
              {r.data.minimum && <span className="small">Minimum: {r.data.minimum}</span>}
              <span className="row-flex">
                {!r.data.active && <span className="kicker">inactive</span>}
                <EpistemicChips rec={r} compact />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon="routine" title="No routines">
          Each routine gets a “minimum version” for bad days. Systems should survive imperfect adherence.
        </Empty>
      )}
    </section>
  )
}

const FITNESS: LogArea[] = ['workout', 'body', 'cardio', 'recovery', 'nutrition', 'sleep']

function Fitness() {
  const logs = useKind('log').filter((l) => FITNESS.includes(l.data.area))
  const newLog = useNewLog()
  const { weight, lifts, records } = useMemo(() => {
    const weight = logs.flatMap((l) =>
      l.data.date ? l.data.metrics.filter((m) => /weight/i.test(m.name) && m.value !== null).map((m) => ({ date: l.data.date!, value: m.value!, unit: m.unit || 'kg' })) : [],
    )
    const byExercise = new Map<string, { date: string; value: number }[]>()
    const best = new Map<string, { weight: number; log: RecordOf<'log'> }>()
    for (const l of logs)
      for (const s of l.data.sets) {
        if (s.weight === null || !s.exercise.trim()) continue
        const k = s.exercise.trim().toLowerCase()
        if (l.data.date) byExercise.set(k, [...(byExercise.get(k) ?? []), { date: l.data.date, value: s.weight }])
        if (!best.has(k) || best.get(k)!.weight < s.weight) best.set(k, { weight: s.weight, log: l })
      }
    const lifts = [...byExercise.entries()].filter(([, v]) => v.length >= 2).slice(0, 4)
    return { weight, lifts, records: [...best.entries()] }
  }, [logs])
  const recent = [...logs].sort((a, b) => partialSortKey(b.data.date).localeCompare(partialSortKey(a.data.date))).slice(0, 12)
  return (
    <section className="section" id="fitness">
      <SectionHead title="Fitness" count={logs.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => newLog('workout')}>
          Log workout
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => newLog('body')}>
          Log measurement
        </button>
      </SectionHead>
      <p className="muted small">Track actual performance. No targets are generated from historical numbers.</p>
      <div className="cols cols-3">
        <div className="panel">
          <div className="kicker">Body weight</div>
          <LineChart label="Body weight" unit={weight[0]?.unit ?? 'kg'} points={weight} />
        </div>
        {lifts.map(([k, pts]) => (
          <div key={k} className="panel">
            <div className="kicker">{k}: top set</div>
            <LineChart label={`${k} top set`} unit="kg" points={pts} />
          </div>
        ))}
        <div className="panel">
          <div className="kicker">Best recorded</div>
          {records.length ? (
            <ul className="plain-list">
              {records.map(([k, r]) => (
                <li key={k}>
                  <span>{k}</span>
                  <Link to={`/r/${r.log.id}`} className="mono small">
                    {r.weight} kg {r.log.data.date ? `· ${r.log.data.date}` : '· undated'}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">No lifts logged.</p>
          )}
        </div>
      </div>
      <LogList logs={recent} empty="No fitness entries yet." />
    </section>
  )
}

function LogList({ logs, empty }: { logs: RecordOf<'log'>[]; empty: string }) {
  if (!logs.length) return <p className="muted small">{empty}</p>
  return (
    <ul className="log-list">
      {logs.map((l) => (
        <li key={l.id}>
          <span className="mono small log-date">{l.data.date ? formatPartial(l.data.date) : 'undated'}</span>
          <span className="kicker">{l.data.area}</span>
          <RecordLink rec={l} icon={false} />
          <span className="row-flex">
            <EpistemicChips rec={l} compact />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Care() {
  const logs = useKind('log').filter((l) => ['care', 'health', 'injury'].includes(l.data.area))
  const meds = useKind('medication')
  const newLog = useNewLog()
  const create = useCreate()
  const sorted = [...logs].sort((a, b) => partialSortKey(b.data.date ?? b.asOf).localeCompare(partialSortKey(a.data.date ?? a.asOf)))
  return (
    <section className="section" id="care">
      <SectionHead title="Health & personal care" count={logs.length + meds.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => newLog('care')}>
          Log care
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => newLog('health')}>
          Health note
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => create('medication', {})}>
          Medication record
        </button>
      </SectionHead>
      <p className="notice">
        A private record, not a diagnostic engine. Historical entries are history, not current problems. Medication records are never advice; this app never suggests changes.
      </p>
      <div className="cols cols-2">
        <div>
          <div className="kicker">Notes & observations</div>
          <LogList logs={sorted} empty="No entries. Import your private records file or add notes here." />
        </div>
        <div>
          <div className="kicker">Medication records</div>
          {meds.length ? (
            <ul className="log-list">
              {meds.map((m) => (
                <li key={m.id}>
                  <span className={`chip ${m.data.status === 'current' ? 'chip--accent' : 'chip--hist'}`}>{m.data.status}</span>
                  <RecordLink rec={m} icon={false} />
                  <span className="muted small">{m.data.dose || 'dose not recorded'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">None recorded.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function Social() {
  const logs = useKind('log').filter((l) => l.data.area === 'social')
  const newLog = useNewLog()
  return (
    <section className="section" id="social">
      <SectionHead title="Social practice" count={logs.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => newLog('social', 'Social practice')}>
          Log a situation
        </button>
      </SectionHead>
      <p className="muted small">Situations attempted, conversations started, what got easier. Behaviour and growth, not a measure of worth.</p>
      <LogList logs={logs} empty="Nothing logged yet." />
    </section>
  )
}

function Environment() {
  const items = useKind('item')
  const create = useCreate()
  const groups = [
    { title: 'Essential', xs: items.filter((i) => i.data.need === 'essential' && i.data.status !== 'bought' && i.data.status !== 'rejected') },
    { title: 'Optional', xs: items.filter((i) => i.data.need === 'optional' && i.data.status !== 'bought' && i.data.status !== 'rejected') },
    { title: 'Mostly appealing to imagine', xs: items.filter((i) => i.data.need === 'appealing' && i.data.status !== 'bought' && i.data.status !== 'rejected') },
    { title: 'Bought: did it help?', xs: items.filter((i) => i.data.status === 'bought') },
  ]
  return (
    <section className="section" id="environment">
      <SectionHead title="Environment & tools" count={items.length}>
        <button className="btn btn--ghost btn--sm" onClick={() => create('item', { data: { status: 'wishlist' } })}>
          Add item
        </button>
      </SectionHead>
      <p className="muted small">Things that reduce everyday friction versus things that are nice to imagine owning.</p>
      <div className="cols cols-2">
        {groups.map((g) => (
          <div key={g.title} className="panel">
            <div className="kicker">
              {g.title} · {g.xs.length}
              {g.xs.some((i) => i.data.cost) && ` · ₹${g.xs.reduce((a, i) => a + (i.data.cost ?? 0), 0).toLocaleString('en-IN')}`}
            </div>
            <ul className="plain-list">
              {g.xs.map((i) => (
                <li key={i.id}>
                  <RecordLink rec={i} />
                  <span className="row-flex">
                    {i.data.reducesFriction && (
                      <span className="chip chip--quiet" title="Reduces everyday friction">
                        <Icon name="check" size={11} /> friction
                      </span>
                    )}
                    {g.title.startsWith('Bought') && <span className="muted small">{i.data.actualBenefit ? 'benefit noted' : 'benefit not yet noted'}</span>}
                  </span>
                </li>
              ))}
              {!g.xs.length && <li className="muted small">—</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
