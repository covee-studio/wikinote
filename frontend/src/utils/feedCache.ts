// Feed cache — stale-while-revalidate for new tab instant loading.
// On mount: reads synchronously from localStorage (instant, no flicker).
// After fetch: writes back to localStorage + chrome.storage so the next
// new tab can immediately show the cached cards while a background refresh runs.

import type { DiscoveryItem } from "../types/DiscoveryItem"
import { StorageAdapter } from "./environment"

export const CACHE_TTL_MS = 30 * 60 * 1000   // 30 min — if younger, skip refetch
const PREFIX = "wikinote-feed-v2-"

interface CacheEntry {
  items: DiscoveryItem[]
  timestamp: number
}

export const feedCache = {
  /** Disconnect removes fetch caches, but never intentionally saved favorites. */
  async clearSource(sourceId: string): Promise<void> {
    const prefixes = [`wikinote-feed-v1-${sourceId}-`, `wikinote-feed-v2-${sourceId}-`, `wikinote-${sourceId}-cursor-`]
    if (sourceId === 'weread') prefixes.push('wikinote-weread-v1-')
    const keys = Object.keys(localStorage).filter(key => prefixes.some(prefix => key.startsWith(prefix)))
    await Promise.all(keys.map(key => StorageAdapter.remove(key).catch(() => undefined)))
  },
  /** Synchronous read from localStorage mirror — used as react-query initialData */
  getSync(key: string): CacheEntry | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return null
      const entry = JSON.parse(raw) as CacheEntry
      return typeof entry.timestamp === 'number' && Array.isArray(entry.items) && entry.items.every(item => item && typeof item.id === 'string' && typeof item.title === 'string' && item.raw) ? entry : null
    } catch {
      return null
    }
  },

  /** Persist to localStorage (sync for next read) and chrome.storage (async, for extension durability) */
  async set(key: string, items: DiscoveryItem[]): Promise<void> {
    const entry: CacheEntry = { items, timestamp: Date.now() }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(entry))
    } catch {
      // quota exceeded — ignore
    }
    try { await StorageAdapter.set(PREFIX + key, entry) } catch { /* A cache miss is recoverable. */ }
  },

  /** Stable key for a given source + language + non-secret config fingerprint */
  key(adapterId: string, langId: string, configFingerprint: string): string {
    return `${adapterId}-${langId}-${configFingerprint}`
  },
}
