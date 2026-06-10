import { motion } from 'motion/react'

export function RainbowTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #e6eaee 0%, #eeefea 55%, #e8e9e4 100%)' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 18%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)',
      }} />
      <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 4px, transparent 4px, transparent 8px)',
      }} />
      <motion.div
        className="absolute left-1/2"
        style={{
          width: 1300, height: 1300, marginLeft: -650, top: '30%', borderRadius: '50%',
          background: 'conic-gradient(from 180deg at 50% 50%, transparent 0deg, transparent 200deg, rgba(210,120,120,0.65) 224deg, rgba(220,150,110,0.65) 240deg, rgba(210,190,110,0.65) 256deg, rgba(140,190,140,0.65) 272deg, rgba(120,170,210,0.65) 288deg, rgba(140,130,190,0.65) 304deg, rgba(180,130,190,0.65) 320deg, transparent 340deg, transparent 360deg)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 0%, transparent 40%, black 45%, black 50%, transparent 55%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 0%, transparent 40%, black 45%, black 50%, transparent 55%, transparent 100%)',
          filter: 'blur(10px) contrast(1.3)',
        }}
        animate={{ opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 60%, transparent 100%)',
          filter: 'blur(6px)', mixBlendMode: 'soft-light',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function RainbowPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #e6eaee, #eeefea)' }}>
      <div className="absolute inset-0 opacity-50 mix-blend-overlay" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 3px, transparent 3px, transparent 6px)',
      }} />
      <div className="absolute left-1/2" style={{
        width: 120, height: 120, marginLeft: -60, top: '60%', borderRadius: '50%',
        background: 'conic-gradient(from 180deg at 50% 50%, transparent 200deg, rgba(210,120,120,0.75) 224deg, rgba(220,150,110,0.75) 240deg, rgba(210,190,110,0.75) 256deg, rgba(140,190,140,0.75) 272deg, rgba(120,170,210,0.75) 288deg, rgba(140,130,190,0.75) 304deg, rgba(180,130,190,0.75) 320deg, transparent 340deg)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 36%, black 44%, black 52%, transparent 60%)',
        maskImage: 'radial-gradient(circle, transparent 36%, black 44%, black 52%, transparent 60%)',
        filter: 'blur(2px)',
      }} />
    </div>
  )
}
