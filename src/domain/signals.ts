import { daysSince } from './dates'
import { COMMITTED_INTEREST, type AnyRecord, type RecordOf, type Settings } from './types'

export interface Signal {
  id: string
  tone: 'info' | 'warn'
  text: string
  href: string
}

const of = <K extends AnyRecord['kind']>(rs: AnyRecord[], k: K) => rs.filter((r): r is RecordOf<K> => r.kind === k && !r.archived)

/**
 * Patterns computed from stored records only. Phrased as observations, never as praise or blame:
 * the point is to notice drift early, not to keep score.
 */
export function computeSignals(all: AnyRecord[], settings: Settings, now = Date.now()): Signal[] {
  const out: Signal[] = []
  const projects = of(all, 'project')
  const active = projects.filter((p) => p.data.status === 'active')

  if (active.length > settings.activeProjectLimit)
    out.push({
      id: 'over-limit',
      tone: 'warn',
      text: `${active.length} active projects against a limit of ${settings.activeProjectLimit}. Consider pausing one deliberately.`,
      href: '/projects',
    })

  for (const p of active) {
    if (!p.data.nextAction.trim())
      out.push({ id: `no-next-${p.id}`, tone: 'warn', text: `“${p.title}” is active but has no next action.`, href: `/r/${p.id}` })
    else if (daysSince(p.updatedAt, now) > 21)
      out.push({
        id: `stale-${p.id}`,
        tone: 'info',
        text: `“${p.title}” is marked active but hasn’t changed in ${daysSince(p.updatedAt, now)} days. Still active?`,
        href: `/r/${p.id}`,
      })
  }

  const started30 = projects.filter((p) => daysSince(p.createdAt, now) <= 30 && p.origin !== 'seed').length
  const finished90 = projects.filter(
    (p) => p.data.status === 'completed' && p.origin !== 'seed' && daysSince(p.updatedAt, now) <= 90,
  ).length
  if (started30 >= 3 && finished90 === 0)
    out.push({
      id: 'starts-vs-finishes',
      tone: 'warn',
      text: `${started30} projects created in the last 30 days, none completed in 90. More starting than finishing.`,
      href: '/projects',
    })

  const focus = of(all, 'topic').filter((t) => COMMITTED_INTEREST.includes(t.data.status))
  if (focus.length > settings.focusTopicLimit)
    out.push({
      id: 'focus-over',
      tone: 'warn',
      text: `${focus.length} topics marked as studying, practicing or building (limit ${settings.focusTopicLimit}). Which are really fascinations?`,
      href: '/atlas',
    })
  for (const t of focus) {
    const last = t.data.lastStudied
    if (!last || daysSince(`${last.padEnd(10, last.length === 4 ? '-12-31' : '-28')}T00:00:00Z`, now) > 30)
      out.push({
        id: `unstudied-${t.id}`,
        tone: 'info',
        text: last
          ? `“${t.title}” is marked ${t.data.status}, last studied ${last}.`
          : `“${t.title}” is marked ${t.data.status} but has no study date recorded.`,
        href: `/r/${t.id}`,
      })
  }

  const inbox = all.filter((r) => r.kind === 'capture' && !r.archived && !r.data.processed).length
  if (inbox > 0)
    out.push({
      id: 'inbox',
      tone: inbox > 10 ? 'warn' : 'info',
      text: `${inbox} capture${inbox === 1 ? '' : 's'} waiting in the inbox.`,
      href: '/inbox',
    })

  const reviews = of(all, 'review').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const lastReview = reviews[0]
  if (!lastReview)
    out.push({ id: 'no-review', tone: 'info', text: 'No weekly review yet.', href: '/review' })
  else if (daysSince(lastReview.createdAt, now) > 8)
    out.push({
      id: 'review-due',
      tone: 'info',
      text: `Last review was ${daysSince(lastReview.createdAt, now)} days ago.`,
      href: '/review',
    })

  for (const g of of(all, 'goal'))
    if (g.data.status === 'active' && !g.data.actions.some((a) => !a.done))
      out.push({
        id: `goal-${g.id}`,
        tone: 'info',
        text: `Goal “${g.title}” is active but has no open observable action.`,
        href: `/r/${g.id}`,
      })

  const tasks = of(all, 'task')
  const made14 = tasks.filter((t) => daysSince(t.createdAt, now) <= 14).length
  const done14 = tasks.filter((t) => t.data.doneAt && daysSince(t.data.doneAt, now) <= 14).length
  if (made14 >= 8 && done14 * 4 < made14)
    out.push({
      id: 'plans-vs-done',
      tone: 'warn',
      text: `${made14} tasks created in two weeks, ${done14} completed. Planning is outpacing doing.`,
      href: '/projects',
    })

  return out
}
