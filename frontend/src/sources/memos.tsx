import type { DiscoveryItem } from "../types/DiscoveryItem"
import type { CardRenderProps, FetchConfig, LikePreview, SourceAdapter, ZenContentData } from "./adapter"
import { MemoCard } from "../components/MemoCard"
import { Calendar as CalendarIcon } from "lucide-react"
import { formatDateLong } from "../utils/formatting"
import { normalizeUrl } from "../utils/environment"

// ─── Raw shape — internal to this adapter ─────────────────────
export interface MemoRaw {
  uid: string
  content: string
  title: string        // extracted from content
  excerpt: string      // extracted from content
  displayTime: string
  tags: string[]
  imageUrl?: string    // first image resource, if any
  endpoint: string     // base URL, stored for URL construction
}

// ─── Memos API types ──────────────────────────────────────────
interface MemosApiResource {
  name: string           // "resources/1"
  filename: string
  type?: string          // "image/jpeg" etc.
  externalLink?: string
}

interface MemosApiMemo {
  name: string           // "memos/1"
  uid: string
  content: string
  displayTime?: string
  createTime?: string
  tags?: string[]
  resources?: MemosApiResource[]
}

// ─── Content helpers ──────────────────────────────────────────
const MARKDOWN_INLINE = /[*_`~[\]()!#>\\]/g

function extractTitle(content: string): string {
  const lines = content.split("\n")
  for (const line of lines) {
    const cleaned = line.replace(/^#+\s*/, "").trim()
    if (cleaned) return cleaned.slice(0, 120)
  }
  return "Untitled memo"
}

function extractExcerpt(content: string): string {
  const lines = content.split("\n")
  // Skip the first non-empty line (used as title)
  let skippedTitle = false
  const excerptLines: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (!skippedTitle) { skippedTitle = true; continue }
    const clean = trimmed.replace(/^#+\s*/, "").replace(MARKDOWN_INLINE, "").trim()
    if (clean) excerptLines.push(clean)
    if (excerptLines.join(" ").length > 200) break
  }
  return excerptLines.join(" ").slice(0, 220)
}

function getImageUrl(endpoint: string, resources: MemosApiResource[]): string | undefined {
  const imgResource = resources.find((r) => r.type?.startsWith("image/"))
  if (!imgResource) return undefined
  if (imgResource.externalLink) return imgResource.externalLink
  // Internal Memos resource URL: /file/{resource.name}/{filename}
  return `${endpoint.replace(/\/$/, "")}/file/${imgResource.name}/${imgResource.filename}`
}

// ─── Fetch ────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Window-cycling cursor ─────────────────────────────────────
// Divides the full history into non-overlapping PAGE_SIZE windows and
// cycles through them in order. This guarantees every note is surfaced
// before any repeats, regardless of totalSize.
interface MemosCursor {
  windowIndex: number   // which window we'll fetch NEXT
  totalWindows: number  // how many windows exist for the current totalSize
  totalSize: number     // snapshot of totalSize when cursor was written
}

function cursorKey(endpointHash: string): string {
  return `wikinote-memos-cursor-${endpointHash}`
}

function endpointHash(base: string): string {
  let h = 5381
  for (let i = 0; i < base.length; i++) h = (h * 33) ^ base.charCodeAt(i)
  return (h >>> 0).toString(36)
}

function readCursor(key: string): MemosCursor | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as MemosCursor) : null
  } catch { return null }
}

function writeCursor(key: string, cursor: MemosCursor): void {
  try { localStorage.setItem(key, JSON.stringify(cursor)) } catch { /* quota */ }
}

async function fetchMemos(endpoint: string, token: string): Promise<DiscoveryItem[]> {
  const base = normalizeUrl(endpoint).replace(/\/$/, "")
  const headers = { Authorization: `Bearer ${token}` }
  const PAGE_SIZE = 30

  // ── Step 1: probe for total note count ──────────────────────────────────
  let totalSize = 0
  try {
    const probeResp = await fetch(`${base}/api/v1/memos?pageSize=1`, { headers })
    if (probeResp.ok) {
      const probeData = await probeResp.json()
      totalSize = typeof probeData.totalSize === "number" ? probeData.totalSize : 0
    }
  } catch { /* probe failed — offset stays 0 */ }

  // ── Step 2: pick the next non-overlapping window ─────────────────────────
  // Divides history into ceil(totalSize / PAGE_SIZE) windows. The last window
  // may return fewer than PAGE_SIZE items — that's fine and avoids overlap.
  // Never clamp the offset to totalSize - PAGE_SIZE (that would cause the last
  // two windows to overlap by up to PAGE_SIZE - 1 items).
  let offset = 0
  let cursorKeyToWrite: string | null = null
  let nextCursor: MemosCursor | null = null
  if (totalSize > 0) {
    const ck = cursorKey(endpointHash(base))
    const totalWindows = Math.ceil(totalSize / PAGE_SIZE)
    const saved = readCursor(ck)

    // Reset cursor whenever totalSize changed at all — Memos is time-ordered,
    // so even one new note shifts all offset boundaries.
    const windowIndex = (!saved || saved.totalSize !== totalSize) ? 0 : saved.windowIndex

    offset = windowIndex * PAGE_SIZE

    // Advance and wrap after the window is fetched successfully. Advancing
    // before the request would skip a window when the network is unavailable.
    cursorKeyToWrite = ck
    nextCursor = {
      windowIndex: (windowIndex + 1) % totalWindows,
      totalWindows,
      totalSize,
    }
  }

  // ── Step 3: fetch the window ─────────────────────────────────────────────
  const url = `${base}/api/v1/memos?pageSize=${PAGE_SIZE}&offset=${offset}`
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`Memos API error: ${resp.status}`)

  const data = await resp.json()

  // API shape: { memos: MemosApiMemo[] }  (some older versions return a plain array)
  const memoList: MemosApiMemo[] = Array.isArray(data) ? data : (data.memos ?? [])

  if (cursorKeyToWrite && nextCursor) writeCursor(cursorKeyToWrite, nextCursor)

  const items = memoList
    .filter((m) => m.content?.trim())
    .map((m): DiscoveryItem => {
      const uid = m.uid || m.name?.split("/").pop() || String(Math.random())
      const title = extractTitle(m.content)
      const excerpt = extractExcerpt(m.content)
      const imageUrl = m.resources?.length ? getImageUrl(base, m.resources) : undefined
      const raw: MemoRaw = {
        uid,
        content: m.content,
        title,
        excerpt,
        displayTime: m.displayTime ?? m.createTime ?? new Date().toISOString(),
        tags: m.tags ?? [],
        imageUrl,
        endpoint: base,
      }
      return {
        id: `memo-${uid}`,
        source: "memos",
        title,
        url: `${base}/m/${uid}`,
        raw,
      }
    })

  // Shuffle within the window so notes don't always appear in chronological order
  return shuffleArray(items)
}

// ─── Zen mode helpers ─────────────────────────────────────────
function stripHashtagLines(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return true
      return !t.split(/\s+/).every((tok) => tok.startsWith('#'))
    })
    .join('\n')
    .trim()
}

// ─── Gradient helpers (same as TextCard / HN) ─────────────────
function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  return Math.abs(hash) % 360
}

function heroGradient(hue: number): string {
  const h2 = (hue + 40) % 360
  return `linear-gradient(135deg, hsl(${hue},45%,88%) 0%, hsl(${h2},38%,93%) 100%)`
}

// ─── Adapter ──────────────────────────────────────────────────
export const memosAdapter: SourceAdapter = {
  id: "memos",
  label: "Memos",
  description: "Your personal notes from a self-hosted Memos instance.",
  color: "#1e293b",
  logoSrc: "/source-icons/memos.png",
  requiresConfig: true,
  // Always refetch on mount so the window cursor advances on every new tab,
  // even within the global feed-cache TTL window. Cached data is only used
  // when a fresh request fails, so a new tab never flashes an old memo before
  // replacing it with the next window.
  cacheTtlMs: 0,
  showCachedWhileRefetching: false,
  fallbackToCachedDataOnError: true,
  replaceAnchorOnRefetch: true,
  configSchema: [
    {
      key: "endpoint",
      label: "Instance URL",
      placeholder: "https://memos.example.com",
      hint: "The base URL of your Memos instance",
      isUrl: true,
    },
    {
      key: "token",
      label: "API Token",
      placeholder: "Paste your API token here",
      secret: true,
      hint: "Find it in Memos → Settings → Account",
    },
  ],

  async fetch(config?: FetchConfig): Promise<DiscoveryItem[]> {
    const endpoint = config?.sourceConfig?.endpoint?.trim()
    const token = config?.sourceConfig?.token?.trim()
    // Gracefully return empty when not configured — no error shown
    if (!endpoint || !token) return []
    return fetchMemos(endpoint, token)
  },

  renderCard(item: DiscoveryItem, props: CardRenderProps) {
    return <MemoCard item={item} priority={props.priority} />
  },

  getLikePreview(item: DiscoveryItem): LikePreview {
    const raw = item.raw as MemoRaw
    const thumbnailNode = raw.imageUrl ? (
      <img
        src={raw.imageUrl}
        alt={raw.title}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />
    ) : (
      <div
        className="w-16 h-16 rounded-lg flex-shrink-0"
        style={{ background: heroGradient(stringToHue(raw.uid)) }}
      />
    )
    const tagStr = raw.tags.length ? raw.tags.map((t) => `#${t}`).join(" ") + " · " : ""
    return {
      thumbnailNode,
      descriptionText: tagStr + (raw.excerpt || raw.content.slice(0, 100)),
      titleHoverClass: "hover:text-slate-700",
    }
  },

  getSearchText(item: DiscoveryItem): string {
    const raw = item.raw as MemoRaw
    return `${item.title} ${raw.excerpt} ${raw.tags.join(" ")}`
  },

  getExportData(item: DiscoveryItem): Record<string, unknown> {
    const raw = item.raw as MemoRaw
    return {
      title: item.title,
      url: item.url,
      source: "memos",
      content: raw.content,
      tags: raw.tags,
      displayTime: raw.displayTime,
    }
  },

  getZenContent(item: DiscoveryItem): ZenContentData {
    const raw = item.raw as MemoRaw
    const primary = stripHashtagLines(raw.content)
    return {
      primary,
      contentKind: "body",
      primaryScrollable: { maxHeightVh: 55 },
      metaNode: (
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3" strokeWidth={2} />
            {formatDateLong(raw.displayTime)}
          </span>
          {raw.tags.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="font-mono">{raw.tags.slice(0, 4).map((t) => `#${t}`).join('  ')}</span>
            </>
          )}
        </span>
      ),
      accent: '#64748b',
      accentText: '#475569',
      sourceLabel: 'Memos',
      noLink: true,
    }
  },
}
