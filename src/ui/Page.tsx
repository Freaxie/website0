import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { IconName } from '../domain/kinds'
import { Icon } from './Icon'

export function PageHead({ mode, title, lede, actions }: { mode: string; title: string; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <div className="kicker">{mode}</div>
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Empty({
  icon = 'dot',
  title,
  children,
  action,
}: {
  icon?: IconName
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <Icon name={icon} size={20} />
      <div className="empty-title">{title}</div>
      {children && <div className="muted small empty-body">{children}</div>}
      {action}
    </div>
  )
}

export function SectionHead({ title, count, more, children }: { title: string; count?: number; more?: { to: string; label: string }; children?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>
        {title}
        {count !== undefined && <span className="count">{count}</span>}
      </h2>
      <div className="row-flex">
        {children}
        {more && (
          <Link className="more-link" to={more.to}>
            {more.label} <Icon name="arrow" size={13} />
          </Link>
        )}
      </div>
    </div>
  )
}
