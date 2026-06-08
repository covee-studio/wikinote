interface WaveLayerProps {
  d: string
  fill: string
  duration: number
  bobDuration: number
  delay?: number
  bobDelay?: number
}

function WaveLayer({ d, fill, duration, bobDuration, delay = 0, bobDelay = 0 }: WaveLayerProps) {
  return (
    <div
      className="absolute bottom-0 left-0"
      style={{
        width: '200%',
        animation: `zen-wave-drift ${duration}s linear infinite, zen-wave-bob ${bobDuration}s ease-in-out infinite`,
        animationDelay: `${delay}s, ${bobDelay}s`,
        willChange: 'transform',
      }}
    >
      <svg
        viewBox="0 0 2880 360"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '40vh', minHeight: 240, display: 'block' }}
      >
        <path d={d} fill={fill} />
      </svg>
    </div>
  )
}

const WAVE_FAR =
  'M0,150 C180,120 360,180 540,160 C720,140 900,170 1080,150 C1260,135 1380,165 1440,150 C1620,120 1800,180 1980,160 C2160,140 2340,170 2520,150 C2700,135 2820,165 2880,150 L2880,360 L0,360 Z'
const WAVE_MID =
  'M0,210 C240,150 420,250 660,215 C840,188 1020,255 1200,205 C1320,178 1400,225 1440,210 C1680,150 1860,250 2100,215 C2280,188 2460,255 2640,205 C2760,178 2840,225 2880,210 L2880,360 L0,360 Z'
const WAVE_NEAR =
  'M0,260 C160,235 380,290 600,265 C820,245 980,295 1200,270 C1320,255 1400,285 1440,260 C1600,235 1820,290 2040,265 C2260,245 2420,295 2640,270 C2760,255 2840,285 2880,260 L2880,360 L0,360 Z'
const WAVE_FRONT =
  'M0,310 C220,275 400,330 620,300 C840,272 1040,335 1240,305 C1340,290 1400,315 1440,310 C1660,275 1840,330 2060,300 C2280,272 2480,335 2680,305 C2780,290 2840,315 2880,310 L2880,360 L0,360 Z'

export function WavesTheme() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.35]"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)' }}
      />
      <WaveLayer d={WAVE_FAR}  fill="rgba(148,163,184,0.15)" duration={28} bobDuration={12} delay={-4}  bobDelay={-2} />
      <WaveLayer d={WAVE_MID}  fill="rgba(120,140,130,0.16)" duration={22} bobDuration={10} delay={-9}  bobDelay={-5} />
      <WaveLayer d={WAVE_NEAR} fill="rgba(110,130,122,0.18)" duration={16} bobDuration={8}  delay={-3}  bobDelay={-1} />
      <WaveLayer d={WAVE_FRONT} fill="rgba(96,118,110,0.22)" duration={12} bobDuration={6.5} delay={-7} bobDelay={-3} />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
