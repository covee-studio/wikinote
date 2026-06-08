import { useMemo } from 'react'
import { motion } from 'motion/react'

export function ConstellationTheme() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 5,
        dur: 2.5 + Math.random() * 3.5,
      })),
    [],
  )

  const lines = useMemo(
    () =>
      Array.from({ length: 6 }).map(() => ({
        x1: Math.random() * 100, y1: Math.random() * 100,
        x2: Math.random() * 100, y2: Math.random() * 100,
        delay: Math.random() * 5,
        dur: 6 + Math.random() * 5,
      })),
    [],
  )

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(rgba(100,116,139,0.16) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {lines.map((l, i) => (
          <motion.line
            key={i}
            x1={`${l.x1}%`} y1={`${l.y1}%`}
            x2={`${l.x2}%`} y2={`${l.y2}%`}
            stroke="rgba(71,85,105,0.4)"
            strokeWidth={0.8}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${s.top}%`, left: `${s.left}%`,
            width: s.size, height: s.size,
            backgroundColor: 'rgba(51,65,85,0.7)',
          }}
          animate={{ opacity: [0.1, 0.85, 0.1], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
