import type { DiscoveryItem, SourceId } from "../types/DiscoveryItem"
import { StorageAdapter } from "./environment"

export type FavoriteSyncStatus = "unavailable" | "disabled" | "syncing" | "synced" | "error"

export interface LikeRecord {
  id: string
  item?: DiscoveryItem
  updatedAt: number
  deleted?: boolean
}

interface SyncItem {
  id: string
  source: SourceId
  title: string
  url: string
  raw: Record<string, unknown>
}

interface SyncRecord {
  id: string
  updatedAt: number
  deleted?: boolean
  item?: SyncItem
}

interface SyncManifest {
  version: 1
  chunks: string[]
}

const MANIFEST_KEY = "wikinote-favorites-sync-v1"
const CHUNK_PREFIX = "wikinote-favorites-sync-v1-chunk-"
const CHUNK_BYTE_LIMIT = 6500
const TOTAL_BYTE_LIMIT = 95000
const MAX_TEXT_LENGTH = 1200

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown, maxLength = MAX_TEXT_LENGTH): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  return value.trim().slice(0, maxLength)
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function pickDefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
}

function hypothesisQuote(raw: Record<string, unknown>): string | undefined {
  const target = Array.isArray(raw.target) ? raw.target : []
  for (const targetEntry of target) {
    const selectors = asRecord(targetEntry).selector
    if (!Array.isArray(selectors)) continue
    for (const selectorEntry of selectors) {
      const selector = asRecord(selectorEntry)
      if (selector.type === "TextQuoteSelector") {
        const exact = stringValue(selector.exact)
        if (exact) return exact
      }
    }
  }
  return undefined
}

function compactRaw(item: DiscoveryItem): Record<string, unknown> {
  const raw = asRecord(item.raw)

  switch (item.source) {
    case "weread":
      // WeRead favorites are local-only and filtered before serialization.
      return {}
    case "wikipedia":
      return pickDefined({
        pageid: numberValue(raw.pageid),
        title: stringValue(raw.title, 300),
        displaytitle: stringValue(raw.displaytitle, 300),
        extract: stringValue(raw.extract),
        thumbnail: asRecord(raw.thumbnail).source
          ? { source: stringValue(asRecord(raw.thumbnail).source, 500) }
          : undefined,
        url: stringValue(raw.url, 500),
      })
    case "hackernews":
      return pickDefined({
        id: numberValue(raw.id),
        title: stringValue(raw.title, 300),
        url: stringValue(raw.url, 500),
        score: numberValue(raw.score),
        commentCount: numberValue(raw.commentCount),
        author: stringValue(raw.author, 120),
        time: numberValue(raw.time),
      })
    case "memos":
      return pickDefined({
        uid: stringValue(raw.uid, 300),
        title: stringValue(raw.title, 300),
        // Deliberately sync the preview only, not the complete private memo.
        excerpt: stringValue(raw.excerpt),
        displayTime: stringValue(raw.displayTime, 80),
        tags: Array.isArray(raw.tags)
          ? raw.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12).map((tag) => tag.slice(0, 80))
          : undefined,
        imageUrl: stringValue(raw.imageUrl, 500),
        endpoint: stringValue(raw.endpoint, 500),
      })
    case "hypothesis": {
      const document = asRecord(raw.document)
      return pickDefined({
        id: stringValue(raw.id, 300),
        uri: stringValue(raw.uri, 1000),
        // Store the selected quote directly rather than the complete selector
        // tree. The latter is useful to Hypothesis, but unnecessary in Likes
        // and can consume most of Chrome Sync's per-item quota.
        quote: hypothesisQuote(raw),
        text: stringValue(raw.text),
        user: stringValue(raw.user, 300),
        created: stringValue(raw.created, 80),
        updated: stringValue(raw.updated, 80),
        tags: Array.isArray(raw.tags)
          ? raw.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12).map((tag) => tag.slice(0, 80))
          : undefined,
        group: stringValue(raw.group, 300),
        document: pickDefined({
          title: Array.isArray(document.title)
            ? document.title.filter((title): title is string => typeof title === "string").slice(0, 4).map((title) => title.slice(0, 300))
            : undefined,
          link: Array.isArray(document.link)
            ? document.link.slice(0, 4).map((link) => pickDefined({ href: stringValue(asRecord(link).href, 1000) }))
            : undefined,
        }),
      })
    }
  }
}

function toSyncRecord(record: LikeRecord): SyncRecord {
  return {
    id: record.id,
    updatedAt: record.updatedAt,
    ...(record.deleted ? { deleted: true } : record.item ? { item: {
      id: record.item.id,
      source: record.item.source,
      title: record.item.title.slice(0, 300),
      url: record.item.url.slice(0, 1000),
      raw: compactRaw(record.item),
    } } : {}),
  }
}

function fromSyncRecord(record: SyncRecord): LikeRecord | null {
  if (!record || typeof record.id !== "string" || typeof record.updatedAt !== "number") return null
  if (record.deleted) return { id: record.id, updatedAt: record.updatedAt, deleted: true }
  const item = record.item
  if (
    !item ||
    typeof item.id !== "string" ||
    !["wikipedia", "hackernews", "memos", "hypothesis"].includes(item.source) ||
    typeof item.title !== "string" ||
    typeof item.url !== "string" ||
    !/^https?:\/\//i.test(item.url)
  ) return null
  return {
    id: record.id,
    updatedAt: record.updatedAt,
    item: {
      id: item.id,
      source: item.source,
      title: item.title,
      url: item.url,
      raw: asRecord(item.raw),
    },
  }
}

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

function chunkRecords(records: SyncRecord[]): SyncRecord[][] {
  const chunks: SyncRecord[][] = []
  let current: SyncRecord[] = []
  for (const record of records) {
    if (byteLength(record) > CHUNK_BYTE_LIMIT) {
      throw new Error("A favorite preview exceeds Chrome Sync item quota")
    }
    const candidate = [...current, record]
    if (current.length > 0 && byteLength(candidate) > CHUNK_BYTE_LIMIT) {
      chunks.push(current)
      current = [record]
    } else {
      current = candidate
    }
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

function isSyncManifest(value: unknown): value is SyncManifest {
  const manifest = asRecord(value)
  return manifest.version === 1 && Array.isArray(manifest.chunks) && manifest.chunks.every((key) => typeof key === "string")
}

export function isFavoriteSyncAvailable(): boolean {
  return StorageAdapter.isSyncAvailable()
}

export async function readFavoriteSyncRecords(): Promise<{ records: LikeRecord[]; chunkKeys: string[] }> {
  const manifest = await StorageAdapter.syncGet<SyncManifest>(MANIFEST_KEY)
  if (!isSyncManifest(manifest) || manifest.chunks.length === 0) return { records: [], chunkKeys: [] }

  const values = await StorageAdapter.syncGetMany(manifest.chunks)
  const records = manifest.chunks.flatMap((key) => {
    const chunk = values[key]
    return Array.isArray(chunk) ? chunk.map((record) => fromSyncRecord(record as SyncRecord)).filter(Boolean) as LikeRecord[] : []
  })
  return { records, chunkKeys: manifest.chunks }
}

export async function writeFavoriteSyncRecords(records: LikeRecord[], previousChunkKeys: string[] = []): Promise<void> {
  const syncRecords = records.filter(record => !record.id.startsWith('weread-') && record.item?.source !== 'weread').map(toSyncRecord)
  if (byteLength(syncRecords) > TOTAL_BYTE_LIMIT) {
    throw new Error("Favorites exceed Chrome Sync storage quota")
  }
  const chunks = chunkRecords(syncRecords)
  const chunkKeys = chunks.map((_, index) => `${CHUNK_PREFIX}${index}`)
  const values: Record<string, unknown> = {
    [MANIFEST_KEY]: { version: 1, chunks: chunkKeys } satisfies SyncManifest,
  }
  chunks.forEach((chunk, index) => { values[chunkKeys[index]] = chunk })
  await StorageAdapter.syncSet(values)

  const obsoleteKeys = previousChunkKeys.filter((key) => !chunkKeys.includes(key))
  await StorageAdapter.syncRemove(obsoleteKeys)
}

export function subscribeToFavoriteSyncChanges(listener: () => void): () => void {
  return StorageAdapter.onSyncChange((keys) => {
    if (keys.includes(MANIFEST_KEY) || keys.some((key) => key.startsWith(CHUNK_PREFIX))) listener()
  })
}
