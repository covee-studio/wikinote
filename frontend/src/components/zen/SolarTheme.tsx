import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'

type SolarPhase = {
  name: 'deep-night' | 'morning' | 'day' | 'evening' | 'late'
  sky: [string, string, string, string]
  upperGlow: string
  middleGlow: string
  lowerGlow: string
  horizon: string
  horizonHeight: string
  horizonOpacity: number
}

function getSolarPhase(date = new Date()): SolarPhase {
  const hour = date.getHours() + date.getMinutes() / 60

  if (hour < 5) {
    return {
      name: 'deep-night',
      sky: ['#bdc9df', '#cdd3e3', '#dadbe7', '#e4e1e8'],
      upperGlow: 'rgba(48,61,126,0.26)',
      middleGlow: 'rgba(98,94,150,0.18)',
      lowerGlow: 'rgba(139,146,184,0.14)',
      horizon: 'rgba(170,178,204,0.42)',
      horizonHeight: '38%',
      horizonOpacity: 0.58,
    }
  }
  if (hour < 8) {
    return {
      name: 'morning',
      sky: ['#cfe1f3', '#e4ebf2', '#f2e4da', '#f7cfaa'],
      upperGlow: 'rgba(70,127,205,0.18)',
      middleGlow: 'rgba(161,167,213,0.12)',
      lowerGlow: 'rgba(255,166,82,0.30)',
      horizon: 'rgba(244,181,118,0.66)',
      horizonHeight: '38%',
      horizonOpacity: 0.78,
    }
  }
  if (hour < 16) {
    return {
      name: 'day',
      sky: ['#c9def4', '#dceaf5', '#f2f7f6', '#dce9ed'],
      upperGlow: 'rgba(61,126,213,0.18)',
      middleGlow: 'rgba(116,166,212,0.10)',
      lowerGlow: 'rgba(156,198,218,0.14)',
      horizon: 'rgba(193,215,224,0.48)',
      horizonHeight: '34%',
      horizonOpacity: 0.68,
    }
  }
  if (hour < 19) {
    return {
      name: 'evening',
      sky: ['#d4d8e9', '#e4dce4', '#eed4c2', '#f4b57e'],
      upperGlow: 'rgba(76,84,160,0.22)',
      middleGlow: 'rgba(145,111,153,0.16)',
      lowerGlow: 'rgba(246,122,48,0.30)',
      horizon: 'rgba(236,142,75,0.62)',
      horizonHeight: '42%',
      horizonOpacity: 0.78,
    }
  }
  return {
    name: 'late',
    sky: ['#c7ccdf', '#d8d2df', '#e7c8bf', '#f0aa7f'],
    upperGlow: 'rgba(61,62,128,0.26)',
    middleGlow: 'rgba(124,86,128,0.18)',
    lowerGlow: 'rgba(230,104,52,0.26)',
    horizon: 'rgba(218,124,78,0.56)',
    horizonHeight: '44%',
    horizonOpacity: 0.72,
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
  return `linear-gradient(180deg, ${phase.sky[0]} 0%, ${phase.sky[1]} 34%, ${phase.sky[2]} 72%, ${phase.sky[3]} 100%)`
}

function solarAtmosphere(phase: SolarPhase) {
  return `radial-gradient(ellipse 72% 46% at 18% 8%, ${phase.upperGlow} 0%, rgba(255,255,255,0) 70%),
    radial-gradient(ellipse 62% 42% at 52% 46%, ${phase.middleGlow} 0%, rgba(255,255,255,0) 74%),
    radial-gradient(ellipse 64% 40% at 76% 84%, ${phase.lowerGlow} 0%, rgba(255,255,255,0) 74%)`
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
          background: solarAtmosphere(phase),
          mixBlendMode: phase.name === 'day' || phase.name === 'morning' ? 'normal' : 'multiply',
        }}
        animate={{ opacity: [0.82, 1, 0.82] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: phase.horizonHeight,
          background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${phase.horizon} 100%)`,
        }}
        animate={{ opacity: [phase.horizonOpacity * 0.82, phase.horizonOpacity, phase.horizonOpacity * 0.82] }}
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
        background: solarAtmosphere(phase),
        mixBlendMode: phase.name === 'day' || phase.name === 'morning' ? 'normal' : 'multiply',
      }} />
      <div className="absolute inset-x-0 bottom-0" style={{
        height: phase.horizonHeight,
        opacity: phase.horizonOpacity,
        background: `linear-gradient(180deg, transparent, ${phase.horizon})`,
      }} />
    </div>
  )
}
