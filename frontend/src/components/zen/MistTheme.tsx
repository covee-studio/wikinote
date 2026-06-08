import { motion } from 'motion/react'

const BLOBS = [
  { color: 'rgba(120,158,180,0.55)', size: 560, top: '2%',  left: '6%',  dur: 19, x: [0, 220, 90, 0],  y: [0, 120, 220, 0],   s: [1, 1.25, 1.05, 1] },
  { color: 'rgba(196,164,148,0.5)',  size: 520, top: '34%', left: '58%', dur: 23, x: [0, -180, -60, 0], y: [0, 90, -120, 0],   s: [1, 1.18, 0.92, 1] },
  { color: 'rgba(150,158,196,0.48)', size: 480, top: '52%', left: '14%', dur: 21, x: [0, 160, 240, 0],  y: [0, -130, -40, 0],  s: [1.05, 0.9, 1.2, 1.05] },
  { color: 'rgba(160,188,168,0.46)', size: 500, top: '12%', left: '64%', dur: 26, x: [0, -140, 60, 0],  y: [0, 150, 60, 0],    s: [1, 1.22, 1, 1] },
]

export function MistTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle, ${b.color} 0%, rgba(255,255,255,0) 68%)`,
            filter: 'blur(36px)',
          }}
          animate={{ x: b.x as number[], y: b.y as number[], scale: b.s as number[] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
