import { useEffect, useState } from "react"
import { LANGUAGES } from "../languages"

type ModelAvailability = "unavailable" | "downloadable" | "downloading" | "available"

interface PromptModelLanguageSpec {
  type: "text"
  languages: string[]
}

interface PromptModelOptions {
  expectedInputs: PromptModelLanguageSpec[]
  expectedOutputs: PromptModelLanguageSpec[]
}

interface PromptSessionOptions extends PromptModelOptions {
  initialPrompts: Array<{
    role: "system"
    content: string
  }>
}

interface ChromeLanguageModelSession {
  prompt(input: string): Promise<string>
  destroy(): void
}

interface ChromeLanguageModelAPI {
  availability(options: PromptModelOptions): Promise<ModelAvailability>
  create(options: PromptSessionOptions): Promise<ChromeLanguageModelSession>
}

type TranslatorAvailability = "unavailable" | "downloadable" | "downloading" | "available"

interface ChromeTranslator {
  translate(text: string): Promise<string>
}

interface ChromeTranslatorAPI {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorAvailability>
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<ChromeTranslator>
}

declare global {
  // These APIs are supplied by Chrome at runtime and are intentionally
  // optional so the web build remains usable in browsers without built-in AI.
  var LanguageModel: ChromeLanguageModelAPI | undefined
  var Translator: ChromeTranslatorAPI | undefined
}

export type TranslationEngine = "prompt" | "translator" | "original"
export type TranslationState = "idle" | "pending" | "translated" | "fallback"

export interface AutoTranslatedText {
  text: string
  state: TranslationState
  engine: TranslationEngine
  /** True when a non-English HN target was requested, even if it failed. */
  requested: boolean
}

interface TranslationResolution {
  text: string
  engine: Exclude<TranslationEngine, "original">
}

// These IDs are the Wikipedia language IDs already used by the app. The same
// target is used for HN translation so the setting has one clear meaning.
const TRANSLATION_TARGETS: Record<string, string> = {
  ar: "ar",
  bg: "bg",
  bn: "bn",
  cs: "cs",
  da: "da",
  de: "de",
  el: "el",
  es: "es",
  fi: "fi",
  fr: "fr",
  he: "he",
  hi: "hi",
  hr: "hr",
  hu: "hu",
  id: "id",
  it: "it",
  ja: "ja",
  kn: "kn",
  ko: "ko",
  lt: "lt",
  mr: "mr",
  nl: "nl",
  no: "no",
  pl: "pl",
  pt: "pt",
  ro: "ro",
  ru: "ru",
  sk: "sk",
  sl: "sl",
  sv: "sv",
  ta: "ta",
  te: "te",
  th: "th",
  tr: "tr",
  uk: "uk",
  vi: "vi",
  en: "en",
  "zh-cn": "zh",
  "zh-hk": "zh-Hant",
  "zh-mo": "zh-Hant",
  "zh-my": "zh",
  "zh-sg": "zh",
  "zh-tw": "zh-Hant",
}

const MAX_TRANSLATION_CACHE_ENTRIES = 256
const MAX_TITLE_LENGTH = 500
const SOURCE_LANGUAGE = "en"
const PROMPT_RETRY_DELAY_MS = 1800

// Chrome's current Prompt API model language matrix is narrower than the
// Translator API. Avoid probing LanguageModel for targets it cannot produce;
// those headlines go straight to the task-specific Translator API.
const PROMPT_SUPPORTED_LANGUAGES = new Set(["de", "en", "es", "fr", "ja"])

const promptSessionPromises = new Map<string, Promise<ChromeLanguageModelSession | null>>()
const promptUnavailableTargets = new Set<string>()
const promptRetryableTargets = new Set<string>()
let promptExecutionUnavailable = false
const promptQueues = new Map<string, Promise<void>>()
const translatorPromises = new Map<string, Promise<ChromeTranslator | null>>()
const translationPromises = new Map<string, Promise<TranslationResolution | null>>()
const translationCache = new Map<string, TranslationResolution>()

export function getTranslationTarget(languageId: string): string | null {
  return TRANSLATION_TARGETS[languageId] ?? null
}

function cacheTranslation(key: string, translated: TranslationResolution): void {
  if (translationCache.has(key)) translationCache.delete(key)
  while (translationCache.size >= MAX_TRANSLATION_CACHE_ENTRIES) {
    const oldest = translationCache.keys().next().value
    if (oldest === undefined) break
    translationCache.delete(oldest)
  }
  translationCache.set(key, translated)
}

function targetName(languageId: string, targetLanguage: string): string {
  return LANGUAGES.find((language) => language.id === languageId)?.name ?? targetLanguage
}

function modelOptions(targetLanguage: string): PromptModelOptions {
  return {
    expectedInputs: [{ type: "text", languages: [SOURCE_LANGUAGE] }],
    expectedOutputs: [{ type: "text", languages: [targetLanguage] }],
  }
}

function modelSessionOptions(languageId: string, targetLanguage: string): PromptSessionOptions {
  return {
    ...modelOptions(targetLanguage),
    initialPrompts: [
      {
        role: "system",
        content: [
          "You translate Hacker News headlines.",
          `Translate each headline into ${targetName(languageId, targetLanguage)} (${targetLanguage}).`,
          "Return only the translated headline, with no explanation, prefix, quotation marks, or markdown.",
          "Preserve product names, company names, people names, URLs, acronyms, code, numbers, and technical terms unless they have a standard translation.",
          "Translate each new headline independently and keep its original meaning and tone.",
        ].join(" "),
      },
    ],
  }
}

function getLanguageModel(): ChromeLanguageModelAPI | null {
  return typeof LanguageModel === "undefined" ? null : LanguageModel
}

function isPromptExecutionBlocked(error: unknown): boolean {
  const name = error instanceof DOMException ? error.name : ""
  const message = error instanceof Error ? error.message : String(error)
  const detail = `${name} ${message}`.toLowerCase()

  // These are machine-eligibility or Chrome feature-gating failures. Retrying
  // them for every headline only repeats the same browser-level error; the
  // Translator API can still provide a graceful local/Chrome fallback.
  return /feature flag.*model execution|feature.?not.?enabled|execution.*disabled|model service.*not running|gpu.*blocked|insufficient.*disk|not eligible/.test(detail)
}

async function getPromptSession(languageId: string, targetLanguage: string): Promise<ChromeLanguageModelSession | null> {
  const model = getLanguageModel()
  if (
    !model ||
    promptExecutionUnavailable ||
    !PROMPT_SUPPORTED_LANGUAGES.has(targetLanguage) ||
    promptUnavailableTargets.has(targetLanguage)
  ) return null

  const existing = promptSessionPromises.get(targetLanguage)
  if (existing) return existing

  const options = modelOptions(targetLanguage)
  const promise = (async () => {
    try {
      const availability = await model.availability(options)
      if (availability === "unavailable") {
        promptUnavailableTargets.add(targetLanguage)
        return null
      }

      if (availability === "downloading") {
        promptRetryableTargets.add(targetLanguage)
        return null
      }

      const session = await model.create(modelSessionOptions(languageId, targetLanguage))
      promptRetryableTargets.delete(targetLanguage)
      return session
    } catch (error) {
      if (isPromptExecutionBlocked(error)) {
        promptExecutionUnavailable = true
        promptUnavailableTargets.add(targetLanguage)
        promptRetryableTargets.delete(targetLanguage)
        return null
      }
      if (error instanceof DOMException && error.name === "NotSupportedError") {
        // The Prompt API currently exposes only a subset of languages. Let
        // the task-specific Translator API handle those targets instead of
        // waiting forever for a user activation that cannot fix the mismatch.
        promptUnavailableTargets.add(targetLanguage)
        promptRetryableTargets.delete(targetLanguage)
        return null
      }
      // Chrome may require user activation before it starts downloading the
      // foundation model. Keep this retryable; the hook waits briefly for a
      // natural interaction before allowing the compatibility fallback.
      promptRetryableTargets.add(targetLanguage)
      return null
    }
  })()

  promptSessionPromises.set(targetLanguage, promise)
  const session = await promise
  if (!session) promptSessionPromises.delete(targetLanguage)
  return session
}

function normalizeModelOutput(output: string): string | null {
  const cleaned = output
    .trim()
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^(?:translation|translated headline|翻译|翻譯)\s*[:：]\s*/i, "")
    .trim()

  if (!cleaned) return null

  const unquoted = cleaned.length >= 2 &&
    ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
      (cleaned.startsWith("“") && cleaned.endsWith("”")))
    ? cleaned.slice(1, -1).trim()
    : cleaned

  const singleLine = unquoted.replace(/\s*\n\s*/g, " ").trim()
  return singleLine.slice(0, MAX_TITLE_LENGTH) || null
}

async function promptTranslation(original: string, languageId: string, targetLanguage: string): Promise<string | null> {
  const session = await getPromptSession(languageId, targetLanguage)
  if (!session) return null

  const previous = promptQueues.get(targetLanguage) ?? Promise.resolve()
  let release!: () => void
  const turn = new Promise<void>((resolve) => { release = resolve })
  promptQueues.set(targetLanguage, previous.then(() => turn, () => turn))

  try {
    await previous
    const output = await session.prompt(
      `Translate this Hacker News headline into the target language. Return only the headline:\n${original}`,
    )
    return normalizeModelOutput(output)
  } catch {
    // A broken or exhausted session must not poison later titles. Chrome's
    // session will be recreated on the next title or user activation.
    session.destroy()
    promptSessionPromises.delete(targetLanguage)
    return null
  } finally {
    release()
  }
}

function translatorKey(targetLanguage: string): string {
  return `${SOURCE_LANGUAGE}:${targetLanguage}`
}

async function getTranslator(targetLanguage: string): Promise<ChromeTranslator | null> {
  if (typeof Translator === "undefined") return null

  const key = translatorKey(targetLanguage)
  const existing = translatorPromises.get(key)
  if (existing) return existing

  const promise = (async () => {
    const availability = await Translator.availability({
      sourceLanguage: SOURCE_LANGUAGE,
      targetLanguage,
    })
    if (availability === "unavailable") return null
    return Translator.create({ sourceLanguage: SOURCE_LANGUAGE, targetLanguage })
  })()

  translatorPromises.set(key, promise)
  try {
    return await promise
  } catch {
    // A first automatic create can be rejected when Chrome requires a user
    // activation to start a language-pack download. Do not cache that failure.
    translatorPromises.delete(key)
    return null
  }
}

async function translatorTranslation(original: string, targetLanguage: string): Promise<string | null> {
  const translator = await getTranslator(targetLanguage)
  if (!translator) return null

  try {
    const translated = (await translator.translate(original)).trim()
    return translated || null
  } catch {
    return null
  }
}

async function translateTitle(
  original: string,
  languageId: string,
  targetLanguage: string,
  allowFallbackWhenPromptRetryable: boolean,
): Promise<TranslationResolution | null> {
  const key = `${targetLanguage}\u0000${original}`
  const cached = translationCache.get(key)
  if (cached) return cached

  const pending = translationPromises.get(key)
  if (pending) return pending

  const promise = (async () => {
    // This is the only first-choice path. A successful result is explicitly
    // tagged as "prompt" so the UI can prove which Chrome API answered.
    const modelResult = await promptTranslation(original, languageId, targetLanguage)
    if (modelResult) {
      const resolved = { text: modelResult, engine: "prompt" as const }
      cacheTranslation(key, resolved)
      return resolved
    }

    // If Chrome exposed the foundation model but creation was blocked by user
    // activation, briefly keep the title in a pending state. This prevents an
    // English-first flash and gives the real Prompt API a chance to run.
    if (promptRetryableTargets.has(targetLanguage) && !allowFallbackWhenPromptRetryable) return null

    const fallback = await translatorTranslation(original, targetLanguage)
    if (!fallback) return null
    const resolved = { text: fallback, engine: "translator" as const }
    cacheTranslation(key, resolved)
    return resolved
  })()

  translationPromises.set(key, promise)
  try {
    return await promise
  } finally {
    translationPromises.delete(key)
  }
}

function originalResult(original: string, requested: boolean, pending = false): AutoTranslatedText {
  return {
    text: pending ? "" : original,
    state: pending ? "pending" : requested ? "fallback" : "idle",
    engine: "original",
    requested,
  }
}

function translatedResult(resolution: TranslationResolution): AutoTranslatedText {
  return {
    text: resolution.text,
    state: "translated",
    engine: resolution.engine,
    requested: true,
  }
}

/**
 * Automatically translates a Hacker News title. Chrome's local foundation
 * model is attempted first; the task-specific Translator API is used only
 * when the Prompt API is absent or does not support the selected language.
 * While the target title is pending, the source title is hidden behind a
 * stable placeholder so a language switch never flashes English first.
 */
export function useAutoTranslatedText(
  original: string,
  languageId: string,
  enabled: boolean,
): AutoTranslatedText {
  const targetLanguage = enabled ? getTranslationTarget(languageId) : null
  const requested = !!targetLanguage && targetLanguage !== SOURCE_LANGUAGE && !!original.trim()
  const requestKey = `${original}\u0000${languageId}\u0000${enabled}`
  const initial = originalResult(original, requested, requested)
  const [stored, setStored] = useState<{ key: string; value: AutoTranslatedText }>(() => ({
    key: requestKey,
    value: initial,
  }))

  // During the render where languageId changes, state still contains the old
  // result. Keying the value makes that stale English/old-language result
  // invisible immediately, before useEffect gets a chance to run.
  const current = stored.key === requestKey ? stored.value : initial

  useEffect(() => {
    let cancelled = false
    let inFlight = false
    let settled = false
    let promptAttempts = 0
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null
    const activationOptions: AddEventListenerOptions = { capture: true }

    const cleanup = () => {
      window.removeEventListener("pointerdown", onActivation, activationOptions)
      window.removeEventListener("keydown", onActivation, activationOptions)
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }

    const finish = (value: AutoTranslatedText) => {
      if (cancelled || settled) return
      settled = true
      setStored({ key: requestKey, value })
      cleanup()
    }

    const scheduleFallback = () => {
      if (fallbackTimer || cancelled || settled) return
      fallbackTimer = setTimeout(() => {
        fallbackTimer = null
        void run(true)
      }, PROMPT_RETRY_DELAY_MS)
    }

    const run = async (allowFallbackWhenPromptRetryable: boolean) => {
      if (cancelled || settled || inFlight || !targetLanguage || !requested) return
      inFlight = true
      if (!allowFallbackWhenPromptRetryable) promptAttempts += 1

      try {
        const resolution = await translateTitle(
          original,
          languageId,
          targetLanguage,
          allowFallbackWhenPromptRetryable,
        )
        if (resolution) {
          finish(translatedResult(resolution))
        } else if (!allowFallbackWhenPromptRetryable && promptRetryableTargets.has(targetLanguage)) {
          // Keep the natural-activation retry short and bounded. If the model
          // still cannot start, use the explicit Translator fallback instead
          // of leaving a title permanently blank.
          scheduleFallback()
        } else {
          finish(originalResult(original, true))
        }
      } catch {
        finish(originalResult(original, true))
      } finally {
        inFlight = false
      }
    }

    function onActivation() {
      if (promptAttempts >= 2 || settled) return
      void run(false)
    }

    if (!requested || !targetLanguage) {
      setStored({ key: requestKey, value: originalResult(original, false) })
      return cleanup
    }

    window.addEventListener("pointerdown", onActivation, activationOptions)
    window.addEventListener("keydown", onActivation, activationOptions)
    void run(false)

    return () => {
      cancelled = true
      cleanup()
    }
  }, [languageId, original, requestKey, requested, targetLanguage])

  return current
}
