import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { sceneRandom, snowParticles, starParticles, waveY } from '../src/components/zen/sceneGeometry'
import { MountainsTheme, MountainsPreview } from '../src/components/zen/MountainsTheme'
import { RainbowTheme, RainbowPreview } from '../src/components/zen/RainbowTheme'
import { SnowTheme } from '../src/components/zen/SnowTheme'
import { RipplesTheme, RipplesPreview } from '../src/components/zen/RipplesTheme'
import { BambooTheme } from '../src/components/zen/BambooTheme'
import { ConstellationTheme } from '../src/components/zen/ConstellationTheme'
import { MistTheme } from '../src/components/zen/MistTheme'
import { OceanTheme, OceanPreview } from '../src/components/zen/OceanTheme'
import { WavesPreview } from '../src/components/zen/WavesTheme'
import { ZEN_THEMES } from '../src/utils/zenThemes'

it('keeps scene randomness repeatable and bounded', () => {
  const a = sceneRandom(123), b = sceneRandom(123)
  for (let i = 0; i < 100; i++) {
    const value = a()
    expect(value).toBe(b())
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(1)
  }
})

it('starts snow throughout its fall cycle instead of waiting offscreen', () => {
  const flakes = snowParticles(76)
  expect(flakes).toHaveLength(76)
  expect(new Set(flakes.map(f => f.depth)).size).toBe(3)
  expect(flakes.every(f => f.delay < 0 && f.delay > -f.duration)).toBe(true)
  const bands = new Set(flakes.map(f => Math.floor(-f.delay / f.duration * 4)))
  expect(bands.size).toBe(4)
  expect(snowParticles(76)).toEqual(flakes)
})

it('places stars within the scene with varied sizes and brightness', () => {
  const stars = starParticles(96)
  expect(stars).toHaveLength(96)
  expect(stars.every(s => s.x >= 0 && s.x < 100 && s.y >= 0 && s.y < 100)).toBe(true)
  expect(stars.every(s => s.opacity > 0 && s.opacity <= 1)).toBe(true)
  expect(new Set(stars.map(s => s.size)).size).toBeGreaterThan(80)
})

it('does not collide SVG gradient or mask IDs between thumbnails and full scenes', () => {
  const html = renderToStaticMarkup(createElement(Fragment, null,
    createElement(MountainsTheme), createElement(MountainsPreview), createElement(RainbowTheme), createElement(RainbowPreview), createElement(OceanTheme), createElement(OceanPreview)))
  const ids = Array.from(html.matchAll(/ id="([^"]+)"/g), match => match[1])
  expect(ids.length).toBeGreaterThan(10)
  expect(new Set(ids).size).toBe(ids.length)
  for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref)
})

it('renders decorative scenes without interactive or external content', () => {
  for (const Component of [MountainsTheme, RainbowTheme, SnowTheme, RipplesTheme, BambooTheme, ConstellationTheme, MistTheme, OceanTheme]) {
    const html = renderToStaticMarkup(createElement(Component))
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toMatch(/<(button|a|iframe|img)\b|https?:\/\//)
  }
})

it('keeps the saved rainbow identity when presenting the After rain redesign', () => {
  expect(ZEN_THEMES).toHaveLength(11)
  expect(ZEN_THEMES.find(theme => theme.id === 'rainbow')?.name).toBe('After rain')
  expect(new Set(ZEN_THEMES.map(theme => theme.id)).size).toBe(11)
})

it('starts the flock in flight and schedules the first meteor within one second', () => {
  const mountains = renderToStaticMarkup(createElement(MountainsTheme))
  const stars = renderToStaticMarkup(createElement(ConstellationTheme))
  expect(mountains).toContain('animation-delay:-7s')
  const firstMeteor = stars.match(/class="scene-meteor" style="([^"]+)"/)?.[1]
  expect(firstMeteor).toContain('animation-delay:0.35s')
})

it('uses a bounded ripple pool and meteor set, with no runtime accumulation', () => {
  const water = renderToStaticMarkup(createElement(RipplesTheme))
  const stars = renderToStaticMarkup(createElement(ConstellationTheme))
  expect(water.match(/class="water-ring"/g)).toHaveLength(20)
  expect(stars.match(/class="scene-meteor"/g)).toHaveLength(3)
})

it('scales wave relief with the canvas and keeps layers vertically alive', () => {
  const layer = { color: '#fff', speed: 0.3, amplitude: 0.08, phase: 0.2, baseY: 0.4, frequency: 1.1, direction: 1 } as const
  const small = waveY(layer, 0.3, 200, 1.5) - layer.baseY * 200
  const large = waveY(layer, 0.3, 400, 1.5) - layer.baseY * 400
  expect(large).toBeCloseTo(small * 2)
  expect(waveY(layer, 0.3, 200, 1.5)).not.toBeCloseTo(waveY(layer, 0.3, 200, 3.5))
  expect(waveY(layer, 0.3, 200, 1.5, 1)).not.toBeCloseTo(waveY(layer, 0.3, 200, 1.5, 1.75))
  const normalRelief = waveY(layer, 0.3, 200, 1.5, 1, 1) - layer.baseY * 200
  const desktopRelief = waveY(layer, 0.3, 200, 1.5, 1, 1.4) - layer.baseY * 200
  expect(Math.abs(desktopRelief)).toBeGreaterThan(Math.abs(normalRelief))
})

it('uses artwork without a center marker for the waves preview', () => {
  const html = renderToStaticMarkup(createElement(WavesPreview))
  expect(html.match(/<path/g)).toHaveLength(3)
  expect(html).not.toMatch(/<(circle|ellipse)\b/)
})

it('keeps the ripples preview free of decorative drop dots', () => {
  const html = renderToStaticMarkup(createElement(RipplesPreview))
  expect(html.match(/<path/g)).toHaveLength(4)
  expect(html).not.toContain('water-drop')
  expect(html).not.toMatch(/<(circle|ellipse)\b/)
})
