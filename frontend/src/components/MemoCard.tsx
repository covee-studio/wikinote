import { Heart, NotebookPen, Share2 } from "lucide-react"
import { useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import type { MemoRaw } from "../sources/memos"
import "../styles/TextCard.css"
import "../styles/WikiCard.css"
import type { DiscoveryItem } from "../types/DiscoveryItem"

interface MemoCardProps {
  item: DiscoveryItem
  priority?: boolean
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch { return "" }
}

function formatDateLong(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  } catch { return "" }
}

export function MemoCard({ item, priority = false }: MemoCardProps) {
  const memo = item.raw as MemoRaw
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const { t } = useI18n()
  const { showToast } = useToast()
  const { toggleLike, isLiked } = useLikedArticles()
  const liked = isLiked(item)
  const hasImage = Boolean(memo.imageUrl)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.url })
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
        return
      } catch (err) {
        if ((err as Error).name === "AbortError") return
      }
    }
    await navigator.clipboard.writeText(item.url)
    showToast(t("common.copied"))
    setShareSuccess(true)
    setTimeout(() => setShareSuccess(false), 2000)
  }

  const dateShort = formatDate(memo.displayTime)
  const dateLong = formatDateLong(memo.displayTime)

  return (
    <div className="wiki-card inline-grid" style={{ gridTemplateRows: "auto 1fr" }}>
      {/* ── Hero ── */}
      {hasImage ? (
        /* Photo hero */
        <div className="wiki-card-image">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block absolute inset-0"
            aria-label={`Open memo: ${memo.title}`}
          >
            <img
              src={memo.imageUrl}
              alt={memo.title}
              className={`${isImageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300 w-full h-full object-cover`}
              loading={priority ? "eager" : "lazy"}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)}
              decoding="async"
            />
          </a>
        </div>
      ) : (
        /* Text hero — warm neutral bg + date + watermark */
        <div
          className="wiki-card-image card-hero-text"
          style={{ background: "#F7F6F8" }}
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-0"
            aria-label={`Open memo: ${memo.title}`}
          />
          <span className="card-hero-label">Personal Note</span>
          <NotebookPen
            className="card-hero-watermark"
            style={{ width: 88, height: 88, color: "#94a3b8" }}
          />
          <span className="card-hero-date">{dateLong}</span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="wiki-card-content">
        {/* Source badge */}
        <div className="source-badge">
          <span className="source-badge-dot" style={{ backgroundColor: "#8b5cf6" }} />
          Memos
        </div>

        {/* Title */}
        <h3 className="wiki-card-title">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-600 transition-colors duration-200"
          >
            {memo.title}
          </a>
        </h3>

        {/* Excerpt */}
        {memo.excerpt && (
          <p className="wiki-card-excerpt">{memo.excerpt}</p>
        )}

        {/* Footer */}
        <div className="card-footer-row">
          {memo.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium"
              style={{ color: "#94a3b8" }}
            >
              #{tag}
            </span>
          ))}
          {memo.tags.length === 0 && (
            <span>{dateShort}</span>
          )}
          {/* Hover-only actions */}
          <div className="card-action-buttons">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(item) }}
              className={`card-action-btn ${liked ? "liked" : ""}`}
              aria-label={t("common.like")}
            >
              <Heart style={{ width: 14, height: 14 }} fill={liked ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className={`card-action-btn ${shareSuccess ? "share-active" : ""}`}
              aria-label={t("common.share")}
            >
              <Share2 style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
