import { useEffect, useRef, useState } from 'react'
import { drawMorph } from '../lib/forms.js'
import { bus, reduced } from '../lib/bus.js'

const DUR = 1700

// Every link to a plate becomes a passage: the world you are in is taken apart and reassembled
// as the world you asked for, and only then does the page move.
export default function Passage() {
  const canvas = useRef(null)
  const [run, setRun] = useState(null)

  useEffect(() => {
    const click = (e) => {
      const link = e.target.closest?.('a[href^="#plate-"]')
      if (!link || reduced || e.metaKey || e.ctrlKey) return
      const to = link.getAttribute('href').slice(7)
      const mid = innerHeight / 2
      const here = [...document.querySelectorAll('[data-world]')].find((el) => {
        const r = el.getBoundingClientRect()
        return r.top <= mid && r.bottom >= mid
      })
      const from = here ? here.dataset.world : 'reality'
      if (from === to) return
      e.preventDefault()
      bus.switched()
      setRun({ from, to, start: performance.now(), jumped: false })
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [])

  useEffect(() => {
    if (!run) return
    const el = canvas.current
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)
    el.width = Math.round(innerWidth * dpr)
    el.height = Math.round(innerHeight * dpr)
    const ctx = el.getContext('2d')
    let raf
    const frame = (now) => {
      const p = Math.min(1, (now - run.start) / DUR)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawMorph(ctx, innerWidth, innerHeight, run.from, run.to, p, now / 1000)
      if (p > 0.5 && !run.jumped) {
        run.jumped = true
        const target = document.getElementById(`plate-${run.to}`)
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + scrollY, behavior: 'instant' })
        history.replaceState(null, '', `#plate-${run.to}`)
      }
      if (p < 1) raf = requestAnimationFrame(frame)
      else {
        el.classList.add('is-leaving')
        setTimeout(() => setRun(null), 450)
      }
    }
    el.classList.remove('is-leaving')
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run])

  return run ? <canvas ref={canvas} className="passage" aria-hidden="true" /> : null
}
