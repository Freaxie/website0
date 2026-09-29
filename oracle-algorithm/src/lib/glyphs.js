// Twelve ritual signs, invented for this exhibition (they belong to no real tradition).
// Each is a list of primitives in a 100 × 100 box, so one definition serves both
// the SVG drawings and the point clouds that the Transmutation room turns into a grid.
//   ['c', cx, cy, r]            circle
//   ['l', x1, y1, x2, y2]       line
//   ['a', cx, cy, r, a0, a1]    arc, degrees, y down

const zig = (pts) => pts.slice(1).map((p, i) => ['l', pts[i][0], pts[i][1], p[0], p[1]])

export const GLYPHS = [
  {
    id: 'eye', name: 'The Eye',
    prims: [['a', 50, 95, 62, -130, -50], ['a', 50, 0, 62, 50, 130], ['c', 50, 48, 11]],
    root: 'Beneath your question lies the Eye: something already sees what you are only beginning to ask.',
    cross: 'It is crossed by the Eye: you are being watched by the part of you that already knows.',
    end: 'It comes to the Eye. What is hidden will be seen, though perhaps not by you.',
  },
  {
    id: 'threshold', name: 'The Threshold',
    prims: [['l', 25, 90, 25, 20], ['l', 75, 90, 75, 20], ['l', 14, 20, 86, 20], ['c', 50, 58, 6]],
    root: 'Beneath your question lies the Threshold: you are asking from a doorway, not a room.',
    cross: 'It is crossed by the Threshold: one step is being mistaken for a journey.',
    end: 'It comes to the Threshold. The answer is not on this side.',
  },
  {
    id: 'knot', name: 'The Knot',
    prims: [['c', 37, 50, 22], ['c', 63, 50, 22]],
    root: 'Beneath your question lies the Knot: two things you think are separate are one.',
    cross: 'It is crossed by the Knot: pulling harder will tighten it.',
    end: 'It comes to the Knot. What binds you is also what holds you up.',
  },
  {
    id: 'tide', name: 'The Tide',
    prims: [30, 52, 74].flatMap((y) => [['a', 26, y, 12, 180, 360], ['a', 50, y, 12, 180, 0], ['a', 74, y, 12, 180, 360]]),
    root: 'Beneath your question lies the Tide: what left will return, changed.',
    cross: 'It is crossed by the Tide: the moment is not yours to hurry.',
    end: 'It comes to the Tide. Wait for the second wave, not the first.',
  },
  {
    id: 'key', name: 'The Key',
    prims: [['c', 28, 50, 15], ['l', 43, 50, 88, 50], ['l', 76, 50, 76, 64], ['l', 86, 50, 86, 60]],
    root: 'Beneath your question lies the Key: you already hold the thing you are asking for.',
    cross: 'It is crossed by the Key: a door is open that you believe is locked.',
    end: 'It comes to the Key. Something opens, and it cannot be closed again.',
  },
  {
    id: 'ladder', name: 'The Ladder',
    prims: [['l', 36, 8, 36, 92], ['l', 64, 8, 64, 92], ['l', 36, 24, 64, 24], ['l', 36, 43, 64, 43], ['l', 36, 62, 64, 62], ['l', 36, 81, 64, 81]],
    root: 'Beneath your question lies the Ladder: this is one rung of many.',
    cross: 'It is crossed by the Ladder: the way up and the way down are the same.',
    end: 'It comes to the Ladder. Slowly, and only by steps.',
  },
  {
    id: 'lantern', name: 'The Lantern',
    prims: [...zig([[50, 10], [82, 50], [50, 90], [18, 50], [50, 10]]), ['c', 50, 50, 7]],
    root: 'Beneath your question lies the Lantern: a small light, enough for one step.',
    cross: 'It is crossed by the Lantern: you see clearly, but only nearby.',
    end: 'It comes to the Lantern. You will not see far, and you will not need to.',
  },
  {
    id: 'serpent', name: 'The Serpent',
    prims: [['a', 50, 32, 18, 0, -270], ['a', 50, 68, 18, -90, 180], ['c', 68, 32, 3]],
    root: 'Beneath your question lies the Serpent: the old skin is not the animal.',
    cross: 'It is crossed by the Serpent: what looks like a threat is a change of shape.',
    end: 'It comes to the Serpent. You will leave something behind that you thought was you.',
  },
  {
    id: 'crown', name: 'The Crown',
    prims: zig([[14, 76], [14, 30], [32, 56], [50, 20], [68, 56], [86, 30], [86, 76], [14, 76]]),
    root: 'Beneath your question lies the Crown: this is a question about who decides.',
    cross: 'It is crossed by the Crown: someone else believes this is theirs to answer.',
    end: 'It comes to the Crown. Authority, and the weight that comes with it.',
  },
  {
    id: 'seed', name: 'The Seed',
    prims: [['c', 50, 56, 28], ['c', 50, 56, 7], ['l', 50, 28, 50, 6]],
    root: 'Beneath your question lies the Seed: it has already begun, underground.',
    cross: 'It is crossed by the Seed: too early to see, not too early to tend.',
    end: 'It comes to the Seed. Nothing yet, and then all at once.',
  },
  {
    id: 'scales', name: 'The Scales',
    prims: [['l', 50, 12, 50, 86], ['l', 18, 28, 82, 28], ['a', 18, 44, 12, 0, 180], ['a', 82, 44, 12, 0, 180], ['l', 34, 86, 66, 86]],
    root: 'Beneath your question lies the Scales: something must be given for something received.',
    cross: 'It is crossed by the Scales: the balance you want is not the one you need.',
    end: 'It comes to the Scales. It will be fair, which is not the same as kind.',
  },
  {
    id: 'mirror', name: 'The Mirror',
    prims: [['c', 50, 40, 26], ['l', 50, 66, 50, 92], ['l', 36, 92, 64, 92]],
    root: 'Beneath your question lies the Mirror: the question is partly about the one who asks.',
    cross: 'It is crossed by the Mirror: you are reading your own face as a sign.',
    end: 'It comes to the Mirror. You will meet what you bring.',
  },
]

const rad = (d) => (d * Math.PI) / 180
const pt = (cx, cy, r, a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))]

// SVG path data for a glyph.
export function glyphPath(prims) {
  return prims
    .map((p) => {
      if (p[0] === 'l') return `M${p[1]} ${p[2]}L${p[3]} ${p[4]}`
      if (p[0] === 'c') {
        const [, cx, cy, r] = p
        return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
      }
      const [, cx, cy, r, a0, a1] = p
      const [x0, y0] = pt(cx, cy, r, a0)
      const [x1, y1] = pt(cx, cy, r, a1)
      const large = Math.abs(a1 - a0) > 180 ? 1 : 0
      const sweep = a1 > a0 ? 1 : 0
      return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`
    })
    .join('')
}

// Evenly spaced points along a glyph, in its 100 × 100 box.
export function glyphPoints(prims, step = 4) {
  const out = []
  for (const p of prims) {
    if (p[0] === 'l') {
      const [, x1, y1, x2, y2] = p
      const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / step))
      for (let i = 0; i <= n; i++) out.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n])
    } else {
      const [, cx, cy, r, a0 = 0, a1 = 360] = p
      const n = Math.max(4, Math.round((r * Math.abs(rad(a1 - a0))) / step))
      const closed = p[0] === 'c'
      for (let i = 0; i < (closed ? n : n + 1); i++) out.push(pt(cx, cy, r, a0 + ((a1 - a0) * i) / n))
    }
  }
  return out
}
