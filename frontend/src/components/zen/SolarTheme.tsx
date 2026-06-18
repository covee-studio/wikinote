import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'

type SolarPhase = {
  name: 'night' | 'morning' | 'day' | 'evening'
  sky: [string, string, string]
  upperGlow: string
  lowerGlow: string
  horizon: string
}

function getSolarPhase(date = new Date()): SolarPhase {
  const hour = date.getHours() + date.getMinutes() / 60

  if (hour < 5) {
    return {
      name: 'night',
      sky: ['#dde3ee', '#e9e6eb', '#f1e5db'],
      upperGlow: 'rgba(106,122,171,0.22)',
      lowerGlow: 'rgba(232,191,154,0.22)',
      horizon: 'rgba(235,204,178,0.68)',
    }
  }
  if (hour < 8) {
    return {
      name: 'morning',
      sky: ['#e6ecf4', '#f1e8e5', '#f7d7bd'],
      upperGlow: 'rgba(108,139,204,0.18)',
      lowerGlow: 'rgba(255,180,98,0.36)',
      horizon: 'rgba(247,195,145,0.78)',
    }
  }
  if (hour < 16) {
    return {
      name: 'day',
      sky: ['#dfeaf4', '#f5f8f6', '#e3edf0'],
      upperGlow: 'rgba(122,166,214,0.2)',
      lowerGlow: 'rgba(238,218,170,0.14)',
      horizon: 'rgba(202,221,225,0.66)',
    }
  }
  if (hour < 19) {
    return {
      name: 'evening',
      sky: ['#e9edf3', '#f1e4de', '#f6c999'],
      upperGlow: 'rgba(103,112,184,0.22)',
      lowerGlow: 'rgba(255,160,72,0.42)',
      horizon: 'rgba(242,178,117,0.78)',
    }
  }
  return {
    name: 'night',
    sky: ['#dfe6f0', '#e9e3eb', '#efd8c2'],
    upperGlow: 'rgba(80,92,151,0.26)',
    lowerGlow: 'rgba(238,146,92,0.32)',
    horizon: 'rgba(225,177,143,0.7)',
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
            `radial-gradient(ellipse 70% 48% at 18% 10%, ${phase.upperGlow} 0%, rgba(255,255,255,0) 68%),
             radial-gradient(ellipse 58% 38% at 76% 74%, ${phase.lowerGlow} 0%, rgba(255,255,255,0) 72%)`,
          mixBlendMode: phase.name === 'day' ? 'normal' : 'multiply',
        }}
        animate={{ opacity: [0.82, 1, 0.82] }}
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
          `radial-gradient(ellipse 70% 48% at 18% 10%, ${phase.upperGlow} 0%, rgba(255,255,255,0) 68%),
           radial-gradient(ellipse 58% 38% at 76% 74%, ${phase.lowerGlow} 0%, rgba(255,255,255,0) 72%)`,
        mixBlendMode: phase.name === 'day' ? 'normal' : 'multiply',
      }} />
      <div className="absolute inset-x-0 bottom-0 h-[30%]" style={{
        background: `linear-gradient(180deg, transparent, ${phase.horizon})`,
      }} />
    </div>
  )
}
