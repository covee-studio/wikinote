/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Heart } from "lucide-react"
import { StorageAdapter } from "../utils/environment"
import type { DiscoveryItem, SourceId } from "../types/DiscoveryItem"
import {
  isFavoriteSyncAvailable,
  readFavoriteSyncRecords,
  subscribeToFavoriteSyncChanges,
  writeFavoriteSyncRecords,
} from "../utils/favoriteSync"
import type { FavoriteSyncStatus, LikeRecord } from "../utils/favoriteSync"
import "../assets/heartAnimation.css"

// ─── Backward-compatible migration ───────────────────────────
// Converts old localStorage items (WikiArticle | HNArticle) to the new
// normalized DiscoveryItem format. Called once on mount.
function migrateStoredItem(item: unknown): DiscoveryItem | null {
  if (!item || typeof item !== "object") return null
  const obj = item as Record<string, unknown>

  // Already in new normalized format
  if (typeof obj.id === "string" && typeof obj.source === "string" && "raw" in obj) {
    return obj as unknown as DiscoveryItem
  }

  // Old WikiArticle format: { pageid: number, title, url, extract, ... }
  if (typeof obj.pageid === "number") {
    return {
      id: `wiki-${obj.pageid}`,
      source: "wikipedia" as SourceId,
      title: String(obj.title ?? ""),
      url: String(obj.url ?? ""),
      raw: obj,
    }
  }

  // Old HNArticle format: { source: "hackernews", id: number, title, url, ... }
  if (obj.source === "hackernews" && typeof obj.id === "number") {
    return {
      id: `hn-${obj.id}`,
      source: "hackernews" as SourceId,
      title: String(obj.title ?? ""),
      url: String(obj.url ?? ""),
      raw: obj,
    }
  }

  return null
}

// ─── Context ──────────────────────────────────────────────────
interface LikedArticlesContextType {
  likedArticles: DiscoveryItem[]
  toggleLike: (item: DiscoveryItem) => void
  isLiked: (item: DiscoveryItem) => boolean
  syncAvailable: boolean
  syncEnabled: boolean
  syncStatus: FavoriteSyncStatus
  setSyncEnabled: (enabled: boolean) => void
}

const LikedArticlesContext = createContext<LikedArticlesContextType | undefined>(undefined)

const LOCAL_RECORDS_KEY = "wikinote-liked-records-v1"
const SYNC_ENABLED_KEY = "wikinote-favorites-sync-enabled"

function visibleItems(records: Map<string, LikeRecord>): DiscoveryItem[] {
  return [...records.values()]
    .filter((record) => !record.deleted && record.item)
    .sort((a, b) => a.updatedAt - b.updatedAt)
    .map((record) => record.item!)
}

function recordsFromItems(items: DiscoveryItem[]): Map<string, LikeRecord> {
  return new Map(items.map((item) => [item.id, { id: item.id, item, updatedAt: 0 }]))
}

function validLocalRecords(value: unknown): LikeRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter((record): record is LikeRecord => {
    if (!record || typeof record !== "object") return false
    const candidate = record as Partial<LikeRecord>
    return typeof candidate.id === "string" && typeof candidate.updatedAt === "number"
  })
}

function mergeRecords(local: Map<string, LikeRecord>, remote: LikeRecord[]): Map<string, LikeRecord> {
  const merged = new Map(local)
  for (const candidate of remote) {
    const current = merged.get(candidate.id)
    if (!current || candidate.updatedAt > current.updatedAt) {
      merged.set(candidate.id, candidate)
    }
  }
  return merged
}

function sameRecordVersions(a: Map<string, LikeRecord>, b: Map<string, LikeRecord>): boolean {
  if (a.size !== b.size) return false
  for (const [id, record] of a) {
    const other = b.get(id)
    if (!other || other.updatedAt !== record.updatedAt || Boolean(other.deleted) !== Boolean(record.deleted)) return false
  }
  return true
}

export function LikedArticlesProvider({ children }: { children: ReactNode }) {
  const [likedArticles, setLikedArticles] = useState<DiscoveryItem[]>([])
  const [syncAvailable] = useState(() => isFavoriteSyncAvailable())
  const [syncEnabled, setSyncEnabledState] = useState(false)
  const [syncStatus, setSyncStatus] = useState<FavoriteSyncStatus>(syncAvailable ? "disabled" : "unavailable")
  const [hydrated, setHydrated] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const recordsRef = useRef<Map<string, LikeRecord>>(new Map())
  const syncEnabledRef = useRef(false)
  const syncWriteChain = useRef(Promise.resolve())

  const persistLocal = (records: Map<string, LikeRecord>) => {
    const items = visibleItems(records)
    recordsRef.current = records
    setLikedArticles(items)
    void Promise.all([
      StorageAdapter.set("likedArticles", items),
      StorageAdapter.set(LOCAL_RECORDS_KEY, [...records.values()]),
    ])
  }

  const queueSyncWrite = () => {
    if (!syncEnabledRef.current || !syncAvailable) return
    syncWriteChain.current = syncWriteChain.current.then(async () => {
      setSyncStatus("syncing")
      const remote = await readFavoriteSyncRecords()
      const merged = mergeRecords(recordsRef.current, remote.records)
      if (!sameRecordVersions(merged, recordsRef.current)) persistLocal(merged)
      await writeFavoriteSyncRecords([...merged.values()], remote.chunkKeys)
      setSyncStatus("synced")
    }).catch(async () => {
      setSyncStatus("error")
    })
  }

  useEffect(() => {
    let cancelled = false
    const hydrate = async () => {
      const [saved, savedRecords, savedSyncEnabled] = await Promise.all([
        StorageAdapter.get<unknown[]>("likedArticles"),
        StorageAdapter.get<unknown[]>(LOCAL_RECORDS_KEY),
        StorageAdapter.get<boolean>(SYNC_ENABLED_KEY),
      ])
      if (cancelled) return

      const migrated = Array.isArray(saved)
        ? saved.map(migrateStoredItem).filter(Boolean) as DiscoveryItem[]
        : []
      const records = validLocalRecords(savedRecords).length > 0
        ? validLocalRecords(savedRecords)
        : [...recordsFromItems(migrated).values()]
      recordsRef.current = new Map(records.map((record) => [record.id, record]))
      setLikedArticles(visibleItems(recordsRef.current))
      setHydrated(true)

      const shouldSync = syncAvailable && savedSyncEnabled === true
      syncEnabledRef.current = shouldSync
      setSyncEnabledState(shouldSync)
      if (!shouldSync) {
        setSyncStatus(syncAvailable ? "disabled" : "unavailable")
        return
      }

      setSyncStatus("syncing")
      try {
        const remote = await readFavoriteSyncRecords()
        const merged = mergeRecords(recordsRef.current, remote.records)
        persistLocal(merged)
        await writeFavoriteSyncRecords([...merged.values()], remote.chunkKeys)
        if (!cancelled) setSyncStatus("synced")
      } catch {
        if (!cancelled) setSyncStatus("error")
      }
    }
    void hydrate()
    return () => { cancelled = true }
  }, [syncAvailable])

  const toggleLike = (item: DiscoveryItem) => {
    if (!hydrated) return
    const next = new Map(recordsRef.current)
    const existing = next.get(item.id)
    const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1)
    if (existing && !existing.deleted) {
      next.set(item.id, { id: item.id, updatedAt, deleted: true })
    } else {
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 800)
      next.set(item.id, { id: item.id, item, updatedAt })
    }
    persistLocal(next)
    queueSyncWrite()
  }

  const isLiked = (item: DiscoveryItem): boolean =>
    likedArticles.some((a) => a.id === item.id)

  const setSyncEnabled = (enabled: boolean) => {
    if (!syncAvailable || !hydrated) return
    if (enabled) {
      syncEnabledRef.current = true
      setSyncEnabledState(true)
      setSyncStatus("syncing")
      syncWriteChain.current = syncWriteChain.current.then(async () => {
        if (!syncEnabledRef.current) return
        try {
          const remote = await readFavoriteSyncRecords()
          const merged = mergeRecords(recordsRef.current, remote.records)
          persistLocal(merged)
          await writeFavoriteSyncRecords([...merged.values()], remote.chunkKeys)
          await StorageAdapter.set(SYNC_ENABLED_KEY, true)
          setSyncStatus("synced")
        } catch {
          syncEnabledRef.current = false
          setSyncEnabledState(false)
          await StorageAdapter.set(SYNC_ENABLED_KEY, false)
          setSyncStatus("error")
        }
      })
      return
    }

    syncEnabledRef.current = false
    setSyncEnabledState(false)
    setSyncStatus("syncing")
    syncWriteChain.current = syncWriteChain.current.then(async () => {
      // Disabling is local to this Chrome profile. Do not delete the shared
      // cloud copy: another enabled device may still be using it, and a
      // destructive clear here would make a simple toggle lose favorites.
      await StorageAdapter.set(SYNC_ENABLED_KEY, false)
      setSyncStatus("disabled")
    }).catch(async () => {
      await StorageAdapter.set(SYNC_ENABLED_KEY, false)
      setSyncStatus("error")
    })
  }

  useEffect(() => {
    if (!hydrated || !syncEnabled || !syncAvailable) return
    let cancelled = false
    const pullRemote = async () => {
      try {
        setSyncStatus("syncing")
        const remote = await readFavoriteSyncRecords()
        if (cancelled) return
        const merged = mergeRecords(recordsRef.current, remote.records)
        if (!sameRecordVersions(merged, recordsRef.current)) persistLocal(merged)
        if (!sameRecordVersions(merged, new Map(remote.records.map((record) => [record.id, record])))) {
          await writeFavoriteSyncRecords([...merged.values()], remote.chunkKeys)
        }
        if (!cancelled) setSyncStatus("synced")
      } catch {
        if (!cancelled) setSyncStatus("error")
      }
    }
    const unsubscribe = subscribeToFavoriteSyncChanges(() => { void pullRemote() })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [hydrated, syncEnabled, syncAvailable])

  return (
    <LikedArticlesContext.Provider value={{ likedArticles, toggleLike, isLiked, syncAvailable, syncEnabled, syncStatus, setSyncEnabled }}>
      {children}
      {showHeart && (
        <div className="heart-animation">
          <Heart size={200} strokeWidth={0} className="fill-white" />
        </div>
      )}
    </LikedArticlesContext.Provider>
  )
}

export function useLikedArticles() {
  const ctx = useContext(LikedArticlesContext)
  if (!ctx) throw new Error("useLikedArticles must be used within a LikedArticlesProvider")
  return ctx
}
