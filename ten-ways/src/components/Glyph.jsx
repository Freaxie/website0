// An archetype's sign, drawn in a 100 × 100 box.
export default function Glyph({ d, className = '', stroke = 'currentColor', width = 5 }) {
  return (
    <svg viewBox="-4 -4 108 108" className={`glyph ${className}`} aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
