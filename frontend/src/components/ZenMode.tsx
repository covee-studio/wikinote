import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Heart as HeartIcon, Share2 as Share2Icon, Layers as LayersIcon, Palette as PaletteIcon, Info as InfoIcon, Check as CheckIcon, Shuffle as ShuffleIcon } from 'lucide-react'
import { useLikedArticles } from '../contexts/LikedArticlesContext'
import { useToast } from '../contexts/ToastContext'
import { useI18n } from '../hooks/useI18n'
import { useLocalization } from '../hooks/useLocalization'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getAdapter } from '../sources/registry'
import type { DiscoveryItem } from '../types/DiscoveryItem'
import { ZEN_THEMES } from '../utils/zenThemes'
import { useAutoTranslatedText } from '../utils/translation'
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
  isLoading?: boolean
  loadError?: string
  onRetry?: () => void
}

const SCROLL_FADE_SIZE = '3.75rem'

function FadingScroll({ children, maxHeightVh }: { children: React.ReactNode; maxHeightVh: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ top: false, bottom: false })

  const updateFade = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    const overflow = node.scrollHeight - node.clientHeight > 1
    setFade({
      top: overflow && node.scrollTop > 1,
      bottom: overflow && node.scrollTop + node.clientHeight < node.scrollHeight - 1,
    })
  }, [])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    updateFade()
    node.addEventListener('scroll', updateFade, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateFade) : null
    observer?.observe(node)

    return () => {
      node.removeEventListener('scroll', updateFade)
      observer?.disconnect()
    }
  }, [updateFade, children])

  const maskImage = fade.top && fade.bottom
    ? `linear-gradient(to bottom, transparent 0, black ${SCROLL_FADE_SIZE}, black calc(100% - ${SCROLL_FADE_SIZE}), transparent 100%)`
    : fade.top
      ? `linear-gradient(to bottom, transparent 0, black ${SCROLL_FADE_SIZE}, black 100%)`
      : fade.bottom
        ? `linear-gradient(to bottom, black 0, black calc(100% - ${SCROLL_FADE_SIZE}), transparent 100%)`
        : 'none'

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div
        ref={scrollRef}
        // A scrollable region must be focusable so keyboard users can scroll it.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="region"
        aria-label="Scrollable content"
        className="zen-scroll w-full overflow-y-auto rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
        style={{ maxHeight: `${maxHeightVh}vh`, maskImage }}
      >
        {children}
      </div>
      <div aria-hidden className={`zen-scroll-edge zen-scroll-edge-top ${fade.top ? 'opacity-100' : 'opacity-0'}`} />
      <div aria-hidden className={`zen-scroll-edge zen-scroll-edge-bottom ${fade.bottom ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

function ZenContent({ item, dark }: { item: DiscoveryItem; dark: boolean }) {
  const { primary, secondary, imageUrl, metaNode, primaryWeight = 500, contentKind = "title", accent, accentText, sourceLabel, noLink, primaryScrollable } =
    getAdapter(item.source).getZenContent(item)
  const { currentLanguage } = useLocalization()
  const translation = useAutoTranslatedText(
    primary,
    currentLanguage.id,
    item.source === 'hackernews',
  )
  const translatedPrimary = translation.text

  const linkProps = !noLink ? { href: item.url, target: '_blank' as const, rel: 'noopener noreferrer' } : null
  const imageStyle = { width: 120, height: 120, objectFit: 'cover' as const, flexShrink: 0 }
  // Justify Chinese body copy, but keep English body copy left-aligned so
  // browser justification does not create distracting word gaps. Use the
  // actual content rather than the selected UI language because Memos and
  // Hypothesis are not translated by the global language preference.
  const bodyText = `${primary}\n${secondary ?? ''}`
  const hasChineseText = (value: string) => /[\u3400-\u4dbf\u4e00-\u9fff]/.test(value)
  const isChineseBody = contentKind === "body" && hasChineseText(bodyText)
  const secondaryTextAlign = secondary ? (hasChineseText(secondary) ? 'justify' as const : 'left' as const) : undefined

  const primaryStyle = {
    // Keep the semantic hierarchy stable across sources. Wikipedia and HN
    // provide titles/headlines; Memos and Hypothesis provide reading content.
    fontSize: contentKind === "body" ? 'clamp(18px, 1.6vw, 28px)' : 'clamp(30px, 3.1vw, 48px)',
    lineHeight: contentKind === "body" ? 1.85 : 1.62,
    letterSpacing: '0.005em',
    fontWeight: contentKind === "body" ? 400 : primaryWeight,
    overflowWrap: 'anywhere' as const,
    ...(contentKind === "body" ? { textAlign: isChineseBody ? 'justify' as const : 'left' as const } : {}),
  }
  const primaryEl = translation.state === 'pending' ? (
    <div
      className="mx-auto flex min-h-[72px] w-full max-w-[680px] items-center justify-center"
      role="status"
      aria-label="Translating headline locally"
      data-translation-engine="pending"
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `1.5px solid ${dark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.18)'}`,
        animation: 'zen-breathe 2.6s ease-in-out infinite',
      }} />
    </div>
  ) : (
    <p
      className={`font-serif-display whitespace-pre-line mx-auto max-w-[680px] ${dark ? 'text-slate-50' : 'text-slate-900'}`}
      style={primaryStyle}
      data-translation-engine={translation.engine}
    >
      {translatedPrimary}
    </p>
  )

  const translationLabel = translation.state === 'pending'
    ? 'Local AI…'
    : translation.engine === 'prompt'
      ? 'Chrome AI'
      : translation.engine === 'translator'
        ? 'Chrome Translator'
        : 'Original title'
  const translationTitle = translation.state === 'pending'
    ? 'Waiting for Chrome LanguageModel'
    : translation.engine === 'prompt'
      ? 'Translated by Chrome LanguageModel (Prompt API)'
      : translation.engine === 'translator'
        ? 'Translated by Chrome Translator API fallback'
        : 'The original Hacker News title is shown because local translation is unavailable'

  const textBlock = (
    <>
      {primaryScrollable ? (
        <FadingScroll maxHeightVh={primaryScrollable.maxHeightVh}>
          {primaryEl}
        </FadingScroll>
      ) : primaryEl}
      {secondary && (
        <p
          className={contentKind === "body"
            ? `font-serif-display whitespace-pre-line mx-auto mt-8 w-full max-w-[680px] ${dark ? 'text-slate-50' : 'text-slate-900'}`
            : `font-serif-display mx-auto mt-6 max-w-[600px] line-clamp-4 ${dark ? 'text-slate-300' : 'text-slate-500'}`}
          style={contentKind === "body"
            ? primaryStyle
            : { fontSize: 'clamp(15px, 1.3vw, 18px)', lineHeight: 1.8, textAlign: secondaryTextAlign }}
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
          {translation.requested && (
            <span
              className="normal-case tracking-normal text-[9px] font-medium opacity-70"
              data-translation-engine={translation.state === 'pending' ? 'pending' : translation.engine}
              title={translationTitle}
            >
              {translationLabel}
            </span>
          )}
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

function ThemePicker({
  dark,
  themeId,
  themeOpen,
  onToggle,
  onClose,
  onSelect,
}: {
  dark: boolean
  themeId: string
  themeOpen: boolean
  onToggle: () => void
  onClose: () => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="relative">
      <ChromeButton label="Appearance" active={themeOpen} onClick={onToggle} dark={dark}>
        <PaletteIcon className="w-[18px] h-[18px]" strokeWidth={2} />
      </ChromeButton>
      <AnimatePresence>
        {themeOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
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
              <button
                type="button"
                onClick={() => onSelect('random')}
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
                  const selected = th.id === themeId
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onSelect(th.id)}
                      className="group flex flex-col items-center gap-1.5"
                      aria-pressed={selected}
                    >
                      <span
                        className="relative w-full h-10 rounded-lg overflow-hidden border transition-all"
                        style={{
                          background: th.Preview ? undefined : th.swatch,
                          borderColor: selected ? '#334155' : 'rgba(226,232,240,0.9)',
                          boxShadow: selected ? '0 0 0 1.5px #334155' : 'none',
                        }}
                      >
                        {th.Preview && <th.Preview />}
                        {selected && (
                          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-slate-800 text-white inline-flex items-center justify-center">
                            <CheckIcon className="w-2 h-2" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] ${selected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
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
  )
}

function TopToolbar({
  dark,
  visible,
  themeId,
  themeOpen,
  onOpenModal,
  onToggleTheme,
  onCloseTheme,
  onSelectTheme,
}: {
  dark: boolean
  visible: boolean
  themeId: string
  themeOpen: boolean
  onOpenModal: (modal: Exclude<ModalKey, null>) => void
  onToggleTheme: () => void
  onCloseTheme: () => void
  onSelectTheme: (id: string) => void
}) {
  return (
    <motion.div
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -6 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute top-0 right-0 px-7 pt-5 z-30 flex items-center gap-1"
    >
      <ChromeButton label="About" onClick={() => { onCloseTheme(); onOpenModal('about') }} dark={dark}>
        <InfoIcon className="w-[18px] h-[18px]" strokeWidth={2} />
      </ChromeButton>
      <ChromeButton label="Sources" onClick={() => { onCloseTheme(); onOpenModal('sources') }} dark={dark}>
        <LayersIcon className="w-[18px] h-[18px]" strokeWidth={2} />
      </ChromeButton>
      <ChromeButton label="Liked" onClick={() => { onCloseTheme(); onOpenModal('likes') }} dark={dark}>
        <HeartIcon className="w-[18px] h-[18px]" strokeWidth={2} />
      </ChromeButton>
      <ThemePicker
        dark={dark}
        themeId={themeId}
        themeOpen={themeOpen}
        onToggle={onToggleTheme}
        onClose={onCloseTheme}
        onSelect={onSelectTheme}
      />
    </motion.div>
  )
}

export function ZenMode({ isOpen, feedKey, anchorKey, items, initialIndex, onNearEnd, isLoading = false, loadError, onRetry }: ZenModeProps) {
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
  // If the previously visible item (anchoredItemRef) is still present in the new feed,
  // restore it instead of jumping to the new random initialIndex — this prevents a
  // visible reshuffle when source toggles or config changes while an article is shown.
  useEffect(() => {
    if (!isOpen || currentItemId !== null || items.length === 0) return
    if (anchoredItemRef.current) {
      const stillPresent = items.findIndex((it) => it.id === anchoredItemRef.current!.id)
      if (stillPresent !== -1) {
        setCurrentItemId(anchoredItemRef.current.id)
        return
      }
    }
    if (initialIndex < 0) return
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
        {/* Keep the complete toolbar available while the first source request is pending. */}
        <TopToolbar
          dark={isDark}
          visible
          themeId={themeId}
          themeOpen={themeOpen}
          onOpenModal={setModal}
          onToggleTheme={() => setThemeOpen((value) => !value)}
          onCloseTheme={() => setThemeOpen(false)}
          onSelectTheme={(id) => {
            setThemeId(id)
            localStorage.setItem('zen-theme-id', id)
            setThemeOpen(false)
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-8">
          {loadError ? (
            <div
              role="alert"
              className={`max-w-sm text-center ${isDark ? 'text-slate-100' : 'text-slate-700'}`}
            >
              <p className="text-base font-medium">{loadError}</p>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                Check your connection or source settings, then try again.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={`mt-5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isDark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white/70 text-slate-700 hover:bg-white'
                  }`}
                >
                  Retry
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.18)'}`,
              animation: 'zen-breathe 2.6s ease-in-out infinite',
            }} />
          ) : (
            <div className={`max-w-sm text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              No content is available from the enabled sources.
            </div>
          )}
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

      {/* Top-right: keep all controls in the same place before and after loading. */}
      <TopToolbar
        dark={isDark}
        visible={chromeVisible}
        themeId={themeId}
        themeOpen={themeOpen}
        onOpenModal={setModal}
        onToggleTheme={() => setThemeOpen((value) => !value)}
        onCloseTheme={() => setThemeOpen(false)}
        onSelectTheme={(id) => {
          setThemeId(id)
          localStorage.setItem('zen-theme-id', id)
          setThemeOpen(false)
        }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex items-start md:items-center justify-center overflow-y-auto px-8 pt-16 pb-32">
        <div className="w-full max-w-[820px] relative min-h-0">
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
