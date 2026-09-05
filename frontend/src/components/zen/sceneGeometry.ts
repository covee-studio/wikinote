/** Stable layouts avoid rerender jumps and make visual regressions reproducible. */
export function sceneRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function snowParticles(count: number) {
  const random = sceneRandom(2718)
  return Array.from({ length: count }, (_, i) => {
    const depth = i % 3
    const duration = 12 + (2 - depth) * 9 + random() * 10
    return {
      x: random() * 100, size: 1.2 + depth * 1.1 + random() * 1.4,
      duration, delay: -random() * duration, sway: 18 + random() * 42,
      opacity: 0.28 + depth * 0.18 + random() * 0.15, depth,
    }
  })
}

export function starParticles(count: number) {
  const random = sceneRandom(173)
  return Array.from({ length: count }, (_, i) => ({
    x: random() * 100, y: random() * 100,
    size: i % 9 === 0 ? 2.4 + random() : 0.7 + random() * 1.2,
    opacity: 0.22 + random() * 0.65, duration: 3 + random() * 6,
    delay: -random() * 12,
  }))
}

export interface WaveParameters {
  speed: number
  amplitude: number
  phase: number
  baseY: number
  frequency: number
  direction: number
}

export function waveY(layer: WaveParameters, xRatio: number, height: number, elapsed: number, spatialScale = 1, reliefScale = 1) {
  const travel = elapsed * layer.speed * layer.direction
  const breathing = 0.88 + Math.sin(elapsed * 0.31 + layer.phase) * 0.12
  const amplitude = height * layer.amplitude * breathing * reliefScale
  const rise = Math.sin(elapsed * 0.23 + layer.phase * 1.7) * height * 0.018 * reliefScale
  const broadSwell = Math.sin(xRatio * Math.PI * 2 * layer.frequency * spatialScale + travel + layer.phase)
  const crossingScale = 0.75 + spatialScale * 0.25
  const crossingSwell = Math.sin(xRatio * Math.PI * 2 * 0.54 * crossingScale - travel * 0.62 + layer.phase * 1.35) * 0.48
  const crestDetail = Math.sin(xRatio * Math.PI * 2 * 2.15 * spatialScale + travel * 1.35 + layer.phase * 0.7) * 0.13

  return layer.baseY * height + rise - (broadSwell + crossingSwell + crestDetail) * amplitude
}
