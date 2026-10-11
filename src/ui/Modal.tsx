import { useEffect, useRef, type ReactNode } from 'react'
import { create } from 'zustand'

export function Modal({
  open,
  onClose,
  label,
  children,
  className = '',
  position = 'center',
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
  position?: 'center' | 'top'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef<Element | null>(null)
  useEffect(() => {
    if (!open) return
    prev.current = document.activeElement
    const el = ref.current
    const first = el?.querySelector<HTMLElement>('[autofocus], input, textarea, button, select')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
          (x) => !x.hasAttribute('disabled'),
        )
        if (!f.length) return
        const [a, z] = [f[0], f[f.length - 1]]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      ;(prev.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={`overlay overlay--${position}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={`dialog ${className}`}>
        {children}
      </div>
    </div>
  )
}

interface ConfirmReq {
  title: string
  body?: string
  confirm?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}
const useConfirmStore = create<{ req: ConfirmReq | null }>(() => ({ req: null }))

/** Promise-based confirmation for destructive operations. */
export function confirmAction(opts: Omit<ConfirmReq, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ req: { ...opts, resolve } }))
}

export function ConfirmHost() {
  const req = useConfirmStore((s) => s.req)
  const done = (ok: boolean) => {
    req?.resolve(ok)
    useConfirmStore.setState({ req: null })
  }
  return (
    <Modal open={!!req} onClose={() => done(false)} label={req?.title ?? 'Confirm'} className="dialog--confirm">
      {req && (
        <div className="confirm">
          <h2 className="serif">{req.title}</h2>
          {req.body && <p className="text-2">{req.body}</p>}
          <div className="row-flex confirm-actions">
            <button className="btn btn--ghost" onClick={() => done(false)}>
              Cancel
            </button>
            <button className={`btn ${req.danger ? 'btn--danger' : 'btn--primary'}`} onClick={() => done(true)} autoFocus>
              {req.confirm ?? 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
