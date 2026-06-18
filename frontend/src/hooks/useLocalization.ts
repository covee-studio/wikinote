import { useCallback, useEffect, useState } from "react"
import { LANGUAGES } from "../languages"
import type { Language } from "../types/ArticleProps"
import { StorageAdapter } from "../utils/environment"

const LANGUAGE_CHANGE_EVENT = "wikinote-language-change"

function findLanguage(languageId: string | null | undefined): Language {
  return LANGUAGES.find((lang) => lang.id === languageId) || LANGUAGES[0]
}

// Read from localStorage synchronously so the first render already has the
// correct language. Without this, the async StorageAdapter.get resolves a
// microtask later, leaving currentLanguage='en' on render #1, which causes
// the English cache to be loaded as initialData even when the user set Chinese.
function getStoredLanguageSync(): Language {
  try {
    const raw = localStorage.getItem("lang")
    if (raw) {
      const id = JSON.parse(raw) as string
      return findLanguage(id)
    }
  } catch {
    // Ignore unavailable localStorage or legacy invalid JSON.
  }
  return LANGUAGES[0]
}

export function useLocalization() {
  const getInitialLanguage = useCallback(async (): Promise<Language> => {
    const savedLanguageId = await StorageAdapter.get<string>("lang")
    return findLanguage(savedLanguageId)
  }, [])

  // Synchronous init: correct language is available on the very first render.
  // The async effect below runs afterward to reconcile chrome.storage in extension builds.
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getStoredLanguageSync)
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

  useEffect(() => {
    const syncLanguage = (event: Event) => {
      const languageId = (event as CustomEvent<string>).detail
      setCurrentLanguage(findLanguage(languageId))
    }

    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage)
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage)
  }, [])

  const setLanguage = async (languageId: string) => {
    const newLanguage = LANGUAGES.find((lang) => lang.id === languageId)
    if (newLanguage) {
      await StorageAdapter.set("lang", newLanguage.id)
      setCurrentLanguage(newLanguage)
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: newLanguage.id }))
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
