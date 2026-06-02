import { useQueries } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useMotionValueEvent, useScroll } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { AboutModal } from "./components/AboutModal"
import { DiscoveryCard } from "./components/DiscoveryCard"
import { LikesModal } from "./components/LikesModal"
import { SkeletonGrid } from "./components/SkeletonCard"
import { SourcesModal } from "./components/SourcesModal"
import { ZenMode } from "./components/ZenMode"
import { useSources } from "./contexts/SourcesContext"
import { useI18n } from "./hooks/useI18n"
import { useLocalization } from "./hooks/useLocalization"
import { useScrollPosition } from "./hooks/useScrollPosition"
import { ADAPTER_LIST } from "./sources/registry"
import type { DiscoveryItem } from "./types/DiscoveryItem"

const ZEN_OPEN_KEY = "zen_open"
const ZEN_INDEX_KEY = "zen_last_index"

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

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [showSources, setShowSources] = useState(false)
  const [showZen, setShowZen] = useState(false)
  const [zenIndex, setZenIndex] = useState(0)
  const { currentLanguage, ready } = useLocalization()
  const { enabledSources, getSourceConfig } = useSources()
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

  const queryResults = useQueries({
    queries: activeAdapters.map((adapter) => ({
      queryKey: [
        "articles",
        adapter.id,
        adapter.id === "wikipedia" ? currentLanguage.id : "",
        JSON.stringify(getSourceConfig(adapter.id)),
      ],
      queryFn: () =>
        adapter.fetch({
          language: currentLanguage,
          sourceConfig: getSourceConfig(adapter.id),
        }),
      enabled: ready,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  })

  const isLoading = queryResults.some((r) => r.isPending || r.isFetching)

  const articles = dedup(
    interleaveN(
      activeAdapters.map((_, i) =>
        Array.isArray(queryResults[i]?.data) ? (queryResults[i].data as DiscoveryItem[]) : []
      )
    )
  )

  // Restore Zen mode once articles are available
  useEffect(() => {
    if (!zenRestorePendingRef.current) return
    if (articles.length === 0) return
    zenRestorePendingRef.current = false
    const saved = parseInt(localStorage.getItem(ZEN_INDEX_KEY) ?? "-1", 10)
    const next = saved >= 0 && articles.length > 1 ? (saved + 1) % articles.length : 0
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

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          queryResults.forEach((r) => r.refetch())
        }
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, activeAdapters.length])

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
