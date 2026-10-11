import { useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGraphIndex } from '../store/hooks'
import { useStore } from '../store/store'
import { renderMarkdown } from './markdown'

/** Rendered markdown. Internal links navigate in-app; a missing [[link]] creates the note on click. */
export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const { titles } = useGraphIndex()
  const navigate = useNavigate()
  const html = useMemo(() => renderMarkdown(text, titles), [text, titles])

  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a')
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const missing = a.getAttribute('data-missing')
    if (missing) {
      e.preventDefault()
      const rec = useStore.getState().create('note', { title: missing })
      navigate(`/r/${rec.id}?edit=1`)
      return
    }
    const href = a.getAttribute('href') ?? ''
    if (href.startsWith('/') && !href.startsWith('/functions')) {
      e.preventDefault()
      navigate(href)
    }
  }
  return <div className={`md ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
