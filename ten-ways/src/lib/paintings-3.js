// Scenes XVII–XXIV: Beholding and Tending.
import { lerp } from './geom.js'

export default {
  explorer: {
    style: 'pixel',
    colors: 22,
    seed: 171,
    title: 'Odysseus, bound to the mast, hears the Sirens',
    draw(ctx, K) {
      K.sky(['#22143a', '#4a1e4e', '#8a2c4a', '#d8583a', '#f6a04a'], 0, 80)
      K.glow(40, 80, 44, '#ffb060', 0.45)
      K.disc(40, 80, 7, '#ffd88a')
      for (const [y, x0, x1] of [
        [70, 20, 70],
        [74, 40, 96],
        [60, 50, 100],
        [46, 0, 40],
        [30, 30, 90],
      ])
        K.ribbon(
          [
            [x0, y],
            [lerp(x0, x1, 0.5), y - 0.8],
            [x1, y],
          ],
          (t) => 1.8 * Math.sin(Math.PI * t),
          'rgba(70,18,46,0.6)',
        )
      K.sky(['#4a1430', '#3a0e26', '#22081a'], 80, 125)
      for (let i = 0; i < 120; i++) {
        const t = K.R()
        K.rect(40 + (K.R() - 0.5) * (4 + t * 40), 81 + t * t * 44, 0.6 + t * 3, 0.35, K.R() < 0.6 ? '#ff9a4a' : '#ffd08a')
      }
      for (let i = 0; i < 28; i++) {
        const x = K.R() * 100
        const y = 86 + K.R() * 38
        K.curve(
          [
            [x - 3, y],
            [x, y - 0.8],
            [x + 3, y],
          ],
          'rgba(150,50,80,0.6)',
          0.4,
        )
      }
      // the Sirens on their rock, among the bones of sailors who listened
      K.blob(
        [
          [-2, 104],
          [-2, 70],
          [5, 62],
          [13, 60],
          [21, 65],
          [27, 82],
          [26, 100],
        ],
        '#1a0a14',
      )
      for (const [x, y] of [
        [6, 92],
        [12, 96],
        [18, 88],
        [9, 80],
      ])
        K.disc(x, y, 0.8, '#e8d8c8')
      const siren = (x, y, sz, d) => {
        K.ribbon(
          [
            [x - d * 1.4 * sz, y],
            [x - d * 3.6 * sz, y + 1.6 * sz],
          ],
          (t) => 1.6 * sz * (1 - t * 0.5),
          '#2a0e1e',
        )
        K.oval(x, y, 2.2 * sz, 1.3 * sz, -d * 14, '#2a0e1e')
        K.blob(
          [
            [x - d * 0.4 * sz, y - 0.6 * sz],
            [x - d * 2.4 * sz, y - 3.6 * sz],
            [x - d * 3.6 * sz, y - 2 * sz],
            [x - d * 1.6 * sz, y + 0.4 * sz],
          ],
          '#3a1428',
        )
        K.line(
          [
            [x, y + 1 * sz],
            [x + d * 0.2 * sz, y + 2.6 * sz],
          ],
          '#2a0e1e',
          0.3 * sz,
        )
        const h = [x + d * 1.4 * sz, y - 2.2 * sz]
        K.blob(
          [
            [h[0] - d * 1.1 * sz, h[1] - 0.6 * sz],
            [h[0] - d * 1.6 * sz, h[1] + 2.4 * sz],
            [h[0] - d * 0.2 * sz, h[1] + 1.2 * sz],
          ],
          '#120610',
        )
        K.disc(h[0], h[1], 1 * sz, '#e8a48c')
        K.disc(h[0] - d * 0.3 * sz, h[1] - 0.4 * sz, 0.9 * sz, '#120610')
        K.disc(h[0] + d * 0.3 * sz, h[1] + 0.2 * sz, 0.75 * sz, '#e8a48c')
      }
      siren(7, 61, 1.6, 1)
      siren(15, 58.4, 1.7, 1)
      siren(22, 66, 1.6, 1)
      // the ship: sail furled, oars out, an eye on the prow
      const y0 = 103
      for (let i = 0; i < 9; i++)
        K.line(
          [
            [40 + i * 5.4, y0 - 3],
            [34 + i * 5.4, y0 + 5],
          ],
          '#1a0810',
          0.6,
        )
      K.blob(
        [
          [32, y0 - 4],
          [38, y0 + 1],
          [84, y0 + 1],
          [92, y0 - 4],
          [97, y0 - 12],
          [92, y0 - 6],
          [84, y0 - 4.4],
          [38, y0 - 5],
        ],
        '#1a0810',
      )
      K.ribbon(
        [
          [32, y0 - 4],
          [28, y0 - 9],
          [29, y0 - 14],
          [33, y0 - 15],
        ],
        (t) => 2 - t * 1.2,
        '#1a0810',
      )
      K.disc(90, y0 - 5.6, 1.2, '#f0e0c8')
      K.disc(90.3, y0 - 5.6, 0.55, '#1a0810')
      for (let i = 0; i < 8; i++) {
        K.disc(42 + i * 5.4, y0 - 6.4, 1.3, '#2a1220')
        K.line(
          [
            [42 + i * 5.4, y0 - 5.6],
            [43 + i * 5.4, y0 - 4.2],
          ],
          '#2a1220',
          1.4,
        )
      }
      K.reflect(y0 + 1.6, { alpha: 0.32, ripple: 0.8, depth: 18, clip: (c) => c.rect(26, y0 + 1, 74, 20) })
      K.limb([64, y0 - 4], [64, 38], 1.1, 0.8, '#1a0810')
      K.limb([52, 41], [76, 41], 0.7, 0.7, '#1a0810')
      K.ribbon(
        [
          [52, 41.6],
          [64, 42.8],
          [76, 41.6],
        ],
        2,
        '#c8a080',
      )
      K.line(
        [
          [64, 40],
          [32, y0 - 13],
        ],
        '#1a0810',
        0.25,
      )
      K.line(
        [
          [64, 40],
          [95, y0 - 11],
        ],
        '#1a0810',
        0.25,
      )
      // Odysseus straining at the ropes toward the song
      const O = K.body({ x: 64.6, y: y0 - 25, s: 1, dir: -1, torso: -10, head: -24, col: '#2a1220', armL: [40, 10], armR: [-40, -10], back: ['armL', 'armR'], legL: [-6, 0], legR: [6, 0], beard: true })
      for (const yy of [O.sc[1] + 2, O.P[1] - 3, O.P[1] + 6])
        K.line(
          [
            [61.4, yy],
            [67.6, yy + 0.4],
          ],
          '#d8b080',
          0.6,
        )
      K.glow(40, 80, 70, '#ff8040', 0.1)
    },
  },

  hedonist: {
    style: 'vase',
    figure: 'black',
    shape: 'tondo',
    ground: '#cf5b34',
    seed: 181,
    title: 'Dionysus at sea, after Exekias',
    draw(ctx, K) {
      const { F, L, W } = K
      // the vine from the mast, spreading over the whole cup
      K.curve(
        [
          [50, 40],
          [40, 28],
          [28, 24],
          [18, 32],
        ],
        F,
        0.9,
      )
      K.curve(
        [
          [50, 40],
          [60, 27],
          [72, 24],
          [82, 32],
        ],
        F,
        0.9,
      )
      K.curve(
        [
          [50, 40],
          [50, 26],
          [50, 18],
        ],
        F,
        0.7,
      )
      const grapes = (x, y) => {
        for (let r = 0; r < 4; r++) for (let i = 0; i <= 3 - r; i++) K.disc(x - (3 - r) * 0.8 + i * 1.6, y + r * 1.4, 0.8, F)
      }
      for (const [x, y] of [
        [24, 30],
        [34, 26],
        [44, 22],
        [56, 22],
        [66, 26],
        [76, 30],
        [50, 16],
      ]) {
        K.line(
          [
            [x, y - 2.6],
            [x, y],
          ],
          F,
          0.3,
        )
        grapes(x, y)
      }
      const leaf = (x, y, a) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((a * Math.PI) / 180)
        K.blob(
          [
            [0, 0],
            [-2.2, -1.4],
            [-1.6, -3.4],
            [0, -2.6],
            [1.6, -3.4],
            [2.2, -1.4],
          ],
          F,
        )
        K.line(
          [
            [0, 0],
            [0, -2.4],
          ],
          L,
          0.2,
        )
        ctx.restore()
      }
      for (const [x, y, a] of [
        [29, 25, -30],
        [39, 23, -10],
        [61, 23, 10],
        [71, 25, 30],
        [19, 31, -60],
        [81, 31, 60],
        [47, 21, -10],
        [53, 19, 20],
      ])
        leaf(x, y, a)
      // the ship, its white sail
      K.limb([50, 79], [50, 40], 1, 0.8, F)
      K.line(
        [
          [36, 44],
          [64, 44],
        ],
        F,
        0.7,
      )
      K.blob(
        [
          [37, 44.4],
          [63, 44.4],
          [64.6, 54],
          [62, 64],
          [38, 64],
          [35.6, 54],
        ],
        W,
      )
      for (let i = 1; i < 6; i++)
        K.line(
          [
            [37 + i * 4.4, 44.4],
            [36.4 + i * 4.6, 63.6],
          ],
          '#c8b8a0',
          0.25,
        )
      K.blob(
        [
          [20, 73],
          [30, 79.6],
          [70, 79.6],
          [80, 74],
          [86, 66],
          [82, 73.6],
          [74, 76],
          [26, 75],
        ],
        F,
      )
      K.ribbon(
        [
          [20, 73],
          [16, 68],
          [18, 63],
          [22, 63],
        ],
        (t) => 2 - t * 1.2,
        F,
      )
      K.ribbon(
        [
          [84, 70],
          [89, 70],
          [91, 67],
        ],
        (t) => 1.6 - t,
        F,
      )
      for (let i = 0; i < 3; i++)
        K.curve(
          [
            [26 + i, 76.4 + i],
            [50, 77.4 + i],
            [76 - i * 2, 75.4 + i],
          ],
          L,
          0.25,
        )
      // Dionysus reclining, with his drinking-horn
      const D = K.body({
        x: 38,
        y: 71.6,
        s: 1.04,
        dir: 1,
        torso: -72,
        head: -10,
        col: F,
        legL: [80, 96],
        legR: [76, 92],
        armL: [10, 120],
        armR: [70, 140],
        back: ['armL'],
        robe: { col: F, knees: true, hem: 2, y: 74 },
        beard: 'long',
        hair: F,
        hairLen: 1.8,
      })
      K.line(
        [
          [D.P[0] - 1, D.P[1] - 2],
          [D.P[0] + 14, D.P[1] + 1],
        ],
        L,
        0.3,
      )
      K.line(
        [
          [D.P[0] + 2, D.P[1] - 4],
          [D.P[0] + 16, D.P[1] - 1],
        ],
        L,
        0.3,
      )
      K.curve(
        [
          [D.hr[0] - 1, D.hr[1] + 1],
          [D.hr[0] + 2, D.hr[1] - 2],
          [D.hr[0] + 5, D.hr[1] - 7],
        ],
        F,
        1.4,
      )
      for (let i = 0; i < 5; i++) K.disc(D.hd[0] - 2 + i * 1.1, D.hd[1] - 2.6 - Math.sin((i / 4) * Math.PI) * 0.8, 0.5, L)
      // the pirates, who became dolphins
      const dol = [
        [26, 92, -20, 0.62, false],
        [46, 99, 10, 0.66, false],
        [68, 92, 30, 0.62, false],
        [34, 106, 6, 0.55, true],
        [62, 105, -10, 0.56, true],
        [16, 52, -70, 0.55, false],
        [84, 52, 70, 0.55, true],
      ]
      for (const [x, y, a, s, f] of dol) {
        K.dolphin(x, y, s, a, F, f)
        const ex = x + Math.cos((a * Math.PI) / 180) * s * (f ? -6 : 6)
        const ey = y + Math.sin((a * Math.PI) / 180) * s * (f ? -6 : 6)
        K.disc(ex, ey - 0.6 * s, 0.32, L)
      }
    },
  },

  cinephile: {
    style: 'halftone',
    seed: 191,
    inks: [
      { col: '#ff6a1a', ang: 15, off: [3, 2] },
      { col: '#1a1614', ang: 45 },
    ],
    cell: 6,
    title: 'The prisoners in the cave watch the shadows',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#241610')
      // the wall they face, lit by a fire behind them
      K.blob(
        [
          [4, 14],
          [20, 8],
          [50, 6],
          [82, 8],
          [97, 16],
          [98, 60],
          [95, 92],
          [50, 96],
          [4, 92],
          [2, 50],
        ],
        '#e8742e',
      )
      K.glow(50, 52, 50, '#ffc890', 0.85, 'source-over')
      // the shadows of the things carried past the fire
      K.layer(
        (L) => {
          L.beast({ kind: 'horse', x: 34, y: 70, s: 1.5, dir: 1, col: '#1a1614', neck: -4 })
          const m = L.body({ x: 70, y: 64, s: 1.45, dir: -1, torso: -4, col: '#1a1614', armL: [-160, -186], armR: [16, 6], legL: [-14, -4], legR: [16, 6] })
          const jar = [m.hl[0] + 0.4, m.hl[1] - 6.4]
          L.oval(jar[0], jar[1], 3.2, 4.6, 0, '#1a1614')
          L.poly(
            [
              [jar[0] - 0.6, jar[1] + 4],
              [jar[0] + 0.6, jar[1] + 4],
              [jar[0], jar[1] + 6.4],
            ],
            '#1a1614',
          )
          L.rect(jar[0] - 0.9, jar[1] - 7.4, 1.8, 3.4, '#1a1614')
          L.rect(jar[0] - 1.6, jar[1] - 8, 3.2, 0.9, '#1a1614')
          L.ring(jar[0] - 2.2, jar[1] - 4.2, 1.4, '#1a1614', 0.7, 90, 270)
          L.ring(jar[0] + 2.2, jar[1] - 4.2, 1.4, '#1a1614', 0.7, -90, 90)
          L.bird(56, 26, 3, '#1a1614', -1, 0.9)
        },
        { alpha: 0.92, blur: 0.5 },
      )
      // their own heads at the bottom of the picture they are watching
      K.layer(
        (L) => {
          for (let i = 0; i < 5; i++) {
            L.disc(12 + i * 19, 90, 6.4, '#1a1614')
            L.oval(12 + i * 19, 98, 11, 6, 0, '#1a1614')
          }
        },
        { alpha: 0.6, blur: 1 },
      )
      // the prisoners, seen from behind, chained at the neck
      K.rect(0, 112, 100, 13, '#3a2214')
      for (let i = 0; i < 4; i++) {
        const x = 14 + i * 24
        K.blob(
          [
            [x - 12, 126],
            [x - 11, 112],
            [x - 6, 106],
            [x + 6, 106],
            [x + 11, 112],
            [x + 12, 126],
          ],
          '#2a1a12',
        )
        K.disc(x, 99, 6.2, '#2a1a12')
        K.ring(x, 99, 6.2, '#ff9a4a', 0.7, 200, 340)
        K.curve(
          [
            [x - 11, 112],
            [x - 6, 106.4],
            [x + 6, 106.4],
            [x + 11, 112],
          ],
          '#ff9a4a',
          0.6,
        )
      }
      const chain = []
      for (let x = -2; x < 102; x += 2.4) chain.push(x)
      for (const x of chain) K.ring(x, 107 + Math.sin(x / 7) * 0.6, 1, '#d8a070', 0.45)
    },
  },

  archivist: {
    style: 'pixel',
    colors: 22,
    seed: 201,
    title: 'Mnemosyne, and the nine lights',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#2a1a12')
      // the far wall: a tall window
      K.rect(36, 20, 28, 52, '#3a2618')
      K.shape((c) => {
        c.moveTo(42, 66)
        c.lineTo(42, 34)
        c.arc(50, 34, 8, Math.PI, 0)
        c.lineTo(58, 66)
        c.closePath()
      }, '#f2dcae')
      K.rect(49.4, 26, 1.2, 40, '#3a2618')
      K.rect(42, 46, 16, 1.2, '#3a2618')
      // the shelves, receding on both sides
      const cols = ['#7a2a1e', '#2f4a3a', '#a8742a', '#3a3a6a', '#6a4a2a', '#8a5a3a', '#4a2a2a', '#c8a060']
      for (const side of [-1, 1]) {
        const xo = side < 0 ? 0 : 100
        const xi = side < 0 ? 36 : 64
        K.poly(
          [
            [xo, 0],
            [xi, 20],
            [xi, 72],
            [xo, 125],
          ],
          '#3a2416',
        )
        for (let r = 0; r < 9; r++) {
          const t0 = r / 9
          const t1 = (r + 1) / 9
          const yo0 = lerp(0, 125, t0)
          const yo1 = lerp(0, 125, t1)
          const yi0 = lerp(20, 72, t0)
          const yi1 = lerp(20, 72, t1)
          for (let b = 0; b < 30; b++) {
            const u0 = b / 30
            const u1 = (b + 0.85) / 30
            const xa = lerp(xo, xi, u0)
            const xb = lerp(xo, xi, u1)
            const top = (u, y0, y1) => lerp(y0, y1, u)
            const h = 0.75 + K.R() * 0.2
            K.poly(
              [
                [xa, top(u0, yo0, yi0) + (top(u0, yo1, yi1) - top(u0, yo0, yi0)) * (1 - h)],
                [xb, top(u1, yo0, yi0) + (top(u1, yo1, yi1) - top(u1, yo0, yi0)) * (1 - h)],
                [xb, top(u1, yo1, yi1)],
                [xa, top(u0, yo1, yi1)],
              ],
              cols[Math.floor(K.R() * cols.length)],
            )
          }
          K.line(
            [
              [xo, yo1],
              [xi, yi1],
            ],
            '#1a0e08',
            0.6,
          )
        }
      }
      K.poly(
        [
          [0, 125],
          [36, 72],
          [64, 72],
          [100, 125],
        ],
        '#4a3020',
      )
      for (let i = -6; i <= 6; i++)
        K.line(
          [
            [50 + i * 2.4, 72],
            [50 + i * 16, 125],
          ],
          '#3a2416',
          0.4,
        )
      for (let j = 1; j < 8; j++) {
        const y = 72 + (53 * j * j) / 49
        K.line(
          [
            [0, y],
            [100, y],
          ],
          '#3a2416',
          0.4,
        )
      }
      // light down from the window, with dust in it
      K.layer(
        (L) =>
          L.poly(
            [
              [42, 34],
              [58, 34],
              [74, 125],
              [26, 125],
            ],
            'rgba(255,226,170,0.5)',
          ),
        { blur: 2, mode: 'lighter', alpha: 0.5 },
      )
      for (let i = 0; i < 60; i++) K.disc(36 + K.R() * 30, 40 + K.R() * 80, 0.2, 'rgba(255,240,200,0.8)')
      K.line(
        [
          [30, 30],
          [22, 100],
        ],
        '#5a3a20',
        0.8,
      )
      K.line(
        [
          [34, 32],
          [26, 102],
        ],
        '#5a3a20',
        0.8,
      )
      for (let i = 0; i < 9; i++)
        K.line(
          [
            [lerp(30, 22, i / 9), lerp(30, 100, i / 9)],
            [lerp(34, 26, i / 9), lerp(32, 102, i / 9)],
          ],
          '#5a3a20',
          0.5,
        )
      // Mnemosyne with her lamp; the nine lights above her
      const M = K.body({ x: 50, y: 88, s: 1.1, dir: -1, torso: -2, head: -8, col: '#e8c0a0', armL: [-120, -170], armR: [10, 4], robe: { col: '#2f5a6a', hem: 6, y: 112 }, hair: '#3a2214', hairLen: 1.8 })
      K.blob(
        [
          [M.sr[0] + 0.6, M.sr[1]],
          [M.P[0] + 5, M.P[1] + 6],
          [M.P[0] + 7, M.P[1] + 24],
          [M.P[0] + 2, M.P[1] + 24],
        ],
        '#1f4050',
      )
      const lamp = [M.hl[0] - 0.6, M.hl[1] - 1.6]
      K.glow(lamp[0], lamp[1], 34, '#ffb050', 0.45)
      K.oval(lamp[0], lamp[1] + 0.6, 1.8, 0.8, 0, '#c8902e')
      K.disc(lamp[0] - 0.4, lamp[1] - 0.8, 0.6, '#fff4c8')
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.06 + (i / 8) * 0.88)
        const x = 50 + Math.cos(a) * 30
        const y = 24 + Math.sin(a) * 12
        K.glow(x, y, 6, '#ffc870', 0.75)
        K.disc(x, y, 1, '#fff6dc')
      }
    },
  },

  healer: {
    style: 'pixel',
    colors: 22,
    seed: 211,
    title: 'A healing dream in the temple of Asclepius',
    draw(ctx, K) {
      K.sky(['#0a1430', '#16244a', '#2a3e6a', '#4a5e86'], 0, 80)
      K.stars(70, [0, 0, 100, 60], '#e8f0ff', 0.28)
      K.glow(70, 24, 26, '#cfe0ff', 0.35)
      K.disc(70, 24, 6, '#f4f6ff')
      K.ridge(76, 3, '#1a2440', { freq: 0.06, seed: 2, y1: 82 })
      for (const x of [14, 22, 86])
        K.blob(
          [
            [x - 1.6, 80],
            [x, 66],
            [x + 1.6, 80],
          ],
          '#121a30',
        )
      // the colonnade
      K.rect(0, 80, 100, 45, '#3a4460')
      K.rect(0, 0, 100, 10, '#d8dce6')
      K.rect(0, 10, 100, 2.4, '#9aa2b8')
      for (const x of [8, 36, 64, 92]) {
        K.layer(
          (L) =>
            L.poly(
              [
                [x - 4, 80],
                [x + 4, 80],
                [x + 30, 125],
                [x + 18, 125],
              ],
              '#141a2e',
            ),
          { alpha: 0.6 },
        )
        K.rect(x - 4, 12, 8, 70, '#c8ccd8')
        K.rect(x - 4, 12, 2.4, 70, '#e6e8f0')
        K.rect(x + 2, 12, 2, 70, '#8a92aa')
        K.rect(x - 5.4, 80, 10.8, 2.6, '#b8bccc')
        K.rect(x - 5.4, 11, 10.8, 2.4, '#e0e2ea')
      }
      // the sleeper on a pallet, a lamp, a sacred snake, a dog
      K.rect(14, 101, 40, 4, '#5a4a3a')
      K.oval(32, 99.4, 18, 3, 0, '#d8d0c0')
      K.oval(17, 98.4, 3, 2, 0, '#e8e2d6')
      K.body({
        x: 30,
        y: 99,
        s: 0.96,
        dir: -1,
        torso: -82,
        head: -96,
        col: '#d8a07a',
        legL: [94, 96],
        legR: [90, 92],
        armL: [-170, -120],
        armR: [60, 30],
        back: ['armR'],
        robe: { col: '#7a8aa8', knees: true, hem: 1, y: 101 },
        hair: '#3a2214',
      })
      K.glow(56, 98, 18, '#ffb050', 0.4)
      K.oval(56, 99, 1.8, 0.8, 0, '#c8902e')
      K.disc(56.6, 97.8, 0.6, '#fff0c0')
      K.serpent(
        [
          [46, 112],
          [42, 110],
          [36, 113],
          [30, 110],
          [24, 112],
        ],
        1.1,
        '#5a7a4a',
      )
      K.beast({ kind: 'dog', x: 86, y: 112, s: 0.9, dir: -1, col: '#a88a6a' })
      // Asclepius, who comes in the dream, with his serpent staff
      K.glow(70, 74, 24, '#d8e8ff', 0.25)
      const A = K.body({ x: 70, y: 82, s: 1.12, dir: -1, torso: -4, head: -16, col: '#e0b898', armL: [-40, -60], armR: [30, 4], robe: { col: '#e8e4dc', hem: 6, y: 106 }, beard: true, beardCol: '#c8c0b8', hair: '#c8c0b8' })
      K.blob(
        [
          [A.sl[0] - 1, A.sl[1] - 0.6],
          [A.P[0] + 6, A.P[1] - 4],
          [A.P[0] + 7, A.P[1] + 22],
          [A.P[0] - 2, A.P[1] + 23],
          [A.P[0] - 4, A.P[1] + 4],
        ],
        '#b8b0c8',
      )
      K.limb([A.hr[0], A.hr[1] - 14], [A.hr[0] + 2, 108], 1.3, 1.2, '#3a2412')
      K.serpent(
        [
          [A.hr[0] - 0.6, A.hr[1] - 15],
          [A.hr[0] + 2, A.hr[1] - 10],
          [A.hr[0] - 0.6, A.hr[1] - 5],
          [A.hr[0] + 2.4, A.hr[1]],
          [A.hr[0] - 0.4, A.hr[1] + 5],
          [A.hr[0] + 2.2, A.hr[1] + 10],
        ],
        1.3,
        '#2f5a26',
      )
    },
  },

  teacher: {
    style: 'vase',
    figure: 'red',
    seed: 221,
    title: 'Chiron teaches Achilles to draw the bow',
    draw(ctx, K) {
      const { F, L, T } = K
      K.inscribe('ΧΙΡΟΝ', 62, 24, 3.6, T)
      K.inscribe('ΑΧΙΛΛΕΥΣ', 12, 30, 3.2, T)
      ctx.translate(50, 108)
      ctx.scale(1.24, 1.24)
      ctx.translate(-50, -108)
      // a pine branch over Chiron's shoulder, a hare hanging from it
      // Chiron: a man to the waist, a horse behind
      const C = K.beast({ kind: 'horse', x: 64, y: 107, s: 1.2, dir: -1, col: F, noHead: true })
      const fs = C.fsh
      const J = K.body({ x: fs[0] - 1, y: fs[1] - 2, s: 1.14, dir: -1, torso: -6, head: -14, col: F, noLegs: true, armL: [-70, -90], armR: [-150, -200], outline: L, ow: 0.45, eye: L, beard: 'long', beardCol: L, hair: L, hairLen: 1.4 })
      K.line(
        [
          [C.hip[0] - 2, C.hip[1] - 3],
          [C.hip[0] + 2, C.hip[1] + 5],
        ],
        L,
        0.35,
      )
      K.curve(
        [
          [fs[0] + 4, fs[1] + 2],
          [fs[0] + 9, fs[1] + 1],
          [fs[0] + 15, fs[1] + 1.4],
        ],
        L,
        0.3,
      )
      const br = [J.hr[0] + 2, J.hr[1] - 3]
      K.line(
        [
          [J.hr[0] - 2, J.hr[1] + 2],
          [br[0] + 14, br[1] - 4],
        ],
        F,
        0.9,
      )
      for (let i = 0; i < 5; i++)
        K.line(
          [
            [br[0] + 2 + i * 2.6, br[1] - 0.8 - i * 0.8],
            [br[0] + 4 + i * 2.6, br[1] - 4 - i * 0.8],
          ],
          F,
          0.5,
        )
      K.oval(br[0] + 10, br[1] + 3, 1.4, 3.4, 10, F)
      K.oval(br[0] + 10.6, br[1] - 0.4, 0.5, 1.6, 20, F)
      K.line(
        [
          [br[0] + 10, br[1] - 3],
          [br[0] + 10, br[1] + 0],
        ],
        F,
        0.3,
      )
      // Achilles, a boy, drawing a bow at the master's word
      const A = K.body({ x: 30, y: 89, s: 0.84, dir: 1, torso: -4, head: 2, col: F, legL: [-14, 0], legR: [16, 0], armL: [80, 120], armR: [92, 92], back: ['armL'], outline: L, ow: 0.45, eye: L, hair: L, hairLen: 0.8 })
      K.blob(
        [
          [A.sl[0] - 0.8, A.sl[1]],
          [A.sr[0] + 0.8, A.sr[1]],
          [A.pr[0] + 2.2, A.P[1] + 4],
          [A.pl[0] - 2.2, A.P[1] + 4],
        ],
        F,
      )
      for (let i = 0; i < 4; i++)
        K.line(
          [
            [A.pl[0] - 1 + i * 1.6, A.P[1] - 2],
            [A.pl[0] - 1.6 + i * 1.9, A.P[1] + 3.6],
          ],
          L,
          0.25,
        )
      const bow = A.hr
      K.ctx.beginPath()
      K.ctx.arc(bow[0] - 4, bow[1], 6.4, -0.95, 0.95)
      K.ctx.strokeStyle = F
      K.ctx.lineWidth = 0.7
      K.ctx.stroke()
      K.line(
        [
          [bow[0] - 0.4, bow[1] - 5.2],
          [A.hl[0], A.hl[1]],
          [bow[0] - 0.4, bow[1] + 5.2],
        ],
        F,
        0.25,
      )
      K.line(
        [
          [A.hl[0] - 1, A.hl[1]],
          [bow[0] + 6, bow[1]],
        ],
        F,
        0.35,
      )
      // a small tree, the ground
      K.limb([10, 107], [12, 70], 1.6, 0.8, F)
      for (const [x, y, a] of [
        [12, 74, -30],
        [11, 82, 40],
        [12, 90, -40],
      ])
        K.line(
          [
            [x, y],
            [x + Math.sin((a * Math.PI) / 180) * 6, y - Math.cos((a * Math.PI) / 180) * 6],
          ],
          F,
          0.6,
        )
    },
  },

  lover: {
    style: 'pixel',
    colors: 22,
    seed: 231,
    title: 'Psyche lifts the lamp to see her lover',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#1a0c16')
      K.glow(60, 70, 70, '#ff9a4a', 0.28)
      // curtains
      for (const [x0, d] of [
        [0, 1],
        [100, -1],
      ]) {
        for (let i = 0; i < 7; i++) {
          const x = x0 + d * i * 2.6
          K.rect(Math.min(x, x + d * 2.6), 0, 2.6, 125, i % 2 ? '#5a0e22' : '#7a1a2e')
        }
        K.curve(
          [
            [x0 + d * 18, 0],
            [x0 + d * 16, 30],
            [x0 + d * 8, 60],
            [x0, 70],
          ],
          '#3a0814',
          1.6,
        )
      }
      K.rect(0, 0, 100, 6, '#3a0814')
      for (let x = 0; x < 100; x += 4)
        K.poly(
          [
            [x, 6],
            [x + 2, 9],
            [x + 4, 6],
          ],
          '#c8902e',
        )
      // the bed
      K.rect(14, 96, 72, 5, '#5a3a20')
      K.rect(16, 101, 3, 12, '#4a2e18')
      K.rect(81, 101, 3, 12, '#4a2e18')
      K.blob(
        [
          [14, 96],
          [16, 89],
          [84, 89.6],
          [86, 96],
        ],
        '#e8dcc8',
      )
      K.blob(
        [
          [16, 90],
          [17, 85],
          [24, 85.4],
          [25, 90],
        ],
        '#f2eadc',
      )
      // Eros asleep, his wings fallen open
      K.wing(44, 84, 1.15, -34, '#f6efe2', { n: 9, len: 22, spread: -56, edge: '#c8b8a0' })
      const E = K.body({ x: 38, y: 88, s: 1, dir: -1, torso: -84, head: -100, col: '#f0c8a2', legL: [80, 96], legR: [76, 92], armL: [-150, -110], armR: [20, 40], back: ['armR'], hair: '#e8b04a' })
      K.blob(
        [
          [E.P[0] - 1, E.P[1] - 2],
          [E.P[0] + 14, E.P[1] - 3],
          [E.P[0] + 26, E.P[1] - 1],
          [E.P[0] + 26, E.P[1] + 4],
          [E.P[0], E.P[1] + 3],
        ],
        '#e6d8f0',
      )
      // Psyche, the lamp held out, a knife held low
      const P = K.body({ x: 66, y: 76, s: 1.08, dir: -1, torso: -22, head: -32, col: '#f0c8a8', armL: [-110, -140], armR: [10, 0], legL: [-6, 0], legR: [8, 2], robe: { col: '#f2ece0', hem: 6, y: 98 }, hair: '#4a2414', hairLen: 1.4 })
      K.line(
        [
          [P.hr[0], P.hr[1]],
          [P.hr[0] + 1, P.hr[1] + 4],
        ],
        '#d8dce6',
        0.5,
      )
      const lamp = [P.hl[0] - 1, P.hl[1] - 0.6]
      K.oval(lamp[0], lamp[1], 2, 0.9, 0, '#c8902e')
      K.glow(lamp[0] - 0.6, lamp[1] - 1.6, 40, '#ffb050', 0.5)
      K.glow(lamp[0] - 0.6, lamp[1] - 1.6, 10, '#ffd890', 0.6)
      K.blob(
        [
          [lamp[0] - 1.4, lamp[1] - 0.6],
          [lamp[0] - 1, lamp[1] - 3],
          [lamp[0] - 0.4, lamp[1] - 0.6],
        ],
        '#fff2c8',
      )
      // the drop of hot oil that wakes him
      K.disc(lamp[0] - 2, lamp[1] + 3.6, 0.45, '#ffe8a0')
    },
  },

  gardener: {
    style: 'mosaic',
    seed: 241,
    tiles: 60,
    colors: 16,
    grout: '#4a4236',
    title: 'Demeter with wheat and a torch',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#23301e')
      K.rect(3, 3, 94, 119, '#e8dfc8')
      // a border of leaves
      const leafRun = (x0, y0, x1, y1) => {
        const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 3.6)
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n
          const x = lerp(x0, x1, t)
          const y = lerp(y0, y1, t)
          const a = Math.atan2(y1 - y0, x1 - x0) * (180 / Math.PI) + (i % 2 ? 40 : -40)
          K.oval(x, y, 2, 0.9, a, i % 2 ? '#4a7a3a' : '#6a9a4a')
        }
      }
      leafRun(6, 6.5, 94, 6.5)
      leafRun(6, 118.5, 94, 118.5)
      leafRun(6.5, 9, 6.5, 116)
      leafRun(93.5, 9, 93.5, 116)
      K.rect(10, 10, 80, 105, '#23301e')
      K.rect(11, 11, 78, 103, '#efe6d0')
      // winter on her left hand, summer on her right
      K.rect(11, 96, 39, 18, '#e8e8e4')
      K.limb([22, 98], [24, 60], 2.4, 1, '#6a5a4a')
      for (const [x, y, a, l] of [
        [23.4, 70, -40, 9],
        [23, 78, 36, 8],
        [24, 64, 20, 7],
        [23.6, 84, -30, 6],
      ])
        K.line(
          [
            [x, y],
            [x + Math.sin((a * Math.PI) / 180) * l, y - Math.cos((a * Math.PI) / 180) * l],
          ],
          '#6a5a4a',
          0.8,
        )
      K.rect(50, 96, 39, 18, '#b89a4a')
      for (let i = 0; i < 16; i++) {
        const x = 52 + i * 2.4
        K.line(
          [
            [x, 114],
            [x + 0.6, 92 + (i % 3) * 2],
          ],
          '#a8862a',
          0.5,
        )
        K.oval(x + 0.6, 91 + (i % 3) * 2, 0.7, 2, 6, '#d8b048')
      }
      for (const [x, y] of [
        [56, 100],
        [64, 104],
        [72, 99],
        [80, 103],
        [86, 98],
      ]) {
        K.line(
          [
            [x, y + 4],
            [x, y],
          ],
          '#4a7a3a',
          0.4,
        )
        K.disc(x, y, 1.6, '#c8282a')
        K.disc(x, y, 0.5, '#2a1a1a')
      }
      // Demeter, standing, crowned with wheat
      K.blob(
        [
          [38, 104],
          [41, 70],
          [43, 46],
          [57, 46],
          [59, 70],
          [62, 104],
        ],
        '#3f6f6a',
      )
      K.blob(
        [
          [42, 50],
          [58, 47],
          [62, 72],
          [56, 92],
          [42, 80],
        ],
        '#c8902e',
      )
      for (let i = 0; i < 4; i++)
        K.curve(
          [
            [44 + i * 3, 54 + i * 2],
            [50 + i * 2, 70],
            [46 + i * 3, 88],
          ],
          '#a8701e',
          0.5,
        )
      K.oval(46, 105, 2.2, 1, 0, '#6a3a2a')
      K.oval(54, 105, 2.2, 1, 0, '#6a3a2a')
      K.limb([44, 49], [38, 60], 2.8, 2.2, '#3f6f6a')
      K.limb([38, 60], [36, 54], 2.2, 1.8, '#e2b08a')
      K.limb([56, 49], [62, 62], 2.8, 2.2, '#3f6f6a')
      K.limb([62, 62], [64, 56], 2.2, 1.8, '#e2b08a')
      // the sheaf in one hand, the torch she searched with in the other
      for (let i = 0; i < 9; i++) {
        const a = -30 + i * 7.5
        const x1 = 36 + Math.sin((a * Math.PI) / 180) * 14
        const y1 = 56 - Math.cos((a * Math.PI) / 180) * 14
        K.line(
          [
            [36, 62],
            [x1, y1],
          ],
          '#c8a03a',
          0.5,
        )
        K.oval(x1, y1, 0.8, 2, a, '#e0b84a')
      }
      K.rect(35, 56, 2.6, 1.2, '#8a5a20')
      K.limb([64, 92], [64.6, 44], 1.4, 1.2, '#6a4a2a')
      K.blob(
        [
          [62, 45],
          [63, 40],
          [64.6, 34],
          [66.6, 40],
          [67.4, 45],
        ],
        '#e8642a',
      )
      K.blob(
        [
          [63.4, 45],
          [64.2, 41],
          [64.8, 37.6],
          [65.8, 41],
          [66.2, 45],
        ],
        '#f6c04a',
      )
      K.disc(50, 43.6, 1.8, '#e2b08a')
      K.oval(50, 39, 3.4, 4.2, 0, '#e8b892')
      K.blob(
        [
          [46.4, 40],
          [46.2, 35.4],
          [50, 33.4],
          [53.8, 35.4],
          [53.6, 40],
          [52.6, 36.4],
          [47.4, 36.4],
        ],
        '#7a3a1e',
      )
      for (let i = 0; i < 7; i++) {
        const a = -54 + i * 18
        K.oval(50 + Math.sin((a * Math.PI) / 180) * 5, 36 - Math.cos((a * Math.PI) / 180) * 5, 0.7, 1.8, a, '#e0b84a')
      }
      K.disc(48.6, 39.4, 0.45, '#2a1a14')
      K.disc(51.4, 39.4, 0.45, '#2a1a14')
      K.line(
        [
          [49.2, 41.8],
          [50.8, 41.8],
        ],
        '#a04a3a',
        0.4,
      )
      K.bird(80, 30, 1, '#5a6a8a', -1, 0.8)
      K.bird(70, 22, 0.8, '#6a7a9a', -1, 0.2)
    },
  },
}
