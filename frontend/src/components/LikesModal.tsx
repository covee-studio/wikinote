import { Clock3, Cloud, Download, Heart, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useLikedArticles } from "../contexts/LikedArticlesContext"
import { useI18n } from "../hooks/useI18n"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation"
import { getAdapter } from "../sources/registry"
import { Toggle } from "./Toggle"
import type { DiscoveryItem } from "../types/DiscoveryItem"

interface LikesModalProps {
  isOpen: boolean
  onClose: () => void
}

function SourceBadge({ item }: { item: DiscoveryItem }) {
  const adapter = getAdapter(item.source)
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {adapter.logoSrc ? (
        <img src={adapter.logoSrc} alt="" className="h-full w-full rounded-full object-contain" />
      ) : (
        <span className="text-sm font-semibold text-slate-500">{adapter.label.slice(0, 1)}</span>
      )}
    </div>
  )
}

export function LikesModal({ isOpen, onClose }: LikesModalProps) {
  const { t } = useI18n()
  const {
    likedArticles,
    recentArticles,
    toggleLike,
    clearRecent,
    syncAvailable,
    syncEnabled,
    syncStatus,
    setSyncEnabled,
  } = useLikedArticles()
  const [activeTab, setActiveTab] = useState<"saved" | "recent">("saved")
  const [tabWasChosenByUser, setTabWasChosenByUser] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useKeyboardNavigation({ onEscape: onClose, enabled: isOpen })
  useFocusTrap(isOpen, containerRef)

  // Saved is the natural entry point when the user has deliberately kept
  // something. Recent is a recovery surface, so it becomes the default only
  // when there is nothing saved. Do not override a tab the user has chosen
  // during this open session (including while storage is still hydrating).
  useEffect(() => {
    if (!isOpen) {
      setTabWasChosenByUser(false)
      return
    }
    if (!tabWasChosenByUser) {
      setActiveTab(likedArticles.length > 0 ? "saved" : "recent")
    }
  }, [isOpen, likedArticles.length, tabWasChosenByUser])

  const articles: Array<{ item: DiscoveryItem; seenAt?: number }> = activeTab === "saved"
    ? likedArticles.map((item) => ({ item }))
    : recentArticles
  const filteredArticles = articles.filter(({ item }) =>
    getAdapter(item.source).getSearchText(item).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatSeenAt = (seenAt: number) => {
    const seconds = Math.max(0, Math.floor((Date.now() - seenAt) / 1000))
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return "Yesterday"
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(seenAt))
  }

  const handleExport = () => {
    const data = likedArticles.map((item) => getAdapter(item.source).getExportData(item))
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const filename = `wikinote-favorites-${new Date().toISOString().split("T")[0]}.json`
    const link = document.createElement("a")
    link.setAttribute("href", dataUri)
    link.setAttribute("download", filename)
    link.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="likes-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            ref={containerRef}
            className="z-[41] p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col relative"
            style={{
              background: "#ffffff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            }}
            role="document"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t("likes.title")}</h2>
                  <p className="text-sm text-slate-400">
                    {t("likes.savedAndRecent")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "saved" && likedArticles.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all"
                    title={t("likes.export")}
                  >
                    <Download className="w-4 h-4" />
                    {t("likes.export")}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 flex border-b border-slate-100" role="tablist" aria-label="Collection views">
              {(["saved", "recent"] as const).map((tab) => {
                const selected = activeTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setTabWasChosenByUser(true)
                      setActiveTab(tab)
                      setSearchQuery("")
                    }}
                    className={`relative px-4 pb-2.5 text-sm transition-colors ${selected ? "font-medium text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {t(`likes.${tab}`)}
                    {selected && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-slate-800" />}
                  </button>
                )
              })}
            </div>

            {activeTab === "saved" && syncAvailable && (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 mb-4"
                title="Only compact favorite previews are synced. API keys and tokens stay on this device."
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Cloud className={`h-4 w-4 flex-shrink-0 ${syncStatus === "error" ? "text-rose-400" : "text-slate-400"}`} strokeWidth={1.8} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-slate-700">Sync favorites</p>
                    <p className={`truncate text-[11px] ${syncStatus === "error" ? "text-rose-500" : "text-slate-400"}`}>
                      {syncStatus === "syncing"
                        ? "Syncing with Chrome"
                        : syncStatus === "synced"
                          ? "Synced with Chrome"
                          : syncStatus === "error"
                            ? "Sync unavailable"
                            : "Only on this device"}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={syncEnabled}
                  onChange={() => setSyncEnabled(!syncEnabled)}
                  ariaLabel="Sync favorites across Chrome devices"
                />
              </div>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "saved" ? t("likes.search") : t("likes.searchRecent")}
                className="w-full text-slate-800 px-4 py-2.5 pl-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredArticles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    {activeTab === "saved"
                      ? <Heart className="w-7 h-7 text-slate-400" />
                      : <Clock3 className="w-7 h-7 text-slate-400" />}
                  </div>
                  <p className="text-slate-700 text-base font-medium">
                    {searchQuery ? t("likes.noMatches") : activeTab === "saved" ? t("likes.noLikedArticles") : t("likes.noRecentArticles")}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {searchQuery ? t("likes.tryDifferentSearch") : activeTab === "saved" ? t("likes.startLiking") : "The last things you opened will appear here"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {filteredArticles.map(({ item, seenAt }) => {
                    const adapter = getAdapter(item.source)
                    const preview = adapter.getLikePreview(item)
                    return (
                      <div
                        key={item.id}
                        className="group px-2 py-4 transition-colors hover:bg-slate-50/80"
                      >
                        <div className="flex gap-4 items-start">
                          {activeTab === "recent" ? <SourceBadge item={item} /> : preview.thumbnailNode}
                          <div className="flex-1 min-w-0">
                            {activeTab === "recent" && (
                              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                                {adapter.label}
                              </p>
                            )}
                            <div className="flex justify-between items-start gap-2">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-semibold text-slate-800 transition-colors line-clamp-1 ${preview.titleHoverClass}`}
                              >
                                {item.title}
                              </a>
                              {activeTab === "saved" ? (
                                <button
                                  onClick={() => toggleLike(item)}
                                  className="text-slate-300 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                  aria-label={t("likes.remove")}
                                  title={t("likes.remove")}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              ) : seenAt ? (
                                <time className="shrink-0 pt-0.5 text-[11px] text-slate-400" dateTime={new Date(seenAt).toISOString()}>
                                  {formatSeenAt(seenAt)}
                                </time>
                              ) : null}
                            </div>
                            {preview.descriptionNode ?? (
                              <p className="text-sm text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {preview.descriptionText}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {activeTab === "recent" && recentArticles.length > 0 && (
              <div className="flex justify-end pt-3">
                <button type="button" onClick={clearRecent} className="text-xs text-slate-400 transition-colors hover:text-slate-700">
                  {t("likes.clearRecent")}
                </button>
              </div>
            )}
          </motion.div>

          <div
            className="w-full h-full z-[40] fixed inset-0"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose() } }}
            role="button"
            tabIndex={0}
            aria-label={t("common.close")}
            aria-pressed="false"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
