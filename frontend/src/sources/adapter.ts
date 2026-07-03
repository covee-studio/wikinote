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
  /** Optional secondary text shown below the title (e.g. article extract) */
  secondary?: string
  /** Optional hero image URL */
  imageUrl?: string
  /** Metadata row (read time, score, tags, etc.) rendered as a ReactNode */
  metaNode: ReactNode
  /** Font weight for primary text; defaults to 500 */
  primaryWeight?: number
  /** Muted accent colour for the source indicator dot and horizontal rule */
  accent: string
  /** Text colour for the source label above the rule */
  accentText: string
  /** Human-readable source name shown above the rule */
  sourceLabel: string
  /** When true, no external link is rendered (e.g. Memos, where URLs are private/invalid) */
  noLink?: boolean
  /** When true, the primary text block is rendered in a scrollable container with a max height.
   *  Use for sources like Memos where content can be arbitrarily long. */
  scrollable?: boolean
}

export interface SourceConfigField {
  key: string
  label: string
  placeholder: string
  secret?: boolean
  hint?: string
}

export interface SourceAdapter {
  readonly id: SourceId
  readonly label: string
  readonly description: string
  /** Hex accent colour used for indicator dots and UI highlights */
  readonly color: string
  /** Optional per-source user-configurable fields (e.g. API key, endpoint).
   *  When present, the SourcesModal renders input fields for these. */
  readonly configSchema?: SourceConfigField[]
  /** If true, source requires config before it can return data.
   *  These sources are excluded from the default-enabled set. */
  readonly requiresConfig?: boolean

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
