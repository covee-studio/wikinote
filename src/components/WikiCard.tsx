import { Heart, Share2 } from "lucide-react"
import { useState } from "react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useToast } from "../contexts/ToastContext"
import { useI18n } from "../hooks/useI18n"
import "../styles/WikiCard.css"
import type { ArticleProps } from "../types/ArticleProps"

interface WikiCardProps extends ArticleProps {
  priority?: boolean
}

export function WikiCard({ article, priority = false }: WikiCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const { toggleLike, isLiked } = useLikedArticles()
  const { t } = useI18n()
  const { showToast } = useToast()

  const handleShare = async () => {
    setShareError(false)
    setShareSuccess(false)

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.displaytitle,
          text: article.extract || "",
          url: article.url,
        })
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error)
          setShareError(true)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(article.url)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
        showToast(t("common.copied"))
      } catch (error) {
        console.error("Error copying to clipboard:", error)
        setShareError(true)
      }
    }
  }

  return (
    <div
      className="wiki-card hover:shadow-lg transition-shadow duration-300 inline-grid"
      style={{
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div className="wiki-card-image">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full cursor-pointer group"
          aria-label={`Read more about ${article.displaytitle}`}
          title={`Read more about ${article.displaytitle}`}
        >
          {article.thumbnail ? (
            <img
              src={article.thumbnail.source}
              alt={article.displaytitle}
              className={`${
                isImageLoaded ? "opacity-100" : "opacity-0"
              } transition-opacity duration-300 w-full h-full object-cover transition-transform duration-300`}
              width={article.thumbnail.width}
              height={article.thumbnail.height}
              loading={priority ? "eager" : "lazy"}
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                console.error("Image failed to load:", e)
                setIsImageLoaded(true)
              }}
              decoding="async"
            />
          ) : (
            <div className="bg-gray-200 h-full w-full group-hover:bg-gray-300 transition-colors duration-300" />
          )}
        </a>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleLike(article)
            }}
            className={`w-10 h-10 glass-button flex items-center justify-center ${
              isLiked(article.pageid) ? "text-red-500 liked" : "text-white hover:text-red-500"
            }`}
            aria-label={t("common.like")}
            title={t("common.like")}
          >
            <Heart className="w-5 h-5" fill={isLiked(article.pageid) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleShare()
            }}
            className={`w-10 h-10 glass-button flex items-center justify-center text-white hover:text-blue-500 ${
              shareError ? "text-red-500" : ""
            } ${shareSuccess ? "share-active" : ""}`}
            aria-label={t("common.share")}
            title={t("common.share")}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="wiki-card-content">
        <h3 className="wiki-card-title hover:text-blue-500 transition-colors duration-300">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            {article.displaytitle}
          </a>
        </h3>
        <p className="wiki-card-excerpt">{article.extract}</p>
      </div>
    </div>
  )
}
