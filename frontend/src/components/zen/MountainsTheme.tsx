import { useId } from 'react'

// Broad wooded shoulders, not rocky sawtooth peaks. Shared with the thumbnail.
const RIDGES = [
  'M-40 293C45 295 91 266 139 249S207 201 257 214S323 257 391 250S467 228 523 250S611 282 679 254S761 208 817 213S890 243 951 248S1070 270 1124 253S1196 230 1240 241V460H-40Z',
  'M-40 340C34 327 92 310 135 278S184 244 217 261S263 300 316 315C385 342 432 321 480 308S563 307 627 329C709 351 742 302 788 277S846 242 879 258S932 305 979 313S1084 290 1126 304S1205 329 1240 316V460H-40Z',
  'M-40 383C29 371 66 328 105 310S162 291 193 309S240 352 284 365C354 386 399 367 451 374S546 403 601 382C664 361 689 328 727 332S791 376 849 383C918 391 964 344 1008 347S1083 380 1137 371S1205 356 1240 373V460H-40Z',
  'M-40 405 Q61 354 155 386 T325 401 Q415 382 467 405 T643 420 Q747 376 821 401 T1001 389 Q1104 365 1240 390 V460 H-40Z',
]

function MountainLandscape() {
  const id = useId().replace(/:/g, '')
  return <svg viewBox="0 0 1200 460" preserveAspectRatio="none" className="mountain-landscape">
    <defs>{['#b7c5be', '#92aaa0', '#648578', '#45675d'].map((color, i) => (
      <linearGradient key={color} id={`${id}-ridge-${i}`} x2="0" y2="1">
        <stop stopColor={color} /><stop offset="1" stopColor={['#e2e5d9', '#d0d9cd', '#a3b8aa', '#819d8d'][i]} />
      </linearGradient>
    ))}</defs>
    {RIDGES.map((d, i) => <path key={d} d={d} fill={`url(#${id}-ridge-${i})`} />)}
  </svg>
}

function Birds() {
  return <div className="mountain-flock" style={{ animationDelay: '-7s' }}>{[0, 1, 2, 3, 4].map(i => (
    <svg key={i} viewBox="0 0 24 12" style={{ left: Math.abs(i - 2) * 19, top: i * 10, animationDelay: `${-i * .19}s` }}>
      <path d="M1 8Q6 1 12 7Q18 2 23 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ))}</div>
}

export function MountainsTheme() {
  return <div aria-hidden className="theme-scene mountains-scene">
    <MountainLandscape /><div className="mountain-mist mountain-mist-far" /><div className="mountain-mist mountain-mist-near" /><Birds />
  </div>
}

export function MountainsPreview() {
  return <div className="theme-scene theme-preview mountains-scene"><MountainLandscape /></div>
}
