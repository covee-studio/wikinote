import type { CSSProperties } from 'react'
import { sceneRandom } from './sceneGeometry'
import { useId } from 'react'

function SailingBoat() {
  const id = useId().replace(/:/g, '')
  const silhouette = <>
    <path d="M31 80Q67 83 116 77L106 85Q66 93 39 85Z" fill="#526f6d" />
    <path d="M37 80Q77 83 116 77" fill="none" stroke="#eceee1" strokeWidth="1.2" />
    <path d="M73 19L71 79" stroke="#617d77" strokeWidth="1.2" />
    <path d="M76 23Q94 52 110 69Q91 67 76 73Z" fill={`url(#${id}-sail)`} />
    <path d="M69 32Q55 59 45 74L69 72Z" fill="#f5f1e3" opacity=".85" />
    <path d="M76 23Q87 50 76 73M69 32L69 72" stroke="#8ba09a" strokeWidth=".5" opacity=".65" fill="none" />
    <path d="M73 20L115 78M72 30L34 80" stroke="#82988f" strokeWidth=".4" opacity=".7" />
  </>
  return <svg viewBox="0 0 160 128" aria-hidden>
    <defs>
      <linearGradient id={`${id}-sail`}><stop stopColor="#f9f5e7" /><stop offset=".55" stopColor="#e7e6d9" /><stop offset="1" stopColor="#bacac2" /></linearGradient>
      <linearGradient id={`${id}-reflection`} x2="0" y2="1"><stop stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
      <mask id={`${id}-mask`}><rect x="0" y="86" width="160" height="40" fill={`url(#${id}-reflection)`} /></mask>
    </defs>
    <g className="vessel-wake"><path d="M8 87Q43 83 67 87M83 87Q118 82 146 86M25 94Q77 90 126 93M49 103Q83 99 104 101" /></g>
    <g className="vessel-hull">{silhouette}</g>
    <g className="vessel-reflection" mask={`url(#${id}-mask)`}><g transform="translate(0 135) scale(1 -.55)">{silhouette}</g></g>
    <path d="M33 89L126 87M53 98L117 97M61 108L100 106" stroke="#deebe7" strokeWidth="2.5" opacity=".65" />
  </svg>
}

const random = sceneRandom(401)
const GLINTS = Array.from({ length: 52 }, () => ({
  x: random() * 1200, y: 25 + random() * 245, length: 6 + random() * 38,
  opacity: .18 + random() * .45, delay: -random() * 12, duration: 5 + random() * 7,
}))

function SeaReflections() {
  return <svg className="sea-reflections" viewBox="0 0 1200 300" preserveAspectRatio="none">
    {GLINTS.map((glint, i) => <path key={i}
      d={'M' + glint.x + ' ' + glint.y + 'q' + glint.length * .45 + ' -1.5 ' + glint.length + ' 0'}
      style={{ '--glint-opacity': glint.opacity, animationDelay: glint.delay + 's', animationDuration: glint.duration + 's' } as CSSProperties}
    />)}
  </svg>
}

export function OceanTheme() {
  return <div aria-hidden className="theme-scene ocean-scene">
    <div className="ocean-depth" /><div className="ocean-sunpath" />
    <SeaReflections />
    <div className="ocean-vessel"><SailingBoat /></div>
  </div>
}

export function OceanPreview() {
  return <div className="theme-scene theme-preview ocean-scene">
    <div className="ocean-depth" /><SeaReflections />
  </div>
}
