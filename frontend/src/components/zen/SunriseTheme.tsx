import { motion } from 'motion/react'

export function SunriseTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: [
          'linear-gradient(180deg, #e7ecf1 0%, #eef0ee 50%, #f3ead9 100%)',
          'linear-gradient(180deg, #eaedf0 0%, #f3ede4 50%, #f8e6c9 100%)',
          'linear-gradient(180deg, #e7ecf1 0%, #eef0ee 50%, #f3ead9 100%)',
        ]}}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 rounded-full"
        style={{ width: 240, height: 240, marginLeft: -120,
          background: 'radial-gradient(circle, rgba(255,245,225,1) 0%, rgba(255,228,180,0.8) 35%, rgba(255,228,180,0) 70%)' }}
        initial={{ bottom: '-10%', opacity: 0 }}
        animate={{ bottom: '20%', opacity: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />
      <div className="absolute inset-x-0 bottom-0" style={{
        height: '35%',
        background: 'linear-gradient(180deg, rgba(216,224,229,0.85) 0%, rgba(205,214,219,1) 100%)',
        backdropFilter: 'blur(4px)',
      }}>
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'rgba(255,255,255,0.4)' }} />
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
            filter: 'blur(1px)',
          }}
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export function SunrisePreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #e7ecf1 0%, #f3ede4 55%, #f8e6c9 100%)' }}>
      <div className="absolute left-1/2 rounded-full" style={{
        width: 28, height: 28, marginLeft: -14, bottom: '25%',
        background: 'radial-gradient(circle, #fff5e1 0%, rgba(255,228,180,0) 70%)',
      }} />
      <div className="absolute inset-x-0 bottom-0" style={{
        height: '35%', background: 'rgba(216,224,229,0.85)',
        borderTop: '1px solid rgba(255,255,255,0.4)',
      }} />
    </div>
  )
}
