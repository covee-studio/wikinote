export type ArticleQualityIssueType =
  | "missing-url"
  | "missing-thumbnail"
  | "empty-extract"
  | "short-extract"
  | "disambiguation"
  | "list-or-index"
  | "stub-or-low-context"

export type ArticleQualityField = "title" | "extract" | "category" | "url" | "thumbnail"

export interface ArticleQualityIssue {
  type: ArticleQualityIssueType
  field: ArticleQualityField
  term?: string
}

export interface ArticleQualityInput {
  title: string
  displaytitle?: string
  extract?: string
  url?: string
  thumbnail?: {
    source?: string
    width?: number
    height?: number
  }
  categories?: readonly string[]
}

export interface ArticleQualityResult {
  isHighQuality: boolean
  issues: ArticleQualityIssue[]
}

export const MIN_MEANINGFUL_EXTRACT_CHARACTERS = 140
export const MIN_MEANINGFUL_EXTRACT_WORDS = 18

const DISAMBIGUATION_TITLE_TERMS = [
  "(disambiguation)",
  "disambiguation",
  "may refer to",
  "can refer to",
  "refers to",
  "消歧义",
  "曖昧さ回避",
  "Begriffsklärung",
  "homonymie",
] as const

const DISAMBIGUATION_CATEGORY_TERMS = [
  "disambiguation pages",
  "all disambiguation pages",
  "set index articles",
  "surnames",
  "given names",
  "消歧义页",
  "消歧義頁",
  "曖昧さ回避",
  "begriffsklärung",
  "homonymie",
] as const

const DISAMBIGUATION_EXTRACT_PATTERNS = [
  /\bmay refer to\b/i,
  /\bcan refer to\b/i,
  /\bmay stand for\b/i,
  /\bcan stand for\b/i,
  /\bmay mean\b/i,
  /\bcan mean\b/i,
  /\brefers to several\b/i,
  /\bhas several meanings\b/i,
  /可以指/i,
  /可能指/i,
  /可指/i,
  /是一个消歧义/i,
] as const

const LIST_OR_INDEX_TITLE_PATTERNS = [
  /^list of\b/i,
  /^lists of\b/i,
  /^index of\b/i,
  /^outline of\b/i,
  /^glossary of\b/i,
  /^timeline of\b/i,
  /^catalog(?:ue)? of\b/i,
  /^一覧[:：]?/i,
  /一覧$/i,
  /^列表[:：]?/i,
  /列表$/i,
  /^索引[:：]?/i,
  /索引$/i,
] as const

const LIST_OR_INDEX_CATEGORY_TERMS = [
  "lists of",
  "list of",
  "indexes of",
  "set index articles",
  "glossaries",
  "outlines",
  "timelines of",
  "catalogues",
  "catalogs",
  "列表",
  "索引",
  "一覧",
] as const

const STUB_OR_LOW_CONTEXT_CATEGORY_TERMS = [
  "stub categories",
  "stubs",
  "stub articles",
  "articles with short description",
  "short description matches wikidata",
  "小作品",
  "小作品条目",
  "スタブ",
] as const

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[_\-–—:;,.!?()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function normalizeCategory(category: string): string {
  return normalizeText(category.replace(/^category\s*:/i, ""))
}

function wordCount(text: string): number {
  const words = text.match(/[\p{L}\p{N}]+/gu)
  return words?.length ?? 0
}

function hasCjkText(text: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)
}

function containsAnyTerm(text: string, terms: readonly string[]): string | undefined {
  const normalizedText = normalizeText(text)

  return terms.find((term) => normalizedText.includes(normalizeText(term)))
}

function containsAnyCategoryTerm(categories: readonly string[], terms: readonly string[]): string | undefined {
  for (const category of categories) {
    const normalizedCategory = normalizeCategory(category)
    const matchedTerm = terms.find((term) => normalizedCategory.includes(normalizeText(term)))

    if (matchedTerm) {
      return matchedTerm
    }
  }

  return undefined
}

function matchesAnyPattern(text: string, patterns: readonly RegExp[]): string | undefined {
  const normalizedTitle = normalizeText(text)
  const originalText = text.trim()
  const matchedPattern = patterns.find((pattern) => pattern.test(normalizedTitle) || pattern.test(originalText))

  return matchedPattern?.source
}

function hasValidCanonicalUrl(url: string | undefined): boolean {
  if (!url) return false

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "https:" && parsedUrl.hostname.includes("wikipedia.org")
  } catch {
    return false
  }
}

function hasUsableThumbnail(thumbnail: ArticleQualityInput["thumbnail"]): boolean {
  if (!thumbnail?.source) return false

  return (thumbnail.width ?? 0) > 0 && (thumbnail.height ?? 0) > 0
}

function evaluateExtractQuality(extract: string | undefined): ArticleQualityIssue[] {
  const trimmedExtract = extract?.trim() ?? ""

  if (!trimmedExtract) {
    return [{ type: "empty-extract", field: "extract" }]
  }

  if (trimmedExtract.length < MIN_MEANINGFUL_EXTRACT_CHARACTERS) {
    return [
      {
        type: "short-extract",
        field: "extract",
        term: `${trimmedExtract.length}/${MIN_MEANINGFUL_EXTRACT_CHARACTERS}`,
      },
    ]
  }

  if (!hasCjkText(trimmedExtract) && wordCount(trimmedExtract) < MIN_MEANINGFUL_EXTRACT_WORDS) {
    return [
      {
        type: "short-extract",
        field: "extract",
        term: `${wordCount(trimmedExtract)}/${MIN_MEANINGFUL_EXTRACT_WORDS}`,
      },
    ]
  }

  return []
}

export function evaluateArticleQuality(input: ArticleQualityInput): ArticleQualityResult {
  const titleText = [input.title, input.displaytitle].filter(Boolean).join(" ")
  const categories = input.categories ?? []
  const issues: ArticleQualityIssue[] = []

  if (!hasValidCanonicalUrl(input.url)) {
    issues.push({ type: "missing-url", field: "url" })
  }

  if (!hasUsableThumbnail(input.thumbnail)) {
    issues.push({ type: "missing-thumbnail", field: "thumbnail" })
  }

  issues.push(...evaluateExtractQuality(input.extract))

  const disambiguationTitleTerm = containsAnyTerm(titleText, DISAMBIGUATION_TITLE_TERMS)
  const disambiguationCategoryTerm = containsAnyCategoryTerm(categories, DISAMBIGUATION_CATEGORY_TERMS)
  const disambiguationExtractPattern = matchesAnyPattern(input.extract ?? "", DISAMBIGUATION_EXTRACT_PATTERNS)

  if (disambiguationTitleTerm) {
    issues.push({ type: "disambiguation", field: "title", term: disambiguationTitleTerm })
  } else if (disambiguationCategoryTerm) {
    issues.push({ type: "disambiguation", field: "category", term: disambiguationCategoryTerm })
  } else if (disambiguationExtractPattern) {
    issues.push({ type: "disambiguation", field: "extract", term: disambiguationExtractPattern })
  }

  const listTitlePattern = matchesAnyPattern(titleText, LIST_OR_INDEX_TITLE_PATTERNS)
  const listCategoryTerm = containsAnyCategoryTerm(categories, LIST_OR_INDEX_CATEGORY_TERMS)

  if (listTitlePattern) {
    issues.push({ type: "list-or-index", field: "title", term: listTitlePattern })
  } else if (listCategoryTerm) {
    issues.push({ type: "list-or-index", field: "category", term: listCategoryTerm })
  }

  const stubCategoryTerm = containsAnyCategoryTerm(categories, STUB_OR_LOW_CONTEXT_CATEGORY_TERMS)

  if (stubCategoryTerm) {
    issues.push({ type: "stub-or-low-context", field: "category", term: stubCategoryTerm })
  }

  return {
    isHighQuality: issues.length === 0,
    issues,
  }
}

export function isHighQualityArticle(input: ArticleQualityInput): boolean {
  return evaluateArticleQuality(input).isHighQuality
}
