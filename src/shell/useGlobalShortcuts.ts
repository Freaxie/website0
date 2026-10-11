import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SECTIONS } from '../domain/kinds'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { isTyping, matches } from './keys'
import { NAV } from './nav'

/**
 * ⌘/Ctrl+K palette · Alt+N (and ⌘/Ctrl+N where the browser allows it) new note · capture shortcut
 * (Settings) · / search · ? help · g then a letter to jump · Esc closes overlays.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const pendingG = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      const typing = isTyping(e.target)
      const newNote = () => {
        e.preventDefault()
        ui.closeAll()
        const r = useStore.getState().create('note', {})
        navigate(`/r/${r.id}?edit=1`)
      }

      if (matches(e, 'mod+k')) {
        e.preventDefault()
        ui.set({ palette: !ui.palette, capture: false })
        return
      }
      if (matches(e, 'alt+n') || matches(e, 'mod+n')) return newNote()
      const capture = useStore.getState().settings.captureShortcut
      const captureHasMod = /mod|alt|ctrl|cmd/.test(capture)
      if (matches(e, capture) && (captureHasMod || !typing)) {
        e.preventDefault()
        ui.set({ capture: true, palette: false })
        return
      }
      if (e.key === 'Escape') {
        if (ui.closeAll()) e.preventDefault()
        else if (typing) (e.target as HTMLElement).blur()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return

      if (Date.now() - pendingG.current < 1200) {
        pendingG.current = 0
        const n = NAV.find((x) => x.key === e.key.toLowerCase())
        if (n) {
          e.preventDefault()
          navigate(SECTIONS[n.section].path)
        }
        return
      }
      if (e.key === 'g') {
        pendingG.current = Date.now()
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        ui.set({ palette: true })
      } else if (e.key === '?') {
        e.preventDefault()
        ui.set({ shortcuts: !ui.shortcuts })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}
