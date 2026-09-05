import type { CSSProperties } from 'react'
import { starParticles } from './sceneGeometry'

const STARS = starParticles(96)
// The first pass begins just after entry; negative delays used to start in the invisible cooldown.
const METEORS = [{ x: 24, y: 13, duration: 11, delay: .35 }, { x: 61, y: 6, duration: 16, delay: 4.8 }, { x: 76, y: 36, duration: 19, delay: 9.2 }]

function StarField({ preview = false }: { preview?: boolean }) {
  return <>{STARS.slice(0, preview ? 18 : 96).map((star, i) => <i key={i} className="scene-star" style={{
    left: `${star.x}%`, top: `${star.y}%`, width: preview ? Math.min(star.size, 2) : star.size,
    height: preview ? Math.min(star.size, 2) : star.size,
    '--star-opacity': star.opacity, animationDuration: `${star.duration}s`, animationDelay: `${star.delay}s`,
  } as CSSProperties} />)}</>
}

export function ConstellationTheme() {
  return <div aria-hidden className="theme-scene stars-scene">
    <div className="stellar-haze" /><StarField />
    {METEORS.map((meteor, i) => <div className="meteor-track" key={i} style={{ left: `${meteor.x}%`, top: `${meteor.y}%` }}>
      <i className="scene-meteor" style={{ animationDuration: `${meteor.duration}s`, animationDelay: `${meteor.delay}s` }} />
    </div>)}
  </div>
}

export function ConstellationPreview() {
  return <div className="theme-scene theme-preview stars-scene"><StarField preview /></div>
}
