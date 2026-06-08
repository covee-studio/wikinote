import { motion } from 'motion/react'

export function DawnTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(180deg, #e9edf2 0%, #f1ece6 48%, #f6e2d4 82%, #f2d4c2 100%)',
            'linear-gradient(180deg, #edeaf0 0%, #f2e9e6 48%, #f7dccd 82%, #f0cdc0 100%)',
            'linear-gradient(180deg, #e9edf2 0%, #f1ece6 48%, #f6e2d4 82%, #f2d4c2 100%)',
          ],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-0"
        style={{
          height: '55%',
          bottom: 0,
          background:
            'radial-gradient(ellipse 80% 100% at 50% 120%, rgba(255,224,196,0.95) 0%, rgba(255,214,184,0.45) 35%, rgba(255,255,255,0) 70%)',
        }}
        animate={{ y: ['8%', '-6%', '8%'], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 340, height: 340,
          left: '50%', bottom: '-4%',
          marginLeft: -170,
          background:
            'radial-gradient(circle, rgba(255,240,220,0.95) 0%, rgba(255,230,205,0.4) 40%, rgba(255,255,255,0) 70%)',
        }}
        animate={{ x: [-60, 60, -60], scale: [1, 1.08, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
