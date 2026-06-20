import { Flame, Heart, MessageSquare, Share2 } from "lucide-react"
import { useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import type { HNArticleRaw } from "../sources/hackernews"
import "../styles/TextCard.css"
import "../styles/WikiCard.css"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import { formatRelativeTime, getDomain } from "../utils/formatting"

interface TextCardProps {
  item: DiscoveryItem
  priority?: boolean
}

export function TextCard({ item }: TextCardProps) {
  const article = item.raw as HNArticleRaw
  const [shareSuccess, setShareSuccess] = useState(false)
  const { t } = useI18n()
  const { showToast } = useToast()
  const { toggleLike, isLiked } = useLikedArticles()
  const liked = isLiked(item)

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

  const domain = getDomain(item.url)
  const isExternal = !item.url.includes("news.ycombinator.com")
  const displayDomain = isExternal && domain ? domain : "news.ycombinator.com"
  const discussionUrl = `https://news.ycombinator.com/item?id=${article.id}`

  return (
    <div className="wiki-card inline-grid" style={{ gridTemplateRows: "auto 1fr" }}>
      {/* ── Hero — cream bg + domain + flame watermark ── */}
      <div
        className="wiki-card-image card-hero-text"
        style={{ background: "#FAF5F3" }}
      >
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={`Read: ${item.title}`}
        />
        <span className="card-hero-label">Linked Source</span>
        <Flame
          className="card-hero-watermark"
          style={{ width: 88, height: 88, color: "#f97316" }}
        />
        <span className="card-hero-domain">{displayDomain}</span>
      </div>

      {/* ── Content ── */}
      <div className="wiki-card-content">
        {/* Source badge */}
        <div className="source-badge">
          <span className="source-badge-dot" style={{ backgroundColor: "#f97316" }} />
          Hacker News
        </div>

        {/* Title */}
        <h3 className="wiki-card-title text-card-title-hn">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.title}
          </a>
        </h3>

        {/* Meta footer */}
        <div className="card-footer-row">
          <a
            href={discussionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-orange-400 transition-colors"
          >
            <MessageSquare style={{ width: 12, height: 12 }} />
            <span>{article.commentCount}</span>
          </a>
          <span className="opacity-40">·</span>
          <span>{article.author}</span>
          <span className="opacity-40">·</span>
          <span>{formatRelativeTime(article.time)}</span>
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
