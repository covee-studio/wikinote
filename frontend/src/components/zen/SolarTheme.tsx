import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'

type SolarPhase = {
  sky: [string, string, string]
  glow: string
  band: string
  horizon: string
  sunY: string
  sunOpacity: number
}

function getSolarPhase(date = new Date()): SolarPhase {
  const hour = date.getHours() + date.getMinutes() / 60

  if (hour < 5) {
    return {
      sky: ['#dde3ee', '#e9e6eb', '#f1e5db'],
      glow: 'rgba(242,198,154,0.35)',
      band: 'rgba(76,92,150,0.34)',
      horizon: 'rgba(235,204,178,0.68)',
      sunY: '72%',
      sunOpacity: 0.24,
    }
  }
  if (hour < 8) {
    return {
      sky: ['#e6ecf4', '#f1e8e5', '#f7d7bd'],
      glow: 'rgba(255,187,112,0.58)',
      band: 'rgba(72,108,190,0.28)',
      horizon: 'rgba(247,195,145,0.78)',
      sunY: '64%',
      sunOpacity: 0.44,
    }
  }
  if (hour < 16) {
    return {
      sky: ['#eef3f5', '#f4f3ed', '#e7edf1'],
      glow: 'rgba(255,222,172,0.35)',
      band: 'rgba(88,124,200,0.2)',
      horizon: 'rgba(214,226,229,0.72)',
      sunY: '48%',
      sunOpacity: 0.28,
    }
  }
  if (hour < 19) {
    return {
      sky: ['#e9edf3', '#f1e4de', '#f6c999'],
      glow: 'rgba(255,169,91,0.62)',
      band: 'rgba(86,99,178,0.3)',
      horizon: 'rgba(242,178,117,0.78)',
      sunY: '60%',
      sunOpacity: 0.46,
    }
  }
  return {
    sky: ['#dfe6f0', '#e9e3eb', '#efd8c2'],
    glow: 'rgba(241,162,95,0.46)',
    band: 'rgba(58,68,132,0.36)',
    horizon: 'rgba(225,177,143,0.7)',
    sunY: '70%',
    sunOpacity: 0.32,
  }
}

function useSolarPhase() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(() => getSolarPhase(now), [now])
}

function solarBackground(phase: SolarPhase) {
  return `linear-gradient(180deg, ${phase.sky[0]} 0%, ${phase.sky[1]} 50%, ${phase.sky[2]} 100%)`
}

export function SolarTheme() {
  const phase = useSolarPhase()

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: solarBackground(phase) }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(112deg, transparent 0%, transparent 16%, ${phase.band} 17%, transparent 34%, transparent 42%, rgba(255,255,255,0.36) 43%, transparent 58%, transparent 100%)`,
          mixBlendMode: 'multiply',
        }}
        animate={{ x: ['-2%', '2%', '-2%'] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 rounded-full"
        style={{
          width: 260,
          height: 260,
          marginLeft: -130,
          top: phase.sunY,
          background: `radial-gradient(circle, rgba(255,246,224,${phase.sunOpacity}) 0%, ${phase.glow} 34%, rgba(255,255,255,0) 72%)`,
        }}
        animate={{ x: [-34, 34, -34], scale: [1, 1.06, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '34%',
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${phase.horizon} 100%)`,
        }}
        animate={{ opacity: [0.76, 0.95, 0.76] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export function SolarPreview() {
  const phase = getSolarPhase()

  return (
    <div className="absolute inset-0" style={{ background: solarBackground(phase) }}>
      <div className="absolute inset-0" style={{
        background:
          `linear-gradient(112deg, transparent 0%, transparent 16%, ${phase.band} 17%, transparent 34%, transparent 42%, rgba(255,255,255,0.42) 43%, transparent 58%, transparent 100%)`,
        mixBlendMode: 'multiply',
      }} />
      <div className="absolute inset-x-0 bottom-0 h-[30%]" style={{
        background: `linear-gradient(180deg, transparent, ${phase.horizon})`,
      }} />
    </div>
  )
}
