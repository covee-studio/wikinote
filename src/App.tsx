import { useInfiniteQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useInView, useMotionValueEvent, useScroll } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AboutModal } from "./components/AboutModal"
import { LanguageSelector } from "./components/LanguageSelector"
import { LikesModal } from "./components/LikesModal"
import { LoadingSkeletonCards, SkeletonGrid } from "./components/SkeletonCard"
import { WikiCard } from "./components/WikiCard"
import { useI18n } from "./hooks/useI18n"
import { useLocalization } from "./hooks/useLocalization"
import { useScrollPosition } from "./hooks/useScrollPosition"
import type { WikiArticle } from "./types/ArticleProps"
import { fetchWithCORS } from "./utils/environment"

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const { currentLanguage, ready } = useLocalization()
  const [isScrolled, setIsScrolled] = useState<boolean>(false)
  const { scrollYProgress } = useScroll() // ensure motion scroll values are initialized (not used directly)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsScrolled(latest > 0.04)
  })

  const { t } = useI18n()
  const { scrollY } = useScrollPosition(30)
  const titleOpacity = Math.max(0, 1 - scrollY / 80)

  // Query function to fetch a batch of random Wikipedia articles
  const queryFn = useMemo(() => {
    return async (): Promise<WikiArticle[]> => {
      const response = await fetchWithCORS(
        currentLanguage.api +
          new URLSearchParams({
            action: "query",
            format: "json",
            generator: "random",
            grnnamespace: "0",
            prop: "extracts|info|pageimages",
            inprop: "url|varianttitles",
            grnlimit: "20",
            exintro: "1",
            exlimit: "max",
            exsentences: "5",
            explaintext: "1",
            piprop: "thumbnail",
            pithumbsize: "480",
            origin: "*",
            variant: currentLanguage.id,
          })
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (!data.query || !data.query.pages) throw new Error("Invalid API response")

      type WikipediaThumbnail = { source: string; width: number; height: number }
      type WikipediaPage = {
        title: string
        varianttitles?: Record<string, string>
        extract: string
        pageid: number
        thumbnail?: WikipediaThumbnail
        canonicalurl: string
      }

      const pages = data.query.pages as Record<string, WikipediaPage>
      const newArticles = Object.values(pages)
        .map(
          (page): WikiArticle => ({
            title: page.title,
            displaytitle: page.varianttitles?.[currentLanguage.id] || page.title,
            extract: page.extract,
            pageid: page.pageid,
            thumbnail: page.thumbnail,
            url: page.canonicalurl,
          })
        )
        .filter((a) => a.thumbnail && a.thumbnail.source && a.url && a.extract)
      return newArticles
    }
  }, [currentLanguage])

  const {
    data: queryData,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["wikiArticles", currentLanguage.id],
    queryFn: () => queryFn(),
    initialPageParam: 0,
    getNextPageParam: (_lastPage: WikiArticle[], allPages: WikiArticle[][]) => allPages.length,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: ready,
  })

  const flatArticles = (queryData?.pages ?? []).flat() as WikiArticle[]
  const articles = flatArticles
  const loading = isPending || isFetching || isFetchingNextPage

  const loadMoreDetectorRef = useRef<HTMLDivElement>(null)
  const loadMoreDetectorInView = useInView(loadMoreDetectorRef)

  useEffect(() => {
    if (loadMoreDetectorInView) {
      fetchNextPage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreDetectorInView])

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
        <div className="flex items-center gap-3">
          <div
            className={`modern-button-group flex items-center rounded-full p-1 border shadow-lg transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 backdrop-blur-xl border-white/40 shadow-xl"
                : "bg-white/10 backdrop-blur-xl border-white/20"
            }`}
          >
            <button
              onClick={() => setShowAbout(true)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t("app.about")}
            </button>
            <button
              onClick={() => setShowLikes(true)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-red-500 hover:bg-red-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t("app.likes")}
            </button>
          </div>
          <div
            className={`rounded-full p-1 border shadow-lg relative transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 backdrop-blur-xl border-white/40 shadow-xl"
                : "bg-white/10 backdrop-blur-xl border-white/20"
            }`}
            style={{ zIndex: 9998 }}
          >
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="masonry-grid">
        {articles.map((article, idx) => (
          <WikiCard key={article.pageid} article={article} priority={idx < 6} />
        ))}
        {isPending && <SkeletonGrid count={6} />}
        {loading && <LoadingSkeletonCards />}
        <div ref={loadMoreDetectorRef} className="h-10 col-span-full" />
      </div>

      {/* Floating global loading */}
      {loading && articles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 glass-effect px-6 py-3 rounded-full shadow-lg border border-white/20 pointer-events-none z-[60]">
          <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          <span className="text-slate-700 font-medium">{t("common.loadingMore")}</span>
        </div>
      )}

      {/* Modals */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} />
    </div>
  )
}

export default App
