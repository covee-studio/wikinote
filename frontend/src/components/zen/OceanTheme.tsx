import { motion } from 'motion/react'

export function OceanTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #eef3f3 0%, #f2f5f3 40%, #e9f0ef 54%, #dcebe9 66%, #c8dddb 88%, #bcd4d2 100%)',
      }} />
      <motion.div
        className="absolute left-1/2"
        style={{ top: '60%', width: 520, height: 220, marginLeft: -260,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
          filter: 'blur(8px)' }}
        animate={{ x: [-40, 40, -40], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{ right: '25%', bottom: '35%', width: 60, height: 30 }}
        animate={{ x: [-15, 15, -15], y: [0, -4, 0] }}
        transition={{
          x: { duration: 24, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <svg viewBox="0 0 60 30" className="w-full h-full opacity-40" preserveAspectRatio="xMidYMid meet">
          <path d="M5,20 Q20,28 50,20 L55,18 Q30,25 2,18 Z" fill="rgba(70,96,98,0.8)" />
          <line x1="25" y1="20" x2="25" y2="4" stroke="rgba(70,96,98,0.7)" strokeWidth="1.5" />
          <path d="M25,4 L40,14 L25,16 Z" fill="rgba(70,96,98,0.5)" />
        </svg>
      </motion.div>
    </div>
  )
}

export function OceanPreview() {
  return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #eef3f3 0%, #e9f0ef 54%, #c8dddb 88%, #bcd4d2 100%)',
    }}>
      <div className="absolute left-1/2 top-[58%] w-8 h-5 -ml-4" style={{
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.6), transparent 70%)',
        filter: 'blur(2px)',
      }} />
    </div>
  )
}
