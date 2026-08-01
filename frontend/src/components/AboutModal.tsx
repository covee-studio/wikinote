import { Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useI18n } from '../hooks/useI18n'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useRef } from 'react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)

  useKeyboardNavigation({ onEscape: onClose, enabled: isOpen })
  useFocusTrap(isOpen, containerRef)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="about-backdrop"
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
            className="z-[41] p-6 rounded-2xl w-full max-w-md flex flex-col relative"
            style={{
              background: '#ffffff',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            }}
            role="document"
            ref={containerRef}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h2 className="font-serif-editorial text-xl font-semibold text-slate-800">{t('about.title')}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="font-serif-editorial flex flex-col gap-2.5 text-[15px] text-slate-600 leading-[1.75]">
              <p>A new tab is usually just a moment between things.</p>
              <p>
                Wikinote puts something there — one article, quietly chosen at random.
                Wikipedia, Hacker News, or your own notes.
              </p>
              <p>You can skip it. Or you can stay a while.</p>
              <p>Either way, it's a chance to meet something you didn't know you were curious about.</p>

              <p className="text-slate-300 select-none">—</p>

              <p>
                This started as a fork of{' '}
                <a
                  href="https://github.com/IsaacGemal/wikitok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-800 font-medium hover:underline"
                >
                  wikitok
                </a>
                {' '}by{' '}
                <a
                  href="https://github.com/IsaacGemal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-800 font-medium hover:underline"
                >
                  IsaacGemal
                </a>
                , and was shaped along the way by{' '}
                <a
                  href="https://github.com/liminalpurr/jizhi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-800 font-medium hover:underline"
                >
                  几枝
                </a>
                . They made me think harder about what a new tab could be.
              </p>
              <p>Hope you enjoy it.</p>

              <div className="font-sans pt-4 border-t border-slate-100 mt-1 flex items-center gap-4">
                <a
                  href="https://github.com/Exploreryer/wikinote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                  GitHub
                </a>
                <span className="text-slate-200 select-none">·</span>
                <a
                  href="https://buymeacoffee.com/exploreryer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                  {t('about.buyMeCoffee')} ☕
                </a>
              </div>
            </div>
          </motion.div>

          <div
            className="w-full h-full z-[40] fixed inset-0"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose() } }}
            aria-label={t('common.close')}
            role="button"
            tabIndex={0}
            aria-pressed="false"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
