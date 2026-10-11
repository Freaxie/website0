import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { partialSortKey } from '../domain/dates'

export interface Point {
  date: string
  value: number
}

/**
 * A minimal, honest single-series line chart: real points only, no smoothing, no extrapolation.
 * 2px line, ringed ≥8px markers, a hairline baseline, a crosshair that snaps to the nearest entry,
 * arrow-key access, and a table view. The title names the series, so there is no legend.
 */
export function LineChart({ points, unit, label }: { points: Point[]; unit: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const pts = [...points].sort((a, b) => partialSortKey(a.date).localeCompare(partialSortKey(b.date)))
  if (pts.length < 2)
    return (
      <p className="muted small">
        {pts.length === 1 ? `One dated entry (${pts[0].value} ${unit}, ${pts[0].date}). A trend needs at least two.` : 'No dated entries yet.'}
      </p>
    )
  const W = 340
  const H = 140
  const PX = 22
  const PT = 26
  const PB = 22
  const vs = pts.map((p) => p.value)
  const lo = Math.min(...vs)
  const hi = Math.max(...vs)
  const x = (i: number) => PX + (i / (pts.length - 1)) * (W - 2 * PX)
  const y = (v: number) => H - PB - ((v - lo) / (hi - lo || 1)) * (H - PT - PB)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('')

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    for (let i = 1; i < pts.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    setHover(best)
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const step = e.key === 'ArrowRight' ? 1 : -1
      setHover((h) => Math.max(0, Math.min(pts.length - 1, (h ?? (step > 0 ? -1 : pts.length)) + step)))
    }
  }
  const h = hover !== null ? pts[hover] : null
  const tipX = hover !== null ? Math.min(Math.max(x(hover), 60), W - 60) : 0

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        tabIndex={0}
        aria-label={`${label}, ${pts.length} entries from ${pts[0].date} to ${pts[pts.length - 1].date}. Use arrow keys to read values.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <line x1={PX} x2={W - PX} y1={H - PB} y2={H - PB} className="chart-axis" />
        <text x={PX} y={H - 6} className="chart-label">{pts[0].date}</text>
        <text x={W - PX} y={H - 6} className="chart-label" textAnchor="end">{pts[pts.length - 1].date}</text>
        <text x={PX} y={PT - 10} className="chart-label">{`${lo === hi ? hi : `${lo}–${hi}`} ${unit}`}</text>
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PT - 4} y2={H - PB} className="chart-cross" />}
        <path d={d} className="chart-line" />
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={i === hover ? 5 : 4} className="chart-dot" />
        ))}
        {h && hover !== null && (
          <g transform={`translate(${tipX},${Math.max(PT + 4, y(h.value) - 30)})`} className="chart-tip" aria-hidden>
            <rect x={-56} y={-14} width={112} height={22} rx={3} />
            <text textAnchor="middle" y={1}>{`${h.date} · ${h.value} ${unit}`}</text>
          </g>
        )}
      </svg>
      <details className="chart-table">
        <summary className="kicker">Table</summary>
        <table className="table table--tiny">
          <tbody>
            {pts.map((p, i) => (
              <tr key={i}>
                <td className="mono">{p.date}</td>
                <td className="mono">
                  {p.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
