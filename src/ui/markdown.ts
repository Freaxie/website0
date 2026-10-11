import DOMPurify from 'dompurify'
import { Marked, type TokenizerAndRendererExtension } from 'marked'
import { titleKey } from '../domain/wikilinks'

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

let hooked = false
function hookOnce() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? ''
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })
}

const caches = new WeakMap<Map<string, string>, Map<string, string>>()

/**
 * Markdown → sanitised HTML. [[Title]] becomes a link to the record with that title, or a
 * "missing" link that offers to create it. Inline HTML is sanitised; scripts never survive.
 */
export function renderMarkdown(md: string, titles: Map<string, string>): string {
  let cache = caches.get(titles)
  if (!cache) caches.set(titles, (cache = new Map()))
  const key = md
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  hookOnce()
  const wikilink: TokenizerAndRendererExtension = {
    name: 'wikilink',
    level: 'inline',
    start: (src) => {
      const i = src.indexOf('[[')
      return i < 0 ? undefined : i
    },
    tokenizer(src) {
      const m = /^\[\[([^\]|\n]+?)(?:\|([^\]\n]+))?\]\]/.exec(src)
      if (m) return { type: 'wikilink', raw: m[0], target: m[1].trim(), label: (m[2] ?? m[1]).trim() }
      return undefined
    },
    renderer(tok) {
      const id = titles.get(titleKey(tok.target as string))
      return id
        ? `<a class="wl" href="/r/${esc(id)}">${esc(tok.label as string)}</a>`
        : `<a class="wl wl-missing" href="#" data-missing="${esc(tok.target as string)}" title="Create “${esc(tok.target as string)}”">${esc(tok.label as string)}</a>`
    },
  }
  const marked = new Marked({ gfm: true, breaks: false, extensions: [wikilink] })
  const html = DOMPurify.sanitize(marked.parse(md, { async: false }) as string, { ADD_ATTR: ['target'] })
  if (cache.size > 500) cache.clear()
  cache.set(key, html)
  return html
}
