// Central adapter registry.
// To add a new source: implement SourceAdapter, import it here, add one entry.
// Every other file (App, DiscoveryCard, LikesModal, SourcesModal) adapts
// automatically — zero changes needed elsewhere.

import { hackerNewsAdapter } from "./hackernews"
import { hypothesisAdapter } from "./hypothesis"
import { memosAdapter } from "./memos"
import { wikipediaAdapter } from "./wikipedia"
import { wereadAdapter } from "./weread"
import type { SourceAdapter } from "./adapter"
import type { SourceId } from "../types/DiscoveryItem"

export const ADAPTER_REGISTRY: Record<SourceId, SourceAdapter> = {
  wikipedia: wikipediaAdapter,
  hackernews: hackerNewsAdapter,
  memos: memosAdapter,
  hypothesis: hypothesisAdapter,
  weread: wereadAdapter,
}

/** Ordered list for UI rendering (Sources button dots, SourcesModal cards) */
export const ADAPTER_LIST: SourceAdapter[] = Object.values(ADAPTER_REGISTRY)

/** Returns the adapter for a given source id. Throws if not found. */
export function getAdapter(id: SourceId): SourceAdapter {
  const adapter = ADAPTER_REGISTRY[id]
  if (!adapter) throw new Error(`No adapter registered for source: "${id}"`)
  return adapter
}
