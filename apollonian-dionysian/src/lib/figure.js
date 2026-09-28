// One human figure, built from primitives in a 400 × 800 box (eight heads tall, the classical canon).
// The Apollonian room draws it; the Dionysian room samples it into particles.

import { rng } from './geom.js'

export const HEAD = { cx: 200, cy: 100, r: 50 }

export const POLYS = {
  neck: [[186, 148], [214, 148], [216, 188], [184, 188]],
  torso: [[124, 192], [276, 192], [252, 420], [148, 420]],
  pelvis: [[148, 424], [252, 424], [256, 478], [144, 478]],
  armL: [[120, 196], [98, 206], [70, 446], [94, 452]],
  armR: [[280, 196], [302, 206], [330, 446], [306, 452]],
  legL: [[144, 482], [196, 482], [190, 768], [156, 768]],
  legR: [[204, 482], [256, 482], [244, 768], [210, 768]],
}

function inPoly(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function inFigure(x, y) {
  if (Math.hypot(x - HEAD.cx, y - HEAD.cy) <= HEAD.r) return true
  return Object.values(POLYS).some((p) => inPoly(x, y, p))
}

export function sampleFigure(count, seed = 7) {
  const r = rng(seed)
  const pts = []
  while (pts.length < count) {
    const x = 60 + r() * 280
    const y = 46 + r() * 726
    if (inFigure(x, y)) pts.push([x, y])
  }
  return pts
}

export const polyPoints = (p) => p.map((q) => q.join(',')).join(' ')
