// Normalized, source-agnostic representation of any feed item.
// Adapters (sources/*.tsx) normalize their raw API responses into this shape.
// Only the adapter that produced the item should cast and read `raw`.

export type SourceId = "wikipedia" | "hackernews" | "memos" | "hypothesis"

export interface DiscoveryItem {
  /** Universal unique key, e.g. "wiki-12345", "hn-99999", "memo-uid-xxx" */
  id: string
  source: SourceId
  title: string
  url: string
  /** Adapter-specific payload — only the producing adapter casts this */
  raw: unknown
}
