import { Heart, Highlighter, Share2 } from "lucide-react"
import { useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import type { DiscoveryItem } from "../types/DiscoveryItem"
import { formatRelativeTime, getDomain } from "../utils/formatting"
import { getAnnotationQuote } from "../sources/hypothesis"
import type { HypothesisAnnotationRaw } from "../sources/hypothesis"
import "../styles/TextCard.css"
import "../styles/WikiCard.css"

interface HypothesisCardProps {
  item: DiscoveryItem
}

export function HypothesisCard({ item }: HypothesisCardProps) {
  const annotation = item.raw as HypothesisAnnotationRaw
  const [shareSuccess, setShareSuccess] = useState(false)
  const { t } = useI18n()
  const { showToast } = useToast()
  const { toggleLike, isLiked } = useLikedArticles()
  const liked = isLiked(item)
  const domain = getDomain(item.url)
  const note = annotation.text?.trim() || ""
  const quote = getAnnotationQuote(annotation)
  const primaryText = quote || note || item.title
  const displayNote = note.length > 220 ? `${note.slice(0, 217)}…` : note

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.url })
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
        return
      } catch (error) {
        if ((error as Error).name === "AbortError") return
      }
    }
    await navigator.clipboard.writeText(item.url)
    showToast(t("common.copied"))
    setShareSuccess(true)
    setTimeout(() => setShareSuccess(false), 2000)
  }

  return (
    <div className="wiki-card inline-grid" style={{ gridTemplateRows: "auto 1fr" }}>
      <div className="wiki-card-image card-hero-text" style={{ background: "#fff8e6" }}>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={`Open: ${item.title}`}
        />
        <span className="card-hero-label">Annotation</span>
        <Highlighter className="card-hero-watermark" style={{ width: 88, height: 88, color: "#e0a000" }} />
        <span className="card-hero-domain">{domain || "hypothes.is"}</span>
      </div>

      <div className="wiki-card-content">
        <div className="source-badge">
          <span className="source-badge-dot" style={{ backgroundColor: "#e0a000" }} />
          Hypothesis
        </div>

        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">
          {quote ? "Highlight" : "Your note"}
        </div>

        <h3 className="text-lg font-normal leading-relaxed text-slate-800">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-amber-700"
          >
            {primaryText}
          </a>
        </h3>

        {quote && note && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Your note
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">{displayNote}</p>
          </div>
        )}

        <div className="card-footer-row">
          <span>{annotation.user?.replace(/^acct:/, "") || "Private annotation"}</span>
          {annotation.updated && (
            <>
              <span className="opacity-40">·</span>
              <span>{formatRelativeTime(Date.parse(annotation.updated))}</span>
            </>
          )}
          <div className="card-action-buttons">
            <button
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleLike(item) }}
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
