import { useQueries } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
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

/** Returns true only when every required config field has a non-empty value. */
function isFullyConfigured(adapter: SourceAdapter, config: Record<string, string>): boolean {
  if (!adapter.requiresConfig || !adapter.configSchema) return true
  return adapter.configSchema.every((f) => f.required === false || Boolean(config[f.key]?.trim()))
}

// How long the user must pause typing in a source's config form before that
// config is considered "settled" and allowed to affect fingerprints/queryKeys.
// Without this, every keystroke in a secret field (e.g. an API token) changes
// its hash and re-triggers fetches/Zen resets for the whole time the user is
// typing a valid value, not just while the config is incomplete.
const CONFIG_SETTLE_DELAY_MS = 600

/**
 * Debounces a map of per-adapter configs so consumers only see a new value
 * once the user has paused editing for CONFIG_SETTLE_DELAY_MS. Config
 * objects that haven't changed keep the exact same reference across renders.
 */
function useSettledConfigs(
  activeAdapters: SourceAdapter[],
  getSourceConfig: (id: SourceId) => Record<string, string>
): Record<string, Record<string, string>> {
  const rawConfigs = activeAdapters.reduce<Record<string, Record<string, string>>>((acc, a) => {
    acc[a.id] = getSourceConfig(a.id)
    return acc
  }, {})
  const rawConfigsKey = JSON.stringify(rawConfigs)

  const [settledConfigs, setSettledConfigs] = useState(rawConfigs)
  const settledKeyRef = useRef(rawConfigsKey)

  useEffect(() => {
    if (rawConfigsKey === settledKeyRef.current) return
    const handle = setTimeout(() => {
      settledKeyRef.current = rawConfigsKey
      setSettledConfigs(rawConfigs)
    }, CONFIG_SETTLE_DELAY_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawConfigsKey])

  return settledKeyRef.current === rawConfigsKey ? rawConfigs : settledConfigs
}

function App() {
  const [extraItemsBySource, setExtraItemsBySource] = useState<ItemsBySource>({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [zenIndex, setZenIndex] = useState(-1)
  // Incremented each time a replaceAnchorOnRefetch source gets fresh data.
  // Passed to ZenMode so it can reset the anchor independently of feedKey.
  const [anchorKey, setAnchorKey] = useState(0)

  const { currentLanguage, ready } = useLocalization()
  const { enabledSources, getSourceConfig } = useSources()
  const { showToast } = useToast()

  const zenRestorePendingRef = useRef(true)
  // Tracks the last-seen dataUpdatedAt per adapter so we can detect genuine
  // refetches (dataUpdatedAt changed from a previously recorded non-zero value).
  const prevDataUpdatedAtRef = useRef<Partial<Record<SourceId, number>>>({})

  const activeAdapters = ADAPTER_LIST.filter((a) => enabledSources.has(a.id))
  // Only reflects config values once the user has paused typing for
  // CONFIG_SETTLE_DELAY_MS — see useSettledConfigs for why this is needed
  // on top of the isFullyConfigured() placeholder below.
  const settledConfigs = useSettledConfigs(activeAdapters, getSourceConfig)
  const activeSourceKey = activeAdapters
    .map((adapter) => {
      const langId = adapter.id === "wikipedia" ? currentLanguage.id : ""
      const config = settledConfigs[adapter.id] ?? {}
      // Use a stable placeholder while the user is mid-typing so that
      // activeSourceKey (and therefore zenIndex / zenRestorePendingRef) don't
      // thrash on every keystroke. The real fingerprint is only included once
      // ALL required fields have non-empty values AND the user has paused
      // typing (config is "settled") — otherwise entering e.g. a token
      // character-by-character keeps re-triggering fetches/resets the whole
      // time even though the field is technically "non-empty" already.
      const cfgStr = isFullyConfigured(adapter, config)
        ? configFingerprint(adapter, config)
        : "__unconfigured__"
      return `${adapter.id}:${langId}:${cfgStr}`
    })
    .join("|")

  useEffect(() => {
    setExtraItemsBySource({})
    setZenIndex(-1)
    zenRestorePendingRef.current = true
    // Reset per-adapter dataUpdatedAt tracking when source config changes
    prevDataUpdatedAtRef.current = {}
  }, [activeSourceKey])

  const queryResults = useQueries({
    queries: activeAdapters.map((adapter) => {
      const langId = adapter.id === "wikipedia" ? currentLanguage.id : ""
      // Use the settled (debounced) config here too so the queryKey — and the
      // config actually passed to adapter.fetch — stay in lockstep with
      // activeSourceKey instead of re-firing on every keystroke.
      const config = settledConfigs[adapter.id] ?? {}
      // Mirror the same placeholder logic used in activeSourceKey so the
      // queryKey is stable while the user is mid-typing in the config form.
      const configStr = isFullyConfigured(adapter, config)
        ? configFingerprint(adapter, config)
        : "__unconfigured__"
      const cacheKey = feedCache.key(adapter.id, langId, configStr)
      const cached = feedCache.getSync(cacheKey)

      return {
        queryKey: ["articles", adapter.id, langId, configStr],
        queryFn: async () => {
          try {
            const items = await adapter.fetch({ language: currentLanguage, sourceConfig: config })
            if (items.length > 0) feedCache.set(cacheKey, items)
            return items
          } catch (error) {
            if (adapter.fallbackToCachedDataOnError && cached?.items?.length) {
              return cached.items
            }
            throw error
          }
        },
        enabled: ready,
        refetchOnWindowFocus: false,
        retry: 1,
        initialData: adapter.showCachedWhileRefetching === false ? undefined : cached?.items,
        initialDataUpdatedAt: cached?.timestamp ?? 0,
        // Per-adapter override: Memos sets cacheTtlMs=0 so every mount triggers
        // a refetch (advancing the window cursor). It opts out of initialData
        // and uses the cached batch only when that fresh request fails.
        // Other sources use the global TTL and normal stale-while-revalidate.
        staleTime: adapter.cacheTtlMs ?? CACHE_TTL_MS,
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

  const hasQueryError = articles.length === 0 && queryResults.some((result) => result.isError)
  const isLoading = !ready || queryResults.some((result) => result.isPending || result.isFetching)
  const retryLoad = useCallback(() => {
    void Promise.all(queryResults.map((result) => result.refetch()))
  }, [queryResults])

  // Detect when a replaceAnchorOnRefetch adapter gets genuinely new data.
  // This effect is declared BEFORE the articles→zenIndex effect so that within
  // the same render batch where queryResults change, we set
  // zenRestorePendingRef.current=true first — then the articles effect below
  // sees it and picks a fresh zenIndex from the new batch.
  const dataUpdatedAtKey = activeAdapters
    .map((a, i) => `${a.id}:${queryResults[i]?.dataUpdatedAt ?? 0}`)
    .join(',')
  // useCallback to avoid stale closure over activeAdapters/queryResults
  const detectRefetch = useCallback(() => {
    activeAdapters.forEach((adapter, i) => {
      if (!adapter.replaceAnchorOnRefetch) return
      const result = queryResults[i]
      if (!result || result.isFetching) return
      const current = result.dataUpdatedAt ?? 0
      if (current === 0) return
      const prev = prevDataUpdatedAtRef.current[adapter.id] ?? 0
      if (current !== prev) {
        const isGenuineRefetch = prev > 0 // prev=0 means very first load; >0 means real refetch
        prevDataUpdatedAtRef.current[adapter.id] = current
        if (isGenuineRefetch) {
          zenRestorePendingRef.current = true
          setAnchorKey((k) => k + 1)
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAtKey])
  useEffect(() => { detectRefetch() }, [detectRefetch])

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
            sourceConfig: settledConfigs[adapter.id] ?? getSourceConfig(adapter.id),
            fetchMode: "more",
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
      anchorKey={anchorKey}
      items={articles}
      initialIndex={zenIndex}
      onNearEnd={loadMore}
      isLoading={isLoading}
      loadError={hasQueryError ? "Unable to load content" : undefined}
      onRetry={hasQueryError ? retryLoad : undefined}
    />
  )
}

export default App
