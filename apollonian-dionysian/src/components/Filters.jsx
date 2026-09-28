// Shared SVG filters. The warp is what Dionysian type is seen through: a slow, breathing displacement.
export default function Filters() {
  return (
    <svg className="sr-filters" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="warp" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.018" numOctaves="2" seed="4" result="n">
            <animate attributeName="baseFrequency" dur="14s" values="0.008 0.018;0.012 0.026;0.008 0.018" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="warp-soft" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.03" numOctaves="1" seed="9" result="n">
            <animate attributeName="baseFrequency" dur="9s" values="0.01 0.03;0.016 0.022;0.01 0.03" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
