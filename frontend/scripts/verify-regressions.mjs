#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const read = (path) => readFileSync(resolve(root, path), "utf8")

const app = read("src/App.tsx")
const translation = read("src/utils/translation.ts")
const zen = read("src/components/ZenMode.tsx")
const styles = read("src/index.css")
const about = read("src/components/AboutModal.tsx")
const memos = read("src/sources/memos.tsx")
const sourcesModal = read("src/components/SourcesModal.tsx")
const adapter = read("src/sources/adapter.ts")
const wikipedia = read("src/sources/wikipedia.tsx")
const hackerNews = read("src/sources/hackernews.tsx")
const hypothesis = read("src/sources/hypothesis.tsx")
const environment = read("src/utils/environment.ts")
const favoriteSync = read("src/utils/favoriteSync.ts")
const likedContext = read("src/contexts/LikedArticlesContext.tsx")
const likesModal = read("src/components/LikesModal.tsx")

// Translation must use the requested foundation model first and retain an
// on-device task-model fallback for languages unsupported by Prompt API.
if (!/LanguageModel/.test(translation) || !/\.prompt\(/.test(translation)) {
  throw new Error("Prompt API path is missing from the translation pipeline")
}
if (!/Translator/.test(translation) || !/translatorTranslation/.test(translation)) {
  throw new Error("Translator fallback is missing from the translation pipeline")
}
if (!/promptRetryableTargets/.test(translation) || !/pointerdown/.test(translation)) {
  throw new Error("Translation retry path does not cover user activation")
}
if (
  !/PROMPT_SUPPORTED_LANGUAGES/.test(translation) ||
  !/isPromptExecutionBlocked/.test(translation) ||
  !/feature flag.*model execution/.test(translation) ||
  !/promptExecutionUnavailable/.test(translation)
) {
  throw new Error("Prompt API does not distinguish supported languages and permanently blocked model execution")
}
if (!/TranslationEngine/.test(translation) || !/data-translation-engine/.test(zen)) {
  throw new Error("Translation engine is not observable in the UI")
}
if (/const translationLabel/.test(zen) || !/LanguagesIcon/.test(zen) || !/Translated locally by Chrome Translator API fallback/.test(zen)) {
  throw new Error("Translation attribution is still exposed as a heavy visible text label")
}
if (/translated\s*\?\?\s*original/.test(translation)) {
  throw new Error("Translation can render the source title before the target title is ready")
}
if (!/animation:\s*'zen-breathe/.test(zen) || /pendingWidth|animate-pulse/.test(zen)) {
  throw new Error("Translation pending state still uses the heavyweight skeleton layout")
}
if (/function primarySize/.test(zen) || !/contentKind === "body"/.test(zen) || !/clamp\(18px, 1\.6vw, 28px\)/.test(zen)) {
  throw new Error("Zen content does not preserve title and body reading hierarchies")
}
if (!/contentKind:\s*"body"/.test(memos) || !/contentKind:\s*"body"/.test(hypothesis)) {
  throw new Error("Body-oriented sources are not explicitly marked for reading typography")
}
if (!/contentKind === "body"[\s\S]*whitespace-pre-line/.test(zen) || !/contentKind === "body"[\s\S]*primaryStyle/.test(zen)) {
  throw new Error("Body secondary content does not preserve paragraph layout and typography")
}
if (!/isChineseBody/.test(zen) || !/textAlign: isChineseBody \? 'justify'/.test(zen) || !/secondaryTextAlign/.test(zen)) {
  throw new Error("Chinese body text does not use language-aware justification")
}
if (!/readingColumnClass/.test(zen) || !/w-full max-w-\[680px\]/.test(zen)) {
  throw new Error("Zen primary and secondary content do not share a stable reading column")
}

// The language is a global content/translation preference, not a Wikipedia
// source setting. It must remain available when Wikipedia is disabled.
const languageLabelIndex = sourcesModal.search(/>\s*Language\s*<\/label>/)
const sourceRowsIndex = sourcesModal.indexOf("{ADAPTER_LIST.map")
if (languageLabelIndex === -1 || sourceRowsIndex === -1 || languageLabelIndex > sourceRowsIndex) {
  throw new Error("Global content/translation language control is missing")
}
if (/Content and translation language|Article language — Wikipedia only/.test(sourcesModal)) {
  throw new Error("Language control is still coupled to the Wikipedia row")
}

// Memos configuration lives on a dedicated child page. The source list must
// stay compact and must not expose the old inline form or an enable-on-save
// action that couples configuration to source activation.
if (!/Back to Sources/.test(sourcesModal) || !/settingsAdapter/.test(sourcesModal) || !/openSourceSettings/.test(sourcesModal)) {
  throw new Error("Memos child settings page is missing")
}
if (!/Configure \$\{adapter\.label\} before enabling it/.test(sourcesModal) || !/setView\(adapter\.id\)/.test(sourcesModal)) {
  throw new Error("Unconfigured sources do not provide a clear setup path")
}
if (/Configure below|Configure Memos|Save & enable|Test connection/.test(sourcesModal)) {
  throw new Error("Memos settings still expose legacy inline or test actions")
}
if (
  !/logoSrc/.test(adapter) ||
  !/logoSrc:\s*\"\/source-icons\/wikipedia\.png\"/.test(wikipedia) ||
  !/logoSrc:\s*\"\/source-icons\/hacker-news\.png\"/.test(hackerNews) ||
  !/logoSrc:\s*\"\/source-icons\/memos\.png\"/.test(memos) ||
  !/logoSrc:\s*\"\/source-icons\/hypothesis\.png\"/.test(hypothesis) ||
  !/aria-label=\{`\$\{adapter\.label\} settings`\}/.test(sourcesModal)
) {
  throw new Error("Memos settings entry or brand asset is missing")
}
if (!/hypothesisAdapter/.test(read("src/sources/registry.ts")) || !/API Token/.test(read("src/sources/hypothesis.tsx"))) {
  throw new Error("Hypothesis source registration or token configuration is missing")
}
if (
  !/getAnnotationQuote/.test(hypothesis) ||
  !/TextQuoteSelector/.test(hypothesis) ||
  !/title: quote \|\| note \|\| documentTitle/.test(hypothesis) ||
  !/primaryKind: quote \? "highlight" : "note"/.test(hypothesis) ||
  !/blockquote className="border-l/.test(hypothesis) ||
  !/border-t border-slate-100/.test(hypothesis)
) {
  throw new Error("Hypothesis highlights and personal notes are not mapped with restrained quote/note treatments")
}
if (!/primaryKind\?: "highlight" \| "note"/.test(adapter) || !/primaryKind/.test(zen) || !/primaryKind === "highlight"/.test(zen)) {
  throw new Error("Shared Zen content does not support semantic quote treatment for highlights")
}
if (!/toggleSource\(settingsAdapter\.id, settingsDraft\)/.test(sourcesModal) || !/pr-28/.test(sourcesModal) || !/hover:z-30/.test(sourcesModal) || !/source-tooltip/.test(sourcesModal) || !/prefers-reduced-motion/.test(read("src/index.css"))) {
  throw new Error("Source setup, secret input spacing, or accessible tooltip motion safeguards are missing")
}
if (!/import \{ Toggle \} from "\.\/Toggle"/.test(sourcesModal) || !/import \{ Toggle \} from "\.\/Toggle"/.test(likesModal) || !/<Toggle/.test(likesModal)) {
  throw new Error("Source and favorites switches must use the shared Toggle component")
}
if (/bg-slate-50 opacity-60/.test(sourcesModal)) {
  throw new Error("Inactive source opacity still affects tooltip rendering")
}
if (!/isFullyConfigured/.test(read("src/contexts/SourcesContext.tsx")) || !/return false/.test(read("src/contexts/SourcesContext.tsx"))) {
  throw new Error("Configuration-backed sources can still be enabled before setup")
}

// Long memo content needs both a bounded scroll region and a break rule for
// URLs or other unbroken strings.
if (!/contentScrollable/.test(zen) || !/contentKind === "body"/.test(zen) || !/overflowWrap:\s*["']anywhere/.test(zen)) {
  throw new Error("Long-content layout safeguards are missing")
}
if (/primaryScrollable/.test(zen) || /primaryScrollable/.test(memos)) {
  throw new Error("Body scrolling is still coupled to the primary text block")
}
if (!/function FadingScroll/.test(zen) || !/bodyScroll/.test(zen) || !/ResizeObserver/.test(zen) || !/maskImage/.test(zen) || !/zen-scroll-edge-bottom/.test(zen) || !/\.zen-scroll::\-webkit-scrollbar/.test(styles)) {
  throw new Error("Scrollable content is missing scrollbar-free edge fade affordances")
}
if (!/font-serif-editorial/.test(about) || !/font-sans/.test(about) || !/font-serif-editorial/.test(styles)) {
  throw new Error("Editorial font treatment is missing from the About surface")
}

// Memos must not advance its cursor until the window request succeeds.
const responseCheck = memos.indexOf("if (!resp.ok) throw")
const cursorWrite = memos.indexOf("writeCursor(cursorKeyToWrite, nextCursor)")
if (responseCheck === -1 || cursorWrite === -1 || cursorWrite < responseCheck) {
  throw new Error("Memos cursor can advance before a successful response")
}
if (!/showCachedWhileRefetching:\s*false/.test(memos)) {
  throw new Error("Memos can still render stale data before a fresh window")
}
if (!/windowOrder/.test(memos) || !/shuffledWindowOrder/.test(memos) || !/isValidCursor/.test(memos)) {
  throw new Error("Memos history windows are not randomized with no-repeat coverage")
}
if (!/pageOrder/.test(hypothesis) || !/shuffledPageOrder/.test(hypothesis) || !/total\?/.test(hypothesis)) {
  throw new Error("Hypothesis pages are not randomized from the full result count")
}

// Favorite sync must be explicit, use Chrome Sync only when available, and
// keep sensitive source credentials and full private memo bodies local.
if (
  !/storage\?\.sync/.test(environment) ||
  !/isFavoriteSyncAvailable/.test(favoriteSync) ||
  !/setSyncEnabled/.test(likedContext) ||
  !/Sync favorites/.test(likesModal) ||
  !/compactRaw/.test(favoriteSync) ||
  /raw\.content/.test(favoriteSync) ||
  /raw\.token/.test(favoriteSync)
) {
  throw new Error("Favorite sync is missing explicit opt-in or private-data safeguards")
}

// A failed load-more request should result in one notification, not a burst
// of duplicate toasts.
const loadMoreToastCount = (app.match(/Failed to load more articles/g) ?? []).length
if (loadMoreToastCount !== 1) {
  throw new Error(`Expected one load-more failure toast, found ${loadMoreToastCount}`)
}

const zipPath = resolve(root, "dist/wikinote-extension.zip")
if (existsSync(zipPath)) {
  const entries = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
  if (entries.includes("extension/configs/extension/newtab.html")) {
    throw new Error("Packed extension still contains a duplicate nested newtab.html")
  }
  const packedHtml = execFileSync("unzip", ["-p", zipPath, "extension/newtab.html"], { encoding: "utf8" })
  if (packedHtml.includes("modulepreload")) {
    throw new Error("Packed extension still emits Vite modulepreload hints")
  }
}

console.log("Regression checks passed: Prompt API fallback, long-content layout, source setup gating, Hypothesis registration, Memos window stability, and extension packaging")
