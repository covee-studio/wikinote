import type { CSSProperties } from 'react'

// Composed around the reading column instead of spawning over the text.
const POOLS = [
  { x: 14, y: 25, size: 270, delay: -2, duration: 6.8 },
  { x: 84, y: 70, size: 360, delay: -4.7, duration: 8.2 },
  { x: 27, y: 84, size: 320, delay: -6.1, duration: 7.5 },
  { x: 87, y: 19, size: 220, delay: -1.1, duration: 6.2 },
  { x: 7, y: 57, size: 190, delay: -3.5, duration: 8.5 },
]

function RipplePools() {
  return <>{POOLS.map((pool, i) => (
    <div className="ripple-pool" key={i} style={{
      left: `${pool.x}%`, top: `${pool.y}%`, width: `clamp(140px, ${pool.size / 12}vw, ${pool.size}px)`,
      '--ripple-duration': `${pool.duration}s`, '--ripple-delay': `${pool.delay}s`,
    } as CSSProperties}>
      {[0, 1, 2, 3].map(ring => <i key={ring} className="water-ring" style={{ animationDelay: `${pool.delay + ring * .48}s` }} />)}
      <span className="water-drop" />
    </div>
  ))}</>
}

export function RipplesTheme() {
  return <div aria-hidden className="theme-scene ripples-scene">
    <div className="water-light water-light-one" /><div className="water-light water-light-two" /><RipplePools />
  </div>
}

export function RipplesPreview() {
  return <div aria-hidden className="theme-scene theme-preview ripples-scene">
    <svg className="ripples-preview-art" viewBox="0 0 100 48" preserveAspectRatio="none">
      <path d="M7 31 C18 20 39 20 51 31" />
      <path d="M-4 37 C15 15 43 15 61 36" />
      <path d="M52 18 C64 8 86 9 102 23" />
      <path d="M61 25 C72 17 91 18 105 30" />
    </svg>
  </div>
}
