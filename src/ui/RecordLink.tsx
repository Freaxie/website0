import { Link } from 'react-router-dom'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS } from '../domain/kinds'
import type { AnyRecord } from '../domain/types'
import { Icon } from './Icon'

export function RecordLink({ rec, icon = true, className = '' }: { rec: AnyRecord; icon?: boolean; className?: string }) {
  return (
    <Link to={`/r/${rec.id}`} className={`rlink ${rec.archived ? 'is-archived' : ''} ${className}`}>
      {icon && <Icon name={KIND_DEFS[rec.kind].icon} size={14} className="rlink-icon" />}
      <span className="truncate">{displayTitle(rec)}</span>
    </Link>
  )
}
