import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Heart as HeartIcon, Share2 as Share2Icon, Layers as LayersIcon, Palette as PaletteIcon, Info as InfoIcon, Check as CheckIcon, Shuffle as ShuffleIcon } from 'lucide-react'
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
  feedKey: string
  /** Incremented by App when a replaceAnchorOnRefetch source gets a new batch.
   *  Resets the anchor independently of feedKey — feedKey handles full source
   *  config resets (which also clear extraItems); anchorKey handles only the
   *  displayed item so the user sees the new Memos window without losing
   *  any loaded-more content. */
  anchorKey: number
  items: DiscoveryItem[]
  initialIndex: number
  onNearEnd?: () => void
}

function primarySize(len: number): string {
  if (len <= 36)  return 'clamp(30px, 4.2vw, 48px)'
  if (len <= 90)  return 'clamp(25px, 3vw, 38px)'
  if (len <= 160) return 'clamp(22px, 2.4vw, 31px)'
  return 'clamp(19px, 2vw, 26px)'
}

function ZenContent({ item, dark }: { item: DiscoveryItem; dark: boolean }) {
  const { primary, secondary, imageUrl, metaNode, primaryWeight = 500, accent, accentText, sourceLabel, noLink, primaryScrollable } =
    getAdapter(item.source).getZenContent(item)

  const linkProps = !noLink ? { href: item.url, target: '_blank' as const, rel: 'noopener noreferrer' } : null
  const imageStyle = { width: 120, height: 120, objectFit: 'cover' as const, flexShrink: 0 }

  const primaryEl = (
    <p
      className={`font-serif-display whitespace-pre-line mx-auto max-w-[680px] ${dark ? 'text-slate-50' : 'text-slate-900'}`}
      style={{ fontSize: primarySize(primary.length), lineHeight: 1.5, letterSpacing: '-0.005em', fontWeight: primaryWeight }}
    >
      {primary}
    </p>
  )

  const textBlock = (
    <>
      {primaryScrollable ? (
        <div
          className={`overflow-y-auto w-full max-w-[680px] mx-auto text-left rounded-lg px-2 ${dark ? 'scrollbar-dark' : ''}`}
          style={{ maxHeight: `${primaryScrollable.maxHeightVh}vh` }}
        >
          {primaryEl}
        </div>
      ) : primaryEl}
      {secondary && (
        <p
          className={`font-serif-display leading-[1.75] mx-auto max-w-[600px] mt-6 line-clamp-4 ${dark ? 'text-slate-300' : 'text-slate-500'}`}
          style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
        >
          {secondary}
        </p>
      )}
    </>
  )

  return (
    <article className="text-center flex flex-col items-center w-full">
      {imageUrl && (
        linkProps ? (
          <a {...linkProps} className="hover:opacity-80 transition-opacity mb-8">
            <img
              src={imageUrl}
              alt=""
              className={`w-[120px] h-[120px] object-cover rounded-full shadow-[0_8px_28px_rgba(15,23,42,0.12)] ring-4 ${dark ? 'ring-white/20' : 'ring-white/60'}`}
              style={imageStyle}
            />
          </a>
        ) : (
          <img
            src={imageUrl}
            alt=""
            className={`w-[120px] h-[120px] object-cover rounded-full shadow-[0_8px_28px_rgba(15,23,42,0.12)] ring-4 mb-8 ${dark ? 'ring-white/20' : 'ring-white/60'}`}
            style={imageStyle}
          />
        )
      )}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em]" style={{ color: accentText }}>
          <span aria-hidden className="w-1 h-1 rounded-full" style={{ backgroundColor: accent }} />
          {sourceLabel}
        </div>
      </div>
      <div aria-hidden className="mx-auto mb-7 h-[2px] w-10 rounded-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
      {linkProps ? (
        <a {...linkProps} className="flex flex-col items-center hover:opacity-80 transition-opacity w-full">
          {textBlock}
        </a>
      ) : textBlock}
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
      className={`relative z-20 w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors ${cls}`}>
      {children}
    </button>
  )
}

type ModalKey = 'sources' | 'likes' | 'about' | null

export function ZenMode({ isOpen, feedKey, anchorKey, items, initialIndex, onNearEnd }: ZenModeProps) {
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  // When items is rebuilt with a completely different random batch (Wikipedia uses
  // generator=random so each fetch returns new article IDs), currentItemId may not
  // exist in the new array. We keep the last found item in a ref so the display
  // stays stable — no jump — until the user deliberately navigates.
  const anchoredItemRef = useRef<DiscoveryItem | null>(null)
  const index = useMemo(() => {
    if (!currentItemId || items.length === 0) return -1
    return items.findIndex((it) => it.id === currentItemId)
  }, [currentItemId, items])
  // Keep anchor up-to-date whenever the item is present in the current batch.
  useEffect(() => {
    if (index !== -1 && items[index]) anchoredItemRef.current = items[index]
  }, [index, items])
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem('zen-theme-id')
    if (saved === 'dawn' || saved === 'sunrise') {
      localStorage.setItem('zen-theme-id', 'solar')
      return 'solar'
    }
    return (saved && (saved === 'random' || ZEN_THEMES.some((t) => t.id === saved))) ? saved : ZEN_THEMES[0].id
  })
  const resolvedThemeId = useMemo(() => {
    if (themeId !== 'random') return themeId
    return ZEN_THEMES[Math.floor(Math.random() * ZEN_THEMES.length)].id
  }, [themeId])
  const [themeOpen, setThemeOpen] = useState(false)
  const [modal, setModal] = useState<ModalKey>(null)
  const [idle, setIdle] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { toggleLike, isLiked } = useLikedArticles()
  const { showToast } = useToast()
  const { t } = useI18n()

  useFocusTrap(isOpen && !modal && !themeOpen, containerRef)

  const theme = ZEN_THEMES.find((th) => th.id === resolvedThemeId) ?? ZEN_THEMES[0]
  const Backdrop = theme.Backdrop
  const isDark = !!theme.dark

  // Note: we intentionally do NOT clear anchoredItemRef here. Clearing it
  // made `item` (below) resolve to null the instant feedKey/anchorKey
  // changed — e.g. toggling a source or finishing a Memos config edit —
  // which forced the render into the "loading" branch (a different
  // background/layout) for one paint before the new item was picked. That
  // was the whole-window "flash". Keeping the last item visible via
  // anchoredItemRef until a fresh one is chosen makes the transition
  // seamless; the "keep anchor up-to-date" effect above will overwrite it
  // as soon as the new batch resolves.
  useEffect(() => {
    setCurrentItemId(null)
  }, [feedKey])

  // anchorKey is incremented by App when a replaceAnchorOnRefetch source (e.g. Memos)
  // delivers a new batch. Reset anchor so the initialIndex effect below picks up the
  // new batch's starting item. anchorKey=0 is the initial value — skip it.
  useEffect(() => {
    if (anchorKey === 0) return
    setCurrentItemId(null)
  }, [anchorKey])

  // Set the anchor item once: when items arrive and a valid initialIndex is known.
  // Guard on currentItemId===null ensures we never overwrite the user's navigation.
  useEffect(() => {
    if (!isOpen || currentItemId !== null || initialIndex < 0 || items.length === 0) return
    setCurrentItemId(items[Math.min(initialIndex, items.length - 1)].id)
  }, [isOpen, currentItemId, initialIndex, items])

  const wakeUp = useCallback(() => {
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), 2800)
  }, [])

  useEffect(() => {
    wakeUp()
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (shareTimer.current) clearTimeout(shareTimer.current)
    }
  }, [wakeUp])

  useEffect(() => {
    if (modal) wakeUp()
  }, [modal, wakeUp])

  const next = useCallback(() => {
    if (items.length === 0) return
    const base = index !== -1 ? index : 0
    const newIdx = (base + 1) % items.length
    setCurrentItemId(items[newIdx].id)
    wakeUp()
    if (onNearEnd && items.length - newIdx <= 5) onNearEnd()
  }, [index, items, wakeUp, onNearEnd])

  const prev = useCallback(() => {
    if (items.length === 0) return
    const base = index !== -1 ? index : 0
    const newIdx = (base - 1 + items.length) % items.length
    setCurrentItemId(items[newIdx].id)
    wakeUp()
  }, [index, items, wakeUp])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && themeOpen) {
        e.preventDefault()
        setThemeOpen(false)
        return
      }
      if (modal || themeOpen) return
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, modal, themeOpen, prev, next])

  if (!isOpen) return null

  const item = index !== -1 ? items[index] : anchoredItemRef.current

  // Only fall back to the dedicated loading screen when we truly have
  // nothing to show yet (first-ever load). Do NOT also gate on
  // `currentItemId === null` here — that's transiently true on every
  // feedKey/anchorKey reset even when `item` (via anchoredItemRef) is
  // still valid, which used to force a jarring flash to this screen.
  if (!item) {
    return (
      <div className="fixed inset-0 z-[200]" style={{ background: theme.surface }}
        role="dialog" aria-modal="true" aria-label="Zen mode loading">
        <Backdrop />
        <div className="absolute top-0 left-0 px-8 pt-6 z-20">
          <span className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-700'} opacity-40`}>
            Wikinote
          </span>
        </div>
        {/* Sources button — always visible so user can escape a stuck loading screen */}
        <div className="absolute top-0 right-0 px-7 pt-5 z-30">
          <ChromeButton label="Sources" onClick={() => setModal('sources')} dark={isDark}>
            <LayersIcon className="w-[18px] h-[18px]" strokeWidth={2} />
          </ChromeButton>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.18)'}`,
            animation: 'zen-breathe 2.6s ease-in-out infinite',
          }} />
        </div>
        <SourcesModal isOpen={modal === 'sources'} onClose={() => setModal(null)} />
      </div>
    )
  }

  const liked = isLiked(item)
  const chromeVisible = !idle || themeOpen || !!modal

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(item.url)
      setShareCopied(true)
      wakeUp()
      if (shareTimer.current) clearTimeout(shareTimer.current)
      shareTimer.current = setTimeout(() => setShareCopied(false), 1600)
    } catch {
      showToast(t('common.copyFailed'))
    }
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

      {/* Top-left: brand */}
      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute top-0 left-0 px-8 pt-6 z-20 flex items-center gap-4"
      >
        <span className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
          Wikinote
        </span>
      </motion.div>

      {/* Top-right: icon buttons + theme picker */}
      <motion.div
        animate={{ opacity: chromeVisible ? 1 : 0, y: chromeVisible ? 0 : -6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="absolute top-0 right-0 px-7 pt-5 z-30 flex items-center gap-1"
      >
        <ChromeButton label="About" onClick={() => { setThemeOpen(false); setModal('about') }} dark={isDark}>
          <InfoIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        </ChromeButton>
        <ChromeButton label="Sources" onClick={() => { setThemeOpen(false); setModal('sources') }} dark={isDark}>
          <LayersIcon className="w-[18px] h-[18px]" strokeWidth={2} />
        </ChromeButton>
        <ChromeButton label="Liked" onClick={() => { setThemeOpen(false); setModal('likes') }} dark={isDark}>
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
                  {/* Random / auto option */}
                  <button
                    type="button"
                    onClick={() => { setThemeId('random'); localStorage.setItem('zen-theme-id', 'random'); setThemeOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg mb-2 transition-colors ${themeId === 'random' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    aria-pressed={themeId === 'random'}
                  >
                    <span className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 inline-flex items-center justify-center flex-shrink-0">
                      <ShuffleIcon className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                    </span>
                    <span className="text-[12px] text-slate-700 font-medium">Auto</span>
                    <span className="text-[11px] text-slate-400 ml-0.5">— different each tab</span>
                    {themeId === 'random' && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-slate-800 text-white inline-flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                  <div className="h-px bg-slate-100 mb-2" />
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
        className={`absolute left-6 md:left-10 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full backdrop-blur-md border transition-all inline-flex items-center justify-center shadow-[0_4px_16px_rgba(15,23,42,0.06)] z-20 ${
          isDark ? 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20 hover:text-white' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white hover:text-slate-900 hover:scale-105'
        }`}
      >
        <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
      </motion.button>
      <motion.button
        type="button" onClick={next} aria-label="Next"
        animate={{ opacity: chromeVisible ? 1 : 0, x: chromeVisible ? 0 : 8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`absolute right-6 md:right-10 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-11 h-11 rounded-full backdrop-blur-md border transition-all inline-flex items-center justify-center shadow-[0_4px_16px_rgba(15,23,42,0.06)] z-20 ${
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
          <div className="relative">
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
            <AnimatePresence>
              {shareCopied && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  role="status"
                  className={`pointer-events-none absolute left-1/2 bottom-[calc(100%+10px)] z-30 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium shadow-[0_8px_24px_rgba(15,23,42,0.12)] ${
                    isDark ? 'bg-white/90 text-slate-900' : 'bg-slate-900 text-white'
                  }`}
                >
                  {t('common.copiedShort')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <AboutModal isOpen={modal === 'about'} onClose={() => setModal(null)} />
      <SourcesModal isOpen={modal === 'sources'} onClose={() => setModal(null)} />
      <LikesModal isOpen={modal === 'likes'} onClose={() => setModal(null)} />
    </div>
  )
}
