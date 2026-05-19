export const DEFAULT_SAFE_MODE_ENABLED = true

export type ContentSafetyField = "title" | "extract" | "category"

export interface ContentSafetyInput {
  title: string
  displaytitle?: string
  extract?: string
  categories?: string[]
  languageId?: string
}

export interface ContentSafetyMatch {
  field: ContentSafetyField
  term: string
}

export interface ContentSafetyResult {
  isSafe: boolean
  matches: ContentSafetyMatch[]
}

const TITLE_AND_EXTRACT_SENSITIVE_TERMS = [
  "adult entertainment",
  "adult film",
  "beheading",
  "bestiality",
  "cannibalism",
  "child abuse",
  "child pornography",
  "cocaine",
  "explicit sexual",
  "fentanyl",
  "genital",
  "hardcore pornography",
  "heroin",
  "hentai",
  "incest",
  "methamphetamine",
  "nude",
  "nudity",
  "penis",
  "porn",
  "pornographic",
  "pornography",
  "prostitution",
  "rape",
  "self-harm",
  "serial killer",
  "sex crime",
  "sex crimes",
  "sex offender",
  "sex trafficking",
  "sex work",
  "sexual abuse",
  "sexual assault",
  "sexual exploitation",
  "sexual intercourse",
  "suicide",
  "torture",
  "vagina",
  "色情",
  "成人影片",
  "成人电影",
  "裸露",
  "裸體",
  "裸体",
  "性交",
  "性行为",
  "性行為",
  "强奸",
  "強姦",
  "性侵",
  "卖淫",
  "賣淫",
  "妓女",
  "阴茎",
  "陰莖",
  "阴道",
  "陰道",
  "自杀",
  "自殺",
  "酷刑",
  "斩首",
  "斬首",
  "毒品",
  "可卡因",
  "海洛因",
  "冰毒",
  "ポルノ",
  "アダルトビデオ",
  "ヌード",
  "裸",
  "性交",
  "レイプ",
  "強姦",
  "自殺",
  "拷問",
  "麻薬",
  "포르노",
  "성인물",
  "나체",
  "성교",
  "강간",
  "자살",
  "살인",
  "고문",
  "마약",
  "إباحية",
  "عري",
  "اغتصاب",
  "انتحار",
  "مخدرات",
  "پورنوگرافی",
  "برهنگی",
  "تجاوز",
  "خودکشی",
  "مواد مخدر",
  "pornografía",
  "desnudez",
  "violación",
  "suicidio",
  "drogas",
  "pornographie",
  "nudité",
  "viol",
  "drogue",
  "pornografie",
  "nacktheit",
  "vergewaltigung",
  "selbstmord",
  "drogen",
  "pornografia",
  "nudez",
  "estupro",
  "suicídio",
  "drogas",
  "порнография",
  "нагота",
  "изнасилование",
  "самоубийство",
  "наркотики",
]

const CATEGORY_SENSITIVE_TERMS = [
  ...TITLE_AND_EXTRACT_SENSITIVE_TERMS,
  "execution",
  "executions",
  "genocide",
  "genocides",
  "massacre",
  "massacres",
  "murder",
  "murders",
  "war crime",
  "war crimes",
  "谋杀",
  "謀殺",
  "屠杀",
  "屠殺",
  "殺人",
  "虐殺",
  "قتل",
  "asesinato",
  "meurtre",
  "mord",
  "assassinato",
  "убийство",
  "adult industry",
  "adult magazines",
  "adult websites",
  "erotica",
  "erotic art",
  "erotic photography",
  "illegal drug",
  "mass murder",
  "nakedness",
  "porn actors",
  "pornographic actors",
  "sex industry",
  "sex laws",
  "sex manuals",
  "sex museums",
  "sex scandals",
  "sexual acts",
  "sexual disorders",
  "violence against women",
  "暴力",
  "性犯罪",
  "性产业",
  "性產業",
  "性虐待",
  "薬物",
  "性的虐待",
  "성범죄",
  "성산업",
  "насилие",
]

const ASCII_WORD_TERM_PATTERN = /^[a-z0-9][a-z0-9\s-]*[a-z0-9]$/i

function normalizeForSafety(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\s_]+/g, " ")
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function includesSensitiveTerm(text: string, term: string): boolean {
  const normalizedText = normalizeForSafety(text)
  const normalizedTerm = normalizeForSafety(term)

  if (!normalizedText || !normalizedTerm) {
    return false
  }

  if (ASCII_WORD_TERM_PATTERN.test(normalizedTerm)) {
    const escapedTerm = escapeRegExp(normalizedTerm).replace(/\s+/g, "\\s+")
    const termPattern = new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, "i")
    return termPattern.test(normalizedText)
  }

  return normalizedText.includes(normalizedTerm)
}

function collectMatches(
  field: ContentSafetyField,
  text: string,
  terms: readonly string[]
): ContentSafetyMatch[] {
  const matchedTerms = new Set<string>()

  for (const term of terms) {
    if (includesSensitiveTerm(text, term)) {
      matchedTerms.add(term)
    }
  }

  return Array.from(matchedTerms).map((term) => ({ field, term }))
}

export function evaluateContentSafety(input: ContentSafetyInput): ContentSafetyResult {
  const titleText = [input.title, input.displaytitle].filter(Boolean).join(" ")
  const categoryText = input.categories?.join(" ") ?? ""
  const matches = [
    ...collectMatches("title", titleText, TITLE_AND_EXTRACT_SENSITIVE_TERMS),
    ...collectMatches("extract", input.extract ?? "", TITLE_AND_EXTRACT_SENSITIVE_TERMS),
    ...collectMatches("category", categoryText, CATEGORY_SENSITIVE_TERMS),
  ]

  return {
    isSafe: matches.length === 0,
    matches,
  }
}

export function isArticleSafe(input: ContentSafetyInput): boolean {
  return evaluateContentSafety(input).isSafe
}
