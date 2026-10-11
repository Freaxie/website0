import { create } from 'zustand'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'warn' | 'error'
  action?: { label: string; run: () => void }
}

interface UiState {
  palette: boolean
  capture: boolean
  shortcuts: boolean
  drawer: boolean
  /** Editors with keystrokes not yet handed to the store (debounced autosave). */
  dirty: number
  toasts: Toast[]
  set(patch: Partial<Pick<UiState, 'palette' | 'capture' | 'shortcuts' | 'drawer'>>): void
  closeAll(): boolean
  markDirty(delta: 1 | -1): void
  toast(text: string, tone?: Toast['tone'], action?: Toast['action']): void
  dismiss(id: number): void
}

let tid = 0
export const useUi = create<UiState>()((set, get) => ({
  palette: false,
  capture: false,
  shortcuts: false,
  drawer: false,
  dirty: 0,
  toasts: [],
  set: (patch) => set(patch),
  closeAll() {
    const s = get()
    const open = s.palette || s.capture || s.shortcuts || s.drawer
    if (open) set({ palette: false, capture: false, shortcuts: false, drawer: false })
    return open
  },
  markDirty: (d) => set((s) => ({ dirty: Math.max(0, s.dirty + d) })),
  toast(text, tone = 'info', action) {
    const id = ++tid
    set((s) => ({ toasts: [...s.toasts, { id, text, tone, action }] }))
    setTimeout(() => get().dismiss(id), action ? 7000 : 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
