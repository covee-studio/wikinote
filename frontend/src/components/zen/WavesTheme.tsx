import { useEffect, useRef } from "react"

const LAYERS = [
  { color: "#c9d6d1", speed: 0.22, amp: 16, phase: 0.0,  baseY: 0.18 },
  { color: "#b3c3bc", speed: 0.17, amp: 22, phase: 1.3,  baseY: 0.33 },
  { color: "#9eada6", speed: 0.13, amp: 26, phase: 2.5,  baseY: 0.50 },
  { color: "#899892", speed: 0.09, amp: 24, phase: 3.8,  baseY: 0.65 },
  { color: "#74847e", speed: 0.06, amp: 20, phase: 5.1,  baseY: 0.79 },
]

export function WavesTheme() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    let W = 0
    let H = 0
    let animId: number
    let t = 0

    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
    }

    resize()

    const ctx = canvas.getContext("2d")!

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      for (const layer of LAYERS) {
        ctx.beginPath()
        ctx.moveTo(0, H)

        for (let px = 0; px <= W; px += 3) {
          const fx = px / W
          const y =
            layer.baseY * H
            - Math.sin(fx * Math.PI * 3.8 + t * layer.speed                       ) * layer.amp
            - Math.sin(fx * Math.PI * 2.1 + t * layer.speed * 0.6 + layer.phase   ) * layer.amp * 0.55
            - Math.sin(fx * Math.PI * 5.7 + t * layer.speed * 1.3 + layer.phase * 1.6) * layer.amp * 0.28
          ctx.lineTo(px, y)
        }

        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fillStyle = layer.color
        ctx.fill()
      }

      t += 0.022
      animId = requestAnimationFrame(draw)
    }

    draw()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.30]"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)' }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '220px', display: 'block' }}
      />
    </div>
  )
}
