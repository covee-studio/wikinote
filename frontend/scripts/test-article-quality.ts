import assert from "node:assert/strict"
import {
  evaluateArticleQuality,
  isHighQualityArticle,
  MIN_MEANINGFUL_EXTRACT_CHARACTERS,
} from "../src/utils/articleQuality.ts"

const validThumbnail = {
  source: "https://upload.wikimedia.org/wikipedia/commons/example.jpg",
  width: 480,
  height: 320,
}

const highQualityArticle = {
  title: "Marie Curie",
  displaytitle: "Marie Curie",
  extract:
    "Marie Curie was a Polish and naturalised-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize and remains one of the best-known scientists in modern history.",
  url: "https://en.wikipedia.org/wiki/Marie_Curie",
  thumbnail: validThumbnail,
  categories: ["Category:Polish physicists", "Category:Nobel laureates in Physics"],
}

assert.equal(isHighQualityArticle(highQualityArticle), true)

const shortExtract = evaluateArticleQuality({
  ...highQualityArticle,
  title: "Tiny article",
  extract: "Too short.",
})

assert.equal(shortExtract.isHighQuality, false)
assert.equal(shortExtract.issues.some((issue) => issue.type === "short-extract"), true)
assert.equal(MIN_MEANINGFUL_EXTRACT_CHARACTERS > 0, true)

const disambiguationByTitle = evaluateArticleQuality({
  ...highQualityArticle,
  title: "Mercury (disambiguation)",
  categories: ["Category:Disambiguation pages"],
})

assert.equal(disambiguationByTitle.isHighQuality, false)
assert.equal(disambiguationByTitle.issues.some((issue) => issue.type === "disambiguation"), true)

const disambiguationByExtract = evaluateArticleQuality({
  ...highQualityArticle,
  title: "Mercury",
  extract:
    "Mercury may refer to several different topics, including a chemical element, a planet, a Roman deity, newspapers, songs, and other uses across science and culture.",
  categories: ["Category:Language and terminology"],
})

assert.equal(disambiguationByExtract.isHighQuality, false)
assert.equal(disambiguationByExtract.issues.some((issue) => issue.field === "extract"), true)

const listPage = evaluateArticleQuality({
  ...highQualityArticle,
  title: "List of physicists",
  categories: ["Category:Lists of scientists"],
})

assert.equal(listPage.isHighQuality, false)
assert.equal(listPage.issues.some((issue) => issue.type === "list-or-index"), true)

const chineseIndexPage = evaluateArticleQuality({
  ...highQualityArticle,
  title: "物理学家列表",
  extract:
    "物理学家列表收录了在物理学发展过程中具有一定影响的人物，并按照不同历史时期、研究方向和国籍进行整理，便于读者查找相关人物条目。",
  categories: ["Category:科学家列表"],
})

assert.equal(chineseIndexPage.isHighQuality, false)
assert.equal(chineseIndexPage.issues.some((issue) => issue.type === "list-or-index"), true)

const stubPage = evaluateArticleQuality({
  ...highQualityArticle,
  title: "Small town biography",
  categories: ["Category:Physics stubs"],
})

assert.equal(stubPage.isHighQuality, false)
assert.equal(stubPage.issues.some((issue) => issue.type === "stub-or-low-context"), true)

const missingUrl = evaluateArticleQuality({
  ...highQualityArticle,
  url: "",
})

assert.equal(missingUrl.isHighQuality, false)
assert.equal(missingUrl.issues.some((issue) => issue.type === "missing-url"), true)

const missingThumbnail = evaluateArticleQuality({
  ...highQualityArticle,
  thumbnail: undefined,
})

assert.equal(missingThumbnail.isHighQuality, false)
assert.equal(missingThumbnail.issues.some((issue) => issue.type === "missing-thumbnail"), true)
