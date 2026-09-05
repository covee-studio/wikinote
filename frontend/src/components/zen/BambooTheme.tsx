import type { CSSProperties } from 'react'
import { sceneRandom } from './sceneGeometry'

const random = sceneRandom(808)
const RAIN = Array.from({ length: 38 }, () => ({ x: random() * 110 - 5, duration: .85 + random() * .65, delay: -random() * 2, length: 20 + random() * 28 }))
const LEAVES = [
  { x: 12, y: -4, angle: -67, length: 36 }, { x: 26, y: -9, angle: 37, length: 42 },
  { x: 39, y: -16, angle: -54, length: 49 }, { x: 50, y: -22, angle: 30, length: 46 },
  { x: 65, y: -29, angle: -35, length: 36 }, { x: 79, y: -34, angle: 14, length: 39 },
  { x: 25, y: -9, angle: 76, length: 29 },
]

function Sprig({ x, y, direction, scale, index }: { x: number; y: number; direction: number; scale: number; index: number }) {
  return <g transform={`translate(${x} ${y}) scale(${direction * scale} ${scale})`}>
    <g className="bamboo-sprig" style={{ animationDelay: `${-index * .8}s`, animationDuration: `${4.5 + index * .37}s` }}>
      <path d="M0 0Q30 -6 54 -24T101 -42 M27 -9Q39 4 47 16" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
      {LEAVES.map((leaf, i) => <path key={i}
        transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle + index % 3 * 7})`}
        d={`M0 0Q${leaf.length * .44} -5.5 ${leaf.length} 0Q${leaf.length * .48} 2.8 0 0Z`}
        fill="currentColor" opacity={.62 + i % 3 * .16} />)}
    </g>
  </g>
}

function BambooPlant() {
  return <svg viewBox="0 0 300 700" className="bamboo-plant" preserveAspectRatio="xMidYMax meet">
    {[{ x: 60, lean: 65, opacity: .3, width: 4 }, { x: 130, lean: -30, opacity: .38, width: 4 }, { x: 82, lean: 88, opacity: .87, width: 7 }].map((culm, i) => (
      <g key={i} opacity={culm.opacity}>
        <path d={`M${culm.x - culm.width / 2} 714Q${culm.x + culm.lean * .47 - culm.width / 3} 365 ${culm.x + culm.lean} 22Q${culm.x + culm.lean * .47 + culm.width / 3} 365 ${culm.x + culm.width / 2} 714Z`} fill="currentColor" />
        {[1, 2, 3, 4, 5, 6, 7].map(node => {
          const t = node / 8
          const x = culm.x + culm.lean * t
          const y = 714 - t * 687
          return <g key={node}>
            <path d={`M${x - culm.width} ${y}q${culm.width} 3 ${culm.width * 2} 0`} fill="none" stroke="#dce6dd" strokeWidth="1.8" />
            {node > 2 && node % 2 === (i % 2) && <Sprig x={x} y={y} direction={node % 4 === 0 ? -1 : 1} scale={.85 + i * .12 - (node - 3) * .04} index={node + i} />}
          </g>
        })}
        <Sprig x={culm.x + culm.lean * .97} y={52} direction={i % 2 ? -1 : 1} scale={.65} index={i} />
      </g>
    ))}
  </svg>
}

export function BambooTheme() {
  return <div aria-hidden className="theme-scene bamboo-scene">
    <div className="bamboo-grove bamboo-grove-far"><BambooPlant /></div>
    <div className="bamboo-grove bamboo-grove-near"><BambooPlant /></div>
    <div className="bamboo-haze" />
    <div className="bamboo-rain">{RAIN.map((drop, i) => <i key={i} style={{
      left: `${drop.x}%`, height: drop.length, animationDuration: `${drop.duration}s`, animationDelay: `${drop.delay}s`,
    } as CSSProperties} />)}</div>
  </div>
}

export function BambooPreview() {
  return <div className="theme-scene theme-preview bamboo-scene">
    <div className="bamboo-grove bamboo-grove-far"><BambooPlant /></div><div className="bamboo-grove bamboo-grove-near"><BambooPlant /></div>
  </div>
}
