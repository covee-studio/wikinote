import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'motion/react'

function leafPath(len: number) {
  const w = len * 0.17
  return `M0,0 C${len*0.4},${-w} ${len*0.78},${-w*0.6} ${len},0 C${len*0.78},${w*0.6} ${len*0.4},${w} 0,0 Z`
}

function LeafCluster({ x, y, base, ink, size, delay, sway }: {
  x: number; y: number; base: number; ink: string; size: number; delay: number; sway: number
}) {
  const leaves = [
    { a: base - 26, l: size * 0.9, op: 0.85 },
    { a: base - 8,  l: size,       op: 1    },
    { a: base + 12, l: size * 0.82, op: 0.8 },
    { a: base + 30, l: size * 0.66, op: 0.7 },
  ]
  return (
    <motion.svg className="absolute"
      style={{ left: x, top: y, overflow: 'visible', transformOrigin: '0px 0px' }}
      width={1} height={1}
      animate={{ rotate: [-sway, sway, -sway] }}
      transition={{ duration: 3.2 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {leaves.map((lf, i) => (
        <path key={i} d={leafPath(lf.l)} fill={ink} opacity={lf.op} transform={`rotate(${lf.a})`} />
      ))}
    </motion.svg>
  )
}

interface Clump {
  side: 'left' | 'right'; leftPct: number; scale: number; blur: number; ink: string; height: number
  culm: { x1: number; y1: number; x2: number; y2: number; w: number }
  clusters: { t: number; base: number; size: number; delay: number; sway: number }[]
}

function culmPath(c: Clump['culm']) {
  const { x1, y1, x2, y2, w } = c
  const tw = w * 0.4
  const mx = (x1 + x2) / 2 + (x2 - x1) * 0.15
  const my = (y1 + y2) / 2
  return `M${x1-w/2},${y1} Q${mx-w/2},${my} ${x2-tw/2},${y2} L${x2+tw/2},${y2} Q${mx+w/2},${my} ${x1+w/2},${y1} Z`
}

export function BambooTheme() {
  const clumps: Clump[] = useMemo(() => [
    { side: 'left', leftPct: -1, scale: 1, blur: 0, ink: 'rgba(34,40,44,0.9)', height: 620,
      culm: { x1: 40, y1: 620, x2: 150, y2: 30, w: 9 },
      clusters: [
        { t: 1,     base: -70,  size: 64, delay: 0,   sway: 3.2 },
        { t: 5/6,   base: -120, size: 52, delay: 0.7, sway: 2.6 },
        { t: 4/6,   base: -150, size: 48, delay: 1.3, sway: 2.2 },
        { t: 3/6,   base: 200,  size: 40, delay: 0.4, sway: 2.4 },
      ],
    },
    { side: 'left', leftPct: -2, scale: 0.78, blur: 1.2, ink: 'rgba(90,100,96,0.6)', height: 520,
      culm: { x1: 90, y1: 520, x2: 30, y2: 60, w: 6 },
      clusters: [
        { t: 1,   base: -110, size: 46, delay: 0.9, sway: 3   },
        { t: 5/6, base: -150, size: 38, delay: 1.6, sway: 2.4 },
      ],
    },
    { side: 'right', leftPct: 80, scale: 0.62, blur: 3, ink: 'rgba(120,130,124,0.42)', height: 420,
      culm: { x1: 70, y1: 420, x2: 150, y2: 80, w: 6 },
      clusters: [
        { t: 1,   base: -60, size: 44, delay: 0.5, sway: 2.8 },
        { t: 4/6, base: -30, size: 36, delay: 1.1, sway: 2.2 },
      ],
    },
  ], [])

  const rain = useMemo(() => Array.from({ length: 32 }).map(() => ({
    left: Math.random() * 112 - 6,
    len: 26 + Math.random() * 30,
    dur: 0.6 + Math.random() * 0.5,
    delay: Math.random() * 2,
    op: 0.14 + Math.random() * 0.22,
  })), [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #d8e3df 0%, #e2e8e3 55%, #d9e0db 100%)' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.42) 0%, rgba(226,232,227,0) 66%)',
      }} />
      {clumps.map((c, i) => (
        <div key={i} className="absolute bottom-0" style={{
          [c.side === 'left' ? 'left' : 'right']: `${Math.abs(c.leftPct)}%`,
          width: 200, height: c.height,
          transform: `scale(${c.scale})`,
          transformOrigin: c.side === 'left' ? 'bottom left' : 'bottom right',
          filter: c.blur ? `blur(${c.blur}px)` : undefined,
        } as CSSProperties}>
          <svg width={200} height={c.height} viewBox={`0 0 200 ${c.height}`}
            style={{ overflow: 'visible', position: 'absolute', bottom: 0, left: 0 }}>
            <path d={culmPath(c.culm)} fill={c.ink} />
            {Array.from({ length: 5 }).map((_, n) => {
              const t = (n + 1) / 6
              const nx = c.culm.x1 + (c.culm.x2 - c.culm.x1) * t
              const ny = c.culm.y1 + (c.culm.y2 - c.culm.y1) * t
              return <line key={n} x1={nx-5} y1={ny} x2={nx+5} y2={ny} stroke={c.ink} strokeWidth={1.6} strokeLinecap="round" />
            })}
          </svg>
          {c.clusters.map((cl, j) => {
            const cx = c.culm.x1 + (c.culm.x2 - c.culm.x1) * cl.t
            const cy = c.culm.y1 + (c.culm.y2 - c.culm.y1) * cl.t
            return <LeafCluster key={j} x={cx} y={cy} base={cl.base} ink={c.ink} size={cl.size} delay={cl.delay} sway={cl.sway} />
          })}
        </div>
      ))}
      {rain.map((r, i) => (
        <motion.span key={i} className="absolute"
          style={{
            left: `${r.left}%`, top: -44, width: 1, height: r.len,
            background: `linear-gradient(180deg, rgba(150,170,170,0) 0%, rgba(140,162,162,${r.op}) 100%)`,
            transform: 'rotate(13deg)',
          }}
          animate={{ y: ['0vh', '118vh'] }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

export function BambooPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #d8e3df, #d9e0db)' }}>
      <svg viewBox="0 0 64 48" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <path d={culmPath({ x1: 16, y1: 48, x2: 30, y2: 4, w: 2.6 })} fill="rgba(34,40,44,0.85)" />
        <g transform="translate(30,5)">
          {[-60, -40, -18].map((a, i) => (
            <path key={i} d={leafPath(11)} fill="rgba(34,40,44,0.85)" transform={`rotate(${a})`} />
          ))}
        </g>
        <path d={culmPath({ x1: 52, y1: 48, x2: 46, y2: 14, w: 2 })} fill="rgba(110,122,116,0.45)" />
        {[12, 34, 52].map((x, i) => (
          <line key={i} x1={x} y1={2} x2={x+4} y2={18} stroke="rgba(140,162,162,0.4)" strokeWidth={0.7} />
        ))}
      </svg>
    </div>
  )
}
