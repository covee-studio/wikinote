import type { CSSProperties } from 'react'
import { snowParticles } from './sceneGeometry'

const FLAKES = snowParticles(76)

function SnowLandscape() {
  return <svg className="snow-landscape" viewBox="0 0 1200 240" preserveAspectRatio="none">
    <path d="M0 135Q155 102 310 148T690 150T1200 117V240H0Z" fill="#d4dfe3" opacity=".55" />
    <path d="M0 172Q178 121 380 171T840 162T1200 173V240H0Z" fill="#eef2f1" />
    <path d="M0 207Q220 172 415 211T830 197T1200 202V240H0Z" fill="#f7f8f5" />
  </svg>
}

export function SnowTheme() {
  return <div aria-hidden className="theme-scene snow-scene">
    <div className="snow-light" /><SnowLandscape />
    <div className="snow-flurries">{FLAKES.map((f, i) => (
      <span key={i} className={`snow-track snow-depth-${f.depth}`} style={{
        left: `${f.x}%`, '--fall-duration': `${f.duration}s`, '--fall-delay': `${f.delay}s`,
        '--sway': `${f.sway}px`, '--flake-opacity': f.opacity,
      } as CSSProperties}><i style={{ width: f.size, height: f.size }} /></span>
    ))}</div>
  </div>
}

export function SnowPreview() {
  return <div className="theme-scene theme-preview snow-scene"><SnowLandscape />
    {FLAKES.slice(0, 12).map((f, i) => <i key={i} className="snow-preview-flake" style={{ left: `${f.x}%`, top: `${(-f.delay / f.duration) * 90}%`, width: f.size / 1.5, height: f.size / 1.5 }} />)}
  </div>
}
