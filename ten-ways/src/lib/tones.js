// Each archetype's colour, turned into a page to read on: a paper faintly of its hue, an ink of the
// same hue gone nearly black, and an accent dark enough to set text in. Worked in OKLCH, where
// lightness can be changed without the hue drifting.
import { mark } from './archetypes.js'

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function oklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(A, B), (Math.atan2(B, A) * 180) / Math.PI]
}

function rgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}

// A colour from lightness, chroma and hue, with the chroma eased off until it fits the screen's gamut.
export function hex(L, C, H) {
  let c = C
  let v = rgb(L, c, H)
  while (c > 0.001 && v.some((x) => x < -0.0005 || x > 1.0005)) {
    c *= 0.94
    v = rgb(L, c, H)
  }
  return (
    '#' +
    v
      .map((x) =>
        Math.round(gam(Math.min(1, Math.max(0, x))) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

// The colour an archetype keeps on a pale page: near-black plates lend their foreground when it has a
// hue of its own (the rebel's red), and otherwise stay black (the cinephile's dark).
export function accentOf(a) {
  const [L] = oklch(a.color)
  if (L > 0.22) return a.color
  const [, C] = oklch(a.fg)
  return C > 0.08 ? mark(a) : a.color
}

const memo = new Map()
export function tones(a) {
  if (memo.has(a.id)) return memo.get(a.id)
  const acc = accentOf(a)
  const [L, C, H] = oklch(acc)
  const hued = C > 0.03
  // a warm paper, washed with the faintest trace of the archetype's own hue
  const paper = (L0, k) => {
    const a0 = 0.0035 + (hued ? Math.cos((H * Math.PI) / 180) * k : 0)
    const b0 = 0.0125 + (hued ? Math.sin((H * Math.PI) / 180) * k : 0)
    return hex(L0, Math.hypot(a0, b0), (Math.atan2(b0, a0) * 180) / Math.PI)
  }
  const k = Math.min(0.013, C * 0.1)
  const t = {
    page: paper(0.966, k),
    page2: paper(0.94, k * 1.45),
    ink: hex(0.25, hued ? Math.min(0.03, C * 0.25) : 0.008, hued ? H : 80),
    soft: hex(0.47, hued ? Math.min(0.035, C * 0.3) : 0.01, hued ? H : 80),
    rule: hex(0.84, hued ? Math.min(0.03, C * 0.25) : 0.012, hued ? H : 80),
    // the accent as it is, for large marks; and dark enough to read, for text
    accent: L > 0.7 ? a.ink || hex(0.6, C, H) : acc,
    acc: hex(Math.min(L, 0.5), Math.min(C, 0.17), H),
  }
  memo.set(a.id, t)
  return t
}

export const toneVars = (a) => {
  const t = tones(a)
  return { '--t-page': t.page, '--t-page2': t.page2, '--t-ink': t.ink, '--t-soft': t.soft, '--t-rule': t.rule, '--t-accent': t.accent, '--t-acc': t.acc }
}
