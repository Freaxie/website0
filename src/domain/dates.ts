import type { PartialDate } from './types'

export const TIME_ZONE = 'Asia/Kolkata'
const PARTIAL = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/

export const isPartialDate = (s: string | null | undefined): s is PartialDate => !!s && PARTIAL.test(s)

/** Today's date in the owner's time zone, as YYYY-MM-DD. */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026" → "2026", "2026-10" → "Oct 2026", "2026-10-11" → "11 Oct 2026". */
export function formatPartial(d: PartialDate | null | undefined): string {
  if (!d) return 'Date unknown'
  const [y, m, day] = d.split('-')
  if (!m) return y
  if (!day) return `${MONTHS[Number(m) - 1]} ${y}`
  return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`
}

/** Sort key that places partial dates at the start of their period. */
export const partialSortKey = (d: PartialDate | null | undefined) => (d ? d.padEnd(10, d.length === 4 ? '-00-00' : '-00') : '')

export function formatTimestamp(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime()
  const s = Math.round((now - t) / 1000)
  if (s < 45) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(t))
}

export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - new Date(iso).getTime()) / 86400000)

/** Monday of the week containing the given YYYY-MM-DD, as YYYY-MM-DD. */
export function weekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}
