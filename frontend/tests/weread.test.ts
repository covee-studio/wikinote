import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWeReadNotes, normalizeWeReadNotes, requestWeRead, safeWeReadLink, weReadAccountKey, WEREAD_GATEWAY, WEREAD_SKILL_VERSION } from '../src/sources/wereadClient'

const book = { bookId: 'book-1', title: '阅读的意义', author: '测试作者' }
const highlight = { bookmarkId: 'mark-1', type: 1, markText: '重新遇见读过的一句话。', chapterUid: 1, range: '0-12' }
let storage: Map<string, string>
let api: ReturnType<typeof vi.fn>

beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) })
  vi.stubGlobal('navigator', {})
  api = vi.fn(async (_url: string, options: RequestInit) => {
    const body = JSON.parse(String(options.body))
    if (body.api_name === '/user/notebooks') return Response.json({ books: [{ bookId: book.bookId, book, sort: 10 }], hasMore: 0 })
    if (body.api_name === '/book/bookmarklist') return Response.json({ updated: [highlight], chapters: [{ chapterUid: 1, title: '第一章' }] })
    return Response.json({ reviews: [], hasMore: 0 })
  })
  vi.stubGlobal('fetch', api)
})
afterEach(() => vi.unstubAllGlobals())

describe('WeRead protocol', () => {
  it('uses Bearer auth, flat parameters and the official version without cookies', async () => {
    await requestWeRead('/user/notebooks', { count: 20, lastSort: 123 }, 'wrk-test')
    const [url, options] = api.mock.calls[0]
    expect(url).toBe(WEREAD_GATEWAY)
    expect(options).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Authorization: 'Bearer wrk-test' } })
    expect(JSON.parse(String(options.body))).toEqual({ api_name: '/user/notebooks', count: 20, lastSort: 123, skill_version: WEREAD_SKILL_VERSION })
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
  it.each([401, 403, 429, 503])('surfaces HTTP %s without leaking credentials', async status => {
    api.mockResolvedValue(Response.json({}, { status }))
    await expect(requestWeRead('/user/notebooks', {}, 'wrk-private-key')).rejects.toThrow(/WeRead/)
    await expect(requestWeRead('/user/notebooks', {}, 'wrk-private-key')).rejects.not.toThrow('wrk-private-key')
  })
  it.each([{ errcode: -1 }, { upgrade_info: { message: 'Update required' } }])('rejects API and upgrade failures: %j', async body => {
    api.mockResolvedValue(Response.json(body))
    await expect(requestWeRead('/user/notebooks', {}, 'wrk-test')).rejects.toThrow()
  })
  it('propagates caller cancellation', async () => {
    api.mockImplementation(async (_url, options) => {
      options.signal?.throwIfAborted()
      return Response.json({})
    })
    const controller = new AbortController()
    controller.abort()
    await expect(requestWeRead('/user/notebooks', {}, 'wrk-test', controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('personal reading content', () => {
  it('pairs a thought with the exact highlight, retaining chapter and author', () => {
    const result = normalizeWeReadNotes(book, { updated: [highlight], chapters: [{ chapterUid: 1, title: '第一章' }] }, {
      reviews: [{ review: { reviewId: 'r1', content: '这是我的想法。', chapterUid: 1, range: '0-12' } }],
    }, 'account')
    expect(result).toHaveLength(1)
    expect(result[0].raw).toMatchObject({ quote: highlight.markText, thought: '这是我的想法。', chapter: '第一章', bookTitle: book.title, author: book.author })
  })
  it('supports highlights without thoughts and thoughts without highlights', () => {
    const result = normalizeWeReadNotes(book, { updated: [highlight] }, { reviews: [{ review: { reviewId: 'r2', content: '整本书的感想' } }] }, 'account')
    expect(result).toHaveLength(2)
    expect(result.map(item => item.title)).toContain('整本书的感想')
  })
  it('drops bookmarks, blank highlights and blank thoughts', () => {
    expect(normalizeWeReadNotes(book, { updated: [{ ...highlight, type: 0 }, { bookmarkId: 'empty', markText: ' ' }] }, { reviews: [{ review: { reviewId: 'r', content: ' ' } }] }, 'a')).toEqual([])
  })
  it('uses account-scoped stable IDs', () => {
    const make = (account: string) => normalizeWeReadNotes(book, { updated: [highlight] }, {}, account)[0].id
    expect(make('a')).toBe(make('a'))
    expect(make('a')).not.toBe(make('b'))
  })
  it.each(['javascript:alert(1)', 'https://evil.example/book', 'https://weread.qq.com.evil.example/', 'https://secret@weread.qq.com/book'])('rejects untrusted reader links: %s', url => expect(safeWeReadLink(url)).toBe(''))
  it('keeps an official deep link and does not invent one when absent', () => {
    expect(safeWeReadLink('weread://reader/book')).toBe('weread://reader/book')
    expect(normalizeWeReadNotes(book, { updated: [highlight] }, {}, 'a')[0].url).toBe('')
  })
})

describe('incremental, account-isolated discovery', () => {
  it('does not make a request without a key', async () => {
    expect(await fetchWeReadNotes('')).toEqual([])
    expect(api).not.toHaveBeenCalled()
  })
  it('reads a notebook and both personal content endpoints', async () => {
    const result = await fetchWeReadNotes('wrk-test')
    expect(result).toHaveLength(1)
    expect(api.mock.calls.map(([, options]) => JSON.parse(String(options.body)).api_name)).toEqual(['/user/notebooks', '/book/bookmarklist', '/review/list/mine'])
    expect([...storage.keys()][0]).not.toContain('wrk-test')
    expect([...storage.values()].join()).not.toContain('wrk-test')
  })
  it('continues thought pagination without refetching highlights or the notebook', async () => {
    api.mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options.body))
      if (body.api_name === '/user/notebooks') return Response.json({ books: [{ bookId: book.bookId, book }], hasMore: 0 })
      if (body.api_name === '/book/bookmarklist') return Response.json({ updated: [] })
      return Response.json({ reviews: [{ review: { reviewId: String(body.synckey), content: 'Personal thought' } }], hasMore: body.synckey === 0 ? 1 : 0, synckey: 22 })
    })
    const first = await fetchWeReadNotes('wrk-test')
    const second = await fetchWeReadNotes('wrk-test')
    expect(first[0].id).not.toBe(second[0].id)
    expect(api).toHaveBeenCalledTimes(4)
    expect(JSON.parse(String(api.mock.calls[3][1].body))).toMatchObject({ bookid: book.bookId, synckey: 22 })
  })
  it('serves remaining highlights from a bounded batch without a new network call', async () => {
    api.mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options.body))
      if (body.api_name === '/user/notebooks') return Response.json({ books: [{ bookId: book.bookId, book }], hasMore: 0 })
      if (body.api_name === '/book/bookmarklist') return Response.json({ updated: Array.from({ length: 40 }, (_, i) => ({ ...highlight, bookmarkId: `m${i}` })) })
      return Response.json({ reviews: [], hasMore: 0 })
    })
    const first = await fetchWeReadNotes('wrk-test')
    const second = await fetchWeReadNotes('wrk-test')
    expect(first).toHaveLength(30)
    expect(second).toHaveLength(10)
    expect(new Set([...first, ...second].map(item => item.id)).size).toBe(40)
    expect(api).toHaveBeenCalledTimes(3)
  })
  it('never returns another account’s pending queue', async () => {
    await fetchWeReadNotes('wrk-a')
    await fetchWeReadNotes('wrk-b')
    expect(storage.size).toBe(2)
    expect(await weReadAccountKey('wrk-a')).not.toBe(await weReadAccountKey('wrk-b'))
  })
  it('does not advance persisted state on a failed book response', async () => {
    api.mockImplementation(async (_url, options) => JSON.parse(String(options.body)).api_name === '/user/notebooks'
      ? Response.json({ books: [{ bookId: book.bookId, book }], hasMore: 0 })
      : Response.json({}, { status: 500 }))
    await expect(fetchWeReadNotes('wrk-test')).rejects.toThrow()
    expect(storage.size).toBe(0)
  })
  it('continues notebooks with lastSort, not offset or nested params', async () => {
    let indexCalls = 0
    api.mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options.body))
      if (body.api_name === '/user/notebooks') {
        indexCalls++
        return Response.json({ books: [{ bookId: `book-${indexCalls}`, book, sort: 100 }], hasMore: indexCalls === 1 ? 1 : 0 })
      }
      return body.api_name === '/book/bookmarklist' ? Response.json({ updated: [highlight] }) : Response.json({ reviews: [], hasMore: 0 })
    })
    await fetchWeReadNotes('wrk-test')
    await fetchWeReadNotes('wrk-test')
    expect(JSON.parse(String(api.mock.calls[3][1].body))).toMatchObject({ api_name: '/user/notebooks', lastSort: 100 })
  })
  it('returns a genuine empty library and rejects malformed success responses', async () => {
    api.mockResolvedValue(Response.json({ books: [], hasMore: 0 }))
    expect(await fetchWeReadNotes('wrk-empty')).toEqual([])
    api.mockResolvedValue(Response.json({ unexpected: true }))
    await expect(fetchWeReadNotes('wrk-invalid')).rejects.toThrow('unexpected notebook')
  })
})
