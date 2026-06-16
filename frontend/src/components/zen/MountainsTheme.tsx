import { motion } from 'motion/react'

function Goose({ left, top, delay, scale = 1 }: { left: number; top: number; delay: number; scale?: number }) {
  return (
    <motion.svg
      width={16 * scale} height={9 * scale} viewBox="0 0 22 12"
      className="absolute"
      style={{ left, top, willChange: 'transform' }}
      animate={{ scaleY: [1, 0.3, 1] }}
      transition={{ duration: 0.6, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M1,9 Q6,2 11,7 Q16,2 21,9" fill="none" stroke="rgba(58,70,78,0.5)" strokeWidth="1.6" strokeLinecap="round" />
    </motion.svg>
  )
}

function Flock({ top, dur, scale, count }: { top: string; dur: number; scale: number; count: number }) {
  const birds = Array.from({ length: count }).map((_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const rank = Math.ceil(i / 2)
    return { left: 40 + side * rank * 15 * scale, top: rank * 9 * scale, delay: (i % 4) * 0.15 }
  })
  return (
    <motion.div
      className="absolute"
      style={{ top, left: 0, width: 120, height: 60, willChange: 'transform' }}
      animate={{ x: ['-15vw', '115vw'], y: [0, -15, 5, -10, 0] }}
      transition={{
        x: { duration: dur, repeat: Infinity, ease: 'linear' },
        y: { duration: dur * 0.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {birds.map((b, i) => <Goose key={i} left={b.left} top={b.top} delay={b.delay} scale={scale} />)}
    </motion.div>
  )
}

export function MountainsTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f5efe5 0%, #eee7d8 62%, #e2dbcc 100%)' }}>
      <Flock top="13%" dur={45} scale={1} count={7} />
      <Flock top="24%" dur={60} scale={0.7} count={5} />
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full" style={{ height: '38vh' }}>
        <path d="M0,320 C180,340 320,240 500,280 C700,330 880,220 1050,260 L1200,240 L1200,600 L0,600 Z" fill="#d6d8ce" />
        <path d="M0,420 C120,380 220,290 350,360 C480,430 580,310 720,380 C850,450 980,320 1200,390 L1200,600 L0,600 Z" fill="#b6beb7" />
        <path d="M0,480 C60,450 120,380 180,280 C230,190 280,340 360,420 C420,480 460,350 540,260 C600,170 660,320 740,410 C820,500 880,380 960,290 C1030,200 1100,340 1200,440 L1200,600 L0,600 Z" fill="#87938d" />
      </svg>
    </div>
  )
}

export function MountainsPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f5efe5 0%, #e2dbcc 100%)' }}>
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full" style={{ height: '60%' }}>
        <path d="M0,320 C180,340 320,240 500,280 C700,330 880,220 1050,260 L1200,240 L1200,600 L0,600 Z" fill="#d6d8ce" />
        <path d="M0,420 C120,380 220,290 350,360 C480,430 580,310 720,380 C850,450 980,320 1200,390 L1200,600 L0,600 Z" fill="#b6beb7" />
        <path d="M0,480 C60,450 120,380 180,280 C230,190 280,340 360,420 C420,480 460,350 540,260 C600,170 660,320 740,410 C820,500 880,380 960,290 C1030,200 1100,340 1200,440 L1200,600 L0,600 Z" fill="#87938d" />
      </svg>
    </div>
  )
}
