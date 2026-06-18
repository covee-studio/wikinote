import { useQueries } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { ZenMode } from "./components/ZenMode"
import { useSources } from "./contexts/SourcesContext"
import { useToast } from "./contexts/ToastContext"
import { useLocalization } from "./hooks/useLocalization"
import { ADAPTER_LIST } from "./sources/registry"
import type { SourceAdapter } from "./sources/adapter"
import type { DiscoveryItem } from "./types/DiscoveryItem"
import type { SourceId } from "./types/DiscoveryItem"
import { feedCache, CACHE_TTL_MS } from "./utils/feedCache"

type ItemsBySource = Partial<Record<SourceId, DiscoveryItem[]>>

function interleaveN(arrays: DiscoveryItem[][]): DiscoveryItem[] {
  const result: DiscoveryItem[] = []
  const queues = arrays.map((a) => (Array.isArray(a) ? [...a] : []))
  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (q.length > 0) result.push(q.shift()!)
    }
  }
  return result
}

function dedup(items: DiscoveryItem[]): DiscoveryItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function hashString(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function configFingerprint(adapter: SourceAdapter, config: Record<string, string>): string {
  const fields = adapter.configSchema ?? []
  const normalized = fields.reduce<Record<string, string>>((acc, field) => {
    const value = config[field.key]?.trim() ?? ""
    acc[field.key] = field.secret ? `secret:${hashString(value)}` : value
    return acc
  }, {})
  return JSON.stringify(normalized)
}

function App() {
  const [extraItemsBySource, setExtraItemsBySource] = useState<ItemsBySource>({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [zenIndex, setZenIndex] = useState(-1)

  const { currentLanguage, ready } = useLocalization()
  const { enabledSources, getSourceConfig } = useSources()
  const { showToast } = useToast()

  const zenRestorePendingRef = useRef(true)

  const activeAdapters = ADAPTER_LIST.filter((a) => enabledSources.has(a.id))
  const activeSourceKey = activeAdapters
    .map((adapter) => {
      const langId = adapter.id === "wikipedia" ? currentLanguage.id : ""
      return `${adapter.id}:${langId}:${configFingerprint(adapter, getSourceConfig(adapter.id))}`
    })
    .join("|")

  useEffect(() => {
    setExtraItemsBySource({})
    setZenIndex(-1)
    zenRestorePendingRef.current = true
  }, [activeSourceKey])

  const queryResults = useQueries({
    queries: activeAdapters.map((adapter) => {
      const langId = adapter.id === "wikipedia" ? currentLanguage.id : ""
      const config = getSourceConfig(adapter.id)
      const configStr = configFingerprint(adapter, config)
      const cacheKey = feedCache.key(adapter.id, langId, configStr)
      const cached = feedCache.getSync(cacheKey)

      return {
        queryKey: ["articles", adapter.id, langId, configStr],
        queryFn: async () => {
          const items = await adapter.fetch({ language: currentLanguage, sourceConfig: config })
          if (items.length > 0) feedCache.set(cacheKey, items)
          return items
        },
        enabled: ready,
        refetchOnWindowFocus: false,
        retry: 1,
        initialData: cached?.items,
        initialDataUpdatedAt: cached?.timestamp ?? 0,
        staleTime: CACHE_TTL_MS,
      }
    }),
  })

  const articles = dedup(
    interleaveN(
      activeAdapters.map((adapter, i) => [
        ...(Array.isArray(queryResults[i]?.data) ? (queryResults[i].data as DiscoveryItem[]) : []),
        ...(extraItemsBySource[adapter.id] ?? []),
      ])
    )
  )

  // Pick a random starting index once articles arrive
  useEffect(() => {
    if (!zenRestorePendingRef.current) return
    if (articles.length === 0) return
    zenRestorePendingRef.current = false
    setZenIndex(Math.floor(Math.random() * articles.length))
  }, [articles])

  // Load more when user navigates near the end
  const loadMore = async () => {
    if (!ready || isLoadingMore || activeAdapters.length === 0) return
    setIsLoadingMore(true)
    try {
      const results = await Promise.allSettled(
        activeAdapters.map(async (adapter) => {
          const items = await adapter.fetch({
            language: currentLanguage,
            sourceConfig: getSourceConfig(adapter.id),
          })
          return [adapter.id, items] as const
        })
      )
      const next: ItemsBySource = {}
      for (const result of results) {
        if (result.status === "fulfilled") {
          const [sourceId, items] = result.value
          if (items.length > 0) next[sourceId] = items
        } else {
          showToast("Failed to load more articles")
        }
      }
      if (Object.keys(next).length > 0) {
        setExtraItemsBySource((prev) => {
          const updated = { ...prev }
          for (const [sourceId, items] of Object.entries(next)) {
            updated[sourceId as SourceId] = [
              ...(updated[sourceId as SourceId] ?? []),
              ...items,
            ]
          }
          return updated
        })
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <ZenMode
      isOpen={true}
      feedKey={activeSourceKey}
      items={articles}
      initialIndex={zenIndex}
      onNearEnd={loadMore}
    />
  )
}

export default App
