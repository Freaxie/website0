import { Reveal } from './Text.jsx'

export const KINDS = {
  empirical: { label: 'Empirical claim', gloss: 'Observed, measured and replicated.' },
  model: { label: 'Theoretical model', gloss: 'A proposed explanation, competing with others.' },
  argument: { label: 'Philosophical argument', gloss: 'Reasoning about concepts. Data alone does not settle it.' },
  open: { label: 'Open question', gloss: 'Nobody knows yet.' },
}

// One glyph per kind of statement: solid for what is measured, outlined for what is proposed,
// a triangle for what is argued, a broken circle for what is unknown.
export function Glyph({ kind, size = 9 }) {
  const s = size
  const c = 'currentColor'
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden="true">
      {kind === 'empirical' && <rect x="1" y="1" width="8" height="8" fill={c} />}
      {kind === 'model' && <path d="M5 0.6 L9.4 5 L5 9.4 L0.6 5 Z" fill="none" stroke={c} strokeWidth="1.1" />}
      {kind === 'argument' && <path d="M5 1 L9.2 9 L0.8 9 Z" fill="none" stroke={c} strokeWidth="1.1" />}
      {kind === 'open' && (
        <circle cx="5" cy="5" r="4" fill="none" stroke={c} strokeWidth="1.1" strokeDasharray="1.6 1.6" />
      )}
    </svg>
  )
}

export function Tag({ kind, className = '' }) {
  return (
    <span className={`tag mono ${className}`}>
      <Glyph kind={kind} />
      {KINDS[kind].label}
    </span>
  )
}

export function Claim({ kind, children, cite, delay = 0 }) {
  return (
    <Reveal as="aside" className="claim" delay={delay}>
      <div className="claim__tag">
        <Tag kind={kind} />
      </div>
      <p className="claim__text">{children}</p>
      {cite && <p className="claim__cite">{cite}</p>}
    </Reveal>
  )
}

export function Claims({ children }) {
  return <div className="claims">{children}</div>
}
