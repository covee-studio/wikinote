import type { FC } from 'react'
import { WavesTheme } from '../components/zen/WavesTheme'
import { MistTheme } from '../components/zen/MistTheme'
import { DawnTheme } from '../components/zen/DawnTheme'
import { ConstellationTheme, ConstellationPreview } from '../components/zen/ConstellationTheme'
import { PaperTheme } from '../components/zen/PaperTheme'
import { RipplesTheme, RipplesPreview } from '../components/zen/RipplesTheme'
import { MountainsTheme, MountainsPreview } from '../components/zen/MountainsTheme'
import { BambooTheme, BambooPreview } from '../components/zen/BambooTheme'
import { OceanTheme, OceanPreview } from '../components/zen/OceanTheme'
import { RainbowTheme, RainbowPreview } from '../components/zen/RainbowTheme'
import { SunriseTheme, SunrisePreview } from '../components/zen/SunriseTheme'
import { SnowTheme, SnowPreview } from '../components/zen/SnowTheme'

export interface ZenTheme {
  id: string
  name: string
  surface: string
  swatch?: string
  Preview?: FC
  Backdrop: FC
  dark?: boolean
}

export const ZEN_THEMES: ZenTheme[] = [
  {
    id: 'waves',
    name: 'Waves',
    surface: 'linear-gradient(180deg, #f8f7f4 0%, #f3f2ee 55%, #ecebe7 100%)',
    swatch: 'linear-gradient(180deg, #f3f2ee 40%, #9fb0a8 100%)',
    Backdrop: WavesTheme,
  },
  {
    id: 'ripples',
    name: 'Ripples',
    surface: '#eef2f0',
    Preview: RipplesPreview,
    Backdrop: RipplesTheme,
  },
  {
    id: 'mist',
    name: 'Mist',
    surface: '#f5f5f4',
    swatch: 'radial-gradient(circle at 30% 35%, #c3d0d6 0%, #f3f1ee 60%)',
    Backdrop: MistTheme,
  },
  {
    id: 'dawn',
    name: 'Dawn',
    surface: '#f3eee9',
    swatch: 'linear-gradient(180deg, #eef0f3 0%, #f6e8de 70%, #f4ddd0 100%)',
    Backdrop: DawnTheme,
  },
  {
    id: 'constellation',
    name: 'Stars',
    surface: 'linear-gradient(180deg, #0e1320 0%, #1b2236 50%, #161a28 100%)',
    Preview: ConstellationPreview,
    Backdrop: ConstellationTheme,
    dark: true,
  },
  {
    id: 'paper',
    name: 'Paper',
    surface: '#faf8f3',
    swatch: '#f6f1e7',
    Backdrop: PaperTheme,
  },
  {
    id: 'mountains',
    name: 'Mountains',
    surface: 'linear-gradient(180deg, #f3ede0 0%, #e9e1cf 100%)',
    Preview: MountainsPreview,
    Backdrop: MountainsTheme,
  },
  {
    id: 'bamboo',
    name: 'Bamboo',
    surface: 'linear-gradient(180deg, #d9e0dc 0%, #dbe2dd 100%)',
    Preview: BambooPreview,
    Backdrop: BambooTheme,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    surface: 'linear-gradient(180deg, #e7eef0 0%, #aec6c5 100%)',
    Preview: OceanPreview,
    Backdrop: OceanTheme,
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    surface: 'linear-gradient(180deg, #eaeef1 0%, #f1f0ec 70%, #e9ebe7 100%)',
    Preview: RainbowPreview,
    Backdrop: RainbowTheme,
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    surface: 'linear-gradient(180deg, #e7ecf1 0%, #f3ede4 55%, #f6e4cd 100%)',
    Preview: SunrisePreview,
    Backdrop: SunriseTheme,
  },
  {
    id: 'snow',
    name: 'Snow',
    surface: 'linear-gradient(180deg, #e8edf1 0%, #eef1f3 100%)',
    Preview: SnowPreview,
    Backdrop: SnowTheme,
  },
]
