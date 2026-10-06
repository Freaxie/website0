// One shared pointer for the whole experience. Canvases read it each frame;
// nothing here causes React to re-render.
export const pointer = {
  x: typeof innerWidth === 'number' ? innerWidth / 2 : 0,
  y: typeof innerHeight === 'number' ? innerHeight / 2 : 0,
  vx: 0,
  vy: 0,
  speed: 0, // smoothed, px/s
  down: false,
  moved: false, // has the pointer ever moved
  lastMove: 0,
  lastActivity: 0, // any sign of presence: moving, scrolling, typing, touching
  travel: 0, // total px travelled
  type: 'mouse',
  trail: [], // normalised [x, y] samples, for the mirror
}

let installed = false
let lastT = 0
let lastSample = 0

export function installPointer() {
  if (installed) return
  installed = true
  lastT = performance.now()
  pointer.lastMove = lastT
  pointer.lastActivity = lastT
  const alive = () => (pointer.lastActivity = performance.now())
  addEventListener('scroll', alive, { passive: true })
  addEventListener('keydown', alive)
  addEventListener('wheel', alive, { passive: true })
  const move = (e) => {
    const now = performance.now()
    const dt = Math.max(1, now - lastT) / 1000
    const dx = e.clientX - pointer.x
    const dy = e.clientY - pointer.y
    const d = Math.hypot(dx, dy)
    if (pointer.moved) pointer.travel += d
    pointer.vx = dx / dt
    pointer.vy = dy / dt
    const inst = d / dt
    pointer.speed += (Math.min(inst, 8000) - pointer.speed) * 0.18
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.moved = true
    pointer.lastMove = now
    pointer.lastActivity = now
    pointer.type = e.pointerType || 'mouse'
    lastT = now
    if (now - lastSample > 90) {
      lastSample = now
      pointer.trail.push([e.clientX / innerWidth, e.clientY / innerHeight])
      if (pointer.trail.length > 6000) pointer.trail.splice(0, 1000)
    }
  }
  addEventListener('pointermove', move, { passive: true })
  addEventListener(
    'pointerdown',
    (e) => {
      move(e)
      pointer.down = true
    },
    { passive: true },
  )
  const up = () => (pointer.down = false)
  addEventListener('pointerup', up, { passive: true })
  addEventListener('pointercancel', up, { passive: true })
  addEventListener('blur', up)
  // speed decays when the pointer rests
  setInterval(() => {
    if (performance.now() - pointer.lastMove > 120) pointer.speed *= 0.6
  }, 100)
}
