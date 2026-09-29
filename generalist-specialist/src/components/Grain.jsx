// Film grain over everything: a tiled turbulence texture, re-positioned in steps so it flickers like stock.
const noise =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.1 -0.35'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>`,
  )

export default function Grain() {
  return <div className="grain" aria-hidden="true" style={{ backgroundImage: `url("${noise}")` }} />
}
