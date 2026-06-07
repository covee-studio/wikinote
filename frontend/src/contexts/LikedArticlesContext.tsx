import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Heart } from "lucide-react"
import { StorageAdapter } from "../utils/environment"
import type { DiscoveryItem, SourceId } from "../types/DiscoveryItem"
import "../assets/heartAnimation.css"

// ─── Backward-compatible migration ───────────────────────────
// Converts old localStorage items (WikiArticle | HNArticle) to the new
// normalized DiscoveryItem format. Called once on mount.
function migrateStoredItem(item: unknown): DiscoveryItem | null {
  if (!item || typeof item !== "object") return null
  const obj = item as Record<string, unknown>

  // Already in new normalized format
  if (typeof obj.id === "string" && typeof obj.source === "string" && "raw" in obj) {
    return obj as unknown as DiscoveryItem
  }

  // Old WikiArticle format: { pageid: number, title, url, extract, ... }
  if (typeof obj.pageid === "number") {
    return {
      id: `wiki-${obj.pageid}`,
      source: "wikipedia" as SourceId,
      title: String(obj.title ?? ""),
      url: String(obj.url ?? ""),
      raw: obj,
    }
  }

  // Old HNArticle format: { source: "hackernews", id: number, title, url, ... }
  if (obj.source === "hackernews" && typeof obj.id === "number") {
    return {
      id: `hn-${obj.id}`,
      source: "hackernews" as SourceId,
      title: String(obj.title ?? ""),
      url: String(obj.url ?? ""),
      raw: obj,
    }
  }

  return null
}

// ─── Context ──────────────────────────────────────────────────
interface LikedArticlesContextType {
  likedArticles: DiscoveryItem[]
  toggleLike: (item: DiscoveryItem) => void
  isLiked: (item: DiscoveryItem) => boolean
}

const LikedArticlesContext = createContext<LikedArticlesContextType | undefined>(undefined)

export function LikedArticlesProvider({ children }: { children: ReactNode }) {
  const [likedArticles, setLikedArticles] = useState<DiscoveryItem[]>([])
  const [showHeart, setShowHeart] = useState(false)

  useEffect(() => {
    StorageAdapter.get<unknown[]>("likedArticles").then((saved) => {
      if (Array.isArray(saved)) {
        const migrated = saved.map(migrateStoredItem).filter(Boolean) as DiscoveryItem[]
        setLikedArticles(migrated)
      }
    })
  }, [])

  useEffect(() => {
    StorageAdapter.set("likedArticles", likedArticles)
  }, [likedArticles])

  const toggleLike = (item: DiscoveryItem) => {
    setLikedArticles((prev) => {
      const alreadyLiked = prev.some((a) => a.id === item.id)
      if (alreadyLiked) {
        return prev.filter((a) => a.id !== item.id)
      }
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 800)
      return [...prev, item]
    })
  }

  const isLiked = (item: DiscoveryItem): boolean =>
    likedArticles.some((a) => a.id === item.id)

  return (
    <LikedArticlesContext.Provider value={{ likedArticles, toggleLike, isLiked }}>
      {children}
      {showHeart && (
        <div className="heart-animation">
          <Heart size={200} strokeWidth={0} className="fill-white" />
        </div>
      )}
    </LikedArticlesContext.Provider>
  )
}

export function useLikedArticles() {
  const ctx = useContext(LikedArticlesContext)
  if (!ctx) throw new Error("useLikedArticles must be used within a LikedArticlesProvider")
  return ctx
}
