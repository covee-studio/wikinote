import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Heart as HeartIcon, Share2 as Share2Icon, Layers as LayersIcon, Palette as PaletteIcon, Info as InfoIcon, Check as CheckIcon } from 'lucide-react'
import { useLikedArticles } from '../contexts/LikedArticlesContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../hooks/useI18n'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getAdapter } from '../sources/registry'
import type { DiscoveryItem } from '../types/DiscoveryItem'
import { ZEN_THEMES } from '../utils/zenThemes'
import { AboutModal } from './AboutModal'
import { LikesModal } from './LikesModal'
import { SourcesModal } from './SourcesModal'

interface ZenModeProps {
  isOpen: boolean
  items: DiscoveryItem[]
  initialIndex: number
  onClose: () => void
  onNearEnd?: () => void
}

function primarySize(len: number): string {
  if (len <= 36)  return 'clamp(30px, 4.2vw, 48px)'
  if (len <= 90)  return 'clamp(25px, 3vw, 38px)'
  if (len <= 160) return 'clamp(22px, 2.4vw, 31px)'
  return 'clamp(19px, 2vw, 26px)'
}

function ZenContent({ item, dark }: { item: DiscoveryItem; dark: boolean }) {
  const { primary, secondary, imageUrl, metaNode, primaryWeight = 500, accent, accentText, sourceLabel } =
    getAdapter(item.source).getZenContent(item)

  return (
    <article className="text-center flex flex-col items-center">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className={`w-[120px] h-[120px] object-cover rounded-full shadow-[0_8px_28px_rgba(15,23,42,0.12)] ring-4 mb-8 ${dark ? 'ring-white/20' : 'ring-white/60'}`}
        />
      )}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: accentText }}>
          <span aria-hidden className="w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
          {sourceLabel}
        </div>
      </div>
      <div aria-hidden className="mx-auto mb-7 h-[2px] w-10 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <p
          className={`font-serif-display whitespace-pre-line mx-auto max-w-[680px] hover:opacity-80 transition-opacity ${dark ? 'text-slate-50' : 'text-slate-900'}`}
          style={{ fontSize: primarySize(primary.length), lineHeight: 1.5, letterSpacing: '-0.005em', fontWeight: primaryWeight }}
        >
          {primary}
        </p>
      </a>
      {secondary && (
        <p
          className={`font-serif-display leading-[1.75] mx-auto max-w-[600px] mt-6 line-clamp-4 ${dark ? 'text-slate-300' : 'text-slate-500'}`}
          style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
        >
          {secondary}
        </p>
      )}
      <div className="mt-9 text-[12px] text-slate-400">{metaNode}</div>
    </article>
  )
}

function ChromeButton({
  children, label, onClick, active, dark,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  dark?: boolean
}) {
  const cls = dark
    ? active ? 'bg-white/15 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]' : 'text-slate-300 hover:text-white hover:bg-white/10'
    : active ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors ${cls}`}>
      {children}
    </button>
  )
}

type ModalKey = 'sources' | 'likes' | 'about' | null

export function ZenMode({ isOpen, items, initialIndex, onClose, onNearEnd }: ZenModeProps) {
  const [index, setIndex] = useState(initialIndex < 0 ? 0 : initialIndex)
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('zen-theme-id')
    return (saved && ZEN_THEMES.some((t) => t.id === saved)) ? saved : ZEN_THEMES[0].id
  })
  const [themeOpen, setThemeOpen] = useState(false)
  const [modal, setModal] = useState<ModalKey>(null)
  const [idle, setIdle] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { toggleLike, isLiked } = useLikedArticles()
  const { showToast } = useToast()
  const { t } = useI18n()

  useFocusTrap(isOpen && !modal && !themeOpen, containerRef)

  const theme = ZEN_THEMES.find((th) => th.id === themeId) ?? ZEN_THEMES[0]
  const Backdrop = theme.Backdrop
  const isDark = !!theme.dark

  useEffect(() => {
    if (isOpen) setIndex(initialIndex < 0 ? 0 : initialIndex)
  }, [isOpen, initialIndex])

  const wakeUp = useCallback(() => {
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), 2800)
  }, [])

  useEffect(() => {
    wakeUp()
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [wakeUp])

  useEffect(() => {
    if (modal) wakeUp()
  }, [modal, wakeUp])

  const next = useCallback(() => {
    const newIdx = (index + 1) % Math.max(1, items.length)
    setIndex(newIdx)
    wakeUp()
    if (onNearEnd && items.length - newIdx <= 5) onNearEnd()
  }, [index, items.length, wakeUp, onNearEnd])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + Math.max(1, items.length)) % Math.max(1, items.length))
    wakeUp()
  }, [items.length, wakeUp])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (modal || themeOpen) return
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, modal, themeOpen, prev, next, onClose])

  if (!isOpen) return null

  if (items.length === 0 || index < 0 || index >= items.length) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: theme.surface }} role="dialog" aria-modal="true" aria-label="Zen mode loading">
        <Backdrop />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Wikinote</span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i}
                className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-500/60' : 'bg-slate-400/60'}`}
                style={{ animation: `zen-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const item = items[index]
  const liked = isLiked(item)
  const chromeVisible = !idle || themeOpen || !!modal

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.url })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }
    await navigator.clipboard.writeText(item.url)
    showToast(t('common.copied'))
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ background: theme.surface }}
      role="dialog" aria-modal="true" aria-label="Zen mode"
      onMouseMove={wakeUp}
    >
      <Backdrop />

      {/* Top-left: brand + counter */}
      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute top-0 left-0 px-8 pt-6 z-20 flex items-center gap-4"
      >
        <button
          onClick={onClose}
          className={`text-[15px] font-bold tracking-tight hover:opacity-70 transition-opacity ${isDark ? 'text-slate-100' : 'text-slate-700'}`}
        >
          Wikinote
        </button>
      </motion.div>

      {/* Top-right: icon buttons + theme picker */}
      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute top-0 right-0 px-7 pt-5 z-30 flex items-center gap-1"
      >
        <ChromeButton label="About" onClick={() => setModal('about')} dark={isDark}>
          <InfoIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        </ChromeButton>
        <ChromeButton label="Sources" onClick={() => setModal('sources')} dark={isDark}>
          <LayersIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        </ChromeButton>
        <ChromeButton label="Liked" onClick={() => setModal('likes')} dark={isDark}>
          <HeartIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        </ChromeButton>

        {/* Theme picker */}
        <div className="relative">
          <ChromeButton label="Appearance" active={themeOpen} onClick={() => setThemeOpen((v) => !v)} dark={isDark}>
            <PaletteIcon className="w-[18px] h-[18px]" strokeWidth={2} />
          </ChromeButton>
          <AnimatePresence>
            {themeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setThemeOpen(false)} aria-hidden />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 mt-2 w-[288px] z-20 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_16px_48px_rgba(15,23,42,0.16)] p-3"
                >
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 px-1 pb-2">
                    Appearance
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {ZEN_THEMES.map((th) => {
                      const sel = th.id === themeId
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => { setThemeId(th.id); localStorage.setItem('zen-theme-id', th.id); setThemeOpen(false) }}
                          className="group flex flex-col items-center gap-1.5"
                          aria-pressed={sel}
                        >
                          <span
                            className="relative w-full h-10 rounded-lg overflow-hidden border transition-all"
                            style={{
                              background: th.Preview ? undefined : th.swatch,
                              borderColor: sel ? '#334155' : 'rgba(226,232,240,0.9)',
                              boxShadow: sel ? '0 0 0 1.5px #334155' : 'none',
                            }}
                          >
                            {th.Preview && <th.Preview />}
                            {sel && (
                              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center">
                                <CheckIcon className="w-2 h-2" strokeWidth={3} />
                              </span>
                            )}
                          </span>
                          <span className={`text-[10px] ${sel ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                            {th.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center px-8 pt-16 pb-32">
        <div className="w-full max-w-[820px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <ZenContent item={item} dark={isDark} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Left / right navigation */}
      <motion.button
        type="button" onClick={prev} aria-label="Previous"
        animate={{ opacity: chromeVisible ? 1 : 0, x: chromeVisible ? 0 : -8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full backdrop-blur-md border transition-all inline-flex items-center justify-center shadow-[0_4px_16px_rgba(15,23,42,0.06)] z-20 ${
          isDark ? 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20 hover:text-white' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white hover:text-slate-900 hover:scale-105'
        }`}
      >
        <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
      </motion.button>
      <motion.button
        type="button" onClick={next} aria-label="Next"
        animate={{ opacity: chromeVisible ? 1 : 0, x: chromeVisible ? 0 : 8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full backdrop-blur-md border transition-all inline-flex items-center justify-center shadow-[0_4px_16px_rgba(15,23,42,0.06)] z-20 ${
          isDark ? 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20 hover:text-white' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white hover:text-slate-900 hover:scale-105'
        }`}
      >
        <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
      </motion.button>

      {/* Bottom: like + share pill */}
      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : 8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute bottom-0 inset-x-0 pb-7 flex justify-center z-20"
      >
        <div className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-md border shadow-[0_4px_16px_rgba(15,23,42,0.06)] ${
          isDark ? 'bg-white/10 border-white/20' : 'bg-white/60 border-white/70'
        }`}>
          <button
            type="button"
            onClick={() => toggleLike(item)}
            aria-label={liked ? 'Unlike' : 'Like'}
            aria-pressed={liked}
            className={`w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'text-slate-300 hover:text-rose-400 hover:bg-white/10' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'
            }`}
            style={liked ? { color: isDark ? '#fb7185' : '#f43f5e' } : undefined}
          >
            <HeartIcon className="w-[15px] h-[15px]" strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <span className={`w-px h-4 ${isDark ? 'bg-white/20' : 'bg-slate-200'}`} />
          <button
            type="button"
            onClick={handleShare}
            aria-label={t('common.share')}
            className={`w-9 h-9 inline-flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Share2Icon className="w-[15px] h-[15px]" strokeWidth={2} />
          </button>
        </div>
      </motion.div>

      <AboutModal isOpen={modal === 'about'} onClose={() => setModal(null)} />
      <SourcesModal isOpen={modal === 'sources'} onClose={() => setModal(null)} />
      <LikesModal isOpen={modal === 'likes'} onClose={() => setModal(null)} />
    </div>
  )
}
