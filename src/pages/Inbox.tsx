import { Link } from 'react-router-dom'
import { formatTimestamp } from '../domain/dates'
import { humanize } from '../domain/kinds'
import { useKind } from '../store/hooks'
import { useUi } from '../store/ui'
import { Icon } from '../ui/Icon'
import { Markdown } from '../ui/Markdown'
import { Empty, PageHead } from '../ui/Page'
import { CaptureFiling } from './RecordPage'

export function Inbox() {
  const captures = useKind('capture', { archived: true })
  const set = useUi((s) => s.set)
  const open = captures.filter((c) => !c.archived && !c.data.processed).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const done = captures.length - open.length
  return (
    <div className="page inbox">
      <PageHead
        mode="Capture · Inbox"
        title="Inbox"
        lede="Captured without deciding where it belongs. File each one when you have a minute; filing keeps its text and links."
        actions={
          <button className="btn btn--primary" onClick={() => set({ capture: true })}>
            <Icon name="plus" size={15} /> Capture
          </button>
        }
      />
      {open.length === 0 ? (
        <Empty icon="inbox" title="Inbox empty">
          Press <kbd>c</kbd> anywhere to capture a thought. {done > 0 && <Link to="/index?kind=capture&archived=1">{done} processed captures</Link>}
        </Empty>
      ) : (
        <ul className="captures">
          {open.map((c) => (
            <li key={c.id} className="capture-item">
              <div className="capture-top">
                <span className="chip chip--quiet">{humanize(c.data.captureType)}</span>
                {c.private && (
                  <span className="chip chip--private">
                    <Icon name="lock" size={11} />
                  </span>
                )}
                <span className="kicker">{formatTimestamp(c.createdAt)}</span>
              </div>
              <Link to={`/r/${c.id}`} className="capture-title">
                {c.title}
              </Link>
              {c.body && <Markdown text={c.body} className="capture-body" />}
              <CaptureFiling rec={c} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
