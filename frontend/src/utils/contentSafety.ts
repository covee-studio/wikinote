// Safe Mode content filter for Wikinote
//
// Strategy: rely on Wikipedia's own editorial category system rather than
// maintaining a keyword blocklist. Wikipedia editors already tag explicit and
// sensitive content with stable, well-known category names — we just check
// against those.
//
// Categories were chosen to cover clearly adult/explicit/graphic content while
// leaving normal historical, medical, political, and LGBTQ+ encyclopedia
// articles untouched.

const BLOCKED_CATEGORIES = new Set([
  "Category:Wikipedia explicit content",
  "Category:Adult content",
  "Category:Pornographic films",
  "Category:Pornographic film series",
  "Category:Pornographic websites",
  "Category:Pornographic magazines",
  "Category:Sexual fetishism",
  "Category:Child sexual abuse",
  "Category:Child pornography",
  "Category:Rape",
  "Category:Human trafficking for sexual exploitation",
  "Category:Mass murder",
  "Category:Serial killers by country",
  "Category:Genocide",
  "Category:Snuff films",
])

/**
 * Returns true if the article is safe to display.
 * An article with no category data is considered safe.
 */
export function isSafeArticle(categories: string[] | undefined): boolean {
  if (!categories || categories.length === 0) return true
  return !categories.some((cat) => BLOCKED_CATEGORIES.has(cat))
}
