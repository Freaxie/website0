// The test's result as a picture to keep: a 1080 × 1350 card with the epithet, the shape of the
// constellation over all twenty-four ways, and the three strongest.
import { ARCHETYPES } from './archetypes.js'

const W = 1080
const H = 1350
const INK = '#0c0c0c'
const PAPER = '#f1ece1'

export function drawCard(canvas, { title, sub, raw, top }) {
  canvas.width = W
  canvas.height = H
  const c = canvas.getContext('2d')
  const serif = "'Instrument Serif', 'Times New Roman', serif"
  const mono = "'JetBrains Mono', ui-monospace, monospace"
  const text = "'Newsreader Variable', 'Newsreader', Georgia, serif"
  c.fillStyle = INK
  c.fillRect(0, 0, W, H)
  // a band of the twenty-four colours along the top
  ARCHETYPES.forEach((a, i) => {
    c.fillStyle = a.color
    c.fillRect((i * W) / 24, 0, W / 24 + 1, 14)
  })
  c.fillStyle = PAPER
  c.textBaseline = 'alphabetic'
  c.font = `500 20px ${mono}`
  c.letterSpacing = '3px'
  c.fillText('TWENTY-FOUR WAYS OF ENCOUNTERING REALITY', 72, 96)
  c.fillText('MY CONSTELLATION', 72, 128)
  c.letterSpacing = '0px'

  // the epithet, shrunk until it fits on two lines at most
  let size = 118
  let lines = [title]
  const wrap = (s, max) => {
    const words = s.split(' ')
    const out = ['']
    for (const w of words) {
      const t = out[out.length - 1] ? out[out.length - 1] + ' ' + w : w
      if (c.measureText(t).width > max && out[out.length - 1]) out.push(w)
      else out[out.length - 1] = t
    }
    return out
  }
  for (; size > 56; size -= 6) {
    c.font = `italic ${size}px ${serif}`
    lines = wrap(title, W - 144)
    if (lines.length <= 2) break
  }
  lines.forEach((l, i) => c.fillText(l, 72, 250 + i * size * 0.98))
  let y = 250 + (lines.length - 1) * size * 0.98 + 54
  c.font = `28px ${text}`
  c.globalAlpha = 0.8
  wrap(sub, W - 144)
    .slice(0, 2)
    .forEach((l, i) => c.fillText(l, 72, y + i * 38))
  c.globalAlpha = 1

  // the shape
  const cx = W / 2
  const cy = 800
  const R = 290
  const max = Math.max(3, ...Object.values(raw))
  const at = (i, r) => {
    const t = (i / 24) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r]
  }
  c.strokeStyle = 'rgba(241,236,225,0.14)'
  c.lineWidth = 1
  for (const k of [0.33, 0.66, 1]) {
    c.beginPath()
    c.arc(cx, cy, R * k, 0, Math.PI * 2)
    c.stroke()
  }
  ARCHETYPES.forEach((a, i) => {
    const [x, y2] = at(i, R)
    c.beginPath()
    c.moveTo(cx, cy)
    c.lineTo(x, y2)
    c.stroke()
  })
  c.beginPath()
  ARCHETYPES.forEach((a, i) => {
    const [x, y2] = at(i, 26 + (raw[a.id] / max) * (R - 26))
    if (i) c.lineTo(x, y2)
    else c.moveTo(x, y2)
  })
  c.closePath()
  c.fillStyle = 'rgba(241,236,225,0.12)'
  c.fill()
  c.strokeStyle = PAPER
  c.lineWidth = 2.5
  c.lineJoin = 'round'
  c.stroke()
  ARCHETYPES.forEach((a, i) => {
    const v = raw[a.id]
    const [x, y2] = at(i, 26 + (v / max) * (R - 26))
    c.beginPath()
    c.arc(x, y2, v ? 9 : 4, 0, Math.PI * 2)
    c.fillStyle = a.color === '#0c0c0c' ? a.fg : a.color
    c.fill()
    const [lx, ly] = at(i, R + 26)
    c.font = `500 13px ${mono}`
    c.fillStyle = v ? PAPER : 'rgba(241,236,225,0.4)'
    c.textAlign = Math.abs(lx - cx) < 20 ? 'center' : lx > cx ? 'left' : 'right'
    c.fillText(a.name.toUpperCase(), lx, ly + 5)
  })
  c.textAlign = 'left'

  // the three strongest
  const colW = (W - 144) / 3
  top.forEach((a, i) => {
    const x = 72 + i * colW
    const yy = 1200
    c.fillStyle = a.color === '#0c0c0c' ? a.fg : a.color
    c.fillRect(x, yy, colW - 24, 6)
    c.fillStyle = PAPER
    c.font = `500 15px ${mono}`
    c.globalAlpha = 0.6
    c.fillText(`${['FIRST', 'SECOND', 'THIRD'][i]} · ${a.no}`, x, yy + 40)
    c.globalAlpha = 1
    c.font = `44px ${serif}`
    c.fillText(a.name, x, yy + 88)
    c.font = `italic 22px ${text}`
    c.globalAlpha = 0.75
    c.fillText(`to ${a.verb} reality`, x, yy + 120)
    c.globalAlpha = 1
  })
}

// Save the card. Inside a claude.ai artifact the page may not download by itself: the viewer is asked
// through the downloads capability. Anywhere else, an ordinary download link does it.
export async function saveCard(canvas, filename = 'my-constellation.png') {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) return false
  const downloads = await window.claude?.use?.('downloads').catch(() => null)
  if (downloads) {
    try {
      await downloads.save({ filename, data: blob })
      return true
    } catch {
      return false
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}
