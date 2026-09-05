import { useId } from 'react'

// Keep the persisted `rainbow` identity; the visual direction is now "After rain".
function RefractedLight() {
  const id = useId().replace(/:/g, '')
  return <svg className="after-rain-light" viewBox="0 0 1200 800" preserveAspectRatio="none">
    <defs>
      <linearGradient id={`${id}-cool`}>
        <stop stopColor="#b0d6df" stopOpacity="0" /><stop offset=".34" stopColor="#9fced4" stopOpacity=".72" />
        <stop offset=".65" stopColor="#fafff7" stopOpacity=".95" /><stop offset=".83" stopColor="#acd0e6" stopOpacity=".65" /><stop offset="1" stopColor="#b6d9e8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-warm`}>
        <stop stopColor="#e2eccc" stopOpacity="0" /><stop offset=".4" stopColor="#f1e4c8" stopOpacity=".6" />
        <stop offset=".67" stopColor="#fffdf4" stopOpacity=".9" /><stop offset=".85" stopColor="#d1e8e5" stopOpacity=".55" /><stop offset="1" stopColor="#c9e2e8" stopOpacity="0" />
      </linearGradient>
    </defs>
    <g className="after-rain-ribbon after-rain-ribbon-cool">
      <path d="M-170 850C176 569 -10 284 247 -100L424 -100C159 281 363 602 78 850Z" fill={`url(#${id}-cool)`} />
      <path d="M-30 850C244 556 70 271 335 -100" fill="none" stroke="#fbfff8" strokeWidth="3" opacity=".5" />
    </g>
    <g className="after-rain-ribbon after-rain-ribbon-warm">
      <path d="M693 900C1105 628 1141 365 1246 165L1400 243C1168 626 1320 697 992 900Z" fill={`url(#${id}-warm)`} />
      <path d="M862 900C1200 629 1150 495 1320 258" fill="none" stroke="#fffef5" strokeWidth="4" opacity=".55" />
    </g>
  </svg>
}

export function RainbowTheme() {
  return <div aria-hidden className="theme-scene after-rain-scene">
    <RefractedLight /><div className="after-rain-sun" /><div className="after-rain-haze" />
  </div>
}

export function RainbowPreview() {
  return <div className="theme-scene theme-preview after-rain-scene"><RefractedLight /></div>
}
