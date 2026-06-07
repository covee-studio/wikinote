import { useQueries } from "@tanstack/react-query"
import { Loader as Loader2 } from "lucide-react"
import { useMotionValueEvent, useScroll } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { AboutModal } from "./components/AboutModal"
import { DiscoveryCard } from "./components/DiscoveryCard"
import { LikesModal } from "./components/LikesModal"
import { SkeletonGrid } from "./components/SkeletonCard"
import { SourcesModal } from "./components/SourcesModal"
import { ZenMode } from "./components/ZenMode"
import { useSources } from "./contexts/SourcesContext"
import { useToast } from "./contexts/ToastContext"
import { useI18n } from "./hooks/useI18n"
import { useLocalization } from "./hooks/useLocalization"
import { useScrollPosition } from "./hooks/useScrollPosition"
import { ADAPTER_LIST } from "./sources/registry"
import type { SourceAdapter } from "./sources/adapter"
import type { DiscoveryItem } from "./types/DiscoveryItem"
import type { SourceId } from "./types/DiscoveryItem"
import { feedCache, CACHE_TTL_MS } from "./utils/feedCache"

const ZEN_OPEN_KEY = "zen_open"
const ZEN_INDEX_KEY = "zen_last_index"

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
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [extraItemsBySource, setExtraItemsBySource] = useState<ItemsBySource>({})
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Initialise to true immediately if zen was open in the previous tab —
  // so the overlay covers the grid from frame 0 and avoids the flash.
  const [showZen, setShowZen] = useState(() => localStorage.getItem(ZEN_OPEN_KEY) === "true")
  // -1 = sentinel: zen is open but the random index hasn't been picked yet.
  // ZenMode renders only the background while index < 0, preventing any content flash.
  const [zenIndex, setZenIndex] = useState(-1)
  const { currentLanguage, ready } = useLocalization()
  const { enabledSources, getSourceConfig } = useSources()
  const { showToast } = useToast()
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsScrolled(latest > 0.04)
  })
  const { t } = useI18n()
  const { scrollY } = useScrollPosition(30)
  const titleOpacity = Math.max(0, 1 - scrollY / 80)

  // Track whether we still need to restore Zen mode from localStorage
  const zenRestorePendingRef = useRef(localStorage.getItem(ZEN_OPEN_KEY) === "true")

  const activeAdapters = ADAPTER_LIST.filter((a) => enabledSources.has(a.id))
  const activeSourceKey = activeAdapters
    .map((adapter) => {
      const langId = adapter.id === "wikipedia" ? currentLanguage.id : ""
      return `${adapter.id}:${langId}:${configFingerprint(adapter, getSourceConfig(adapter.id))}`
    })
    .join("|")

  useEffect(() => {
    setExtraItemsBySource({})
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
          const items = await adapter.fetch({
            language: currentLanguage,
            sourceConfig: config,
          })
          if (items.length > 0) {
            feedCache.set(cacheKey, items)
          }
          return items
        },
        enabled: ready,
        refetchOnWindowFocus: false,
        retry: 1,
        // Show cached items immediately; refetch silently in background if stale
        initialData: cached?.items,
        initialDataUpdatedAt: cached?.timestamp ?? 0,
        staleTime: CACHE_TTL_MS,
      }
    }),
  })

  const isLoading = queryResults.some((r) => r.isPending || r.isFetching) || isLoadingMore

  const articles = dedup(
    interleaveN(
      activeAdapters.map((adapter, i) => [
        ...(Array.isArray(queryResults[i]?.data) ? (queryResults[i].data as DiscoveryItem[]) : []),
        ...(extraItemsBySource[adapter.id] ?? []),
      ])
    )
  )

  // Restore Zen mode once articles are available
  useEffect(() => {
    if (!zenRestorePendingRef.current) return
    if (articles.length === 0) return
    zenRestorePendingRef.current = false
    // Pick a random article each time a new tab opens — avoid always seeing the same one
    const next = Math.floor(Math.random() * articles.length)
    setZenIndex(next)
    setShowZen(true)
  }, [articles.length])

  const openZen = (idx: number) => {
    localStorage.setItem(ZEN_OPEN_KEY, "true")
    localStorage.setItem(ZEN_INDEX_KEY, String(idx))
    setZenIndex(idx)
    setShowZen(true)
  }

  const closeZen = () => {
    localStorage.removeItem(ZEN_OPEN_KEY)
    setShowZen(false)
  }

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

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
          if (items.length > 0) {
            next[sourceId] = items
          }
        } else {
          showToast("Failed to load more articles")
        }
      }
      if (Object.keys(next).length > 0) {
        setExtraItemsBySource((prev) => {
          const updated = { ...prev }
          for (const [sourceId, items] of Object.entries(next)) {
            updated[sourceId as SourceId] = [...(updated[sourceId as SourceId] ?? []), ...items]
          }
          return updated
        })
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          void loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, activeSourceKey, articles.length])

  const pillBase = "bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg transition-all duration-300"
  const pillScrolled = "bg-white/95 backdrop-blur-xl border-white/40 shadow-xl"
  const btnCls = "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"

  return (
    <div className="relative min-h-screen gradient-bg">
      {/* Top-left brand */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-bold text-glow hover:opacity-90 transition-all duration-300 px-2 py-1 hover:scale-105 text-slate-800 ${
            titleOpacity === 0 ? "pointer-events-none" : ""
          }`}
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleOpacity === 0 ? "-10px" : "0"})`,
            transition: "all 0.3s ease-in-out",
          }}
        >
          {t("app.title")}
        </button>
      </div>

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`modern-button-group flex items-center rounded-full p-1 ${isScrolled ? pillScrolled : pillBase}`}>
          <button
            onClick={() => setShowAbout(true)}
            className={`${btnCls} text-slate-700 hover:text-blue-600 hover:bg-blue-50/80`}
          >
            {t("app.about")}
          </button>
          <button
            onClick={() => setShowLikes(true)}
            className={`${btnCls} text-slate-700 hover:text-red-500 hover:bg-red-50/80`}
          >
            {t("app.likes")}
          </button>
          <button
            onClick={() => setShowSources(true)}
            className={`${btnCls} text-slate-700 hover:text-slate-900 hover:bg-slate-100/80`}
          >
            Sources
          </button>
          <button
            onClick={() => openZen(0)}
            className={`${btnCls} text-slate-500 hover:text-slate-800 hover:bg-slate-100/80`}
            disabled={articles.length === 0}
          >
            Zen
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="masonry-grid" style={{ paddingTop: "80px" }}>
        {articles.map((item, idx) => (
          <DiscoveryCard key={item.id} item={item} priority={idx < 6} />
        ))}
        {isLoading && articles.length === 0 && <SkeletonGrid count={6} />}
        <div ref={loadMoreRef} className="h-10 col-span-full" />
      </div>

      {/* Loading indicator */}
      {isLoading && articles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 glass-effect px-6 py-3 rounded-full shadow-lg border border-white/20 pointer-events-none z-[60]">
          <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          <span className="text-slate-700 font-medium">{t("common.loadingMore")}</span>
        </div>
      )}

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} />
      <SourcesModal isOpen={showSources} onClose={() => setShowSources(false)} />
      <ZenMode
        isOpen={showZen}
        items={articles}
        initialIndex={zenIndex}
        onClose={closeZen}
      />
    </div>
  )
}

export default App
