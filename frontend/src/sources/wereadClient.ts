import type { DiscoveryItem } from '../types/DiscoveryItem'

export const WEREAD_GATEWAY = 'https://i.weread.qq.com/api/agent/gateway'
export const WEREAD_SKILL_VERSION = '1.0.4'
const BATCH_SIZE = 30
const STATE_TTL = 24 * 60 * 60 * 1000

type Json = Record<string, unknown>
export interface WeReadNote {
  bookId: string
  bookTitle: string
  author: string
  chapter: string
  quote: string
  thought: string
  createdAt?: number
}
interface Book { bookId: string; title: string; author: string }
interface State {
  version: 1
  updatedAt: number
  books: Book[]
  lastSort?: number
  hasMore: boolean
  pending?: { book: Book; synckey: number }
  queue: DiscoveryItem[]
}

function object(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}
function text(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function rows(value: unknown): Json[] { return Array.isArray(value) ? value.map(object) : [] }

/** Only accept links returned by the official API, never construct reader IDs. */
export function safeWeReadLink(value: unknown): string {
  try {
    const url = new URL(text(value))
    if (url.username || url.password) return ''
    return (url.protocol === 'https:' && (url.hostname === 'weread.qq.com' || url.hostname === 'i.weread.qq.com')) || url.protocol === 'weread:' ? url.href : ''
  } catch { return '' }
}

export async function requestWeRead(api: string, params: Json, token: string, signal?: AbortSignal): Promise<Json> {
  const timeout = AbortSignal.timeout(15000)
  const response = await fetch(WEREAD_GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, api_name: api, skill_version: WEREAD_SKILL_VERSION }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (response.status === 401 || response.status === 403) throw new Error('WeRead: check or renew your API Key.')
  if (response.status === 429) throw new Error('WeRead is receiving too many requests. Please try again later.')
  if (!response.ok) throw new Error(`WeRead is unavailable (HTTP ${response.status}).`)
  const data = object(await response.json())
  if (data.upgrade_info) throw new Error('WeRead requires a newer integration. Please update Wikinote.')
  if (data.errcode !== undefined && Number(data.errcode) !== 0) throw new Error('WeRead could not read your notes. Check your API Key and try again.')
  return data
}

/** Normalize only personal content; keep the author's words separate from the user's thoughts. */
export function normalizeWeReadNotes(book: Book, bookmarks: Json, reviews: Json, account: string): DiscoveryItem[] {
  const chapters = new Map(rows(bookmarks.chapters).map(chapter => [String(chapter.chapterUid), text(chapter.title)]))
  const marks = rows(bookmarks.updated).filter(mark => mark.type !== 0 && text(mark.markText) && text(mark.bookmarkId))
  const thoughts = rows(reviews.reviews).map(row => object(row.review)).filter(review => text(review.reviewId) && text(review.content))
  const paired = new Set<string>()
  const result: DiscoveryItem[] = []
  const item = (id: string, quote: string, thought: string, raw: Json): DiscoveryItem => {
    const note: WeReadNote = {
      bookId: book.bookId, bookTitle: book.title, author: book.author,
      chapter: text(raw.chapterName) || chapters.get(String(raw.chapterUid)) || '',
      quote, thought,
      createdAt: typeof raw.createTime === 'number' ? raw.createTime : undefined,
    }
    return {
      id: `weread-${account}-${book.bookId}-${id}`, source: 'weread', title: quote || thought,
      url: safeWeReadLink(raw.deepLink) || safeWeReadLink(object(bookmarks.book).deepLink), raw: note,
    }
  }
  for (const review of thoughts) {
    const quote = text(review.abstract)
    const matching = marks.find(mark => String(mark.chapterUid) === String(review.chapterUid) && text(mark.range) && text(mark.range) === text(review.range))
    if (matching) paired.add(text(matching.bookmarkId))
    result.push(item(`review-${text(review.reviewId)}`, quote || text(matching?.markText), text(review.content), review))
  }
  for (const mark of marks) {
    if (!paired.has(text(mark.bookmarkId))) result.push(item(`mark-${text(mark.bookmarkId)}`, text(mark.markText), '', mark))
  }
  return result
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function weReadAccountKey(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token.trim()))
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
}

function readState(key: string): State {
  try {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null') as State | null
    if (state?.version === 1 && Date.now() - state.updatedAt < STATE_TTL && Array.isArray(state.books) &&
      state.books.every(book => typeof book.bookId === 'string' && typeof book.title === 'string' && typeof book.author === 'string') &&
      Array.isArray(state.queue) && state.queue.every(item => item?.source === 'weread' && typeof item.id === 'string' && item.raw) &&
      (!state.pending || (typeof state.pending.book?.bookId === 'string' && typeof state.pending.synckey === 'number'))) return state
  } catch { /* An unavailable cache must not prevent a fresh read. */ }
  return { version: 1, updatedAt: Date.now(), books: [], hasMore: true, queue: [] }
}

/** Walk randomized notebook pages incrementally, rather than downloading a whole library on every new tab. */
export async function fetchWeReadNotes(token: string, signal?: AbortSignal): Promise<DiscoveryItem[]> {
  if (!token.trim()) return []
  const account = await weReadAccountKey(token)
  const key = `wikinote-weread-v1-${account}`
  const run = async (): Promise<DiscoveryItem[]> => {
    const state = readState(key)
    // At most three empty books/pages per batch. The persisted cursor lets the next batch continue.
    for (let attempt = 0; attempt < 3 && state.queue.length === 0; attempt++) {
      signal?.throwIfAborted()
      if (!state.pending && state.books.length === 0) {
        const previousCursor = state.hasMore ? state.lastSort : undefined
        const index = await requestWeRead('/user/notebooks', { count: 20, ...(previousCursor !== undefined ? { lastSort: previousCursor } : {}) }, token, signal)
        if (!Array.isArray(index.books)) throw new Error('WeRead returned an unexpected notebook response.')
        const books = rows(index.books)
        const lastSort = books[books.length - 1]?.sort
        state.hasMore = Number(index.hasMore) === 1
        if (state.hasMore && (typeof lastSort !== 'number' || lastSort === previousCursor)) throw new Error('WeRead could not advance the notebook page. Please try again later.')
        state.lastSort = typeof lastSort === 'number' ? lastSort : undefined
        state.books = shuffle(books.filter(row => text(row.bookId)).map(row => ({
          bookId: text(row.bookId), title: text(object(row.book).title) || 'Untitled book', author: text(object(row.book).author),
        })))
        if (state.books.length === 0) break
      }
      const pending = state.pending
      const book = pending?.book ?? state.books.shift()!
      const [marks, reviews] = await Promise.all([
        pending ? Promise.resolve<Json>({}) : requestWeRead('/book/bookmarklist', { bookId: book.bookId }, token, signal),
        requestWeRead('/review/list/mine', { bookid: book.bookId, count: 20, synckey: pending?.synckey ?? 0 }, token, signal),
      ])
      if (!Array.isArray(reviews.reviews) || (!pending && !Array.isArray(marks.updated))) throw new Error('WeRead returned an unexpected notes response.')
      if (Number(reviews.hasMore) === 1) {
        if (typeof reviews.synckey !== 'number' || reviews.synckey === (pending?.synckey ?? 0)) throw new Error('WeRead could not advance the thoughts page. Please try again later.')
        state.pending = { book, synckey: reviews.synckey }
      } else state.pending = undefined
      state.queue = shuffle(normalizeWeReadNotes(book, marks, reviews, account))
    }
    signal?.throwIfAborted()
    const batch = state.queue.splice(0, BATCH_SIZE)
    try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* Storage can be full or disabled. */ }
    return batch
  }
  // New-tab pages can fetch at the same time. Serialize this one account's cursor when supported.
  return typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request(key, { signal }, run)
    : run()
}
