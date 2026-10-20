// Scenes I–VIII: the orders of Knowing and Making. Each is a myth from the entry's margin, drawn in a
// 100 × 125 frame and handed to a medium chosen for it.
import { lerp } from './geom.js'

// Oedipus, shared by the key block and the colour block of his woodcut.
const OEDIPUS = { x: 26, y: 98, s: 1.15, dir: 1, torso: 30, head: 50, legL: [64, -6], legR: [84, 8], armL: [20, 60], armR: [12, 186], back: ['armL'] }

export default {
  scientist: {
    style: 'pixel',
    colors: 22,
    seed: 11,
    title: 'Prometheus brings the fire down the mountain',
    draw(ctx, K) {
      K.sky(['#060a22', '#0f163d', '#211d4e', '#3f2c5c', '#69395a'], 0, 90)
      K.stars(170, [0, 0, 100, 72], '#fff6e0', 0.3, { bias: 1.5 })
      K.glow(16, 16, 22, '#8fa6ff', 0.18)
      K.moon(16, 16, 4.2, '#f4ecd0', 0.62, -160)
      // Olympus, the light of the gods still on its summit, and Zeus's eagle over it
      K.glow(80, 34, 40, '#ffb85e', 0.22)
      K.ridge(72, 5, '#2c2a5c', {
        freq: 0.05,
        peaks: [
          [80, 38, 10],
          [60, 15, 9],
          [96, 10, 7],
        ],
        seed: 3,
      })
      K.glow(80, 35, 9, '#ffd890', 0.4)
      K.bird(74, 20, 1.5, '#0d0918', -1, 0.95)
      K.ridge(86, 5, '#1c1a42', {
        freq: 0.07,
        peaks: [
          [26, 11, 13],
          [58, 4, 9],
        ],
        seed: 5,
      })
      // the valley where people wait in the dark
      K.rect(0, 92, 100, 33, '#110e28')
      K.ribbon(
        [
          [-2, 101],
          [12, 98],
          [26, 102],
          [40, 99],
          [50, 101],
        ],
        (t) => 1.6 - t,
        '#34427a',
      )
      for (const [x, y] of [
        [8, 97],
        [14, 96.4],
        [20, 97.4],
        [4, 98.2],
      ]) {
        K.rect(x - 1.2, y, 2.4, 1.6, '#08061a')
        K.poly(
          [
            [x - 1.6, y],
            [x, y - 1.4],
            [x + 1.6, y],
          ],
          '#08061a',
        )
      }
      // the slope he comes down, rising to the right
      const g = K.ridge(100, 2.5, '#0d0a1e', { freq: 0.15, slope: 0.55, seed: 9, x0: 14 })
      const x = 60
      const y = g(x) - 24.5
      const pose = { x, y, s: 1.24, dir: -1, torso: 8, head: -6, legL: [-28, -6], legR: [22, 14], armL: [-154, -178], armR: [34, 16], back: ['armR'] }
      const J0 = K.joints(pose)
      // a cloak streaming back in the wind
      const sh = J0.sc
      const cloak = [sh, [sh[0] + 8, sh[1] + 3], [sh[0] + 15, sh[1]], [sh[0] + 22, sh[1] + 5]]
      K.ribbon(cloak, (t) => 2.4 + t * 6.4, '#ff8a3c')
      K.ribbon(
        cloak.map(([a, b]) => [a + 0.6, b + 0.7]),
        (t) => 2.4 + t * 6.4,
        '#4e1424',
      )
      K.body({ ...pose, x: x - 0.6, y: y - 0.5, col: '#ff9a4a', beard: true })
      const J = K.body({ ...pose, col: '#1c1024', beard: true })
      const tip = [J.hl[0] - 1.6, J.hl[1] - 8]
      K.limb(J.hl, tip, 1.1, 0.8, '#5a3a20')
      // the fire, and the light it throws on everything near
      K.glow(tip[0], tip[1] - 2, 52, '#ff6a1e', 0.36)
      K.glow(tip[0], tip[1] - 2, 18, '#ffb357', 0.55)
      const f = (dx, dy, w, h, c) =>
        K.blob(
          [
            [tip[0] - w + dx, tip[1] + dy],
            [tip[0] - w * 0.4 + dx, tip[1] - h * 0.55 + dy],
            [tip[0] + w * 0.6 + dx + h * 0.25, tip[1] - h + dy],
            [tip[0] + w * 0.5 + dx, tip[1] - h * 0.4 + dy],
            [tip[0] + w + dx, tip[1] + dy],
          ],
          c,
        )
      f(0, 0.4, 3.2, 10, '#d43a1c')
      f(0.1, 0.2, 2.4, 8, '#ff7a1c')
      f(0.2, 0, 1.6, 5.6, '#ffc94a')
      f(0.2, -0.2, 0.8, 3, '#fff4c8')
      for (let i = 0; i < 50; i++) {
        const t = K.R()
        const sx = tip[0] + t * 24 + (K.R() - 0.5) * 6 * (0.3 + t)
        const sy = tip[1] - 6 - t * 28 + (K.R() - 0.5) * 7 * t
        K.disc(sx, sy, 0.22 + K.R() * 0.3, K.R() < 0.5 ? '#ffd36a' : '#ff8a3a')
      }
      K.ridge(120, 3, '#07050f', { freq: 0.2, slope: 0.2, seed: 13, x0: -2 })
    },
  },

  philosopher: {
    style: 'vase',
    figure: 'red',
    seed: 21,
    title: 'Socrates takes the cup of hemlock',
    draw(ctx, K) {
      const { F, L, T } = K
      K.inscribe('ΣΟΚΡΑΤΕΣ', 33, 24, 3.6, T, { gap: 0.5 })
      ctx.translate(50, 108)
      ctx.scale(1.2, 1.2)
      ctx.translate(-50, -108)
      const folds = (x0, y0, x1, y1, n, dx, w = 0.28) => {
        for (let i = 0; i < n; i++)
          K.curve(
            [
              [x0 + i * dx, y0],
              [lerp(x0, x1, 0.5) + i * dx * 1.1, lerp(y0, y1, 0.5)],
              [x1 + i * dx * 1.2, y1],
            ],
            L,
            w,
          )
      }
      // the couch he sits on
      K.rect(33, 92.5, 50, 2.2, F)
      K.blob(
        [
          [34, 92.6],
          [36, 89.6],
          [80, 90.4],
          [82, 92.6],
        ],
        F,
      )
      K.blob(
        [
          [34, 92.4],
          [33.2, 87],
          [37, 86.6],
          [38.6, 92],
        ],
        F,
      )
      for (const lx of [36, 79]) {
        K.rect(lx - 0.9, 94.6, 1.8, 13, F)
        K.oval(lx, 98, 1.6, 1, 0, F)
        K.oval(lx, 103, 1.3, 0.8, 0, F)
      }
      K.line(
        [
          [35, 93.4],
          [82, 93.4],
        ],
        L,
        0.35,
      )
      K.curve(
        [
          [37, 91.6],
          [58, 91.2],
          [80, 91.8],
        ],
        L,
        0.3,
      )
      // Socrates: bald, bearded, his cloak over his knees, reaching for the cup
      const S = K.body({
        x: 47,
        y: 90,
        s: 1.08,
        dir: 1,
        torso: -3,
        head: 4,
        col: F,
        outline: L,
        ow: 0.45,
        legL: [76, -4],
        legR: [82, 4],
        armL: [-20, 10],
        armR: [62, 96],
        back: ['armL'],
        robe: { col: F, knees: true, hem: 3.2, y: 105, extra: [[40, 80]] },
        eye: L,
      })
      K.blob(
        [
          [S.hd[0] - 2.7, S.hd[1] + 0.6],
          [S.hd[0] - 2.3, S.hd[1] - 1.4],
          [S.hd[0] - 1, S.hd[1] - 1],
          [S.hd[0] - 1.6, S.hd[1] + 1.6],
        ],
        L,
      )
      K.blob(
        [
          [S.hd[0] + 1.7, S.hd[1] + 0.9],
          [S.hd[0] + 1.3, S.hd[1] + 4.8],
          [S.hd[0] - 0.4, S.hd[1] + 5.8],
          [S.hd[0] - 1.7, S.hd[1] + 2.4],
          [S.hd[0] - 0.4, S.hd[1] + 1.2],
        ],
        L,
      )
      K.line(
        [
          [S.hd[0] + 2, S.hd[1] + 2.2],
          [S.hd[0] + 1.2, S.hd[1] + 2.4],
        ],
        F,
        0.3,
      )
      folds(S.P[0] - 2, S.P[1] - 1, S.P[0] + 6, S.P[1] + 9, 6, 1.6)
      K.curve(
        [
          [S.sl[0] - 0.6, S.sl[1] + 1],
          [S.P[0] - 2.4, S.P[1] - 4],
          [S.P[0] + 3, S.P[1] - 1],
        ],
        L,
        0.32,
      )
      K.curve(
        [
          [S.sl[0] - 0.2, S.sl[1] + 3],
          [S.P[0] - 1.4, S.P[1] - 6],
          [S.P[0] + 3.4, S.P[1] - 3],
        ],
        L,
        0.28,
      )
      // the cup, passing between them
      const cup = [S.hr[0] + 2, S.hr[1] - 0.8]
      K.blob(
        [
          [cup[0] - 2.6, cup[1] - 0.6],
          [cup[0] + 2.6, cup[1] - 0.6],
          [cup[0] + 1.3, cup[1] + 1.3],
          [cup[0] - 1.3, cup[1] + 1.3],
        ],
        F,
      )
      K.rect(cup[0] - 0.3, cup[1] + 1, 0.6, 1.3, F)
      K.rect(cup[0] - 1.3, cup[1] + 2.1, 2.6, 0.5, F)
      K.line(
        [
          [cup[0] - 2.6, cup[1] - 0.6],
          [cup[0] + 2.6, cup[1] - 0.6],
        ],
        L,
        0.3,
      )
      // the jailer, holding it out, his other hand over his eyes
      const J = K.body({
        x: 76,
        y: 85,
        s: 1.06,
        dir: -1,
        torso: -6,
        head: -28,
        col: F,
        outline: L,
        ow: 0.45,
        legL: [-6, -2],
        legR: [10, 4],
        armL: [-78, -88],
        armR: [-40, -176],
        robe: { col: F, hem: 4.6, y: 97 },
        eye: L,
        hair: L,
        hairLen: 0.6,
      })
      folds(J.P[0] - 2.6, J.P[1] - 1, J.P[0] - 3.6, J.P[1] + 11.6, 5, 1.4)
      K.line(
        [
          [J.pl[0] - 1, J.P[1] + 0.2],
          [J.pr[0] + 1, J.P[1] + 0.2],
        ],
        L,
        0.35,
      )
      // a friend at the end of the couch, his head in his hand
      const C = K.body({
        x: 19,
        y: 84,
        s: 1.06,
        dir: 1,
        torso: 8,
        head: 30,
        col: F,
        outline: L,
        ow: 0.45,
        legL: [-4, 0],
        legR: [8, 2],
        armL: [-16, -6],
        armR: [40, 176],
        back: ['armL'],
        robe: { col: F, hem: 5.4, y: 106, extra: [[15, 72]] },
        eye: L,
        beard: true,
        beardCol: L,
        hair: L,
      })
      folds(C.P[0] - 4, C.P[1] - 6, C.P[0] - 4, C.P[1] + 21, 7, 1.4)
      K.curve(
        [
          [C.sr[0] + 1, C.sr[1] + 2],
          [C.P[0] + 2, C.P[1] - 4],
          [C.P[0] + 5, C.P[1] + 2],
        ],
        L,
        0.32,
      )
    },
  },

  theologian: {
    style: 'glass',
    seed: 31,
    colors: 16,
    cells: 12,
    smooth: 1,
    title: 'Jacob wrestles the angel until daybreak',
    draw(ctx, K) {
      K.sky(['#13205e', '#22388a', '#3a58ad', '#8a6aa8', '#e8906a', '#ffd26a'], 0, 86)
      K.glow(84, 86, 30, '#ffe7a0', 0.7)
      K.disc(84, 86, 8, '#fff0b8')
      K.ridge(86, 3, '#2a3f6e', {
        freq: 0.08,
        peaks: [
          [12, 7, 9],
          [88, 8, 10],
        ],
        seed: 4,
      })
      K.rect(0, 92, 100, 13, '#6e4a26')
      K.ridge(95, 1.5, '#8a5e2e', { freq: 0.2, seed: 6, y1: 105 })
      for (let i = 0; i < 4; i++) K.rect(0, 105 + i * 5, 100, 5, ['#1f5f9a', '#2f7fb8', '#1a4f86', '#3a8fc4'][i])
      for (let i = 0; i < 9; i++)
        K.curve(
          [
            [i * 12 - 4, 108 + (i % 3) * 5],
            [i * 12 + 2, 106.6 + (i % 3) * 5],
            [i * 12 + 8, 108 + (i % 3) * 5],
          ],
          '#9ad0ef',
          1.3,
        )
      // the angel: wings raised, a halo, robes of light
      const ang = { x: 61, y: 66, s: 1.45, dir: -1, torso: -16, head: -22, col: '#f2c8a0', legL: [-8, 0], legR: [14, 6], armL: [-54, -76], armR: [-128, -150], hair: '#c8742a', hairLen: 1.2, w: 1.7, headR: 1.35 }
      const a = K.joints(ang)
      const feathers = ['#d88a28', '#c8302c', '#2f8a5a', '#d88a28', '#c8302c', '#2f8a5a', '#d88a28', '#c8302c']
      K.wing(a.sc[0] + 4, a.sc[1] + 3, 1.5, -14, '#e0a838', { n: 8, len: 30, spread: -52, w: 3, cols: feathers })
      K.wing(a.sc[0] + 6, a.sc[1] + 3, 1.5, 22, '#e0a838', { n: 8, len: 32, spread: 50, w: 3, cols: feathers })
      K.disc(a.hd[0], a.hd[1], 8.4, '#fff2a0')
      K.ring(a.hd[0], a.hd[1], 8.4, '#c8302c', 1.4)
      K.body({ ...ang, robe: { col: '#f6f2e6', hem: 9, y: 98 }, back: ['armR', 'armL'] })
      K.blob(
        [
          [a.sr[0] + 1, a.sr[1]],
          [a.P[0] + 7, a.P[1] + 4],
          [a.P[0] + 9, a.P[1] + 30],
          [a.P[0] + 2, a.P[1] + 31],
          [a.P[0], a.P[1] + 8],
        ],
        '#2f4ab8',
      )
      // Jacob: earth-coloured, holding on
      const ja = K.body({
        x: 36,
        y: 74,
        s: 1.36,
        dir: 1,
        torso: 30,
        head: 32,
        w: 1.7,
        headR: 1.3,
        col: '#e0a47a',
        legL: [-40, -10],
        legR: [10, 0],
        armL: [70, 40],
        armR: [96, 60],
        back: ['armL'],
        robe: { col: '#a8301e', hem: 5.6, y: 88 },
        beard: true,
        beardCol: '#4a2a18',
        hair: '#4a2a18',
      })
      K.blob(
        [
          [ja.sl[0] - 1, ja.sl[1] - 0.5],
          [ja.sl[0] - 6, ja.sl[1] + 8],
          [ja.P[0] - 7, ja.P[1] + 6],
          [ja.P[0] - 1, ja.P[1] - 2],
        ],
        '#2f7a3a',
      )
      // the touch on the hip that lamed him
      K.limb(a.sl, a.el, 2.7 * 1.45 * 1.7, 2 * 1.45 * 1.7, '#f6f2e6')
      K.limb(a.el, a.hl, 2 * 1.45 * 1.7, 1.35 * 1.45 * 1.7, '#f2c8a0')
      K.disc(a.hl[0], a.hl[1], 2.6, '#f2c8a0')
    },
  },

  detective: {
    style: 'woodcut',
    seed: 41,
    title: 'Oedipus answers the riddle of the Sphinx',
    spot(ctx, K) {
      K.disc(28, 30, 11, '#fff')
      const J = K.joints(OEDIPUS)
      K.blob(
        [
          [J.sl[0] - 1, J.sl[1] - 1.4],
          [J.sc[0] + 1, J.sc[1] - 1],
          [J.P[0] - 1, J.P[1] + 2],
          [J.P[0] - 6, J.P[1] + 9],
          [J.sl[0] - 6, J.sl[1] + 10],
        ],
        '#fff',
      )
    },
    draw(ctx, K) {
      K.sky(['#d6d6d6', '#e8e8e8', '#f2f2f2'], 0, 86)
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2
        K.line(
          [
            [28 + Math.cos(a) * 13, 30 + Math.sin(a) * 13],
            [28 + Math.cos(a) * 21, 30 + Math.sin(a) * 21],
          ],
          '#8a8a8a',
          0.6,
        )
      }
      K.disc(28, 30, 11, '#fafafa')
      K.ring(28, 30, 11, '#555', 0.6)
      // Thebes on its hill
      K.ridge(84, 4, '#b4b4b4', { freq: 0.05, peaks: [[22, 10, 14]], seed: 2 })
      for (let i = 0; i < 7; i++) {
        const x = 10 + i * 3.4
        K.rect(x, 69 - (i % 2) * 2, 2.6, 8 + (i % 2) * 2, '#8e8e8e')
        K.rect(x + 0.9, 72, 0.8, 1.4, '#3a3a3a')
      }
      K.rect(8, 73, 26, 5, '#a2a2a2')
      K.ridge(98, 3, '#9a9a9a', { freq: 0.09, seed: 3 })
      // the column, and the Sphinx on it
      K.rect(63, 58, 13, 52, '#d2d2d2')
      for (let i = 0; i < 6; i++) K.rect(64 + i * 2.1, 60, 0.7, 48, '#a4a4a4')
      K.rect(61, 55, 17, 3.4, '#c4c4c4')
      K.disc(61.6, 57.6, 2.2, '#c4c4c4')
      K.disc(77.4, 57.6, 2.2, '#c4c4c4')
      K.ring(61.6, 57.6, 1.2, '#666', 0.45)
      K.ring(77.4, 57.6, 1.2, '#666', 0.45)
      const body = '#9c9c9c'
      K.ribbon(
        [
          [77.6, 51],
          [82, 49],
          [81, 43.6],
          [84, 41],
        ],
        (t) => 1.1 - t * 0.6,
        body,
      )
      K.wing(70.4, 46, 1.05, 16, '#d0d0d0', { n: 7, len: 21, spread: 44, w: 2.8, edge: '#4a4a4a', covert: '#bdbdbd' })
      K.oval(74, 50.6, 4.6, 4, 0, body)
      K.blob(
        [
          [65.6, 50.6],
          [66.6, 45.6],
          [72, 45],
          [77, 47.6],
          [78.2, 53.8],
          [65.6, 54.2],
        ],
        body,
      )
      K.oval(71.4, 54.2, 3, 0.9, 0, '#8a8a8a')
      K.limb([68.6, 48.4], [68, 54.6], 2.1, 1.5, '#8a8a8a')
      K.limb([66.6, 48], [65.6, 54.6], 2.2, 1.6, body)
      K.oval(64.8, 54.8, 1.5, 0.7, 0, body)
      K.blob(
        [
          [66, 47],
          [64.4, 44],
          [66.8, 41.2],
          [69.6, 44.6],
        ],
        '#dcdcdc',
      )
      K.disc(64.6, 38.8, 2.9, '#e6e6e6')
      K.poly(
        [
          [62, 38.2],
          [60.8, 39.8],
          [62.2, 40.2],
        ],
        '#e6e6e6',
      )
      K.blob(
        [
          [66.2, 36.6],
          [64, 35.6],
          [66.4, 35.4],
          [68.4, 37],
          [68.8, 44],
          [66.6, 45],
        ],
        '#4a4a4a',
      )
      K.line(
        [
          [62.6, 36.8],
          [66.6, 36],
        ],
        '#555',
        0.5,
      )
      K.disc(63.3, 38.4, 0.3, '#111')
      // bones of those who guessed wrong
      for (const [bx, by, r] of [
        [58, 107, 1.8],
        [84, 108, 1.6],
        [52, 109, 1.4],
      ]) {
        K.disc(bx, by, r, '#f2f2f2')
        K.disc(bx - r * 0.35, by - r * 0.1, r * 0.24, '#222')
        K.disc(bx + r * 0.35, by - r * 0.1, r * 0.24, '#222')
      }
      K.limb([70, 110.5], [79, 109], 0.8, 0.8, '#efefef')
      K.limb([45, 111], [52, 112], 0.7, 0.7, '#efefef')
      // Oedipus on a rock, chin in hand, thinking
      K.blob(
        [
          [10, 113],
          [13, 99],
          [30, 97],
          [38, 104],
          [38, 114],
        ],
        '#7e7e7e',
      )
      for (let i = 0; i < 5; i++)
        K.curve(
          [
            [13 + i * 4.4, 113],
            [16 + i * 4.4, 105],
            [19 + i * 3.8, 99],
          ],
          '#5c5c5c',
          0.4,
        )
      K.limb([16, 62], [24, 112], 0.8, 0.8, '#3a3a3a')
      const J = K.joints(OEDIPUS)
      K.blob(
        [
          [J.sl[0] - 1, J.sl[1] - 1.4],
          [J.sc[0] + 1, J.sc[1] - 1],
          [J.P[0] - 1, J.P[1] + 2],
          [J.P[0] - 6, J.P[1] + 9],
          [J.sl[0] - 6, J.sl[1] + 10],
        ],
        '#8e8e8e',
      )
      K.body({ ...OEDIPUS, col: '#e6e6e6', beard: true, beardCol: '#666', hair: '#5a5a5a' })
      K.oval(J.sl[0] - 3.2, J.sl[1] + 2.4, 3.4, 1.2, -50, '#6a6a6a')
      K.ring(J.sl[0] - 3.2, J.sl[1] + 2.4, 1.4, '#444', 0.4)
    },
  },

  engineer: {
    style: 'pixel',
    colors: 22,
    seed: 51,
    title: 'Icarus falls; a ploughman goes on ploughing',
    draw(ctx, K) {
      K.sky(['#2a539f', '#3f78bd', '#7fb3dc', '#c4e0ea', '#efe7cf'], 0, 79)
      K.glow(26, 24, 70, '#fff0b0', 0.45)
      K.glow(26, 24, 24, '#fff8dc', 0.85)
      K.disc(26, 24, 7, '#fffdf0')
      for (const [cx, cy, s] of [
        [70, 50, 1.1],
        [86, 58, 0.8],
        [12, 64, 0.9],
      ]) {
        K.blob(
          [
            [cx - 10 * s, cy + 2 * s],
            [cx - 6 * s, cy - 2 * s],
            [cx, cy - 3.4 * s],
            [cx + 7 * s, cy - 1.6 * s],
            [cx + 11 * s, cy + 2 * s],
          ],
          'rgba(255,250,240,0.55)',
        )
      }
      K.ridge(78.6, 0.8, '#7f9fba', { x0: -2, x1: 22, freq: 0.3, peaks: [[8, 2.4, 6]], y1: 79.2 })
      K.sky(['#3f86b0', '#245c8a', '#143e66'], 79, 125)
      for (let i = 0; i < 160; i++) {
        const t = K.R()
        const y = 79.5 + t * t * 46
        const x = 26 + (K.R() - 0.5) * (3 + t * 30)
        K.rect(x, y, 0.8 + t * 3.4, 0.35 + t * 0.4, K.R() < 0.5 ? '#fff6d0' : '#cfe8f2')
      }
      for (let i = 0; i < 50; i++) K.rect(K.R() * 100, 82 + K.R() * 43, 1 + K.R() * 3, 0.3, 'rgba(160,210,235,0.5)')
      // a ship going about its business
      K.blob(
        [
          [8, 104],
          [26, 104],
          [23.4, 107.6],
          [10.6, 107.6],
        ],
        '#3a2416',
      )
      K.limb([17, 104], [17, 90], 0.6, 0.5, '#3a2416')
      K.poly(
        [
          [17.6, 90.6],
          [25, 95],
          [24.4, 102.6],
          [17.6, 102.6],
        ],
        '#f2ead6',
      )
      K.poly(
        [
          [16.4, 92],
          [11.4, 101.6],
          [16.4, 101.6],
        ],
        '#ddd2bc',
      )
      // the cliff, and Bruegel's ploughman on it
      K.poly(
        [
          [68, 125],
          [70, 96],
          [73, 78],
          [77, 69],
          [100, 64],
          [100, 125],
        ],
        '#6a5a46',
      )
      K.poly(
        [
          [73, 78],
          [77, 69],
          [100, 64],
          [100, 70],
          [82, 73.4],
          [76, 80],
        ],
        '#5d7f3a',
      )
      K.poly(
        [
          [70, 125],
          [72, 100],
          [75, 84],
          [79, 90],
          [78, 125],
        ],
        '#4e4234',
      )
      for (let i = 0; i < 5; i++)
        K.line(
          [
            [80, 69.4 + i * 0.9],
            [100, 65.4 + i * 1.1],
          ],
          '#4b6a2c',
          0.35,
        )
      K.beast({ kind: 'horse', x: 84, y: 69, s: 0.34, dir: -1, col: '#3a2a1e' })
      K.line(
        [
          [86.6, 66.6],
          [90, 68.6],
        ],
        '#2a1e14',
        0.35,
      )
      K.body({ x: 91, y: 64.4, s: 0.26, dir: -1, torso: -18, col: '#3a2c22', robe: { col: '#9a3a22', hem: 2.2 }, armL: [-60, -70] })
      // Daedalus, ahead and safe
      K.wing(79, 32, 0.5, -60, '#f2ead6', { n: 7, len: 18, spread: -40 })
      K.wing(80, 32, 0.5, 60, '#e2d8c2', { n: 7, len: 18, spread: 40 })
      K.body({ x: 75, y: 33, s: 0.32, dir: 1, torso: 84, head: 70, col: '#7a4a2e', legL: [96, 96], legR: [100, 100], armL: [150, 150], armR: [30, 30] })
      // Icarus, the wax gone
      const I = [56, 60]
      for (let i = 0; i < 40; i++) {
        const t = K.R()
        const fx = lerp(I[0], 34, t) + (K.R() - 0.5) * 18 * (0.4 + t)
        const fy = lerp(I[1] - 2, 30, t) + (K.R() - 0.5) * 10
        K.oval(fx, fy, 1.2, 0.4, K.R() * 180, K.R() < 0.7 ? '#fbf6ea' : '#e8c86a')
      }
      K.wing(I[0] - 2, I[1] - 2, 0.78, -110, '#f4efe2', { n: 5, len: 16, spread: -35, edge: '#cbbfa6' })
      const ic = K.body({ x: I[0], y: I[1], s: 0.82, dir: 1, torso: 156, head: 170, col: '#e9b48c', legL: [190, 150], legR: [150, 200], armL: [-30, -70], armR: [40, 80], hair: '#5a3218' })
      K.limb(ic.sl, [ic.sl[0] - 4, ic.sl[1] + 3], 1.4, 0.6, '#e8c86a')
      K.wing(I[0] + 3, I[1] - 3, 0.7, 140, '#f4efe2', { n: 3, len: 12, spread: 20, edge: '#cbbfa6' })
      for (const [gx, gy] of [
        [44, 82],
        [50, 86],
        [38, 84],
      ])
        K.gull(gx, gy, 0.5, '#f4f4f0', 0.5)
    },
  },

  artist: {
    style: 'pixel',
    colors: 22,
    seed: 61,
    title: 'Pygmalion’s statue begins to breathe',
    draw(ctx, K) {
      K.sky(['#2a1a14', '#3a241a', '#4a2e1e', '#2a1a12'], 0, 125)
      K.rect(0, 100, 100, 25, '#3a2516')
      for (let i = 0; i < 7; i++)
        K.line(
          [
            [0, 100 + i * i * 0.6],
            [100, 100 + i * i * 0.6],
          ],
          '#2a190f',
          0.4,
        )
      // the window, the light through it, a dove in the light
      K.rect(8, 14, 20, 34, '#1a100a')
      K.shape((c) => {
        c.moveTo(10, 48)
        c.lineTo(10, 24)
        c.arc(18, 24, 8, Math.PI, 0)
        c.lineTo(26, 48)
        c.closePath()
      }, '#9fc4e0')
      K.rect(17.4, 16, 1.2, 32, '#1a100a')
      K.rect(10, 31, 16, 1.2, '#1a100a')
      K.glow(18, 30, 26, '#b8d8f0', 0.35)
      // the workshop: a shelf of studies, a curtain
      K.rect(36, 26, 26, 1.4, '#5a3a22')
      for (const [x, h] of [
        [38, 5],
        [44, 7],
        [50, 4.6],
        [56, 6],
      ]) {
        K.rect(x, 26 - 1.4, 3, 1.4, '#8a8478')
        K.oval(x + 1.5, 26 - h * 0.6, 1.4, h * 0.45, 0, '#a8a296')
        K.disc(x + 1.5, 26 - h, 1.1, '#b0aa9e')
      }
      for (let i = 0; i < 6; i++) K.rect(86 + i * 2.4, 0, 2.4, 100, i % 2 ? '#5a1e1e' : '#6e2626')
      K.layer(
        (L) =>
          L.poly(
            [
              [10, 22],
              [26, 18],
              [94, 98],
              [48, 110],
            ],
            'rgba(255,236,200,0.55)',
          ),
        { blur: 3, mode: 'lighter', alpha: 0.6 },
      )
      K.bird(34, 40, 1.1, '#f6f0e4', 1, 0.8)
      // the pedestal and the statue: marble below, warming above
      K.rect(54, 94, 26, 12, '#cfd2da')
      K.rect(52, 92, 30, 3, '#e4e6ec')
      K.rect(54, 104, 26, 2, '#a4a8b4')
      const pose = { x: 67, y: 70, s: 1.1, dir: -1, torso: -6, head: -22, legL: [-6, 0], legR: [8, -4], armL: [-34, -150], armR: [16, 4], hair: '#d8d6dc', hairLen: 1.6 }
      const drape = (L, col) =>
        L.blob(
          [
            [61.4, 72],
            [72.6, 70.4],
            [74, 80],
            [73, 92.4],
            [60, 92.4],
            [60.6, 82],
          ],
          col,
        )
      K.body({ ...pose, col: '#e2e4ea' })
      drape(K, '#eceef3')
      K.layer((L) => {
        L.body({ ...pose, col: '#f2b896', hair: '#6a2e1a' })
        drape(L, '#eceef3')
        L.ctx.globalCompositeOperation = 'destination-in'
        L.rect(0, 0, 100, 125, L.lin(0, 52, 0, 84, ['rgba(0,0,0,1)', 'rgba(0,0,0,0)']))
      })
      for (let i = 0; i < 4; i++)
        K.curve(
          [
            [62 + i * 3, 73],
            [61.6 + i * 3.2, 82],
            [62 + i * 3, 92],
          ],
          '#c4c8d2',
          0.4,
        )
      K.glow(65, 56, 14, '#ff9a7a', 0.22)
      // Pygmalion on his knees, his tools dropped
      const P = K.body({
        x: 38,
        y: 89,
        s: 1.14,
        dir: 1,
        torso: 8,
        head: -26,
        col: '#d0946a',
        legL: [96, 0],
        legR: [80, 2],
        armL: [120, 170],
        armR: [130, 180],
        back: ['armL'],
        robe: { col: '#2f4a7a', knees: true, hem: 3, y: 100 },
        beard: true,
        beardCol: '#3a2214',
        hair: '#3a2214',
      })
      K.glow(P.hd[0], P.hd[1], 8, '#ffd8a8', 0.2)
      K.limb([22, 105], [30, 104], 0.8, 0.8, '#9a9fa9')
      K.limb([28, 107.6], [33, 103], 1.4, 1, '#6a4a2a')
      for (let i = 0; i < 18; i++) K.disc(46 + K.R() * 40, 104 + K.R() * 8, 0.3 + K.R() * 0.5, '#d8dae2')
    },
  },

  musician: {
    style: 'mosaic',
    seed: 71,
    tiles: 62,
    colors: 16,
    grout: '#50473c',
    title: 'Orpheus plays, and the animals come to listen',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#2a1d18')
      K.rect(2.4, 2.4, 95.2, 120.2, '#eadfc6')
      // a guilloche border: two bands plaited round each other
      const plait = (x0, y0, x1, y1) => {
        const horiz = y0 === y1
        const len = horiz ? x1 - x0 : y1 - y0
        for (const [ph, col] of [
          [0, '#9a2c20'],
          [Math.PI, '#c98a2c'],
        ]) {
          const pts = []
          for (let t = 0; t <= len; t += 0.8) {
            const o = Math.sin((t / 6) * Math.PI * 2 + ph) * 2
            pts.push(horiz ? [x0 + t, y0 + o] : [x0 + o, y0 + t])
          }
          K.line(pts, '#2a1d18', 2.2)
          K.line(pts, col, 1.3)
        }
      }
      plait(3, 6, 97, 6)
      plait(3, 119, 97, 119)
      plait(6, 9, 6, 116)
      plait(94, 9, 94, 116)
      K.rect(9.6, 9.6, 80.8, 105.8, '#2a1d18')
      K.rect(10.4, 10.4, 79.2, 104.2, '#efe6cf')
      ctx.save()
      ctx.beginPath()
      ctx.rect(10.4, 10.4, 79.2, 104.2)
      ctx.clip()
      ctx.translate(50, 114)
      ctx.scale(1.06, 1.06)
      ctx.translate(-50, -114)
      // the ground, two trees, birds in them
      K.ridge(100, 1.4, '#a8a070', { x0: 10, x1: 90, freq: 0.1, y1: 114.6 })
      K.ridge(106, 1, '#8a8a5a', { x0: 10, x1: 90, freq: 0.14, y1: 114.6 })
      for (const [tx, d] of [
        [18, 1],
        [82, -1],
      ]) {
        K.limb([tx, 104], [tx + d * 2, 56], 3.4, 2, '#6a4a2e')
        K.limb([tx + d * 1.4, 72], [tx + d * 9, 60], 1.6, 0.8, '#6a4a2e')
        for (const [cx, cy, r] of [
          [tx + d * 2, 48, 8],
          [tx + d * 7, 54, 6],
          [tx - d * 3, 56, 5.4],
        ])
          K.disc(cx, cy, r, '#4f7a3a')
        for (let i = 0; i < 6; i++) K.disc(tx + d * (K.R() * 10 - 3), 44 + K.R() * 16, 1, '#7aa04a')
      }
      K.bird(20, 41, 1.1, '#3a5f8a', 1, 0.2)
      K.disc(20, 41, 0.5, '#3a5f8a')
      K.ribbon(
        [
          [18, 41.6],
          [12.6, 46],
          [10.6, 52],
        ],
        (t) => 2.4 * (1 - t * 0.5),
        '#2f6f6a',
      )
      for (let i = 0; i < 4; i++) K.disc(12 + i * 0.8, 47 + i * 1.6, 0.6, '#d9a640')
      K.bird(80, 46, 1, '#b05a3a', -1, 0.1)
      K.bird(70, 24, 1, '#5a5048', -1, 0.9)
      K.bird(28, 22, 0.9, '#7a6a5a', 1, 1)
      // Orpheus, seated, in his Phrygian cap, the lyre on his knee
      K.blob(
        [
          [38, 98],
          [40, 86],
          [50, 83],
          [62, 86],
          [64, 98],
        ],
        '#8a8070',
      )
      K.ribbon(
        [
          [45, 64],
          [40, 76],
          [37, 90],
          [40, 97],
        ],
        (t) => 6 + t * 4,
        '#a8322a',
      )
      K.limb([45.6, 84], [43, 96], 3, 2.2, '#3f5f8a')
      K.limb([54.4, 84], [57, 96], 3, 2.2, '#3f5f8a')
      K.oval(42.4, 97, 2, 1, 0, '#5a3a2a')
      K.oval(57.6, 97, 2, 1, 0, '#5a3a2a')
      K.blob(
        [
          [44, 64.6],
          [56, 64.6],
          [57.6, 84],
          [42.4, 84],
        ],
        '#3f7f78',
      )
      K.rect(43, 75, 14, 1.2, '#c98a2c')
      K.blob(
        [
          [43.4, 80],
          [56.6, 80],
          [58, 87],
          [42, 87],
        ],
        '#356c66',
      )
      K.limb([44.6, 66], [41, 74], 2.6, 2.2, '#3f7f78')
      K.limb([41, 74], [49.6, 77], 2.2, 1.8, '#e0ad86')
      K.disc(50, 61.6, 1.6, '#e0ad86')
      K.oval(50, 58.6, 3.3, 3.9, 0, '#e3b08a')
      K.disc(47, 58.6, 1.2, '#4a2a1c')
      K.disc(53, 58.6, 1.2, '#4a2a1c')
      K.blob(
        [
          [46.4, 56.4],
          [47.6, 52.4],
          [51, 50.6],
          [54.6, 51.6],
          [56.4, 49.6],
          [55.4, 55.4],
          [53.6, 56.2],
        ],
        '#b8402a',
      )
      K.disc(48.6, 58.6, 0.45, '#2a1d18')
      K.disc(51.4, 58.6, 0.45, '#2a1d18')
      K.line(
        [
          [49.2, 61],
          [50.8, 61],
        ],
        '#9a4a3a',
        0.4,
      )
      // the lyre: a tortoise-shell box, two horns, the strings
      K.oval(59, 80, 3.6, 2.6, 0, '#b8862e')
      K.curve(
        [
          [56.6, 79],
          [55.4, 72],
          [57, 66],
        ],
        '#d9a640',
        1.3,
      )
      K.curve(
        [
          [61.4, 79],
          [62.6, 72],
          [61, 66],
        ],
        '#d9a640',
        1.3,
      )
      K.line(
        [
          [56.4, 67.4],
          [61.6, 67.4],
        ],
        '#8a5a20',
        1,
      )
      for (let i = 0; i < 4; i++)
        K.line(
          [
            [57.6 + i, 67.6],
            [57.6 + i, 79],
          ],
          '#f2e6c8',
          0.3,
        )
      K.limb([55.4, 66], [60, 72], 2.6, 2.2, '#3f7f78')
      K.limb([60, 72], [59, 68], 2, 1.6, '#e0ad86')
      // the listeners: a lion, a stag, a tortoise, a snake on the rock
      K.beast({ kind: 'lion', x: 25, y: 108, s: 1.06, dir: 1, col: '#c48a3a', mane: '#8a4a1e', neck: -10 })
      K.beast({ kind: 'deer', x: 77, y: 108, s: 1.02, dir: -1, col: '#a8683a', antlerCol: '#6a3a1e', neck: 4 })
      K.oval(50, 108, 4, 2.2, 0, '#5a6a3a')
      K.disc(54.6, 108.6, 1, '#7a8a4a')
      for (let i = 0; i < 3; i++) K.disc(48 + i * 2, 107.4, 0.6, '#3a4a2a')
      K.serpent(
        [
          [63, 86],
          [66, 90],
          [62, 93],
          [66, 97],
        ],
        1.1,
        '#4a7a3a',
      )
      ctx.restore()
    },
  },

  storyteller: {
    style: 'pixel',
    colors: 22,
    seed: 81,
    title: 'Scheherazade, one more night',
    draw(ctx, K) {
      K.rect(0, 0, 100, 125, '#1f1d38')
      for (let y = 0; y < 96; y += 6)
        for (let x = (y / 6) % 2 ? 3 : 0; x < 100; x += 6)
          K.poly(
            [
              [x + 3, y],
              [x + 6, y + 3],
              [x + 3, y + 6],
              [x, y + 3],
            ],
            '#26244a',
          )
      // the window: a horseshoe arch on the night
      const win = (c) => {
        c.moveTo(37, 66)
        c.lineTo(37, 30)
        c.arc(50, 28, 14, Math.PI * 0.92, Math.PI * 0.08)
        c.lineTo(63, 66)
        c.closePath()
      }
      K.layer((L) => {
        L.shape(win, '#0c1236')
        L.ctx.save()
        L.ctx.beginPath()
        win(L.ctx)
        L.ctx.clip()
        L.sky(['#070b26', '#14205a', '#2c3a7a'], 12, 66)
        L.stars(40, [36, 12, 28, 40], '#fff4d0', 0.3)
        L.moon(55, 23, 3.2, '#fff2c0', 0.55, -150)
        L.glow(55, 23, 10, '#bfc8ff', 0.25)
        for (const [x, w, h, dome] of [
          [36, 6, 10, 1],
          [42, 4, 6, 0],
          [46, 7, 12, 1],
          [53, 3, 16, 0],
          [56, 8, 9, 1],
          [60, 5, 7, 0],
        ]) {
          L.rect(x, 66 - h, w, h, '#0a0e2a')
          if (dome) L.disc(x + w / 2, 66 - h, w / 2, '#0a0e2a')
          else
            L.poly(
              [
                [x, 66 - h],
                [x + w / 2, 66 - h - 3],
                [x + w, 66 - h],
              ],
              '#0a0e2a',
            )
        }
        L.ctx.restore()
      })
      K.ctx.lineWidth = 1.6
      K.ctx.strokeStyle = '#a8743a'
      K.ctx.beginPath()
      win(K.ctx)
      K.ctx.stroke()
      // the story on the wall: a ship and a great bird, thrown by the lamp
      K.glow(30, 50, 34, '#ffb060', 0.2)
      K.layer(
        (L) => {
          L.blob(
            [
              [8, 52],
              [26, 52],
              [23, 57],
              [11, 57],
            ],
            '#000',
          )
          L.limb([17, 52], [17, 36], 0.8, 0.6, '#000')
          L.poly(
            [
              [17.6, 37],
              [25, 44],
              [17.6, 50],
            ],
            '#000',
          )
          L.poly(
            [
              [16.4, 38],
              [10, 48],
              [16.4, 49],
            ],
            '#000',
          )
          L.bird(30, 32, 2.2, '#000', -1, 1)
          for (let i = 0; i < 4; i++)
            L.curve(
              [
                [4 + i * 7, 59],
                [7 + i * 7, 57.6],
                [10 + i * 7, 59],
              ],
              '#000',
              0.9,
            )
        },
        { alpha: 0.62, blur: 0.5 },
      )
      // the rug
      K.rect(0, 94, 100, 31, '#7a1a22')
      K.rect(0, 96, 100, 2, '#c8902e')
      K.rect(0, 121, 100, 2, '#c8902e')
      for (let x = 4; x < 100; x += 8)
        K.poly(
          [
            [x, 103],
            [x + 4, 108],
            [x, 113],
            [x - 4, 108],
          ],
          '#22305e',
        )
      for (let x = 4; x < 100; x += 8) K.disc(x, 108, 1, '#e0b048')
      // the king, reclining on his cushions, listening
      K.oval(78, 88, 10, 5, -10, '#2f5a3a')
      K.oval(66, 92, 14, 3.6, 0, '#8a2a2e')
      const king = K.body({
        x: 72,
        y: 90,
        s: 1.1,
        dir: -1,
        torso: 58,
        head: 24,
        col: '#b97a52',
        legL: [100, 90],
        legR: [96, 94],
        armL: [-70, -30],
        armR: [14, 178],
        back: ['armR'],
        robe: { col: '#9a2224', knees: true, hem: 3, y: 93 },
        beard: true,
        beardCol: '#1a1010',
      })
      K.blob(
        [
          [king.hd[0] - 3, king.hd[1] - 0.6],
          [king.hd[0] - 2, king.hd[1] - 4.4],
          [king.hd[0] + 2, king.hd[1] - 4.6],
          [king.hd[0] + 3.2, king.hd[1] - 0.8],
        ],
        '#f0e6d2',
      )
      K.disc(king.hd[0] - 0.2, king.hd[1] - 3.2, 0.6, '#d03a3a')
      // Scheherazade, mid-sentence
      K.oval(22, 96, 11, 3.6, 0, '#c8902e')
      const sh = K.body({ x: 22, y: 92, s: 1.04, dir: 1, torso: 4, head: 6, col: '#c08458', legL: [86, -84], legR: [92, -86], armL: [24, 70], armR: [50, 150], back: ['armL'], robe: { col: '#24357a', knees: true, hem: 4, y: 96 } })
      K.blob(
        [
          [sh.hd[0] - 3.4, sh.hd[1] + 5],
          [sh.hd[0] - 3, sh.hd[1] - 2.4],
          [sh.hd[0] - 0.6, sh.hd[1] - 3.4],
          [sh.hd[0] + 2.2, sh.hd[1] - 2.2],
          [sh.hd[0] + 0.8, sh.hd[1] - 1],
          [sh.hd[0] - 1, sh.hd[1] + 6],
        ],
        '#b83242',
      )
      K.line(
        [
          [sh.sl[0], sh.sl[1] + 1],
          [sh.sr[0], sh.sr[1] + 1],
        ],
        '#e0b048',
        0.6,
      )
      // the lamp between them
      K.blob(
        [
          [46, 95],
          [54, 95],
          [56, 93],
          [44, 93],
        ],
        '#b8862e',
      )
      K.oval(50, 92.6, 4, 1.4, 0, '#d9a640')
      K.glow(51.6, 88, 60, '#ff9a3a', 0.32)
      K.glow(51.6, 88, 14, '#ffc46a', 0.5)
      K.blob(
        [
          [50.8, 91.6],
          [51.2, 88.6],
          [52, 85.4],
          [52.6, 88.6],
          [52.6, 91.6],
        ],
        '#ffdd8a',
      )
      K.blob(
        [
          [51.4, 91.4],
          [51.8, 89.2],
          [52.1, 88],
          [52.3, 90],
          [52.2, 91.4],
        ],
        '#fff6d8',
      )
    },
  },
}
