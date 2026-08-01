import { ArrowLeft, ChevronDown, Eye, EyeOff, Info, Languages, Layers, Settings, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useSources } from "../contexts/SourcesContext"
import { useFocusTrap } from "../hooks/useFocusTrap"
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation"
import { useLocalization } from "../hooks/useLocalization"
import { LANGUAGES } from "../languages"
import { ADAPTER_LIST } from "../sources/registry"
import { useToast } from "../contexts/ToastContext"
import type { SourceAdapter } from "../sources/adapter"
import type { SourceId } from "../types/DiscoveryItem"

interface SourcesModalProps {
  isOpen: boolean
  onClose: () => void
}

type SourcesView = "sources" | SourceId

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        checked ? "bg-slate-800" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function SourceHint({ sourceId, sourceLabel, description }: { sourceId: string; sourceLabel: string; description: string }) {
  const tooltipId = `source-description-${sourceId}`

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`About ${sourceLabel}`}
        aria-describedby={tooltipId}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition-colors hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-56 rounded-xl bg-slate-800 px-3 py-2 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {description}
      </span>
    </span>
  )
}

export function SourcesModal({ isOpen, onClose }: SourcesModalProps) {
  const { enabledSources, toggleSource, getSourceConfig, updateSourceConfig, ensureHostPermission } = useSources()
  const { showToast } = useToast()
  const { currentLanguage, setLanguage } = useLocalization()
  const [view, setView] = useState<SourcesView>("sources")
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({})
  const [showToken, setShowToken] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsAdapter = view === "sources" ? undefined : ADAPTER_LIST.find((adapter) => adapter.id === view)

  useKeyboardNavigation({ onEscape: onClose, enabled: isOpen })
  useFocusTrap(isOpen, containerRef)

  useEffect(() => {
    if (isOpen) return
    setView("sources")
    setSettingsDraft({})
    setShowToken(false)
  }, [isOpen])

  const openSourceSettings = (adapter: SourceAdapter) => {
    setSettingsDraft({ ...getSourceConfig(adapter.id) })
    setShowToken(false)
    setView(adapter.id)
  }

  const saveSourceSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settingsAdapter) return
    for (const field of settingsAdapter.configSchema ?? []) {
      updateSourceConfig(settingsAdapter.id, field.key, settingsDraft[field.key] ?? "")
    }
    ensureHostPermission(settingsAdapter.id, settingsDraft)
    setView("sources")
  }

  const handleSourceToggle = (adapter: (typeof ADAPTER_LIST)[number]) => {
    const toggled = toggleSource(adapter.id)
    if (toggled || enabledSources.has(adapter.id)) return

    showToast(`Configure ${adapter.label} before enabling it`)
    if (adapter.requiresConfig) openSourceSettings(adapter)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sources-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
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
            className="relative z-[41] flex h-[min(600px,92vh)] w-full max-w-md flex-col overflow-y-auto overscroll-y-contain rounded-2xl bg-white p-6"
            style={{
              boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            }}
            role="document"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Sources</h2>
                  <p className="text-sm text-slate-400">
                    {enabledSources.size} of {ADAPTER_LIST.length} active
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {view === "sources" ? (
                <motion.div
                  key="sources-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-100">
                      <Languages className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <label htmlFor="article-language-select" className="block text-sm font-semibold text-slate-700">
                        Language
                      </label>
                      <SourceHint
                        sourceId="language"
                        sourceLabel="Language"
                        description="Wikipedia articles and Hacker News headline translation"
                      />
                    </div>
                    <div className="relative w-[148px] flex-shrink-0">
                      <select
                        id="article-language-select"
                        value={currentLanguage.id}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-slate-300"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {ADAPTER_LIST.map((adapter) => {
                      const active = enabledSources.has(adapter.id)
                      const hasSettings = Boolean(adapter.configSchema?.length)

                      return (
                        <div
                          key={adapter.id}
                          className={`flex h-[72px] items-center rounded-xl border border-slate-100 px-4 transition-all duration-200 hover:bg-slate-50 ${
                            active ? "bg-white" : "bg-slate-50 opacity-60"
                          }`}
                        >
                          <div className="flex w-full items-center gap-3">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-100">
                                {adapter.logoSrc ? (
                                  <img
                                    src={adapter.logoSrc}
                                    alt=""
                                    aria-hidden="true"
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <Layers className="h-5 w-5 text-slate-400" aria-hidden="true" />
                                )}
                              </span>
                              <div className="flex min-w-0 items-center gap-1">
                                <label
                                  htmlFor={`source-toggle-${adapter.id}`}
                                  className="cursor-pointer select-none font-semibold text-slate-800"
                                >
                                  {adapter.label}
                                </label>
                                <SourceHint
                                  sourceId={adapter.id}
                                  sourceLabel={adapter.label}
                                  description={adapter.description}
                                />
                              </div>
                            </div>
                            <div className="ml-auto flex items-center gap-3">
                              {hasSettings && (
                                <button
                                  type="button"
                                  onClick={() => openSourceSettings(adapter)}
                                  aria-label={`${adapter.label} settings`}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                >
                                  <Settings className="h-4 w-4" strokeWidth={1.8} />
                                </button>
                              )}
                              <Toggle
                                id={`source-toggle-${adapter.id}`}
                                checked={active}
                                onChange={() => handleSourceToggle(adapter)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${settingsAdapter?.id ?? "source"}-view`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <button
                    type="button"
                    onClick={() => setView("sources")}
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    Back to Sources
                  </button>

                  <div className="flex flex-col items-center">
                    {settingsAdapter?.logoSrc ? (
                      <img
                        src={settingsAdapter.logoSrc}
                        alt={settingsAdapter.label}
                        className="h-20 w-20 rounded-full object-contain shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Layers className="h-9 w-9" strokeWidth={1.6} />
                      </div>
                    )}
                    <h3 className="mt-5 text-3xl font-bold tracking-tight text-slate-800">
                      {settingsAdapter?.label ?? "Source"}
                    </h3>
                  </div>

                  <form className="mt-10 flex flex-col gap-5" onSubmit={saveSourceSettings}>
                    {(settingsAdapter?.configSchema ?? []).map((field) => {
                      const isSecret = field.secret === true
                      const value = settingsDraft[field.key] ?? ""

                      return (
                        <div key={field.key}>
                          <label
                            htmlFor={`${settingsAdapter?.id ?? "source"}-${field.key}`}
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              id={`${settingsAdapter?.id ?? "source"}-${field.key}`}
                              type={isSecret && !showToken ? "password" : "text"}
                              value={value}
                              placeholder={field.placeholder}
                              onChange={(event) => {
                                setSettingsDraft((previous) => ({ ...previous, [field.key]: event.target.value }))
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-300 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                              autoComplete="off"
                              spellCheck={false}
                            />
                            {isSecret && (
                              <button
                                type="button"
                                onClick={() => setShowToken((previous) => !previous)}
                                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                aria-label={showToken ? "Hide token" : "Show token"}
                              >
                                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {showToken ? "Hide token" : "Show token"}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Save
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div
            className="fixed inset-0 z-[40] h-full w-full"
            onClick={onClose}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClose()
              }
            }}
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
