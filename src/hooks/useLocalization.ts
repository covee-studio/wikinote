import { useCallback, useEffect, useState } from "react"
import { LANGUAGES } from "../languages"
import type { Language } from "../types/ArticleProps"
import { StorageAdapter } from "../utils/environment"

export function useLocalization() {
  const getInitialLanguage = useCallback(async (): Promise<Language> => {
    const savedLanguageId = await StorageAdapter.get("lang")
    return LANGUAGES.find((lang) => lang.id === savedLanguageId) || LANGUAGES[0]
  }, [])

  const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0])
  const [ready, setReady] = useState<boolean>(false)

  // Initialize language from storage when mounted
  useEffect(() => {
    let mounted = true
    getInitialLanguage().then((lang) => {
      if (!mounted) return
      setCurrentLanguage(lang)
      setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [getInitialLanguage])

  useEffect(() => {
    // Persist language only after initial load to avoid overwriting saved value with default "en"
    if (!ready) return
    StorageAdapter.set("lang", currentLanguage.id)
  }, [currentLanguage, ready])

  const setLanguage = async (languageId: string) => {
    const newLanguage = LANGUAGES.find((lang) => lang.id === languageId)
    if (newLanguage) {
      // Persist before reload to ensure it is available on next startup
      await StorageAdapter.set("lang", newLanguage.id)
      setCurrentLanguage(newLanguage)
      window.location.reload() // 使用原始的正确方式
    } else {
      console.warn(`Language not found: ${languageId}`)
    }
  }

  return {
    currentLanguage,
    setLanguage,
    availableLanguages: LANGUAGES,
    ready,
  }
}
