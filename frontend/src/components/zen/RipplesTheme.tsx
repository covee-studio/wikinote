import { useEffect, useRef, useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
  rings: number
}

export function RipplesTheme() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const drop = () => {
      const id = nextId.current++
      setRipples((prev) => [
        ...prev,
        {
          id,
          x: 8 + Math.random() * 84,
          y: 12 + Math.random() * 76,
          size: 180 + Math.random() * 220,
          rings: Math.random() > 0.45 ? 2 : 1,
        },
      ])
      timer = setTimeout(drop, 650 + Math.random() * 900)
    }
    timer = setTimeout(drop, 300)
    return () => clearTimeout(timer)
  }, [])

  const remove = (id: number) => setRipples((prev) => prev.filter((r) => r.id !== id))

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.5) 0%, rgba(238,242,240,0) 65%)',
        }}
      />
      <AnimatePresence>
        {ripples.map((r) => (
          <Fragment key={r.id}>
            <motion.span
              className="absolute rounded-full border"
              style={{
                left: `${r.x}%`, top: `${r.y}%`,
                width: r.size, height: r.size,
                marginLeft: -r.size / 2, marginTop: -r.size / 2,
                borderColor: 'rgba(86,108,98,0.45)',
                borderWidth: 1.4,
              }}
              initial={{ scale: 0, opacity: 0.55 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 3.4, ease: 'easeOut' }}
              onAnimationComplete={() => r.rings === 1 && remove(r.id)}
            />
            {r.rings === 2 && (
              <motion.span
                className="absolute rounded-full border"
                style={{
                  left: `${r.x}%`, top: `${r.y}%`,
                  width: r.size * 0.62, height: r.size * 0.62,
                  marginLeft: (-r.size * 0.62) / 2, marginTop: (-r.size * 0.62) / 2,
                  borderColor: 'rgba(86,108,98,0.35)',
                  borderWidth: 1.2,
                }}
                initial={{ scale: 0, opacity: 0.45 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{ duration: 3, ease: 'easeOut', delay: 0.28 }}
                onAnimationComplete={() => remove(r.id)}
              />
            )}
          </Fragment>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function RipplesPreview() {
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #eef3f1 0%, #dde7e2 100%)' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="absolute left-1/2 top-1/2 rounded-full border" style={{
          width: 16 + i * 16, height: 16 + i * 16,
          marginLeft: -(16 + i * 16) / 2, marginTop: -(16 + i * 16) / 2,
          borderColor: `rgba(86,108,98,${0.3 - i * 0.08})`, borderWidth: 1,
        }} />
      ))}
      <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-white/90 shadow-[0_0_3px_rgba(255,255,255,0.9)]" />
    </div>
  )
}
