import { useCallback, useEffect, useRef, useState } from 'react'
import { useUi } from '../store/ui'

/**
 * Local draft state with debounced autosave. The draft is handed to `onSave` after a short pause,
 * on blur (call flush), when the page is hidden, and on unmount, so a refresh never loses typing.
 * Key the component by record id so a draft can never be saved into the wrong record.
 */
export function useDraft<T>(value: T, onSave: (v: T) => void, delay = 450) {
  const [draft, setDraftState] = useState(value)
  const latest = useRef(value)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saveRef = useRef(onSave)
  saveRef.current = onSave
  const markDirty = useUi((s) => s.markDirty)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (!dirty.current) return
    dirty.current = false
    markDirty(-1)
    saveRef.current(latest.current)
  }, [markDirty])

  // Accept outside changes (another tab, an import) only while there is nothing unsaved here.
  useEffect(() => {
    if (!dirty.current) {
      latest.current = value
      setDraftState(value)
    }
  }, [value])

  const setDraft = useCallback(
    (v: T) => {
      latest.current = v
      setDraftState(v)
      if (!dirty.current) {
        dirty.current = true
        markDirty(1)
      }
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, delay)
    },
    [delay, flush, markDirty],
  )

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  return [draft, setDraft, flush] as const
}
