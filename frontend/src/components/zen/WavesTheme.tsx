import { useEffect, useRef } from "react"
import { waveY } from "./sceneGeometry"

const LAYERS = [
  { color: "#d9e4de", speed: 0.34, amplitude: 0.080, phase: 0.2, baseY: 0.18, frequency: 1.15, direction: 1 },
  { color: "#c5d4cc", speed: 0.27, amplitude: 0.096, phase: 1.4, baseY: 0.35, frequency: 1.05, direction: -1 },
  { color: "#afc1b8", speed: 0.22, amplitude: 0.105, phase: 2.7, baseY: 0.52, frequency: 0.92, direction: 1 },
  { color: "#98aca2", speed: 0.17, amplitude: 0.092, phase: 4.0, baseY: 0.68, frequency: 1.08, direction: -1 },
  { color: "#81968c", speed: 0.13, amplitude: 0.078, phase: 5.2, baseY: 0.82, frequency: 0.86, direction: 1 },
] as const

function drawWaves(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number) {
  ctx.clearRect(0, 0, width, height)
  for (const layer of LAYERS) {
    ctx.beginPath()
    ctx.moveTo(0, height)
    const step = Math.max(2, width / 240)
    const spatialScale = Math.min(1.75, Math.max(1, width / 700))
    const reliefScale = 1 + Math.min(0.48, Math.max(0, (width - 640) / 1340))
    for (let x = 0; x <= width + step; x += step) {
      ctx.lineTo(x, waveY(layer, x / width, height, elapsed, spatialScale, reliefScale))
    }
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = layer.color
    ctx.fill()
  }
}

export function WavesTheme() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let width = 0
    let height = 0
    let animationId = 0
    let elapsed = 0
    let previousTime: number | undefined

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.round(canvas.clientWidth))
      const nextHeight = Math.max(1, Math.round(canvas.clientHeight))
      if (nextWidth !== width || nextHeight !== height || canvas.width !== nextWidth * dpr || canvas.height !== nextHeight * dpr) {
        width = nextWidth
        height = nextHeight
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      drawWaves(ctx, width, height, elapsed)
    }

    const frame = (now: number) => {
      if (previousTime !== undefined) elapsed += Math.min((now - previousTime) / 1000, 0.05)
      previousTime = now
      render()
      animationId = requestAnimationFrame(frame)
    }

    const start = () => {
      cancelAnimationFrame(animationId)
      previousTime = undefined
      render()
      if (!document.hidden && !reducedMotion.matches) animationId = requestAnimationFrame(frame)
    }

    const resizeObserver = new ResizeObserver(render)
    resizeObserver.observe(canvas)
    document.addEventListener("visibilitychange", start)
    reducedMotion.addEventListener("change", start)
    start()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", start)
      reducedMotion.removeEventListener("change", start)
    }
  }, [])

  return <div aria-hidden className="theme-scene waves-scene"><div className="waves-light" /><canvas ref={canvasRef} className="waves-canvas" /></div>
}

export function WavesPreview() {
  return <div aria-hidden className="theme-scene theme-preview waves-scene">
    <svg className="waves-preview-art" viewBox="0 0 100 48" preserveAspectRatio="none">
      <path fill="#dfe8e3" d="M0 27 C15 20 27 32 42 25 S68 19 81 27 S94 28 100 23 V48 H0Z" />
      <path fill="#c8d7cf" d="M0 34 C17 25 29 39 46 31 S72 27 85 35 S96 35 100 32 V48 H0Z" />
      <path fill="#aebfb6" d="M0 41 C18 33 31 45 49 38 S74 35 87 41 S97 41 100 39 V48 H0Z" />
    </svg>
  </div>
}
