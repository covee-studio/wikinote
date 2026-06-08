import { motion } from 'motion/react'

export function PaperTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: '#faf8f3' }} />
      <motion.div
        className="absolute"
        style={{
          width: '70%', height: '70%',
          top: '15%', left: '15%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, rgba(250,246,238,0) 65%)',
        }}
        animate={{ x: ['-8%', '8%', '-8%'], y: ['-4%', '4%', '-4%'], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute top-[72px] inset-x-[7vw] h-px" style={{ backgroundColor: 'rgba(120,110,95,0.10)' }} />
      <div className="absolute bottom-[72px] inset-x-[7vw] h-px" style={{ backgroundColor: 'rgba(120,110,95,0.10)' }} />
    </div>
  )
}
