import assert from "node:assert/strict"
import {
  DEFAULT_SAFE_MODE_ENABLED,
  evaluateContentSafety,
  isArticleSafe,
} from "../src/utils/contentSafety.ts"

assert.equal(DEFAULT_SAFE_MODE_ENABLED, true)

const safeArticle = {
  title: "Marie Curie",
  extract: "Marie Curie was a physicist and chemist who conducted pioneering research on radioactivity.",
  categories: ["Category:Polish physicists", "Category:Nobel laureates in Physics"],
}

assert.equal(isArticleSafe(safeArticle), true)

const unsafeTitle = evaluateContentSafety({
  title: "History of pornography",
  extract: "This article describes a media genre.",
  categories: ["Category:Media history"],
})

assert.equal(unsafeTitle.isSafe, false)
assert.equal(unsafeTitle.matches.some((match) => match.field === "title"), true)

const unsafeExtract = evaluateContentSafety({
  title: "A fictional biography",
  extract: "The article contains explicit sexual material and describes a sex trafficking case.",
  categories: ["Category:Fictional works"],
})

assert.equal(unsafeExtract.isSafe, false)
assert.equal(unsafeExtract.matches.some((match) => match.field === "extract"), true)

const unsafeCategory = evaluateContentSafety({
  title: "A historical court case",
  extract: "This article summarizes a legal case and its social consequences.",
  categories: ["Category:Sex crimes", "Category:Legal history"],
})

assert.equal(unsafeCategory.isSafe, false)
assert.equal(unsafeCategory.matches.some((match) => match.field === "category"), true)

const unsafeChinese = evaluateContentSafety({
  title: "人物传记",
  extract: "该条目涉及强奸案件和后续审判。",
  categories: ["Category:法律案件"],
  languageId: "zh-cn",
})

assert.equal(unsafeChinese.isSafe, false)
assert.equal(unsafeChinese.matches.some((match) => match.term === "强奸"), true)
