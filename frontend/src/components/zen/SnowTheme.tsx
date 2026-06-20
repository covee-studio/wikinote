import { useMemo } from 'react'
import { motion } from 'motion/react'

interface Flake { left: number; size: number; dur: number; delay: number; sway: number; op: number; blur: number }

function makeFlakes(count: number, near: boolean): Flake[] {
  return Array.from({ length: count }).map(() => ({
    left: Math.random() * 100,
    size: near ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2,
    dur: near ? 8 + Math.random() * 7 : 14 + Math.random() * 12,
    delay: Math.random() * 14,
    sway: (near ? 30 : 16) + Math.random() * 40,
    op: near ? 0.55 + Math.random() * 0.4 : 0.25 + Math.random() * 0.3,
    blur: near ? 0 : 1.2,
  }))
}

export function SnowTheme() {
  const far = useMemo(() => makeFlakes(28, false), [])
  const near = useMemo(() => makeFlakes(22, true), [])
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #d3dae3 0%, #dfe5ea 55%, #e9edf0 100%)' }}>
      <div className="absolute inset-x-0 bottom-0" style={{
        height: '30%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%)',
      }} />
      {[...far, ...near].map((f, i) => (
        <motion.span key={i} className="absolute rounded-full"
          style={{
            left: `${f.left}%`, top: -12, width: f.size, height: f.size,
            backgroundColor: `rgba(255,255,255,${f.op})`,
            boxShadow: f.blur === 0 ? '0 0 4px rgba(255,255,255,0.8)' : undefined,
            filter: f.blur ? `blur(${f.blur}px)` : undefined,
          }}
          animate={{ y: ['0vh', '110vh'], x: [0, f.sway, -f.sway / 2, 0] }}
          transition={{
            y: { duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'linear' },
            x: { duration: f.dur / 2, delay: f.delay, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </div>
  )
}

export function SnowPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #d3dae3 0%, #e9edf0 100%)' }}>
      <div className="absolute inset-x-0 bottom-0" style={{
        height: '30%', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.5))',
      }} />
      {[{l:22,t:24,s:3},{l:50,t:44,s:2},{l:70,t:20,s:3.5},{l:36,t:64,s:2},{l:82,t:54,s:3}].map((p, i) => (
        <span key={i} className="absolute rounded-full" style={{
          left: `${p.l}%`, top: `${p.t}%`, width: p.s, height: p.s,
          backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 0 3px rgba(255,255,255,0.9)',
        }} />
      ))}
    </div>
  )
}
