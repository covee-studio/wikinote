import type { DiscoveryItem } from "../types/DiscoveryItem"
import type { CardRenderProps, LikePreview, SourceAdapter, ZenContentData } from "./adapter"
import { TextCard } from "../components/TextCard"
import { getDomain, formatRelativeTime } from "../utils/formatting"
import { MessageSquare as MessageSquareIcon } from "lucide-react"

// ─── Raw API shape — internal to this adapter ─────────────────
export interface HNArticleRaw {
  id: number
  title: string
  url: string
  score: number
  commentCount: number
  author: string
  time: number
}

const HN_API = "https://hacker-news.firebaseio.com/v0"
const HN_DISCUSSION_URL = "https://news.ycombinator.com/item?id="
const CANDIDATE_POOL = 200
const BATCH_SIZE = 20

interface HNApiItem {
  id: number
  type: string
  title: string
  url?: string
  score: number
  descendants?: number
  by: string
  time: number
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  return Math.abs(hash) % 360
}

function heroGradient(hue: number): string {
  const h2 = (hue + 35) % 360
  return `linear-gradient(135deg, hsl(${hue},55%,88%) 0%, hsl(${h2},45%,93%) 100%)`
}

async function fetchStories(): Promise<DiscoveryItem[]> {
  const idsResp = await fetch(`${HN_API}/topstories.json`)
  if (!idsResp.ok) throw new Error(`HN API error: ${idsResp.status}`)
  const allIds: number[] = await idsResp.json()

  const candidateIds = pickRandom(allIds.slice(0, CANDIDATE_POOL), BATCH_SIZE)
  const items = await Promise.all(
    candidateIds.map(async (id) => {
      try {
        const resp = await fetch(`${HN_API}/item/${id}.json`)
        return resp.ok ? ((await resp.json()) as HNApiItem) : null
      } catch { return null }
    })
  )

  return items
    .filter((item): item is HNApiItem =>
      item !== null && item.type === "story" && Boolean(item.title) && item.score > 0
    )
    .map((item): DiscoveryItem => {
      const raw: HNArticleRaw = {
        id: item.id,
        title: item.title,
        url: item.url ?? `${HN_DISCUSSION_URL}${item.id}`,
        score: item.score,
        commentCount: item.descendants ?? 0,
        author: item.by,
        time: item.time,
      }
      return {
        id: `hn-${item.id}`,
        source: "hackernews",
        title: item.title,
        url: raw.url,
        raw,
      }
    })
}

export const hackerNewsAdapter: SourceAdapter = {
  id: "hackernews",
  label: "Hacker News",
  description: "Top stories from the Hacker News community.",
  color: "#ff6600",
  logoSrc: "/source-icons/hacker-news.png",

  async fetch(): Promise<DiscoveryItem[]> {
    return fetchStories()
  },

  renderCard(item: DiscoveryItem, props: CardRenderProps) {
    return <TextCard item={item} priority={props.priority} />
  },

  getLikePreview(item: DiscoveryItem): LikePreview {
    const raw = item.raw as HNArticleRaw
    const domain = getDomain(item.url)
    const hue = stringToHue(domain || item.title)
    return {
      thumbnailNode: (
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0"
          style={{ background: heroGradient(hue) }}
        />
      ),
      descriptionText: `${domain || "Hacker News"} · ▲ ${raw.score.toLocaleString()} · ${raw.commentCount} comments`,
      titleHoverClass: "hover:text-orange-600",
    }
  },

  getSearchText(item: DiscoveryItem): string {
    return item.title
  },

  getExportData(item: DiscoveryItem): Record<string, unknown> {
    const raw = item.raw as HNArticleRaw
    return {
      title: item.title,
      url: item.url,
      source: "hackernews",
      score: raw.score,
    }
  },

  getZenContent(item: DiscoveryItem): ZenContentData {
    const raw = item.raw as HNArticleRaw
    const domain = getDomain(item.url)
    return {
      primary: item.title,
      metaNode: (
        <span className="inline-flex items-center flex-wrap justify-center gap-x-2 gap-y-1">
          {domain && <span className="font-mono opacity-85">{domain}</span>}
          {domain && <span className="text-slate-300">·</span>}
          <span><span className="font-medium">{raw.score}</span> points</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquareIcon className="w-3 h-3" strokeWidth={2} />
            <span className="font-medium">{raw.commentCount}</span>
          </span>
          <span className="text-slate-300">·</span>
          <span>{raw.author}</span>
          <span className="text-slate-300">·</span>
          <span>{formatRelativeTime(raw.time)}</span>
        </span>
      ),
      accent: '#b3764e',
      accentText: '#9c603a',
      sourceLabel: 'Hacker News',
    }
  },
}
