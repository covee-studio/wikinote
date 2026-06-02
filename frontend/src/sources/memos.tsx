import type { DiscoveryItem } from "../types/DiscoveryItem"
import type { CardRenderProps, FetchConfig, LikePreview, SourceAdapter } from "./adapter"
import { MemoCard } from "../components/MemoCard"

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
const MARKDOWN_INLINE = /[*_`~\[\]()!#>\\]/g

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
async function fetchMemos(endpoint: string, token: string): Promise<DiscoveryItem[]> {
  const base = endpoint.replace(/\/$/, "")

  // Try the current Memos API (v0.22+): GET /api/v1/memos
  const resp = await fetch(`${base}/api/v1/memos?pageSize=30`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error(`Memos API error: ${resp.status}`)

  const data = await resp.json()

  // API shape: { memos: MemosApiMemo[] }
  const memoList: MemosApiMemo[] = Array.isArray(data) ? data : (data.memos ?? [])

  return memoList
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
  color: "#8b5cf6",
  requiresConfig: true,
  configSchema: [
    {
      key: "endpoint",
      label: "Instance URL",
      placeholder: "https://memos.example.com",
      hint: "The base URL of your Memos instance",
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
    try {
      return await fetchMemos(endpoint, token)
    } catch (err) {
      console.error("[Memos adapter] fetch failed:", err)
      return []
    }
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
      titleHoverClass: "hover:text-purple-600",
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
}
