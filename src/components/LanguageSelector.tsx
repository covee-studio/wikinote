import { useEffect, useRef, useState } from "react"
import { useI18n } from "../hooks/useI18n"
import { useLocalization } from "../hooks/useLocalization"
import { LANGUAGES } from "../languages"

export function LanguageSelector() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({})
  const { setLanguage } = useLocalization()
  const { t } = useI18n()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lazy cache flags on demand to avoid upfront heavy work
  const ensureImageCached = (id: string, url: string) => {
    if (cachedImages[id]) return
    const img = new Image()
    img.onload = () => {
      // Cache the original url after successful load
      setCachedImages((prev) => ({ ...prev, [id]: url }))
    }
    img.onerror = () => {
      // No-op; rendering will fallback to text avatar
    }
    img.src = url
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: 9999 }}>
      <button
        className="button-indicator px-4 py-2 text-slate-700 hover:text-purple-600 hover:bg-purple-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
        onClick={handleButtonClick}
        style={{ position: "relative", zIndex: 10000 }}
        data-testid="language-button"
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
      >
        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
        {t("app.language")}
      </button>

      {/* Language dropdown */}
      {showDropdown && (
        <div
          className="absolute bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl border border-white/40"
          style={{
            top: "100%",
            right: "0",
            width: "240px",
            maxHeight: "400px",
            zIndex: 10001,
            marginTop: "8px",
            position: "absolute",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
          data-testid="language-dropdown"
          role="listbox"
        >
          <div className="p-3 border-b border-white/20">
            <div className="text-sm font-medium text-gray-800">Select Wikipedia Language</div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2" style={{ scrollBehavior: "smooth" }}>
            {LANGUAGES.map((language) => (
              <button
                key={language.id}
                onClick={async (e) => {
                  e.stopPropagation()
                  await setLanguage(language.id)
                  setShowDropdown(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-left"
                title={`Switch to ${language.name}`}
                role="option"
                aria-selected={false}
              >
                <div className="w-5 h-5 rounded-full flex-shrink-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <img
                    className="w-5 h-5 rounded-full object-cover"
                    src={cachedImages[language.id] || language.flag}
                    alt={`${language.name} flag`}
                    style={{
                      minWidth: "20px",
                      minHeight: "20px",
                      backgroundColor: "transparent",
                    }}
                    loading="lazy"
                    ref={() => ensureImageCached(language.id, language.flag)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      target.nextElementSibling?.classList.remove("hidden")
                    }}
                  />
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 hidden flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{language.name.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-800 truncate">{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
