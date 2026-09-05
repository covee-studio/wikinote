import { BookOpen } from 'lucide-react'
import type { DiscoveryItem } from '../types/DiscoveryItem'
import type { SourceAdapter } from './adapter'
import { fetchWeReadNotes } from './wereadClient'
import type { WeReadNote } from './wereadClient'

export const wereadAdapter: SourceAdapter = {
  id: 'weread', label: '微信读书',
  description: 'Rediscover your own book highlights and reading thoughts.',
  color: '#517b70', requiresConfig: true,
  permissionOrigin: 'https://i.weread.qq.com',
  setupUrl: 'https://weread.qq.com/r/weread-skills',
  setupLabel: 'Get your WeRead API Key',
  setupHint: 'Revisit your own highlights and reading thoughts. Your API Key stays on this device. Use the Chrome extension for the best connection.',
  configSchema: [{ key: 'token', label: 'API Key', placeholder: 'wrk-…', secret: true }],
  cacheTtlMs: 0,
  fallbackToCachedDataOnError: false,
  fetch: config => fetchWeReadNotes(config?.sourceConfig?.token ?? '', config?.signal),
  renderCard(item: DiscoveryItem) {
    const raw = item.raw as WeReadNote
    return <article className="reading-note"><blockquote>{raw.quote}</blockquote>{raw.thought && <p>{raw.thought}</p>}<footer>{raw.bookTitle} · {raw.author}</footer></article>
  },
  getLikePreview(item) {
    const raw = item.raw as WeReadNote
    return {
      thumbnailNode: <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><BookOpen className="h-6 w-6" strokeWidth={1.5} /></div>,
      descriptionText: [raw.bookTitle, raw.author, raw.thought].filter(Boolean).join(' · '),
      titleHoverClass: 'hover:text-emerald-800',
    }
  },
  getZenContent(item) {
    const raw = item.raw as WeReadNote
    return {
      primary: raw.quote || raw.thought,
      primaryKind: raw.quote ? 'highlight' : 'note',
      secondary: raw.quote ? raw.thought : undefined,
      secondaryLabel: raw.quote && raw.thought ? '我的想法' : undefined,
      contentKind: 'body',
      metaNode: <span className="inline-flex max-w-full flex-col items-center gap-1.5"><span className="font-serif-editorial text-[14px]">《{raw.bookTitle}》{raw.author && ` · ${raw.author}`}</span>{raw.chapter && <span className="text-[11px]">{raw.chapter}</span>}</span>,
      accent: '#638779', accentText: '#486a5e', sourceLabel: '微信读书', noLink: !item.url,
    }
  },
  getSearchText(item) {
    const raw = item.raw as WeReadNote
    return [raw.quote, raw.thought, raw.bookTitle, raw.author, raw.chapter].join(' ')
  },
  getExportData(item) { return { source: 'weread', url: item.url || null, ...item.raw as WeReadNote } },
}
