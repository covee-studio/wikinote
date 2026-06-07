// Feed cache — stale-while-revalidate for new tab instant loading.
// On mount: reads synchronously from localStorage (instant, no flicker).
// After fetch: writes back to localStorage + chrome.storage so the next
// new tab can immediately show the cached cards while a background refresh runs.

import type { DiscoveryItem } from "../types/DiscoveryItem"
import { StorageAdapter } from "./environment"

export const CACHE_TTL_MS = 30 * 60 * 1000   // 30 min — if younger, skip refetch
const PREFIX = "wikinote-feed-v1-"

interface CacheEntry {
  items: DiscoveryItem[]
  timestamp: number
}

export const feedCache = {
  /** Synchronous read from localStorage mirror — used as react-query initialData */
  getSync(key: string): CacheEntry | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return null
      return JSON.parse(raw) as CacheEntry
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
    await StorageAdapter.set(PREFIX + key, entry)
  },

  /** Stable key for a given source + language + non-secret config fingerprint */
  key(adapterId: string, langId: string, configFingerprint: string): string {
    return `${adapterId}-${langId}-${configFingerprint.slice(0, 40)}`
  },
}
