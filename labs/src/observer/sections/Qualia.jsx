import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead from '@shared/components/SectionHead.jsx'
import { Reveal } from '@shared/components/Text.jsx'
import { Claim, Claims } from '@shared/components/Claim.jsx'
import { useCanvas } from '@shared/lib/useCanvas.js'
import { pointer } from '@shared/lib/pointer.js'
import { approach, clamp } from '@shared/lib/math.js'
import { harsh, swell, thump, tone } from '@shared/lib/audio.js'

const EASE = [0.2, 0.7, 0.1, 1]

// index order is fixed by the shader
const PHEN = [
  {
    id: 'light',
    name: 'Light',
    what: 'A brightness gradient on an emitting screen. Nothing here was a source of light.',
  },
  {
    id: 'sound',
    name: 'Sound',
    what: 'Air pressure rising and falling a few hundred times a second. Pitch is how frequency appears to you.',
  },
  { id: 'motion', name: 'Motion', what: 'Sixty still frames a second. Nothing moved; the movement was inferred.' },
  {
    id: 'color',
    name: 'Colour',
    what: 'Three numbers driving three kinds of subpixel, read by three kinds of cone. Where is the violet?',
  },
  { id: 'warmth', name: 'Warmth', what: 'The temperature of your screen did not change.' },
  { id: 'pulse', name: 'Pulse', what: 'A curve repeating 64 times a minute. Your heart was not involved — or was it?' },
  { id: 'pain', name: 'Pain', what: 'No tissue was harmed. Pixels were displaced and a sound was distorted.' },
]
const POS_WIDE = [
  [0.13, 0.3],
  [0.4, 0.4],
  [0.62, 0.25],
  [0.77, 0.6],
  [0.25, 0.72],
  [0.52, 0.76],
  [0.88, 0.27],
]
const POS_TALL = [
  [0.27, 0.12],
  [0.3, 0.38],
  [0.72, 0.5],
  [0.7, 0.76],
  [0.72, 0.25],
  [0.3, 0.63],
  [0.32, 0.88],
]

const LINES = [
  'You experienced something.',
  'What exactly did you experience?',
  'Was the experience in the object…',
  '…or in your mind’s representation of the object?',
]

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uLantern;
uniform vec2 uP[7];
uniform float uA[7];
uniform float uScale;
uniform float uDir;
uniform float uFlash;
uniform float uRing;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float cracks(vec2 p){
  vec2 n = floor(p); vec2 f = fract(p); float F1 = 8.0; float F2 = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)); vec2 r = g + hash2(n + g) - f; float d = dot(r, r);
    if (d < F1){ F2 = F1; F1 = d; } else if (d < F2){ F2 = d; }
  }
  return sqrt(F2) - sqrt(F1);
}
vec3 hsv(float h, float s, float v){ vec3 k = vec3(1.0, 2.0 / 3.0, 1.0 / 3.0); vec3 p = abs(fract(vec3(h) + k) * 6.0 - 3.0); return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s); }

void main(){
  vec2 frag = gl_FragCoord.xy;
  float S = uScale;
  float pain = uA[6];
  float dp = length(frag - uP[6]) / S;
  // pain tears the space around it
  if (pain > 0.01){
    float tf = floor(uTime * 24.0);
    float band = step(0.55, hash(vec2(floor(frag.y / (4.0 + 18.0 * hash(vec2(tf, 2.0)))), tf)));
    float tear = pain * exp(-dp * dp * 9.0);
    frag.x += tear * band * (hash(vec2(floor(frag.y / 3.0), tf)) - 0.5) * 120.0;
    frag.y += tear * (hash(vec2(tf, 7.0)) - 0.5) * 14.0;
  }
  vec2 uv = frag / S;
  vec3 col = vec3(0.01);

  float fog = fbm(uv * 2.4 + vec2(uTime * 0.02, -uTime * 0.013));
  float dm = length(frag - uMouse) / S;
  float lantern = exp(-dm * dm * 9.0) * uLantern;
  col += vec3(0.9, 0.88, 0.84) * fog * (0.016 + lantern * 0.08);

  // 0 light
  {
    float d = length(frag - uP[0]) / S; float a = uA[0];
    float glow = 0.0035 / (d * d + 0.0025);
    float ang = atan(frag.y - uP[0].y, frag.x - uP[0].x);
    float rays = pow(abs(cos(ang * 5.0 + uTime * 0.15)), 40.0) * exp(-d * 4.0) * a;
    col += vec3(1.0, 0.985, 0.95) * (glow * (0.05 + 0.75 * a) + rays * 0.6);
  }
  // 1 sound: pressure rings
  {
    float d = length(frag - uP[1]) / S; float a = uA[1] + uRing * 0.6;
    float w = 0.5 + 0.5 * sin(d * 95.0 - uTime * 11.0);
    float ring = pow(w, 10.0) * exp(-d * 6.5);
    col += vec3(0.84, 0.88, 0.92) * ring * (0.05 + 0.75 * a);
  }
  // 2 motion: streams along the direction of travel
  {
    vec2 q = (frag - uP[2]) / S;
    float c = cos(uDir); float s = sin(uDir);
    vec2 r = vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
    float a = uA[2];
    float n = noise(vec2(r.x * 7.0 - uTime * (1.5 + 9.0 * a), r.y * 70.0));
    float streak = smoothstep(0.62, 1.0, n) * exp(-dot(q, q) * 16.0);
    col += vec3(0.92) * streak * (0.06 + 0.9 * a);
  }
  // 3 colour: the only saturated thing in the laboratory
  {
    float d = length(frag - uP[3]) / S; float a = uA[3];
    float edge = d + (fbm(uv * 3.0 + uTime * 0.06) - 0.5) * 0.14;
    float m = smoothstep(0.26, 0.0, edge);
    vec3 hue = hsv(0.735 + 0.035 * sin(uTime * 0.3), 0.92, 1.0);
    col += hue * m * (0.035 + 0.95 * a) + hue * exp(-d * d * 40.0) * 0.05;
  }
  // 4 warmth
  {
    float d = length(frag - uP[4]) / S; float a = uA[4];
    float m = exp(-d * d * 5.0) * (0.92 + 0.08 * sin(uTime * 0.7));
    col += vec3(1.0, 0.6, 0.3) * m * (0.025 + 0.5 * a);
  }
  // 5 pulse, 64 per minute
  {
    float d = length(frag - uP[5]) / S; float a = uA[5];
    float beat = fract(uTime * 64.0 / 60.0);
    float env = exp(-beat * 9.0) + 0.55 * exp(-max(0.0, beat - 0.2) * 11.0) * step(0.2, beat);
    float disc = smoothstep(0.06 + env * 0.03, 0.0, d);
    float ring = exp(-pow((d - beat * 0.3) * 28.0, 2.0)) * (1.0 - beat);
    col += vec3(0.96, 0.9, 0.88) * (disc * (0.1 + env) * 0.55 + ring * 0.35) * (0.08 + 0.92 * a);
  }
  // 6 pain
  {
    float hint = exp(-dp * dp * 220.0) * (0.25 + 0.75 * step(0.85, hash(vec2(floor(uTime * 14.0), 3.0))));
    col += vec3(1.0, 0.35, 0.25) * hint * 0.35;
    if (pain > 0.01){
      float edge = smoothstep(0.08, 0.0, cracks(uv * 9.0 + vec2(0.0, uTime * 0.2)));
      float m = exp(-dp * dp * 10.0) * pain;
      float flick = step(0.5, hash(vec2(floor(uTime * 30.0), 1.0)));
      col += mix(vec3(1.0, 0.22, 0.1), vec3(1.0), flick * 0.6) * edge * m * 1.4;
      col += vec3(1.0, 0.16, 0.06) * exp(-dp * dp * 30.0) * pain * 0.4;
    }
  }
  col += vec3(0.2, 0.02, 0.01) * uFlash;
  vec2 c = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(c, c) * 0.9;
  col = 1.0 - exp(-col * 1.5);
  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(sh))
    return null
  }
  return sh
}

export default function Qualia() {
  const canvasRef = useRef(null)
  const [found, setFound] = useState(0)
  const [noGL, setNoGL] = useState(false)
  const [line, setLine] = useState(-1)
  const [reveal, setReveal] = useState(false)
  const [tall, setTall] = useState(false)
  const live = useRef({ found: new Set(), onFound: null, started: 0 })
  live.current.onFound = setFound

  useCanvas(
    canvasRef,
    (gl, s, canvas) => {
      if (!gl) {
        setNoGL(true)
        return {}
      }
      const vs = compile(gl, gl.VERTEX_SHADER, VERT)
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
      if (!vs || !fs) {
        setNoGL(true)
        return {}
      }
      const prog = gl.createProgram()
      gl.attachShader(prog, vs)
      gl.attachShader(prog, fs)
      gl.linkProgram(prog)
      gl.useProgram(prog)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const U = (n) => gl.getUniformLocation(prog, n)
      const u = {
        res: U('uRes'),
        time: U('uTime'),
        mouse: U('uMouse'),
        lantern: U('uLantern'),
        P: U('uP'),
        A: U('uA'),
        scale: U('uScale'),
        dir: U('uDir'),
        flash: U('uFlash'),
        ring: U('uRing'),
      }
      const A = new Float32Array(7)
      const P = new Float32Array(14)
      let dir = 0
      let lantern = 0
      let flash = 0
      let ring = 0
      let lastNote = { x: 0, y: 0 }
      let nextBeat = 0
      let painOn = false
      let painNext = 0
      let warmCued = false
      const notes = [220, 246.9, 293.7, 329.6, 392, 440, 493.9, 587.3]
      return {
        resize(w, h) {
          gl.viewport(0, 0, canvas.width, canvas.height)
          setTall(h > w * 1.05)
        },
        frame(dt) {
          const { w, h, t, dpr } = s
          const pos = h > w * 1.05 ? POS_TALL : POS_WIDE
          const m = Math.min(w, h)
          const st = live.current
          const inside = s.inside
          lantern = approach(lantern, inside ? 1 : 0, 3, dt)
          const speed = inside ? pointer.speed : 0
          if (inside && speed > 60) dir = Math.atan2(-pointer.vy, pointer.vx)
          if (inside && !st.started) st.started = t

          for (let i = 0; i < 7; i++) {
            const px = pos[i][0] * w
            const py = pos[i][1] * h
            P[i * 2] = px * dpr
            P[i * 2 + 1] = (h - py) * dpr
            const d = Math.hypot(s.mx - px, s.my - py)
            const q = inside ? Math.exp(-((d / (m * 0.12)) ** 2)) : 0
            let a = A[i]
            switch (i) {
              case 0:
                a = approach(a, q * (pointer.down ? 1 : 0.8), 3, dt)
                if (q > 0.5 && pointer.down && Math.random() < dt * 2) tone(1760, { dur: 1.6, gain: 0.008 })
                break
              case 1: {
                a = approach(a, q * clamp(speed / 500), q * speed > 50 ? 6 : 1.2, dt)
                const moved = Math.hypot(s.mx - lastNote.x, s.my - lastNote.y)
                if (q > 0.3 && moved > 46) {
                  lastNote = { x: s.mx, y: s.my }
                  const ang = Math.atan2(s.my - py, s.mx - px)
                  const n = notes[Math.floor(((ang + Math.PI) / (Math.PI * 2)) * notes.length) % notes.length]
                  tone(n, { dur: 1.8, gain: 0.045 * q, pan: (s.mx / w) * 2 - 1 })
                  ring = 1
                }
                break
              }
              case 2:
                a = approach(a, q * (0.3 + clamp(speed / 900)), 3, dt)
                break
              case 3:
                a = clamp(a + dt * q * 0.42 - dt * 0.05)
                break
              case 4:
                a = clamp(a + dt * q * 0.38 - dt * 0.07)
                if (a > 0.45 && !warmCued) {
                  warmCued = true
                  swell([110, 164.8, 220, 277.2], 0.03, 4.5)
                }
                if (a < 0.2) warmCued = false
                break
              case 5: {
                a = approach(a, q, 2, dt)
                const beat = (t * 64) / 60
                if (beat >= nextBeat) {
                  nextBeat = Math.floor(beat) + 1
                  if (a > 0.2) {
                    thump(0.16 * a)
                    setTimeout(() => thump(0.09 * a), 190)
                  }
                }
                break
              }
              case 6: {
                const on = q > 0.3 && pointer.down
                a = approach(a, on ? 1 : 0, on ? 9 : 2.4, dt)
                if (on && !painOn) {
                  flash = 1
                  harsh(0.06, 0.32)
                  painNext = t + 0.4
                }
                if (on && t > painNext) {
                  harsh(0.04 * a, 0.3)
                  painNext = t + 0.38
                }
                painOn = on
                break
              }
            }
            A[i] = a
            if (a > 0.45 && !st.found.has(i)) {
              st.found.add(i)
              st.onFound(st.found.size)
            }
          }
          flash = approach(flash, 0, 6, dt)
          ring = approach(ring, 0, 2.5, dt)
          canvas.style.transform =
            A[6] > 0.05
              ? `translate(${((Math.random() - 0.5) * 6 * A[6]).toFixed(1)}px, ${((Math.random() - 0.5) * 4 * A[6]).toFixed(1)}px)`
              : ''

          gl.uniform2f(u.res, canvas.width, canvas.height)
          gl.uniform1f(u.time, t)
          gl.uniform2f(u.mouse, s.mx * dpr, (h - s.my) * dpr)
          gl.uniform1f(u.lantern, lantern)
          gl.uniform2fv(u.P, P)
          gl.uniform1fv(u.A, A)
          gl.uniform1f(u.scale, m * dpr)
          gl.uniform1f(u.dir, dir)
          gl.uniform1f(u.flash, flash)
          gl.uniform1f(u.ring, ring)
          gl.drawArrays(gl.TRIANGLES, 0, 3)
        },
      }
    },
    { context: 'webgl', maxDpr: () => (innerWidth * innerHeight > 1.3e6 ? 1 : 1.5) },
  )

  // after enough has been felt, the questions arrive one at a time
  useEffect(() => {
    if (line >= 0 || found < 4) return
    setLine(0)
  }, [found, line])
  useEffect(() => {
    if (line < 0) return
    if (line < LINES.length - 1) {
      const id = setTimeout(() => setLine(line + 1), 3400)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setReveal(true), 3800)
    return () => clearTimeout(id)
  }, [line])
  // a patient visitor who has found a few is not kept waiting forever
  useEffect(() => {
    if (found < 2 || line >= 0) return
    const id = setTimeout(() => setLine((l) => (l < 0 ? 0 : l)), 40000)
    return () => clearTimeout(id)
  }, [found, line])

  const pos = tall ? POS_TALL : POS_WIDE

  return (
    <section id="qualia" className="qualia" data-section>
      <div className="sec qualia__intro">
        <SectionHead n="05" title="The Qualia Chamber" motif="Unlabelled phenomena" />
        <div className="grid12">
          <Reveal className="qualia__lede">
            <p className="whisper">Enter the dark. Nothing in here is labelled.</p>
            <p className="mono mono--dim" style={{ marginTop: 14 }}>
              Move · press · hold · stay
            </p>
          </Reveal>
        </div>
      </div>

      <div className="qualia__chamber">
        {noGL ? (
          <div className="qualia__nogl mono mono--dim">
            This chamber needs WebGL, which this browser has not provided.
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label="A dark chamber containing seven unlabelled phenomena that respond to movement, pressing and staying still."
          />
        )}
        <div className="qualia__found mono mono--dim" aria-label={`${found} of 7 phenomena encountered`}>
          {PHEN.map((p, i) => (
            <i key={p.id} className={i < found ? 'is-on' : ''} />
          ))}
        </div>
        <div className={`qualia__lines ${reveal ? 'is-revealed' : ''}`} aria-live="polite">
          <AnimatePresence mode="wait">
            {line >= 0 && (
              <motion.p
                key={line}
                className={`qualia__line ${line === LINES.length - 1 ? 'is-last' : ''}`}
                initial={{ opacity: 0, filter: 'blur(14px)', y: 8 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                {LINES[line]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {reveal &&
            PHEN.map((p, i) => (
              <motion.div
                key={p.id}
                className={`qualia__label ${pos[i][0] > 0.6 ? 'is-left' : ''}`}
                style={{ left: `${pos[i][0] * 100}%`, top: `${pos[i][1] * 100}%` }}
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, delay: 0.25 * i, ease: EASE }}
              >
                <span className="mono mono--ink">{p.name}</span>
                <span className="qualia__what">{p.what}</span>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <div className="sec qualia__after">
        <Claims>
          <Claim kind="argument" cite="F. Jackson, Epiphenomenal Qualia (1982)">
            Mary knows every physical fact about colour but has lived in a black-and-white room. When she first sees
            red, does she learn something new? If so, the physical facts were not all the facts.
          </Claim>
          <Claim kind="argument" cite="After J. Locke, An Essay Concerning Human Understanding (1690)" delay={0.1}>
            Could your violet be my green, with every word and behaviour matching? If it could, no outside test would
            ever reveal the difference.
          </Claim>
          <Claim kind="empirical" cite="e.g. Lafer-Sousa, Hermann & Conway (2015)" delay={0.2}>
            In 2015 one photograph of a dress looked blue and black to some people and white and gold to others. The
            same pixels; different colours, depending on what each visual system assumed about the light.
          </Claim>
          <Claim kind="empirical" cite="e.g. Berthier, Starkstein & Leiguarda (1988)" delay={0.3}>
            Pain asymbolia: after certain brain lesions, people can recognise pain and describe it, yet are not bothered
            by it. The sensation and its awfulness can come apart.
          </Claim>
          <Claim kind="open" cite="D. Chalmers, Facing Up to the Problem of Consciousness (1995)" delay={0.4}>
            The hard problem: even a complete account of how the brain processes colour, sound and damage seems to leave
            a question over. Why is any of it felt?
          </Claim>
        </Claims>
      </div>
    </section>
  )
}
