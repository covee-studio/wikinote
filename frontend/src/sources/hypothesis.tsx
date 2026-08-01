import { Calendar, Highlighter, PenLine, Quote, Tag } from "lucide-react"
import { HypothesisCard } from "../components/HypothesisCard"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import type { FetchConfig, LikePreview, SourceAdapter, ZenContentData } from "./adapter"
import { formatDateLong, getDomain } from "../utils/formatting"

const API_URL = "https://hypothes.is/api/search"
const PAGE_SIZE = 20

export interface HypothesisAnnotationRaw {
  id: string
  uri: string
  /** Compact cross-device favorite preview; the API value is derived from target selectors. */
  quote?: string
  text?: string
  user?: string
  created?: string
  updated?: string
  tags?: string[]
  group?: string
  target?: Array<{
    selector?: Array<{
      type?: string
      exact?: string
      prefix?: string
      suffix?: string
    }>
  }>
  document?: {
    title?: string[]
    link?: Array<{ href?: string }>
  }
}

interface HypothesisSearchResponse {
  total?: number
  rows?: HypothesisAnnotationRaw[]
}

interface HypothesisCursor {
  pageOrder: number[]
  position: number
  total: number
  checkedAt: number
}

const TOTAL_REFRESH_MS = 5 * 60 * 1000

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

function configKey(token: string, username: string): string {
  return `${hashString(token)}:${username.toLowerCase()}`
}

function cursorKey(key: string): string {
  return `wikinote-hypothesis-cursor-${hashString(key)}`
}

function shuffledPageOrder(totalPages: number): number[] {
  const order = Array.from({ length: totalPages }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function readCursor(key: string): HypothesisCursor | null {
  try {
    const raw = localStorage.getItem(cursorKey(key))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<HypothesisCursor>
    return Array.isArray(value.pageOrder) &&
      typeof value.position === "number" &&
      typeof value.total === "number" &&
      typeof value.checkedAt === "number"
      ? value as HypothesisCursor
      : null
  } catch {
    return null
  }
}

function writeCursor(key: string, cursor: HypothesisCursor): void {
  try { localStorage.setItem(cursorKey(key), JSON.stringify(cursor)) } catch { /* quota */ }
}

function isValidCursor(cursor: HypothesisCursor | null, total: number): cursor is HypothesisCursor {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (!cursor || cursor.total !== total || cursor.total < 0 || !Number.isInteger(cursor.position) || cursor.position < 0 || cursor.pageOrder.length !== totalPages) return false
  const unique = new Set(cursor.pageOrder)
  return unique.size === totalPages && cursor.pageOrder.every((page) => Number.isInteger(page) && page >= 0 && page < totalPages)
}

function documentTitle(annotation: HypothesisAnnotationRaw): string {
  const title = annotation.document?.title?.find((value) => value.trim())?.trim()
  if (title) return title
  const domain = getDomain(annotation.uri)
  return domain ? `Annotation on ${domain}` : "Hypothesis annotation"
}

/** Returns the exact text selected by a TextQuoteSelector, when present. */
export function getAnnotationQuote(annotation: HypothesisAnnotationRaw): string {
  if (annotation.quote?.trim()) return annotation.quote.trim()
  for (const target of annotation.target ?? []) {
    for (const selector of target.selector ?? []) {
      if (selector.type === "TextQuoteSelector" && selector.exact?.trim()) {
        return selector.exact.trim()
      }
    }
  }
  return ""
}

function normalizeUsername(value: string): string {
  return value.replace(/^acct:/i, "").replace(/@hypothes\.is$/i, "").trim()
}

async function fetchAnnotations(config: FetchConfig): Promise<DiscoveryItem[]> {
  const token = config.sourceConfig?.token?.trim() ?? ""
  const username = normalizeUsername(config.sourceConfig?.username?.trim() ?? "")
  if (!token) return []

  const key = configKey(token, username)
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }
  const buildUrl = (limit: number, offset: number) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset), sort: "updated" })
    if (username) params.set("user", `acct:${username}@hypothes.is`)
    return `${API_URL}?${params.toString()}`
  }
  const requestPage = async (limit: number, offset: number): Promise<HypothesisSearchResponse> => {
    const response = await fetch(buildUrl(limit, offset), { headers })
    if (!response.ok) throw new Error(`Hypothesis API error: ${response.status}`)
    return response.json() as Promise<HypothesisSearchResponse>
  }

  let cursor = readCursor(key)
  let total = cursor?.total ?? 0
  const shouldRefreshTotal = !cursor || Date.now() - cursor.checkedAt > TOTAL_REFRESH_MS
  if (shouldRefreshTotal) {
    const probe = await requestPage(1, 0)
    total = typeof probe.total === "number" && Number.isFinite(probe.total) ? Math.max(0, probe.total) : 0
    cursor = null
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (!isValidCursor(cursor, total)) {
    cursor = {
      pageOrder: shuffledPageOrder(totalPages),
      position: 0,
      total,
      checkedAt: Date.now(),
    }
  }

  const position = cursor.position % totalPages
  const pageIndex = cursor.pageOrder[position]
  const offset = pageIndex * PAGE_SIZE
  const data = await requestPage(PAGE_SIZE, offset)
  const rows = Array.isArray(data.rows) ? data.rows : []
  const responseTotal = typeof data.total === "number" && Number.isFinite(data.total)
    ? Math.max(0, data.total)
    : total
  const nextTotalPages = Math.max(1, Math.ceil(responseTotal / PAGE_SIZE))
  const nextCursor = responseTotal !== total
    ? {
      pageOrder: shuffledPageOrder(nextTotalPages),
      position: 0,
      total: responseTotal,
      checkedAt: Date.now(),
    }
    : {
      pageOrder: cursor.pageOrder,
      position: (position + 1) % totalPages,
      total,
      checkedAt: cursor.checkedAt,
    }
  // Advance only after the page has returned successfully. A failed request
  // therefore retries the same randomized page instead of skipping it.
  writeCursor(key, nextCursor)

  return rows
    .filter((annotation) => typeof annotation.id === "string" && typeof annotation.uri === "string")
    .map((annotation) => {
      const quote = getAnnotationQuote(annotation)
      const note = annotation.text?.trim() ?? ""
      return {
        id: `hypothesis-${annotation.id}`,
        source: "hypothesis" as const,
        // The selected quote is the useful content of a highlight. Fall back
        // to the note body, then the document title for note-only annotations.
        title: quote || note || documentTitle(annotation),
        url: annotation.uri,
        raw: annotation,
      }
    })
}

export const hypothesisAdapter: SourceAdapter = {
  id: "hypothesis",
  label: "Hypothesis",
  description: "Your web annotations and highlights from Hypothesis.",
  color: "#e0a000",
  logoSrc: "/source-icons/hypothesis.png",
  requiresConfig: true,
  configSchema: [
    {
      key: "token",
      label: "API Token",
      placeholder: "Paste your Hypothesis token",
      secret: true,
      hint: "Create one in Hypothesis → Account → Developer.",
    },
    {
      key: "username",
      label: "Username",
      placeholder: "Optional",
      required: false,
      hint: "Used to filter annotations for a specific account.",
    },
  ],

  fetch(config?: FetchConfig): Promise<DiscoveryItem[]> {
    return fetchAnnotations(config ?? {})
  },

  renderCard(item: DiscoveryItem) {
    return <HypothesisCard item={item} />
  },

  getLikePreview(item: DiscoveryItem): LikePreview {
    const raw = item.raw as HypothesisAnnotationRaw
    const text = raw.text?.trim() || "No note attached"
    const quote = getAnnotationQuote(raw)
    const previewParts = [
      quote ? `Highlight: ${quote}` : "",
      raw.text?.trim() ? `Your note: ${text}` : "",
    ].filter(Boolean)
    return {
      thumbnailNode: (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
          <Highlighter className="h-7 w-7" strokeWidth={1.7} />
        </div>
      ),
      descriptionText: `${getDomain(item.url) || "Hypothesis"} · ${previewParts.join(" · ").slice(0, 180)}`,
      descriptionNode: (
        <div className="mt-0.5 line-clamp-2 space-y-1 text-sm leading-relaxed text-slate-400">
          {quote && (
            <div className="flex items-start gap-1.5">
              <span className="mt-0.5 flex-shrink-0 text-slate-400" title="Highlight" aria-label="Highlight" role="img"><Quote className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" /></span>
              <span>{quote}</span>
            </div>
          )}
          {raw.text?.trim() && (
            <div className="flex items-start gap-1.5 text-slate-500">
              <span className="mt-0.5 flex-shrink-0 text-slate-400" title="Your note" aria-label="Your note" role="img"><PenLine className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" /></span>
              <span>{text}</span>
            </div>
          )}
        </div>
      ),
      titleHoverClass: "hover:text-amber-700",
    }
  },

  getSearchText(item: DiscoveryItem): string {
    const raw = item.raw as HypothesisAnnotationRaw
    return `${item.title} ${getAnnotationQuote(raw)} ${raw.text ?? ""} ${(raw.tags ?? []).join(" ")}`
  },

  getExportData(item: DiscoveryItem): Record<string, unknown> {
    const raw = item.raw as HypothesisAnnotationRaw
    return {
      title: item.title,
      documentTitle: documentTitle(raw),
      quote: getAnnotationQuote(raw),
      url: item.url,
      source: "hypothesis",
      text: raw.text ?? "",
      tags: raw.tags ?? [],
      user: raw.user ?? "",
      created: raw.created ?? "",
      updated: raw.updated ?? "",
    }
  },

  getZenContent(item: DiscoveryItem): ZenContentData {
    const raw = item.raw as HypothesisAnnotationRaw
    const tags = raw.tags ?? []
    const quote = getAnnotationQuote(raw)
    const note = raw.text?.trim() || ""
    return {
      primary: quote || note || item.title,
      primaryLabel: quote ? "Highlight" : "Your note",
      secondary: quote && note ? note : undefined,
      secondaryLabel: quote && note ? "Your note" : undefined,
      contentKind: "body",
      metaNode: (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3 w-3" strokeWidth={2} />
            {formatDateLong(raw.updated || raw.created || "")}
          </span>
          {tags.length > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" strokeWidth={2} />
                {tags.slice(0, 3).join(" · ")}
              </span>
            </>
          )}
        </span>
      ),
      accent: "#e0a000",
      accentText: "#ad7900",
      sourceLabel: "Hypothesis",
    }
  },
}
