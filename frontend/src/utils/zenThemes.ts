import type { FC } from 'react'
import { WavesTheme } from '../components/zen/WavesTheme'
import { MistTheme } from '../components/zen/MistTheme'
import { DawnTheme } from '../components/zen/DawnTheme'
import { ConstellationTheme } from '../components/zen/ConstellationTheme'
import { PaperTheme } from '../components/zen/PaperTheme'
import { RipplesTheme } from '../components/zen/RipplesTheme'

export interface ZenTheme {
  id: string
  name: string
  surface: string
  swatch: string
  Backdrop: FC
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
    name: 'Constellation',
    surface: '#f6f6f5',
    swatch: 'radial-gradient(rgba(100,116,139,0.4) 1.2px, #f3f3f2 1.2px)',
    Backdrop: ConstellationTheme,
  },
  {
    id: 'paper',
    name: 'Paper',
    surface: '#faf8f3',
    swatch: '#f6f1e7',
    Backdrop: PaperTheme,
  },
  {
    id: 'ripples',
    name: 'Ripples',
    surface: '#eef2f0',
    swatch:
      'radial-gradient(circle, transparent 30%, rgba(86,108,98,0.45) 31%, transparent 34%, transparent 52%, rgba(86,108,98,0.32) 53%, transparent 56%, transparent 72%, rgba(86,108,98,0.22) 73%, transparent 76%)',
    Backdrop: RipplesTheme,
  },
]
