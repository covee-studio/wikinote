import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export function ConstellationTheme() {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 5,
        dur: 2.5 + Math.random() * 3.5,
        opacity: 0.3 + Math.random() * 0.7,
      })),
    [],
  )

  const [meteors, setMeteors] = useState<{ id: number; top: number; left: number }[]>([])

  useEffect(() => {
    let idCounter = 0
    const spawnMeteor = () => {
      const m = { id: idCounter++, top: Math.random() * 30, left: 10 + Math.random() * 50 }
      setMeteors((prev) => [...prev, m])
      setTimeout(() => setMeteors((prev) => prev.filter((x) => x.id !== m.id)), 2500)
      setTimeout(spawnMeteor, 3000 + Math.random() * 3000)
    }
    const t = setTimeout(spawnMeteor, 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, #1b2236 0%, #0e1320 60%, #0a0e17 100%)',
      }} />
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {stars.map((s, i) => (
        <motion.span key={i} className="absolute rounded-full bg-white"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, boxShadow: '0 0 4px rgba(255,255,255,0.4)' }}
          animate={{ opacity: [s.opacity * 0.2, s.opacity, s.opacity * 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <AnimatePresence>
        {meteors.map((m) => (
          <motion.div key={m.id} className="absolute"
            style={{
              top: `${m.top}%`, left: `${m.left}%`, width: 140, height: 1.5,
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 70%, rgba(255,255,255,1) 100%)',
              transformOrigin: 'right center', rotate: 35, boxShadow: '2px 0 6px rgba(255,255,255,0.5)',
            }}
            initial={{ opacity: 0, x: -50, y: -35 }}
            animate={{ opacity: [0, 1, 1, 0], x: 350, y: 245 }}
            transition={{ duration: 1.5, ease: 'linear' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export function ConstellationPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, #1b2236 0%, #0e1320 100%)' }}>
      <div className="absolute inset-0 opacity-[0.1]" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }} />
      <span className="absolute rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.6)]" style={{ top: '30%', left: '20%', width: 2.5, height: 2.5 }} />
      <span className="absolute rounded-full bg-white/80" style={{ top: '60%', left: '70%', width: 3, height: 3 }} />
      <span className="absolute rounded-full bg-white shadow-[0_0_2px_rgba(255,255,255,0.5)]" style={{ top: '80%', left: '40%', width: 2, height: 2 }} />
      <span className="absolute rounded-full bg-white/60" style={{ top: '20%', left: '80%', width: 1.5, height: 1.5 }} />
      <div className="absolute" style={{
        top: '35%', left: '25%', width: 40, height: 1.5,
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%)',
        rotate: '35deg', boxShadow: '1px 0 3px rgba(255,255,255,0.4)',
      }} />
    </div>
  )
}
