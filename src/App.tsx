import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Atlas } from './pages/Atlas'
import { Home } from './pages/Home'
import { Identity } from './pages/Identity'
import { Inbox } from './pages/Inbox'
import { Index } from './pages/Index'
import { Learning } from './pages/Learning'
import { Library } from './pages/Library'
import { Life } from './pages/Life'
import { Projects } from './pages/Projects'
import { RecordPage } from './pages/RecordPage'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'
import { Timeline } from './pages/Timeline'
import { Layout } from './shell/Layout'
import { useStore } from './store/store'
import { useUi } from './store/ui'

// The graph library is the heaviest dependency; load it only when the graph is opened.
const GraphPage = lazy(() => import('./pages/GraphPage').then((m) => ({ default: m.GraphPage })))

function useTheme() {
  const theme = useStore((s) => s.settings.theme)
  const accent = useStore((s) => s.settings.accent)
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'dark') : theme
      root.dataset.theme = resolved
      root.dataset.accent = accent
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'paper' ? '#eeede8' : '#0d1015')
      try {
        localStorage.setItem('atlas:theme', JSON.stringify({ theme: resolved, accent }))
      } catch {
        /* storage blocked: the theme still applies for this session */
      }
    }
    apply()
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, accent])
}

/** Warn before closing the tab while an edit is still in flight. */
function useUnloadGuard() {
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (useUi.getState().dirty > 0 || useStore.getState().save.pending > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBefore)
    return () => window.removeEventListener('beforeunload', onBefore)
  }, [])
}

export default function App() {
  const status = useStore((s) => s.status)
  const loadError = useStore((s) => s.loadError)
  useTheme()
  useUnloadGuard()
  useEffect(() => {
    void useStore.getState().init()
  }, [])

  if (status === 'loading')
    return (
      <div className="boot" role="status">
        <span className="boot-mark" />
        <span className="kicker">Opening the atlas…</span>
      </div>
    )
  if (status === 'error')
    return (
      <div className="boot boot--error" role="alert">
        <h1 className="serif">The atlas can’t open its storage</h1>
        <p className="text-2">{loadError}</p>
        <p className="muted small">
          This app keeps everything in your browser’s IndexedDB. Private browsing modes and blocked site data can prevent that. Nothing has been lost; try a normal
          window.
        </p>
      </div>
    )

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="identity" element={<Identity />} />
          <Route path="atlas" element={<Atlas />} />
          <Route
            path="graph"
            element={
              <Suspense fallback={<div className="page muted">Loading graph…</div>}>
                <GraphPage />
              </Suspense>
            }
          />
          <Route path="learning" element={<Learning />} />
          <Route path="projects" element={<Projects />} />
          <Route path="life" element={<Life />} />
          <Route path="library" element={<Library />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="review" element={<Review />} />
          <Route path="index" element={<Index />} />
          <Route path="settings" element={<Settings />} />
          <Route path="r/:id" element={<RecordPage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <div className="empty">
                  <h1 className="serif">Nowhere on the map</h1>
                  <p className="muted">That address doesn’t exist.</p>
                  <Link className="btn" to="/">
                    Back to the Observatory
                  </Link>
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
