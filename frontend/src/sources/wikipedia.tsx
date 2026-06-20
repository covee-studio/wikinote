import type { Language } from "../types/ArticleProps"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import { isSafeArticle } from "../utils/contentSafety"
import { fetchWithCORS } from "../utils/environment"
import type { CardRenderProps, FetchConfig, LikePreview, SourceAdapter, ZenContentData } from "./adapter"
import { WikiCard } from "../components/WikiCard"
import { Clock as ClockIcon } from "lucide-react"

// ─── Raw API shape — internal to this adapter ─────────────────
// Only this adapter and WikiCard (via cast) ever read these fields.
export interface WikiArticleRaw {
  title: string
  displaytitle: string
  extract: string
  pageid: number
  thumbnail?: { source: string; width: number; height: number }
  url: string
}

type WikipediaApiPage = {
  title: string
  varianttitles?: Record<string, string>
  extract: string
  pageid: number
  thumbnail?: { source: string; width: number; height: number }
  canonicalurl: string
  categories?: { title: string }[]
}

const EN_FALLBACK: Language = {
  id: "en",
  name: "English",
  flag: "🇬🇧",
  api: "https://en.wikipedia.org/w/api.php?",
  article: "https://en.wikipedia.org/wiki/",
}

const RANDOM_BATCH_SIZE = "50"
const MIN_ARTICLES = 12
const MAX_RANDOM_ATTEMPTS = 3

async function fetchArticleBatch(language: Language): Promise<DiscoveryItem[]> {
  const response = await fetchWithCORS(
    language.api +
      new URLSearchParams({
        action: "query",
        format: "json",
        generator: "random",
        grnnamespace: "0",
        prop: "extracts|info|pageimages|categories",
        inprop: "url|varianttitles",
        grnlimit: RANDOM_BATCH_SIZE,
        exintro: "1",
        exlimit: "max",
        exsentences: "5",
        explaintext: "1",
        piprop: "thumbnail",
        pithumbsize: "480",
        cllimit: "20",
        clshow: "!hidden",
        origin: "*",
        variant: language.id,
      })
  )
  if (!response.ok) throw new Error(`Wikipedia HTTP error: ${response.status}`)
  const data = await response.json()
  if (!data.query?.pages) throw new Error("Invalid Wikipedia API response")

  const pages = data.query.pages as Record<string, WikipediaApiPage>
  return Object.values(pages)
    .filter((page) => isSafeArticle(page.categories?.map((c) => c.title)))
    .map((page): WikiArticleRaw => ({
      title: page.title,
      displaytitle: page.varianttitles?.[language.id] ?? page.title,
      extract: page.extract,
      pageid: page.pageid,
      thumbnail: page.thumbnail,
      url: page.canonicalurl,
    }))
    .filter((raw) => raw.url && raw.extract)
    .map((raw): DiscoveryItem => ({
      id: `wiki-${raw.pageid}`,
      source: "wikipedia",
      title: raw.title,
      url: raw.url,
      raw,
    }))
}

async function fetchArticles(language: Language): Promise<DiscoveryItem[]> {
  const seen = new Set<string>()
  const articles: DiscoveryItem[] = []

  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS && articles.length < MIN_ARTICLES; attempt++) {
    const batch = await fetchArticleBatch(language)
    for (const item of batch) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      articles.push(item)
    }
  }

  return articles
}

export const wikipediaAdapter: SourceAdapter = {
  id: "wikipedia",
  label: "Wikipedia",
  description: "Random articles from the world's largest encyclopedia.",
  color: "#3b82f6",

  async fetch(config?: FetchConfig): Promise<DiscoveryItem[]> {
    return fetchArticles(config?.language ?? EN_FALLBACK)
  },

  renderCard(item: DiscoveryItem, props: CardRenderProps) {
    return <WikiCard item={item} priority={props.priority} />
  },

  getLikePreview(item: DiscoveryItem): LikePreview {
    const raw = item.raw as WikiArticleRaw
    const thumbnailNode = raw.thumbnail ? (
      <img
        src={raw.thumbnail.source}
        alt={raw.title}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />
    ) : (
      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0" />
    )
    return {
      thumbnailNode,
      descriptionText: raw.extract,
      titleHoverClass: "hover:text-blue-600",
    }
  },

  getSearchText(item: DiscoveryItem): string {
    const raw = item.raw as WikiArticleRaw
    return `${item.title} ${raw.extract}`
  },

  getExportData(item: DiscoveryItem): Record<string, unknown> {
    const raw = item.raw as WikiArticleRaw
    return {
      title: item.title,
      url: item.url,
      source: "wikipedia",
      extract: raw.extract,
      thumbnail: raw.thumbnail?.source ?? null,
    }
  },

  getZenContent(item: DiscoveryItem): ZenContentData {
    const raw = item.raw as WikiArticleRaw
    const mins = Math.max(1, Math.ceil((raw.extract || '').split(/\s+/).filter(Boolean).length / 200))
    return {
      primary: raw.displaytitle,
      secondary: raw.extract,
      imageUrl: raw.thumbnail?.source,
      metaNode: (
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="w-3 h-3" strokeWidth={2} />
          {mins} min read
        </span>
      ),
      accent: '#5e7a96',
      accentText: '#4a6480',
      sourceLabel: 'Wikipedia',
    }
  },
}
