import { useEffect, useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router-dom'
import { displayTitle } from '../domain/factory'
import { KIND_DEFS, SECTIONS } from '../domain/kinds'
import { useVisible } from '../store/hooks'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { ConfirmHost } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { CommandPalette } from './CommandPalette'
import { formatCombo, isMac } from './keys'
import { NAV, sectionForPath } from './nav'
import { QuickCapture } from './QuickCapture'
import { ShortcutsHelp } from './ShortcutsHelp'
import { Toasts } from './Toasts'
import { useGlobalShortcuts } from './useGlobalShortcuts'

export function Layout() {
  useGlobalShortcuts()
  const location = useLocation()
  const closeDrawer = useUi((s) => s.set)
  useEffect(() => {
    closeDrawer({ drawer: false })
    window.scrollTo(0, 0)
  }, [location.pathname, closeDrawer])

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="main">
        <TopBar />
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
      <QuickCapture />
      <ShortcutsHelp />
      <ConfirmHost />
      <Toasts />
    </div>
  )
}

function Sidebar() {
  const drawer = useUi((s) => s.drawer)
  const set = useUi((s) => s.set)
  const records = useVisible()
  const recent = useStore((s) => s.recent)
  const inbox = useMemo(() => Object.values(records).filter((r) => r.kind === 'capture' && !r.archived && !r.data.processed).length, [records])
  const pinned = useMemo(
    () => Object.values(records).filter((r) => r.pinned && !r.archived).sort((a, b) => a.title.localeCompare(b.title)),
    [records],
  )
  const recents = recent.map((id) => records[id]).filter(Boolean).slice(0, 5)
  let group = ''
  return (
    <>
      <div className={`drawer-scrim ${drawer ? 'is-open' : ''}`} onClick={() => set({ drawer: false })} aria-hidden />
      <aside className={`sidebar ${drawer ? 'is-open' : ''}`} aria-label="Primary">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <ellipse cx="12" cy="12" rx="4.5" ry="10.5" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
              <path d="M1.5 12h21" stroke="currentColor" strokeWidth="1" opacity=".55" />
              <circle cx="16.4" cy="7.2" r="1.9" fill="var(--accent)" />
            </svg>
          </span>
          <span>
            <span className="brand-name">Atlas</span>
            <span className="brand-sub">Krish · personal</span>
          </span>
        </Link>
        <button className="side-search" onClick={() => set({ palette: true })}>
          <Icon name="search" size={14} />
          <span>Search</span>
          <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <nav className="side-nav">
          {NAV.filter((n) => n.section !== 'settings').map((n) => {
            const s = SECTIONS[n.section]
            const head = n.group !== group ? (group = n.group) : null
            return (
              <div key={n.section}>
                {head && <div className="side-group kicker">{head}</div>}
                <NavLink to={s.path} end={s.path === '/'} className="side-link">
                  <Icon name={s.icon} size={16} />
                  <span>{s.label}</span>
                  {n.section === 'inbox' && inbox > 0 && <span className="side-count">{inbox}</span>}
                </NavLink>
              </div>
            )
          })}
        </nav>
        {pinned.length > 0 && (
          <div className="side-block">
            <div className="side-group kicker">Pinned</div>
            {pinned.map((r) => (
              <NavLink key={r.id} to={`/r/${r.id}`} className="side-link side-link--rec">
                <Icon name={KIND_DEFS[r.kind].icon} size={14} />
                <span className="truncate">{displayTitle(r)}</span>
              </NavLink>
            ))}
          </div>
        )}
        {recents.length > 0 && (
          <div className="side-block">
            <div className="side-group kicker">Recent</div>
            {recents.map((r) => (
              <NavLink key={r.id} to={`/r/${r.id}`} className="side-link side-link--rec">
                <Icon name={KIND_DEFS[r.kind].icon} size={14} />
                <span className="truncate">{displayTitle(r)}</span>
              </NavLink>
            ))}
          </div>
        )}
        <div className="side-foot">
          <NavLink to="/settings" className="side-link">
            <Icon name="settings" size={16} />
            <span>Settings</span>
          </NavLink>
          <button className="side-link" onClick={() => set({ shortcuts: true })}>
            <Icon name="keyboard" size={16} />
            <span>Shortcuts</span>
            <kbd>?</kbd>
          </button>
        </div>
      </aside>
    </>
  )
}

function SaveStatus() {
  const save = useStore((s) => s.save)
  const dirty = useUi((s) => s.dirty)
  const state = save.error ? 'error' : dirty > 0 ? 'unsaved' : save.pending > 0 ? 'saving' : save.lastSaved ? 'saved' : 'idle'
  const text = { error: 'Not saved', unsaved: 'Editing…', saving: 'Saving…', saved: 'Saved', idle: 'Stored locally' }[state]
  return (
    <span className={`save save--${state}`} role="status" aria-live="polite" title={save.error ? `Save failed: ${save.error}` : 'Everything is stored in this browser'}>
      <span className="save-dot" aria-hidden />
      {text}
    </span>
  )
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const m = useMatch('/r/:id')
  const records = useVisible()
  const rec = m ? records[m.params.id!] : undefined
  const section = rec ? SECTIONS[KIND_DEFS[rec.kind].section] : sectionForPath(pathname)
  const parent = rec?.kind === 'task' && rec.data.projectId ? records[rec.data.projectId] : undefined
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {section && (
          <li>
            <Link to={section.path}>{section.label}</Link>
          </li>
        )}
        {parent && (
          <li>
            <Link to={`/r/${parent.id}`}>{displayTitle(parent)}</Link>
          </li>
        )}
        {rec && (
          <li aria-current="page" className="truncate">
            {displayTitle(rec)}
          </li>
        )}
      </ol>
    </nav>
  )
}

function TopBar() {
  const set = useUi((s) => s.set)
  const shortcut = useStore((s) => s.settings.captureShortcut)
  const hidePrivate = useStore((s) => s.settings.hidePrivate)
  return (
    <header className="topbar">
      <button className="icon-btn topbar-menu" aria-label="Open navigation" onClick={() => set({ drawer: true })}>
        <Icon name="menu" />
      </button>
      <Breadcrumbs />
      <div className="spacer" />
      {hidePrivate && (
        <span className="chip chip--private" title="Private records are hidden (Settings → Privacy)">
          <Icon name="lock" size={11} /> Screen on
        </span>
      )}
      <SaveStatus />
      <button className="icon-btn topbar-search" aria-label="Search and commands" onClick={() => set({ palette: true })}>
        <Icon name="search" />
      </button>
      <button className="btn btn--primary btn--sm topbar-capture" onClick={() => set({ capture: true })} title={`Quick capture (${formatCombo(shortcut)})`}>
        <Icon name="plus" size={14} /> <span>Capture</span>
      </button>
    </header>
  )
}

function MobileNav() {
  const set = useUi((s) => s.set)
  const items = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/atlas', icon: 'atlas', label: 'Atlas' },
    null,
    { to: '/projects', icon: 'forge', label: 'Forge' },
    { to: '/inbox', icon: 'inbox', label: 'Inbox' },
  ] as const
  return (
    <nav className="mobile-nav" aria-label="Quick navigation">
      {items.map((it, i) =>
        it ? (
          <NavLink key={it.to} to={it.to} end={it.to === '/'} className="mobile-link">
            <Icon name={it.icon} size={19} />
            <span>{it.label}</span>
          </NavLink>
        ) : (
          <button key={i} className="mobile-capture" aria-label="Quick capture" onClick={() => set({ capture: true })}>
            <Icon name="plus" size={22} />
          </button>
        ),
      )}
    </nav>
  )
}
