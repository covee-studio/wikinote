import { motion } from 'motion/react'

export function OceanTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #edf4f5 0%, #f4f6f2 38%, #e3eeec 58%, #c9dfdd 78%, #a9c8c5 100%)',
      }} />
      <motion.div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          height: '34%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(205,228,226,0.92) 34%, rgba(159,196,194,1) 100%)',
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-[-10%]"
        style={{
          bottom: '20%',
          height: 56,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.38) 0px, rgba(255,255,255,0.38) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 10px)',
          filter: 'blur(1px)',
          rotate: '-1deg',
        }}
        animate={{ x: ['-2%', '2%', '-2%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2"
        style={{
          top: '55%',
          width: 620,
          height: 220,
          marginLeft: -310,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0) 70%)',
          filter: 'blur(10px)',
        }}
        animate={{ x: [-36, 36, -36], opacity: [0.55, 0.86, 0.55] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{ right: '18%', bottom: '27%', width: 82, height: 40 }}
        animate={{ x: [-18, 18, -18], y: [0, -5, 0] }}
        transition={{
          x: { duration: 24, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <svg viewBox="0 0 82 40" className="w-full h-full opacity-55" preserveAspectRatio="xMidYMid meet">
          <path d="M8,27 Q28,36 68,27 L76,24 Q42,32 4,24 Z" fill="rgba(60,88,91,0.78)" />
          <line x1="36" y1="27" x2="36" y2="5" stroke="rgba(60,88,91,0.7)" strokeWidth="1.8" />
          <path d="M36,5 L58,18 L36,21 Z" fill="rgba(60,88,91,0.46)" />
        </svg>
      </motion.div>
    </div>
  )
}

export function OceanPreview() {
  return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #edf4f5 0%, #e3eeec 58%, #a9c8c5 100%)',
    }}>
      <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(159,196,194,1) 100%)',
      }} />
      <div className="absolute inset-x-[-10%] bottom-[21%] h-5" style={{
        background:
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 7px)',
        filter: 'blur(0.7px)',
      }} />
    </div>
  )
}
