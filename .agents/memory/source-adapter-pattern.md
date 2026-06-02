---
name: Source Adapter Pattern
description: Architecture decision for multi-source feed — how to add new data sources without touching existing code.
---

## Rule
Every data source is a `SourceAdapter` object (see `sources/adapter.ts`). Adding a new source = implement the interface + add one line to `sources/registry.ts`. Zero other files change.

**Why:** Previous union-type approach (`WikiArticle | HNArticle`) caused type-guards to spread across DiscoveryCard, LikesModal, LikedArticlesContext, and App.tsx. Each new source required editing 4+ files — a textbook open/closed violation.

## How to apply
1. Create `sources/mySource.tsx` implementing `SourceAdapter`:
   - `id`, `label`, `description`, `color` — metadata
   - `fetch(config?)` — returns `DiscoveryItem[]` with `raw` holding source-specific data
   - `renderCard(item, props)` — returns JSX (can import a dedicated card component)
   - `getLikePreview(item)` — returns `{ thumbnailNode, descriptionText, titleHoverClass }`
   - `getSearchText(item)` — for LikesModal search filter
   - `getExportData(item)` — for JSON export
2. Add one line to `ADAPTER_REGISTRY` in `sources/registry.ts`
3. Done — App, DiscoveryCard, LikesModal, SourcesModal all adapt automatically

## Key invariants
- `DiscoveryItem.id` is the universal key (e.g. `wiki-12345`, `hn-99999`) — no more `isHNArticle()` guards
- `DiscoveryItem.raw` is `unknown` — only the producing adapter casts it
- `LikedArticlesContext` uses `item.id` directly for dedup/lookup
- `LikedArticlesContext` migrates old `WikiArticle`/`HNArticle` localStorage format on load

## Files
- Contract: `sources/adapter.ts`
- Registry: `sources/registry.ts`  
- Adapters: `sources/wikipedia.tsx`, `sources/hackernews.tsx`
- Normalized type: `types/DiscoveryItem.ts`
