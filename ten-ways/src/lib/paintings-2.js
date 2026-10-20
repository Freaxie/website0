// Scenes IX–XVI: the Disciplines and the City.
import { lerp } from './geom.js'
import { sample } from './paint-kit.js'

// The alchemist, working his bellows.
const ALCHEMIST = { x: 30, y: 92, s: 1.1, dir: 1, torso: 22, head: 10, legL: [70, 0], legR: [84, 6], armL: [60, 90], armR: [74, 100], back: ['armL'] }

export default {
  warrior: {
    style: 'vase',
    figure: 'black',
    seed: 91,
    title: 'Achilles and Hector before the walls of Troy',
    draw(ctx, K) {
      const { F, L, W, P, T } = K
      K.inscribe('ΑΧΙΛΛΕΥΣ', 10, 22, 3.4, T)
      K.inscribe('ΗΕΚΤΟΡ', 62, 22, 3.4, T)
      const hoplite = (x, y, dir, lean, front, back, armSpear, shieldDev) => {
        const J = K.body({
          x,
          y,
          s: 1.16,
          dir,
          torso: lean * dir,
          head: lean * dir * 0.4,
          col: F,
          legL: dir > 0 ? back : front,
          legR: dir > 0 ? front : back,
          armL: dir > 0 ? [40, 90] : armSpear,
          armR: dir > 0 ? armSpear : [-40, -90],
          back: [dir > 0 ? 'armL' : 'armR'],
        })
        // greaves, a kilt in purple, the cuirass edge
        for (const [k, f] of [
          [J.kl, J.fl],
          [J.kr, J.fr],
        ])
          K.line(
            [
              [lerp(k[0], f[0], 0.15), lerp(k[1], f[1], 0.15)],
              [lerp(k[0], f[0], 0.8), lerp(k[1], f[1], 0.8)],
            ],
            L,
            0.3,
          )
        K.blob(
          [
            [J.pl[0] - 1.6, J.pl[1] - 1],
            [J.pr[0] + 1.6, J.pr[1] - 1],
            [J.pr[0] + 2.2, J.pr[1] + 3.4],
            [J.pl[0] - 2.2, J.pl[1] + 3.4],
          ],
          P,
        )
        for (let i = 0; i < 5; i++)
          K.line(
            [
              [J.pl[0] - 1 + i * 1.4, J.P[1] - 0.6],
              [J.pl[0] - 1.6 + i * 1.6, J.P[1] + 3],
            ],
            L,
            0.25,
          )
        K.line(
          [
            [J.pl[0] - 1, J.P[1] - 1.4],
            [J.pr[0] + 1, J.P[1] - 1.4],
          ],
          L,
          0.35,
        )
        // a Corinthian helmet with its crest
        const h = J.hd
        K.blob(
          [
            [h[0] - dir * 2.8, h[1] + 2.6],
            [h[0] - dir * 3, h[1] - 1.6],
            [h[0] - dir * 0.6, h[1] - 3.2],
            [h[0] + dir * 2.6, h[1] - 1.6],
            [h[0] + dir * 2.8, h[1] + 3.2],
            [h[0] + dir * 1, h[1] + 3.4],
          ],
          F,
        )
        K.line(
          [
            [h[0] + dir * 0.4, h[1] - 0.4],
            [h[0] + dir * 2.6, h[1] - 0.4],
          ],
          L,
          0.35,
        )
        K.line(
          [
            [h[0] + dir * 0.8, h[1] - 0.4],
            [h[0] + dir * 0.8, h[1] + 3],
          ],
          L,
          0.35,
        )
        K.ribbon(
          [
            [h[0] + dir * 1.6, h[1] - 3.4],
            [h[0] - dir * 1, h[1] - 6.6],
            [h[0] - dir * 5, h[1] - 6],
            [h[0] - dir * 7, h[1] - 1.4],
            [h[0] - dir * 6.4, h[1] + 4],
          ],
          (t) => 1.4 + Math.sin(Math.PI * t) * 1.6,
          F,
        )
        K.curve(
          [
            [h[0] + dir * 1, h[1] - 4.4],
            [h[0] - dir * 1.4, h[1] - 6.6],
            [h[0] - dir * 5, h[1] - 5.8],
          ],
          P,
          0.7,
        )
        // the spear
        const hd = dir > 0 ? J.hr : J.hl
        K.line(
          [
            [hd[0] - dir * 12, hd[1] - 4.4],
            [hd[0] + dir * 19, hd[1] + 7.2],
          ],
          F,
          0.7,
        )
        K.poly(
          [
            [hd[0] + dir * 19, hd[1] + 6.4],
            [hd[0] + dir * 23, hd[1] + 8.8],
            [hd[0] + dir * 19, hd[1] + 8],
          ],
          F,
        )
        // the shield, rim incised, a device in added white
        const c = [J.sc[0] + dir * 3.2, J.sc[1] + 5]
        K.disc(c[0], c[1], 9, F)
        K.ring(c[0], c[1], 8, L, 0.4)
        K.ring(c[0], c[1], 8.8, L, 0.25)
        shieldDev(c)
        return J
      }
      hoplite(31, 80, 1, 12, [32, 0], [-34, -10], [160, 104], (c) =>
        K.serpent(
          [
            [c[0] - 4, c[1] - 3],
            [c[0] - 1, c[1] - 4.6],
            [c[0] + 1.6, c[1] - 1.4],
            [c[0] - 1.4, c[1] + 1.6],
            [c[0] + 2, c[1] + 4.4],
          ],
          1.3,
          W,
        ),
      )
      hoplite(69, 81, -1, 6, [-18, 0], [26, 12], [-150, -110], (c) => {
        K.beast({ kind: 'lion', x: c[0] + 0.6, y: c[1] + 4, s: 0.42, dir: -1, col: W, neck: -6 })
        K.disc(c[0], c[1] - 5.4, 0.8, W)
      })
      // a fallen helmet between them, and the ground
      K.blob(
        [
          [47, 107],
          [48, 103.4],
          [51.6, 102.6],
          [53.4, 104],
          [53, 107],
        ],
        F,
      )
      K.ribbon(
        [
          [52, 103],
          [55, 101],
          [57, 104],
        ],
        0.9,
        F,
      )
      K.line(
        [
          [49, 105],
          [52, 105],
        ],
        L,
        0.3,
      )
    },
  },

  monk: {
    style: 'ink',
    seed: 101,
    seal: [82, 104, 6],
    title: 'Beneath the fig tree on the night of the full moon',
    draw(ctx, K) {
      const ink = (a) => `rgba(22,20,18,${a})`
      // the moon, as a single dry circle and a pale wash
      K.disc(68, 30, 15, ink(0.05))
      const ring = []
      for (let i = 0; i <= 34; i++) {
        const a = -1.2 + (i / 34) * Math.PI * 1.88
        ring.push([68 + Math.cos(a) * 16, 30 + Math.sin(a) * 16])
      }
      K.brush(ring, 2.4, ink(0.82), { dry: 0.7, bristles: 9 })
      // the tree: a trunk leaning in from the left, branches over him
      K.brush(
        [
          [8, 126],
          [12, 100],
          [14, 78],
          [20, 58],
          [30, 42],
        ],
        6.4,
        ink(0.9),
        { dry: 0.35, bristles: 11, prof: (t) => 1 - t * 0.55 },
      )
      K.brush(
        [
          [16, 66],
          [8, 56],
          [2, 50],
        ],
        2.2,
        ink(0.85),
        { dry: 0.4 },
      )
      K.brush(
        [
          [28, 44],
          [40, 32],
          [54, 26],
          [60, 24],
        ],
        2.6,
        ink(0.85),
        { dry: 0.5 },
      )
      K.brush(
        [
          [30, 42],
          [34, 22],
          [42, 12],
        ],
        2,
        ink(0.8),
        { dry: 0.5 },
      )
      K.brush(
        [
          [40, 32],
          [46, 40],
          [54, 42],
        ],
        1.4,
        ink(0.8),
        { dry: 0.6 },
      )
      const leaf = (x, y, s, a, al) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((a * Math.PI) / 180)
        ctx.scale(s, s)
        K.blob(
          [
            [0, -1.6],
            [1.4, -2.2],
            [1.8, -0.6],
            [0.4, 1.6],
            [0, 3.4],
            [-0.4, 1.6],
            [-1.8, -0.6],
            [-1.4, -2.2],
          ],
          ink(al),
        )
        ctx.restore()
      }
      for (let i = 0; i < 150; i++) {
        const t = K.R()
        const cx = lerp(4, 64, t) + (K.R() - 0.5) * 12
        const cy = 30 + Math.sin(t * Math.PI) * -14 + (K.R() - 0.5) * 22 + t * 8
        leaf(cx, cy, 0.9 + K.R() * 0.8, K.R() * 360, 0.25 + K.R() * 0.55)
      }
      // the seated figure: a few strokes
      K.disc(52, 66, 9, ink(0.06))
      K.brush(
        [
          [47.8, 64],
          [47.6, 68.6],
          [49.4, 71.6],
          [52, 72.4],
          [54.6, 71.6],
          [56.4, 68.6],
          [56.2, 64],
        ],
        0.9,
        ink(0.9),
      )
      K.brush(
        [
          [47.8, 64.4],
          [48.4, 61],
          [52, 59.6],
          [55.6, 61],
          [56.2, 64.4],
        ],
        0.9,
        ink(0.9),
      )
      K.disc(52, 58.8, 1.8, ink(0.85))
      for (let i = 0; i < 9; i++) K.disc(48.6 + (i % 5) * 1.7, 60.6 + Math.floor(i / 5) * 1.1, 0.5, ink(0.7))
      K.brush(
        [
          [47.4, 65],
          [47, 68.6],
        ],
        0.7,
        ink(0.8),
      )
      K.brush(
        [
          [56.6, 65],
          [57, 68.6],
        ],
        0.7,
        ink(0.8),
      )
      K.brush(
        [
          [49.4, 66],
          [51, 66.3],
        ],
        0.45,
        ink(0.85),
      )
      K.brush(
        [
          [53, 66.3],
          [54.6, 66],
        ],
        0.45,
        ink(0.85),
      )
      K.brush(
        [
          [51.4, 69.8],
          [52.6, 69.8],
        ],
        0.35,
        ink(0.7),
      )
      K.brush(
        [
          [50.6, 73],
          [46, 75],
          [41, 79],
          [38.6, 86],
          [38.4, 94],
        ],
        1.5,
        ink(0.9),
        { dry: 0.3 },
      )
      K.brush(
        [
          [53.4, 73],
          [58, 75],
          [63, 79],
          [65.4, 86],
          [65.6, 94],
        ],
        1.5,
        ink(0.9),
        { dry: 0.3 },
      )
      K.brush(
        [
          [57, 75.4],
          [52, 80],
          [48, 86],
          [46.6, 92],
        ],
        1,
        ink(0.7),
        { dry: 0.5 },
      )
      K.brush(
        [
          [60, 79],
          [56, 84],
          [53, 90],
        ],
        0.8,
        ink(0.6),
        { dry: 0.5 },
      )
      // the right hand reaching down to touch the earth; the left open in the lap
      K.brush(
        [
          [40.6, 84],
          [38.8, 92],
          [37.6, 100],
          [37.2, 104],
        ],
        1.1,
        ink(0.9),
      )
      K.brush(
        [
          [36, 104.4],
          [38.6, 104.6],
        ],
        0.7,
        ink(0.9),
      )
      K.brush(
        [
          [48, 96],
          [52, 97.6],
          [56, 96.4],
        ],
        1,
        ink(0.85),
      )
      K.brush(
        [
          [30, 104],
          [40, 99.4],
          [52, 98.4],
          [64, 99.4],
          [74, 104],
        ],
        1.8,
        ink(0.9),
        { dry: 0.35 },
      )
      K.brush(
        [
          [32, 105],
          [44, 106.6],
          [60, 106.6],
          [72, 105],
        ],
        1.4,
        ink(0.85),
        { dry: 0.5 },
      )
      K.layer(
        (L) =>
          L.blob(
            [
              [20, 108],
              [50, 104.6],
              [84, 108],
              [84, 112],
              [20, 112],
            ],
            ink(0.18),
          ),
        { blur: 1.2 },
      )
      for (const [gx, gy] of [
        [24, 108],
        [27, 107.4],
        [76, 108],
        [79, 107.6],
        [81, 108.6],
      ])
        K.brush(
          [
            [gx, gy],
            [gx + (K.R() - 0.3) * 2, gy - 3 - K.R() * 2],
          ],
          0.5,
          ink(0.7),
        )
    },
  },

  biohacker: {
    style: 'woodcut',
    seed: 111,
    spotCol: '#d23a1c',
    title: 'The alchemist at the athanor',
    spot(ctx, K) {
      K.blob(
        [
          [60.6, 105],
          [61.4, 97],
          [66, 93.4],
          [70.6, 97],
          [71.4, 105],
        ],
        '#fff',
      )
      K.disc(89, 98, 3.4, '#fff')
      K.disc(50, 19, 3, '#fff')
      K.disc(66, 60, 4.6, '#fff')
    },
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#e2e2e2')
      for (let y = 6; y < 92; y += 6) {
        K.line(
          [
            [0, y],
            [100, y],
          ],
          '#a8a8a8',
          0.35,
        )
        for (let x = (y / 6) % 2 ? 4 : 0; x < 100; x += 8)
          K.line(
            [
              [x, y],
              [x, y + 6],
            ],
            '#a8a8a8',
            0.35,
          )
      }
      K.rect(0, 92, 100, 33, '#b8b8b8')
      for (let i = 0; i < 6; i++)
        K.line(
          [
            [0, 92 + i * i * 0.9],
            [100, 92 + i * i * 0.9],
          ],
          '#7a7a7a',
          0.4,
        )
      for (let x = -40; x < 140; x += 10)
        K.line(
          [
            [50 + (x - 50) * 0.35, 92],
            [x, 125],
          ],
          '#7a7a7a',
          0.4,
        )
      // the round-paned window
      K.rect(74, 8, 20, 26, '#6a6a6a')
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 3; i++) {
          K.disc(77.6 + i * 6.4, 11.4 + j * 6.4, 3, '#f6f6f6')
          K.ring(77.6 + i * 6.4, 11.4 + j * 6.4, 1.2, '#9a9a9a', 0.4)
        }
      // the shelf of vessels
      K.rect(4, 30, 30, 1.6, '#5a5a5a')
      for (const [x, w, h, round] of [
        [6, 4, 7, 1],
        [11.6, 3, 9, 0],
        [16, 5, 6, 1],
        [22.4, 3.4, 8, 0],
        [27, 4, 7, 1],
      ]) {
        if (round) {
          K.disc(x + w / 2, 30 - w / 2, w / 2, '#cfcfcf')
          K.rect(x + w / 2 - 0.6, 30 - h, 1.2, h - w / 2, '#cfcfcf')
        } else K.rect(x, 30 - h, w, h, '#a2a2a2')
        K.ring(x + w / 2, 30 - w / 2, w / 2, '#555', 0.3)
      }
      // the ouroboros, with the sun inside it
      const oc = [50, 19]
      K.ring(oc[0], oc[1], 8, '#4a4a4a', 2.6)
      K.ring(oc[0], oc[1], 8, '#cfcfcf', 1.2)
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2
        K.line(
          [
            [oc[0] + Math.cos(a) * 7, oc[1] + Math.sin(a) * 7],
            [oc[0] + Math.cos(a + 0.2) * 9, oc[1] + Math.sin(a + 0.2) * 9],
          ],
          '#4a4a4a',
          0.3,
        )
      }
      K.oval(oc[0] + 8, oc[1] - 1.4, 2.4, 1.6, 30, '#5a5a5a')
      K.disc(oc[0] + 8.6, oc[1] - 2, 0.4, '#fff')
      K.disc(oc[0], oc[1], 3, '#f4f4f4')
      K.ring(oc[0], oc[1], 3, '#333', 0.5)
      K.disc(oc[0], oc[1], 0.7, '#222')
      // the athanor: a brick tower, a fire in its mouth, a still on top
      K.rect(56, 62, 24, 46, '#8e8e8e')
      for (let y = 64; y < 108; y += 3.4) {
        K.line(
          [
            [56, y],
            [80, y],
          ],
          '#555',
          0.35,
        )
        for (let x = 56 + ((y / 3.4) % 2) * 2.4; x < 80; x += 4.8)
          K.line(
            [
              [x, y],
              [x, y + 3.4],
            ],
            '#555',
            0.35,
          )
      }
      K.shape((c) => {
        c.moveTo(56, 62)
        c.quadraticCurveTo(68, 52, 80, 62)
        c.closePath()
      }, '#7a7a7a')
      K.shape((c) => {
        c.moveTo(60.6, 106)
        c.lineTo(60.6, 98)
        c.arc(66, 98, 5.4, Math.PI, 0)
        c.lineTo(71.4, 106)
        c.closePath()
      }, '#141414')
      K.blob(
        [
          [61.6, 105.6],
          [63, 99],
          [64.4, 102],
          [66, 95.4],
          [67.6, 101],
          [69, 98.4],
          [70.4, 105.6],
        ],
        '#f2f2f2',
      )
      K.disc(66, 60, 5, '#eaeaea')
      K.ring(66, 60, 5, '#333', 0.5)
      K.rect(64.8, 50, 2.4, 6, '#eaeaea')
      K.blob(
        [
          [63, 50.6],
          [65, 47],
          [69, 47],
          [71, 49.4],
          [69, 51.4],
        ],
        '#d4d4d4',
      )
      K.line(
        [
          [70.6, 49.2],
          [86, 60],
          [88, 92],
        ],
        '#4a4a4a',
        1.1,
      )
      K.line(
        [
          [70.6, 49.2],
          [86, 60],
          [88, 92],
        ],
        '#d8d8d8',
        0.4,
      )
      K.rect(84, 100, 10, 8, '#6e6e6e')
      K.disc(89, 97.6, 3.6, '#e6e6e6')
      K.rect(88.2, 91.4, 1.6, 3.6, '#e6e6e6')
      K.ring(89, 97.6, 3.6, '#333', 0.5)
      // the moon sign on the furnace
      K.moon(68, 80, 3, '#e8e8e8', 0.5, 0)
      // the alchemist at his bellows
      K.rect(22, 98, 12, 2, '#5a5a5a')
      K.limb([24, 100], [23, 108], 1, 1, '#5a5a5a')
      K.limb([32, 100], [33, 108], 1, 1, '#5a5a5a')
      const J = K.body({ ...ALCHEMIST, col: '#d8d8d8', robe: { col: '#7a7a7a', knees: true, hem: 3.6, y: 106, extra: [[22, 88]] }, beard: 'long', beardCol: '#f2f2f2' })
      K.blob(
        [
          [J.hd[0] - 3.2, J.hd[1] + 1.4],
          [J.hd[0] - 3, J.hd[1] - 2.6],
          [J.hd[0], J.hd[1] - 4.4],
          [J.hd[0] + 3, J.hd[1] - 2.6],
          [J.hd[0] + 1.4, J.hd[1] - 1.4],
        ],
        '#4e4e4e',
      )
      for (let i = 0; i < 5; i++)
        K.curve(
          [
            [J.P[0] - 2 + i * 1.6, J.P[1] - 6],
            [J.P[0] + i * 1.8, J.P[1] + 2],
            [J.P[0] + 2 + i * 2, J.P[1] + 12],
          ],
          '#4a4a4a',
          0.4,
        )
      K.blob(
        [
          [44, 96],
          [54, 99.4],
          [57, 101.6],
          [53, 102],
          [44, 101],
        ],
        '#6a6a6a',
      )
      K.limb([J.hr[0], J.hr[1]], [46, 97], 0.8, 0.8, '#4a4a4a')
    },
  },

  looksmaxxer: {
    style: 'pixel',
    colors: 22,
    seed: 121,
    title: 'Narcissus at the pool',
    draw(ctx, K) {
      K.sky(['#4f4f98', '#8a74b8', '#d79ac0', '#f5c2bc', '#fbe0c0'], 0, 66)
      K.glow(64, 58, 34, '#ffd8b0', 0.45)
      K.ridge(58, 3, '#a68bb8', { freq: 0.05, seed: 2, y1: 70 })
      // a dark grove behind the pool
      K.ridge(68, 4, '#24352e', { freq: 0.12, seed: 7, oct: 3, y1: 84 })
      for (const [x, h, w] of [
        [8, 50, 3.6],
        [15, 40, 3],
        [86, 54, 3.8],
        [94, 42, 3],
      ])
        K.blob(
          [
            [x - w, 74],
            [x - w * 1.1, 74 - h * 0.6],
            [x, 74 - h],
            [x + w * 1.1, 74 - h * 0.6],
            [x + w, 74],
          ],
          '#1c2826',
        )
      // Echo among the trees, half hidden
      K.layer((L) => L.body({ x: 79, y: 60, s: 0.9, dir: -1, torso: -4, head: -10, col: '#f4e2d8', armL: [-30, -150], robe: { col: '#f6ece6', hem: 4, y: 76 }, hair: '#e0c0a8', hairLen: 1.6 }), { alpha: 0.42 })
      K.disc(76, 70, 5, '#24352e')
      // the bank, the dark water
      K.rect(0, 80, 100, 4.6, '#3f6a3a')
      for (let i = 0; i < 50; i++) {
        const x = K.R() * 100
        K.line(
          [
            [x, 84],
            [x + (K.R() - 0.5), 80 - K.R() * 2],
          ],
          '#5a8a4a',
          0.3,
        )
      }
      K.rect(0, 84.4, 100, 41, '#112630')
      // Narcissus on his knees at the edge, leaning over to look
      const N = K.body({
        x: 46,
        y: 70,
        s: 1.26,
        dir: 1,
        torso: 70,
        head: 148,
        col: '#f4c6a4',
        legL: [-2, -90],
        legR: [4, -88],
        armL: [-12, 4],
        armR: [12, 24],
        back: ['armL'],
        robe: { col: '#4a5aa8', hem: 2, y: 77, knees: true },
        hair: '#4a2a1a',
        hairLen: 0.4,
      })
      K.reflect(84.4, { alpha: 0.78, ripple: 0.3, fade: 0.5, depth: 41 })
      K.ring(N.hr[0], 87, 2.2, 'rgba(255,236,236,0.5)', 0.3)
      K.ring(N.hr[0], 87, 4.4, 'rgba(255,236,236,0.28)', 0.3)
      // narcissus flowers, already growing where he kneels
      for (const [fx, fy] of [
        [10, 82],
        [16, 83],
        [24, 82],
        [72, 82],
        [80, 83],
        [88, 82],
      ]) {
        K.line(
          [
            [fx, fy + 2.4],
            [fx, fy],
          ],
          '#4a7a3a',
          0.4,
        )
        for (let i = 0; i < 6; i++) K.oval(fx + Math.cos((i * Math.PI) / 3) * 0.9, fy + Math.sin((i * Math.PI) / 3) * 0.9, 0.8, 0.45, i * 60, '#fbf6ee')
        K.disc(fx, fy, 0.5, '#f0a030')
      }
    },
  },

  sovereign: {
    style: 'mosaic',
    gold: true,
    seed: 131,
    tiles: 60,
    colors: 16,
    grout: '#3a3026',
    title: 'Solomon on the throne of six steps',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#d8a640')
      K.layer(
        (L) => {
          for (let i = 0; i < 30; i++) L.disc(L.R() * 100, L.R() * 125, 8 + L.R() * 10, L.R() < 0.5 ? '#e8bc58' : '#c49030')
        },
        { alpha: 0.35, blur: 4 },
      )
      // the border, with pearls
      K.ctx.lineWidth = 5
      K.ctx.strokeStyle = '#5a1f42'
      K.ctx.strokeRect(2.5, 2.5, 95, 120)
      for (let x = 5; x < 96; x += 3.6) {
        K.disc(x, 2.5, 0.9, '#f4ecdc')
        K.disc(x, 122.5, 0.9, '#f4ecdc')
      }
      for (let y = 6; y < 120; y += 3.6) {
        K.disc(2.5, y, 0.9, '#f4ecdc')
        K.disc(97.5, y, 0.9, '#f4ecdc')
      }
      // columns and an arch
      for (const x of [12, 88]) {
        K.rect(x - 3, 40, 6, 72, '#3f6e5a')
        K.rect(x - 1, 40, 1.2, 72, '#5f8e7a')
        K.rect(x - 4.4, 36, 8.8, 4, '#f0e6d2')
        K.rect(x - 4.4, 110, 8.8, 3, '#f0e6d2')
      }
      K.ring(50, 38, 38, '#a62a2a', 4)
      for (let i = 0; i <= 18; i++) {
        const a = Math.PI + (i / 18) * Math.PI
        K.disc(50 + Math.cos(a) * 38, 38 + Math.sin(a) * 38, 0.8, '#f4ecdc')
      }
      // the steps, with a lion at each end of each step
      for (let i = 0; i < 4; i++) {
        const y = 92 + i * 5
        const w = 26 + i * 8
        K.rect(50 - w, y, w * 2, 5, i % 2 ? '#e8ddc6' : '#cfc1a4')
        K.rect(50 - w, y + 4.2, w * 2, 0.8, '#8a7a5a')
        for (const d of [-1, 1]) K.beast({ kind: 'lion', x: 50 + d * (w - 5), y: y + 0.2, s: 0.5, dir: -d, col: '#b07020', mane: '#7a4410', neck: -10 })
      }
      // the throne
      K.rect(33, 46, 34, 46, '#8a2030')
      K.rect(33, 46, 34, 2, '#f0d070')
      K.rect(33, 46, 2, 46, '#f0d070')
      K.rect(65, 46, 2, 46, '#f0d070')
      for (let y = 52; y < 90; y += 6) {
        K.disc(34, y, 0.9, '#f4ecdc')
        K.disc(66, y, 0.9, '#f4ecdc')
      }
      // Solomon, young and crowned, in purple, with the scroll of wisdom
      K.disc(50, 36, 11, '#f4d36a')
      K.ring(50, 36, 11, '#a62a2a', 1)
      K.blob(
        [
          [38, 90],
          [40, 58],
          [44, 48.6],
          [56, 48.6],
          [60, 58],
          [62, 90],
        ],
        '#4a1f5e',
      )
      K.blob(
        [
          [43, 90],
          [44.6, 66],
          [55.4, 66],
          [57, 90],
        ],
        '#2f4a8a',
      )
      K.blob(
        [
          [44, 49],
          [56, 49],
          [53, 60],
          [47, 60],
        ],
        '#d8a640',
      )
      for (let i = 0; i < 5; i++) K.disc(46 + i * 2, 50.6 + (i % 2) * 2.6, 0.7, i % 2 ? '#c03030' : '#3a8a5a')
      K.rect(47.6, 58, 4.8, 32, '#d8a640')
      for (let y = 61; y < 90; y += 4) K.disc(50, y, 0.8, y % 8 ? '#c03030' : '#f4ecdc')
      K.oval(44, 91, 2.4, 1.2, 0, '#b02a2a')
      K.oval(56, 91, 2.4, 1.2, 0, '#b02a2a')
      K.limb([41, 54], [37, 66], 3, 2.4, '#4a1f5e')
      K.limb([37, 66], [40, 58], 2.4, 2, '#e8b88e')
      K.limb([40, 58], [40, 40], 0.8, 0.8, '#f0d070')
      K.disc(40, 39.4, 1.2, '#f4ecdc')
      K.limb([59, 54], [62, 68], 3, 2.4, '#4a1f5e')
      K.rect(56, 66, 9, 4, '#f4ecdc')
      K.disc(56, 68, 2, '#e6dcc6')
      K.disc(65, 68, 2, '#e6dcc6')
      K.oval(50, 38, 4.6, 5.8, 0, '#ecc09a')
      K.blob(
        [
          [45.2, 36],
          [45.6, 32.4],
          [50, 30.6],
          [54.4, 32.4],
          [54.8, 36],
          [52.4, 33.6],
          [47.6, 33.6],
        ],
        '#3a2216',
      )
      K.rect(44.6, 28.6, 10.8, 3.2, '#f0d070')
      for (let i = 0; i < 5; i++) K.disc(46 + i * 2, 28, 0.9, i % 2 ? '#3a8a5a' : '#c03030')
      K.line(
        [
          [45.2, 31.6],
          [44.8, 39],
        ],
        '#f4ecdc',
        0.8,
      )
      K.line(
        [
          [54.8, 31.6],
          [55.2, 39],
        ],
        '#f4ecdc',
        0.8,
      )
      K.oval(48.2, 37.6, 0.8, 0.5, 0, '#2a1a14')
      K.oval(51.8, 37.6, 0.8, 0.5, 0, '#2a1a14')
      K.line(
        [
          [50, 38],
          [49.6, 40.6],
        ],
        '#c08a6a',
        0.4,
      )
      K.line(
        [
          [49, 42],
          [51, 42],
        ],
        '#a04a3a',
        0.5,
      )
      K.rect(8, 112, 84, 6, '#5a7a4a')
    },
  },

  rebel: {
    style: 'halftone',
    seed: 141,
    inks: [
      { col: '#e0312b', ang: 15, off: [3, 2] },
      { col: '#1c1616', ang: 45 },
    ],
    cell: 6,
    title: 'Antigone covers her brother with dust',
    draw(ctx, K) {
      K.sky(['#a01818', '#d83c30', '#ee8a74', '#f6c2b0'], 0, 92)
      K.disc(66, 74, 19, '#f1e9da')
      K.bird(30, 30, 1.5, '#1c1616', 1, 0.9)
      K.bird(40, 22, 1.1, '#1c1616', -1, 0.3)
      // Thebes behind its walls
      K.rect(0, 84, 100, 10, '#1c1616')
      for (let x = 0; x < 100; x += 3) K.rect(x, 82.6, 1.6, 1.6, '#1c1616')
      for (const [x, w, h] of [
        [6, 7, 12],
        [30, 6, 9],
        [84, 8, 13],
      ]) {
        K.rect(x, 84 - h, w, h, '#1c1616')
        for (let i = 0; i < w; i += 2.2) K.rect(x + i, 84 - h - 1.4, 1.2, 1.4, '#1c1616')
      }
      K.poly(
        [
          [44, 80],
          [52, 76],
          [60, 80],
        ],
        '#1c1616',
      )
      K.rect(45, 80, 14, 4, '#1c1616')
      K.shape((c) => {
        c.moveTo(16, 94)
        c.lineTo(16, 88.6)
        c.arc(19, 88.6, 3, Math.PI, 0)
        c.lineTo(22, 94)
      }, '#8a1a18')
      // the ground outside the walls
      K.sky(['#c84a3a', '#9a2a24', '#4a1414'], 94, 125)
      // Polynices, unburied
      K.body({ x: 46, y: 108, s: 1.08, dir: -1, torso: -90, head: -96, col: '#1c1616', legL: [88, 92], legR: [92, 90], armL: [-96, -100], armR: [84, 92], back: ['armR'] })
      K.blob(
        [
          [38, 106],
          [52, 104],
          [58, 107],
          [52, 110],
          [38, 110],
        ],
        '#7a1a16',
      )
      K.disc(24, 112, 5, '#1c1616')
      K.disc(24, 112, 3, '#c02a24')
      K.line(
        [
          [66, 114],
          [86, 100],
        ],
        '#1c1616',
        0.8,
      )
      // Antigone, kneeling, letting the dust fall from her hand
      const A = K.body({
        x: 72,
        y: 98,
        s: 1.1,
        dir: -1,
        torso: -26,
        head: -30,
        col: '#1c1616',
        legL: [-90, 4],
        legR: [-84, 2],
        armL: [-80, -60],
        armR: [-30, 10],
        back: ['armR'],
        robe: { col: '#c02a24', knees: true, hem: 4, y: 110 },
        hair: '#1c1616',
        hairLen: 2,
      })
      K.blob(
        [
          [A.hd[0] + 2.6, A.hd[1] - 2],
          [A.hd[0] + 7, A.hd[1] + 6],
          [A.sr[0] + 4, A.sr[1] + 10],
          [A.sr[0] + 1, A.sr[1] + 2],
        ],
        '#1c1616',
      )
      for (let i = 0; i < 70; i++) {
        const t = K.R()
        K.disc(A.hl[0] - 1 - t * 6 + (K.R() - 0.5) * t * 6, A.hl[1] + 1 + t * 14, 0.2 + K.R() * 0.4, '#1c1616')
      }
    },
  },

  entrepreneur: {
    style: 'pixel',
    colors: 22,
    seed: 151,
    title: 'Mercury over the harbour at dawn',
    draw(ctx, K) {
      K.sky(['#4f7fc0', '#86b2dc', '#c8dcea', '#fbd8b4', '#ffc490'], 0, 92)
      K.glow(80, 92, 50, '#ffd29a', 0.5)
      K.disc(80, 92, 6, '#fff2cc')
      for (const [cx, cy, s] of [
        [20, 60, 1.2],
        [60, 70, 0.9],
        [36, 30, 0.8],
      ])
        K.blob(
          [
            [cx - 12 * s, cy + 2],
            [cx - 5 * s, cy - 2.6 * s],
            [cx + 4 * s, cy - 2.4 * s],
            [cx + 12 * s, cy + 2],
          ],
          'rgba(255,236,220,0.6)',
        )
      K.ridge(86, 4, '#8aa0b8', { freq: 0.05, seed: 3, y1: 94 })
      // the town on the quay
      K.rect(0, 92, 100, 33, '#3a7090')
      for (let i = 0; i < 80; i++) K.rect(K.R() * 100, 93 + K.R() * 32, 1 + K.R() * 4, 0.3, K.R() < 0.4 ? '#ffdcb0' : '#6aa0bc')
      K.rect(72, 92, 28, 0.6, '#ffe6c0')
      const houses = [
        [0, 8, 10],
        [8, 6, 13],
        [14, 9, 9],
        [23, 6, 15],
        [29, 8, 11],
        [37, 7, 8],
      ]
      K.rect(0, 92, 46, 4, '#8a7a64')
      for (const [x, w, h] of houses) {
        K.rect(x, 92 - h, w, h, ['#f0e2c8', '#e8c8a0', '#f4ead8'][x % 3])
        K.poly(
          [
            [x - 0.5, 92 - h],
            [x + w / 2, 92 - h - 3],
            [x + w + 0.5, 92 - h],
          ],
          '#b8503a',
        )
        for (let j = 0; j < 2; j++) K.rect(x + 1.4 + j * (w / 2), 92 - h + 3, 1.2, 1.8, '#5a4a40')
      }
      K.rect(42, 70, 4, 22, '#f2e8d8')
      K.poly(
        [
          [41, 70],
          [44, 66],
          [47, 70],
        ],
        '#b8503a',
      )
      K.glow(44, 69, 4, '#ffe0a0', 0.6)
      for (const [x, s] of [
        [54, 1],
        [66, 0.8],
      ]) {
        K.blob(
          [
            [x - 7 * s, 96],
            [x + 7 * s, 96],
            [x + 5 * s, 99 * 1],
            [x - 5 * s, 99],
          ],
          '#4a3020',
        )
        K.limb([x, 96], [x, 96 - 12 * s], 0.5, 0.4, '#4a3020')
        K.poly(
          [
            [x + 0.4, 85 * 1 + (1 - s) * 10],
            [x + 6 * s, 88 + (1 - s) * 8],
            [x + 0.4, 94],
          ],
          '#f6ead6',
        )
      }
      for (const [gx, gy] of [
        [30, 50],
        [36, 46],
        [70, 56],
      ])
        K.gull(gx, gy, 0.6, '#ffffff', 0.5)
      // Mercury on a breath of wind, as Giambologna cast him: one foot down, a finger to the sky
      K.blob(
        [
          [46, 70],
          [50, 66.6],
          [56, 67.4],
          [60, 70],
          [55, 72],
          [49, 72],
        ],
        '#fff4ea',
      )
      K.glow(53, 46, 22, '#ffe2b0', 0.35)
      const M = K.body({ x: 53, y: 47, s: 1.04, dir: 1, torso: 6, head: -14, col: '#d8945a', legL: [-6, 4], legR: [30, -60], armL: [-30, -20], armR: [168, 176], back: [], hair: '#5a3218', hairLen: 0.6 })
      K.ribbon(
        [
          [M.sl[0], M.sl[1] + 1],
          [M.sl[0] - 5, M.sl[1] + 6],
          [M.sl[0] - 9, M.sl[1] + 12],
          [M.sl[0] - 8, M.sl[1] + 18],
        ],
        (t) => 2 + t * 3,
        '#c83a2e',
      )
      K.blob(
        [
          [M.hd[0] - 3.4, M.hd[1] - 1],
          [M.hd[0], M.hd[1] - 3.6],
          [M.hd[0] + 3.4, M.hd[1] - 1.4],
          [M.hd[0], M.hd[1] - 1.4],
        ],
        '#8a6a4a',
      )
      K.wing(M.hd[0] - 1.6, M.hd[1] - 2.4, 0.45, -40, '#ffffff', { n: 5, len: 10, spread: -40 })
      for (const f of [M.fl, M.fr]) K.wing(f[0] - 0.6, f[1] - 1, 0.36, -50, '#ffffff', { n: 4, len: 10, spread: -40 })
      K.line(
        [
          [M.hl[0] - 1.2, M.hl[1] - 7],
          [M.hl[0] + 0.8, M.hl[1] + 7],
        ],
        '#e8c050',
        0.6,
      )
      K.serpent(
        [
          [M.hl[0] - 1.6, M.hl[1] - 5],
          [M.hl[0] + 0.6, M.hl[1] - 3],
          [M.hl[0] - 1, M.hl[1] - 1],
          [M.hl[0] + 0.8, M.hl[1] + 1],
        ],
        0.5,
        '#e8c050',
        { even: true },
      )
      K.wing(M.hl[0] - 1.2, M.hl[1] - 7, 0.16, -50, '#ffffff', { n: 4, len: 10, spread: -40 })
      K.wing(M.hl[0] - 1, M.hl[1] - 7, 0.16, 50, '#ffffff', { n: 4, len: 10, spread: 40 })
    },
  },

  trickster: {
    style: 'pixel',
    colors: 22,
    seed: 161,
    title: 'Coyote flings the stars across the sky',
    draw(ctx, K) {
      K.sky(['#04051a', '#0b1236', '#1c2558', '#3a2f62', '#7a4a5e'], 0, 92)
      K.stars(60, [0, 0, 100, 80], '#dfe6ff', 0.26)
      // the careful corner: a few stars set one by one, joined
      const set = [
        [78, 12],
        [84, 9],
        [91, 12],
        [89, 19],
        [81, 20],
      ]
      K.line([...set, set[0]], 'rgba(200,210,255,0.4)', 0.3)
      for (const [x, y] of set) {
        K.disc(x, y, 0.7, '#ffffff')
        K.glow(x, y, 3, '#c8d4ff', 0.4)
      }
      // and the rest, all at once: the spill that became the Milky Way
      const from = [50, 58]
      const path = (t) => [lerp(from[0], 8, t) + Math.sin(t * 3.4) * 8, lerp(from[1], 4, t) - Math.sin(t * Math.PI) * 14]
      K.layer(
        (L) => {
          for (let i = 0; i < 26; i++) {
            const [x, y] = path(i / 25)
            L.glow(x, y, 9 + (i / 25) * 9, '#9a8ad8', 0.16)
          }
        },
        { mode: 'lighter' },
      )
      for (let i = 0; i < 560; i++) {
        const t = Math.pow(K.R(), 0.85)
        const sp = 2 + t * 15
        const [x, y] = path(t)
        K.disc(x + (K.R() - 0.5) * sp * 2, y + (K.R() - 0.5) * sp, 0.16 + K.R() ** 4 * 0.9, K.R() < 0.15 ? '#ffe6b0' : '#f2f4ff')
      }
      // mesas
      K.poly(
        [
          [0, 92],
          [0, 72],
          [4, 71],
          [6, 68],
          [20, 68],
          [22, 72],
          [25, 92],
        ],
        '#3a1e3a',
      )
      K.poly(
        [
          [28, 92],
          [31, 80],
          [32, 77],
          [42, 77],
          [44, 82],
          [47, 92],
        ],
        '#4a2440',
      )
      K.rect(0, 90, 100, 35, '#2a1428')
      for (let i = 0; i < 18; i++) K.disc(K.R() * 100, 96 + K.R() * 26, 1 + K.R() * 1.4, '#3a2a30')
      // Coyote on his rock, head thrown back, the blanket going up
      K.blob(
        [
          [46, 126],
          [52, 104],
          [64, 96.4],
          [86, 97],
          [98, 104],
          [100, 126],
        ],
        '#170a18',
      )
      const cp = { kind: 'coyote', x: 74, y: 97.4, s: 2.1, dir: -1, neck: -22, headDown: -76 }
      K.beast({ ...cp, x: cp.x - 0.4, y: cp.y - 0.4, col: '#6a4a7a' })
      const c = K.beast({ ...cp, col: '#1e1020' })
      const sn = c.snout
      // a Navajo-striped blanket swinging up out of his jaws
      const P = sample(
        [
          [sn[0] + 0.4, sn[1] + 0.8],
          [sn[0] - 1.6, sn[1] - 6],
          [sn[0] - 7, sn[1] - 12.6],
          [sn[0] - 15, sn[1] - 16],
          [sn[0] - 23, sn[1] - 14],
        ],
        8,
      )
      const N = P.map((q, i) => {
        const a = P[Math.max(0, i - 1)]
        const b = P[Math.min(P.length - 1, i + 1)]
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
        return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l]
      })
      const wd = (t) => 1.6 + t * 11 + Math.sin(t * 9) * 0.8
      const band = ['#a8242c', '#a8242c', '#1a1018', '#e8d8b8', '#1a1018', '#a8242c', '#a8242c', '#d8902e']
      for (let i = 0; i < P.length - 1; i++) {
        const t0 = i / (P.length - 1)
        const t1 = (i + 1) / (P.length - 1)
        const [a, b, na, nb] = [P[i], P[i + 1], N[i], N[i + 1]]
        K.poly(
          [
            [a[0] + na[0] * wd(t0) * 0.5, a[1] + na[1] * wd(t0) * 0.5],
            [b[0] + nb[0] * wd(t1) * 0.5, b[1] + nb[1] * wd(t1) * 0.5],
            [b[0] - nb[0] * wd(t1) * 0.5, b[1] - nb[1] * wd(t1) * 0.5],
            [a[0] - na[0] * wd(t0) * 0.5, a[1] - na[1] * wd(t0) * 0.5],
          ],
          band[Math.floor(i / 2) % band.length],
        )
      }
      K.line(
        [
          [sn[0] + 0.6, sn[1] + 0.4],
          [sn[0] - 1, sn[1] - 2],
        ],
        '#1e1020',
        0.8,
      )
    },
  },
}
