import { BookOpen, ChevronLeft, ChevronRight, Clock, Flame, Heart, MessageSquare, NotebookPen, Share2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import type { HNArticleRaw } from "../sources/hackernews"
import type { MemoRaw } from "../sources/memos"
import type { WikiArticleRaw } from "../sources/wikipedia"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import { ZenWave } from "./ZenWave"
import { formatRelativeTime, getDomain } from "./TextCard"

interface ZenModeProps {
  isOpen: boolean
  items: DiscoveryItem[]
  initialIndex: number
  onClose: () => void
}

function readMinutes(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  } catch { return "" }
}

// ─── Per-source Zen content ───────────────────────────────────
function WikipediaZenContent({ item }: { item: DiscoveryItem }) {
  const article = item.raw as WikiArticleRaw
  const mins = readMinutes(article.extract || "")
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto w-full px-6">
      {/* Circular image avatar */}
      {article.thumbnail && (
        <img
          src={article.thumbnail.source}
          alt={article.displaytitle}
          className="w-24 h-24 rounded-full object-cover mb-5 shadow-md"
        />
      )}
      {/* Source badge */}
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
        <BookOpen style={{ width: 10, height: 10 }} />
        Wikipedia
      </span>
      <div className="w-8 h-px bg-slate-300 mb-5" />
      {/* Title */}
      <h2 className="text-3xl font-semibold text-slate-800 leading-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
          {article.displaytitle}
        </a>
      </h2>
      {/* Excerpt */}
      <p className="text-slate-500 text-base leading-relaxed mb-5 line-clamp-5">
        {article.extract}
      </p>
      {/* Read time */}
      <span className="flex items-center gap-1.5 text-sm text-slate-400">
        <Clock style={{ width: 13, height: 13 }} />
        {mins} min read
      </span>
    </div>
  )
}

function HNZenContent({ item }: { item: DiscoveryItem }) {
  const article = item.raw as HNArticleRaw
  const domain = getDomain(item.url)
  const isExternal = !item.url.includes("news.ycombinator.com")
  const displayDomain = isExternal && domain ? domain : "news.ycombinator.com"
  const discussionUrl = `https://news.ycombinator.com/item?id=${article.id}`
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto w-full px-6">
      {/* Source badge */}
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3">
        <Flame style={{ width: 10, height: 10 }} />
        Hacker News
      </span>
      <div className="w-8 h-px bg-slate-300 mb-4" />
      {/* Domain */}
      <p className="text-sm font-mono text-slate-400 mb-3">{displayDomain}</p>
      {/* Title */}
      <h2 className="text-2xl font-semibold text-slate-800 leading-snug mb-5" style={{ fontFamily: "Georgia, serif" }}>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
          {item.title}
        </a>
      </h2>
      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <a href={discussionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-orange-400 transition-colors">
          <MessageSquare style={{ width: 13, height: 13 }} />
          {article.commentCount}
        </a>
        <span className="opacity-40">·</span>
        <span>{article.author}</span>
        <span className="opacity-40">·</span>
        <span>{formatRelativeTime(article.time)}</span>
      </div>
    </div>
  )
}

/** Remove lines that are purely hashtag tokens (they're shown in the footer already) */
function stripHashtagLines(content: string): string {
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      return !trimmed.split(/\s+/).every((token) => token.startsWith("#"))
    })
    .join("\n")
    .trim()
}

function MemosZenContent({ item }: { item: DiscoveryItem }) {
  const memo = item.raw as MemoRaw
  const displayContent = stripHashtagLines(memo.content)
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto w-full px-6">
      {/* Source badge */}
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3">
        <NotebookPen style={{ width: 10, height: 10 }} />
        Memos
      </span>
      <div className="w-8 h-px bg-slate-300 mb-6" />
      {/* Content text — scrollable when note is long; hashtag-only lines stripped */}
      <div
        className="w-full max-h-[55vh] overflow-y-auto text-left px-2 mb-5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#c4b5fd transparent" }}
      >
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet-600 transition-colors">
          <p className="text-xl text-slate-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "Georgia, serif" }}>
            {displayContent}
          </p>
        </a>
      </div>
      {/* Date + tags */}
      <div className="flex items-center gap-2 flex-wrap justify-center text-sm text-slate-400">
        <span>{formatDate(memo.displayTime)}</span>
        {memo.tags.length > 0 && <span className="opacity-40">·</span>}
        {memo.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="text-violet-400 font-medium">#{tag}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Main ZenMode ─────────────────────────────────────────────
export function ZenMode({ isOpen, items, initialIndex, onClose }: ZenModeProps) {
  const [index, setIndex] = useState(initialIndex)
  const [fadeVisible, setFadeVisible] = useState(true)
  const [uiVisible, setUiVisible] = useState(false)
  const { toggleLike, isLiked } = useLikedArticles()
  const { t } = useI18n()
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen) setIndex(initialIndex)
  }, [isOpen, initialIndex])

  const navigate = (newIdx: number) => {
    localStorage.setItem("zen_last_index", String(newIdx))
    setFadeVisible(false)
    setTimeout(() => {
      setIndex(newIdx)
      setFadeVisible(true)
    }, 150)
  }

  const prev = () => navigate((index - 1 + items.length) % items.length)
  const next = () => navigate((index + 1) % items.length)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index, items.length])

  if (!isOpen) return null

  // While open but the random index hasn't been picked yet (index === -1) OR
  // articles haven't arrived yet — render only the background so the grid
  // underneath never flashes through even for a single frame.
  if (items.length === 0 || index < 0 || index >= items.length) {
    return (
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: "#f2f1ee" }}
        role="dialog"
        aria-modal="true"
        aria-label="Zen mode loading"
      />
    )
  }

  const item = items[index]
  const liked = isLiked(item)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.url })
        return
      } catch (err) {
        if ((err as Error).name === "AbortError") return
      }
    }
    await navigator.clipboard.writeText(item.url)
    showToast(t("common.copied"))
  }

  const uiTransition = "opacity 0.35s ease"

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: "#f2f1ee" }}
      role="dialog"
      aria-modal="true"
      aria-label="Zen mode"
      onMouseMove={() => setUiVisible(true)}
      onMouseLeave={() => setUiVisible(false)}
    >
      {/* Top bar — no Zen label, just counter + close */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2 flex-shrink-0">
        <span className="text-xs font-mono text-slate-400 tracking-widest select-none">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close Zen mode"
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Content area — vertically centered, above the waves */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Left arrow — visible only on hover */}
        <button
          onClick={prev}
          className="absolute left-4 w-10 h-10 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all z-10"
          style={{ opacity: uiVisible ? 1 : 0, transition: uiTransition, pointerEvents: uiVisible ? "auto" : "none" }}
          aria-label="Previous"
        >
          <ChevronLeft style={{ width: 18, height: 18 }} />
        </button>

        {/* Content with crossfade */}
        <div
          style={{
            opacity: fadeVisible ? 1 : 0,
            transition: "opacity 0.15s ease",
            width: "100%",
          }}
        >
          {item.source === "wikipedia" && <WikipediaZenContent item={item} />}
          {item.source === "hackernews" && <HNZenContent item={item} />}
          {item.source === "memos" && <MemosZenContent item={item} />}
        </div>

        {/* Right arrow — visible only on hover */}
        <button
          onClick={next}
          className="absolute right-4 w-10 h-10 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all z-10"
          style={{ opacity: uiVisible ? 1 : 0, transition: uiTransition, pointerEvents: uiVisible ? "auto" : "none" }}
          aria-label="Next"
        >
          <ChevronRight style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Bottom: waves + ghost action pill */}
      <div className="relative flex-shrink-0">
        {/* Subtle ghost pill — appears on hover, very low-key */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 px-2 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.28)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.4)",
            opacity: uiVisible ? 1 : 0,
            transition: uiTransition,
            pointerEvents: uiVisible ? "auto" : "none",
          }}
        >
          <button
            onClick={() => toggleLike(item)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              liked ? "text-red-400" : "text-slate-400/70 hover:text-red-400"
            }`}
            aria-label={t("common.like")}
          >
            <Heart style={{ width: 15, height: 15 }} fill={liked ? "currentColor" : "none"} />
          </button>
          <div className="w-px h-4 bg-slate-300/50" />
          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400/70 hover:text-blue-400 transition-colors"
            aria-label={t("common.share")}
          >
            <Share2 style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <ZenWave />
      </div>
    </div>
  )
}
