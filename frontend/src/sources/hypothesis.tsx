import { Calendar, Highlighter, Tag } from "lucide-react"
import { HypothesisCard } from "../components/HypothesisCard"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import type { FetchConfig, LikePreview, SourceAdapter, ZenContentData } from "./adapter"
import { formatDateLong, getDomain } from "../utils/formatting"

const API_URL = "https://hypothes.is/api/search"
const PAGE_SIZE = 20

export interface HypothesisAnnotationRaw {
  id: string
  uri: string
  text?: string
  user?: string
  created?: string
  updated?: string
  tags?: string[]
  group?: string
  document?: {
    title?: string[]
    link?: Array<{ href?: string }>
  }
}

interface HypothesisSearchResponse {
  rows?: HypothesisAnnotationRaw[]
}

const pageByConfig = new Map<string, number>()

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

function configKey(token: string, username: string): string {
  return `${hashString(token)}:${username.toLowerCase()}`
}

function documentTitle(annotation: HypothesisAnnotationRaw): string {
  const title = annotation.document?.title?.find((value) => value.trim())?.trim()
  if (title) return title
  const domain = getDomain(annotation.uri)
  return domain ? `Annotation on ${domain}` : "Hypothesis annotation"
}

function normalizeUsername(value: string): string {
  return value.replace(/^acct:/i, "").replace(/@hypothes\.is$/i, "").trim()
}

async function fetchAnnotations(config: FetchConfig): Promise<DiscoveryItem[]> {
  const token = config.sourceConfig?.token?.trim() ?? ""
  const username = normalizeUsername(config.sourceConfig?.username?.trim() ?? "")
  if (!token) return []

  const key = configKey(token, username)
  const offset = config.fetchMode === "more" ? (pageByConfig.get(key) ?? PAGE_SIZE) : 0
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    sort: "updated",
  })
  if (username) params.set("user", `acct:${username}@hypothes.is`)

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error(`Hypothesis API error: ${response.status}`)

  const data = await response.json() as HypothesisSearchResponse
  const rows = Array.isArray(data.rows) ? data.rows : []
  pageByConfig.set(key, offset + rows.length)

  return rows
    .filter((annotation) => typeof annotation.id === "string" && typeof annotation.uri === "string")
    .map((annotation) => ({
      id: `hypothesis-${annotation.id}`,
      source: "hypothesis" as const,
      title: documentTitle(annotation),
      url: annotation.uri,
      raw: annotation,
    }))
}

export const hypothesisAdapter: SourceAdapter = {
  id: "hypothesis",
  label: "Hypothesis",
  description: "Your web annotations and highlights from Hypothesis.",
  color: "#e0a000",
  logoSrc: "/hypothesis-logo-official.svg",
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
    return {
      thumbnailNode: (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
          <Highlighter className="h-7 w-7" strokeWidth={1.7} />
        </div>
      ),
      descriptionText: `${getDomain(item.url) || "Hypothesis"} · ${text.slice(0, 90)}`,
      titleHoverClass: "hover:text-amber-700",
    }
  },

  getSearchText(item: DiscoveryItem): string {
    const raw = item.raw as HypothesisAnnotationRaw
    return `${item.title} ${raw.text ?? ""} ${(raw.tags ?? []).join(" ")}`
  },

  getExportData(item: DiscoveryItem): Record<string, unknown> {
    const raw = item.raw as HypothesisAnnotationRaw
    return {
      title: item.title,
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
    return {
      primary: item.title,
      secondary: raw.text?.trim() || undefined,
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
