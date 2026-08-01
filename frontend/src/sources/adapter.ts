// SourceAdapter — the contract every data source must satisfy.
// Adding a new source = implement this interface + register in registry.ts.
// No other file needs to change.

import type { ReactNode } from "react"
import type { DiscoveryItem, SourceId } from "../types/DiscoveryItem"
import type { Language } from "../types/ArticleProps"

export interface FetchConfig {
  language?: Language
  /** Per-source user settings (API keys, endpoints, etc.) stored in SourcesContext */
  sourceConfig?: Record<string, string>
  /** Distinguishes the initial feed request from the user's explicit load-more action. */
  fetchMode?: "initial" | "more"
}

export interface CardRenderProps {
  priority?: boolean
}

// Returned by getLikePreview — LikesModal uses this for its shared layout.
// The adapter provides data; LikesModal owns the surrounding chrome (remove
// button, border, etc.) so the layout stays consistent across sources.
export interface LikePreview {
  thumbnailNode: ReactNode
  descriptionText: string
  titleHoverClass: string
}

// Returned by getZenContent — ZenMode uses this for its shared layout.
// The adapter provides all source-specific data; ZenMode owns the surrounding
// chrome (navigation, theme, idle fade) so the layout stays consistent.
export interface ZenContentData {
  /** Main display text: article title, headline, or full note */
  primary: string
  /** Optional semantic label shown above the primary content (e.g. Highlight). */
  primaryLabel?: string
  /** Optional secondary text shown below the title (e.g. article extract) */
  secondary?: string
  /** Optional semantic label shown above the secondary content (e.g. Your note). */
  secondaryLabel?: string
  /** Optional hero image URL */
  imageUrl?: string
  /** Metadata row (read time, score, tags, etc.) rendered as a ReactNode */
  metaNode: ReactNode
  /** Font weight for primary text; defaults to 500 */
  primaryWeight?: number
  /** Reading hierarchy for the main content. Titles/headlines are large;
   * body sources such as Memos and Hypothesis stay at reading size. */
  contentKind?: "title" | "body"
  /** Muted accent colour for the source indicator dot and horizontal rule */
  accent: string
  /** Text colour for the source label above the rule */
  accentText: string
  /** Human-readable source name shown above the rule */
  sourceLabel: string
  /** When true, no external link is rendered (e.g. Memos, where URLs are private/invalid) */
  noLink?: boolean
  /** Optional override for the shared body-content scroll region. Body sources
   *  get the same fading scroll treatment by default; this only changes its
   *  viewport-height cap when a source needs a different reading surface. */
  contentScrollable?: { maxHeightVh: number }
}

export interface SourceConfigField {
  key: string
  label: string
  placeholder: string
  secret?: boolean
  hint?: string
  /** Optional fields do not prevent a source from being enabled when empty. */
  required?: boolean
  /** Marks this field as a base URL (e.g. a self-hosted instance address).
   *  Used to normalize the value (auto-add https://) and to request the
   *  Chrome extension host permission needed to fetch it. */
  isUrl?: boolean
}

export interface SourceAdapter {
  readonly id: SourceId
  readonly label: string
  readonly description: string
  /** Hex accent colour used for indicator dots and UI highlights */
  readonly color: string
  /** Optional source brand mark shown in source settings */
  readonly logoSrc?: string
  /** Optional per-source user-configurable fields (e.g. API key, endpoint).
   *  When present, the SourcesModal renders input fields for these. */
  readonly configSchema?: SourceConfigField[]
  /** If true, source requires config before it can return data.
   *  These sources are excluded from the default-enabled set. */
  readonly requiresConfig?: boolean
  /** Override the feed cache stale time (ms) for this source.
   *  Set to 0 to always refetch on mount while still showing cached data instantly.
   *  Defaults to the global CACHE_TTL_MS when absent. */
  readonly cacheTtlMs?: number
  /** When false, cached feed data is kept only as an error fallback and is not
   *  rendered before the first fresh response. */
  readonly showCachedWhileRefetching?: boolean
  /** When true, a failed fetch may fall back to the last cached batch. */
  readonly fallbackToCachedDataOnError?: boolean
  /** When true, ZenMode replaces the initial anchor item after a background refetch
   *  completes with new data. Use for sources like Memos where each refetch returns a
   *  deliberately different window — the user should see the new batch, not stay pinned
   *  to a cached item that no longer exists in the current list.
   *  Leave false/absent for sources like Wikipedia where anchor stability is preferred. */
  readonly replaceAnchorOnRefetch?: boolean

  /** Fetch a batch of items for the feed */
  fetch(config?: FetchConfig): Promise<DiscoveryItem[]>
  /** Render the full feed card for this item */
  renderCard(item: DiscoveryItem, props: CardRenderProps): ReactNode
  /** Provide display data for the Likes modal entry */
  getLikePreview(item: DiscoveryItem): LikePreview
  /** Provide content data for the Zen mode reading view */
  getZenContent(item: DiscoveryItem): ZenContentData
  /** Return text used for search filtering in LikesModal */
  getSearchText(item: DiscoveryItem): string
  /** Return a plain object for JSON export */
  getExportData(item: DiscoveryItem): Record<string, unknown>
}
