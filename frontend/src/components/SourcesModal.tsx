import { ChevronDown, Layers, X } from "lucide-react"
import { useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useSources } from "../contexts/SourcesContext"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation"
import { useLocalization } from "../hooks/useLocalization"
import { LANGUAGES } from "../languages"
import { ADAPTER_LIST } from "../sources/registry"

interface SourcesModalProps {
  isOpen: boolean
  onClose: () => void
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 flex-shrink-0 ${
        checked ? "bg-slate-800" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export function SourcesModal({ isOpen, onClose }: SourcesModalProps) {
  const { enabledSources, toggleSource, getSourceConfig, updateSourceConfig } = useSources()
  const { currentLanguage, setLanguage } = useLocalization()
  const containerRef = useRef<HTMLDivElement>(null)

  useKeyboardNavigation({ onEscape: onClose, enabled: isOpen })
  useFocusTrap(isOpen, containerRef)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sources-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Sources settings"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            ref={containerRef}
            className="z-[41] p-6 rounded-2xl w-full max-w-md flex flex-col relative max-h-[85vh] overflow-y-auto overscroll-y-contain"
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
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Sources</h2>
                  <p className="text-sm text-slate-400">
                    {enabledSources.size} of {ADAPTER_LIST.length} active
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source rows */}
            <div className="flex flex-col gap-3">
              {ADAPTER_LIST.map((adapter) => {
                const active = enabledSources.has(adapter.id)
                const cfg = getSourceConfig(adapter.id)
                const isConfigured = !adapter.requiresConfig ||
                  (adapter.configSchema?.every((f) => cfg[f.key]?.trim()) ?? false)

                return (
                  <div
                    key={adapter.id}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`source-toggle-${adapter.id}`}
                          className="font-semibold text-slate-800 cursor-pointer select-none"
                        >
                          {adapter.label}
                        </label>
                        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                          {adapter.description}
                        </p>
                      </div>
                      <Toggle
                        id={`source-toggle-${adapter.id}`}
                        checked={active}
                        onChange={() => toggleSource(adapter.id)}
                      />
                    </div>

                    {/* Article language — Wikipedia only */}
                    {adapter.id === "wikipedia" && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <label
                          htmlFor="article-language-select"
                          className="text-xs font-medium text-slate-500 block mb-1.5"
                        >
                          Article language
                        </label>
                        <div className="relative">
                          <select
                            id="article-language-select"
                            value={currentLanguage.id}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full appearance-none text-sm text-slate-700 px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 pr-8 cursor-pointer"
                          >
                            {LANGUAGES.map((lang) => (
                              <option key={lang.id} value={lang.id}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* Config fields (e.g. Memos URL + token) */}
                    {adapter.configSchema && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3">
                        {!isConfigured && (
                          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                            Configure below, then enable this source.
                          </p>
                        )}
                        {adapter.configSchema.map((field) => (
                          <div key={field.key}>
                            <label
                              htmlFor={`cfg-${adapter.id}-${field.key}`}
                              className="text-xs font-medium text-slate-600 flex items-center gap-1"
                            >
                              {field.label}
                              {isConfigured && cfg[field.key] && (
                                <span className="text-emerald-500">✓</span>
                              )}
                            </label>
                            {field.hint && (
                              <p className="text-xs text-slate-400 mb-1">{field.hint}</p>
                            )}
                            <input
                              id={`cfg-${adapter.id}-${field.key}`}
                              type={field.secret ? "password" : "text"}
                              placeholder={field.placeholder}
                              value={cfg[field.key] ?? ""}
                              onChange={(e) => updateSourceConfig(adapter.id, field.key, e.target.value)}
                              className="mt-0.5 w-full text-slate-800 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder-slate-400"
                              autoComplete="off"
                              spellCheck={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-slate-400 text-center mt-5">
              Enabled sources are mixed together in your feed.
            </p>
          </motion.div>

          <div
            className="w-full h-full z-[40] fixed inset-0"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose() } }}
            role="button"
            tabIndex={0}
            aria-label="Close"
            aria-pressed="false"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
