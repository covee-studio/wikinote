import { BookOpen, Clock, Heart, Share2 } from "lucide-react"
import { useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import type { WikiArticleRaw } from "../sources/wikipedia"
import "../styles/WikiCard.css"
import type { DiscoveryItem } from "../types/DiscoveryItem"

interface WikiCardProps {
  item: DiscoveryItem
  priority?: boolean
}

function readMinutes(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
}

export function WikiCard({ item, priority = false }: WikiCardProps) {
  const article = item.raw as WikiArticleRaw
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const { toggleLike, isLiked } = useLikedArticles()
  const { t } = useI18n()
  const { showToast } = useToast()
  const liked = isLiked(item)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title: article.displaytitle, text: article.extract, url: item.url })
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

  const mins = readMinutes(article.extract || "")

  return (
    <div className="wiki-card inline-grid" style={{ gridTemplateRows: "auto 1fr" }}>
      {/* ── Hero ── */}
      <div className="wiki-card-image">
        {article.thumbnail ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block absolute inset-0"
            aria-label={`Read about ${article.displaytitle}`}
          >
            <img
              src={article.thumbnail.source}
              alt={article.displaytitle}
              className={`${isImageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300 w-full h-full object-cover`}
              width={article.thumbnail.width}
              height={article.thumbnail.height}
              loading={priority ? "eager" : "lazy"}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)}
              decoding="async"
            />
          </a>
        ) : (
          /* Fallback hero */
          <div
            className="absolute inset-0 card-hero-text"
            style={{ background: "#eef2ff" }}
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-0"
              aria-label={`Read about ${article.displaytitle}`}
            />
            <span className="card-hero-label">From the encyclopedia</span>
            <BookOpen
              className="card-hero-watermark"
              style={{ width: 96, height: 96, color: "#6366f1" }}
            />
            <span className="card-hero-tagline">"{article.displaytitle}"</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="wiki-card-content">
        {/* Source badge */}
        <div className="source-badge">
          <span className="source-badge-dot" style={{ backgroundColor: "#3b82f6" }} />
          Wikipedia
        </div>

        {/* Title */}
        <h3 className="wiki-card-title">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors duration-200"
          >
            {article.displaytitle}
          </a>
        </h3>

        {/* Excerpt */}
        <p className="wiki-card-excerpt">{article.extract}</p>

        {/* Footer */}
        <div className="card-footer-row">
          <Clock style={{ width: 12, height: 12 }} />
          <span>{mins} min read</span>
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
