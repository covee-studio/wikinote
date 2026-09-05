import { beforeEach, afterEach, expect, it, vi } from 'vitest'

let local: Map<string, string>
let chromeLocal: Record<string, unknown>
beforeEach(() => {
  vi.resetModules()
  local = new Map()
  chromeLocal = {}
  vi.stubGlobal('__IS_EXTENSION__', true)
  vi.stubGlobal('localStorage', { getItem: (key: string) => local.get(key) ?? null, setItem: (key: string, value: string) => local.set(key, value), removeItem: (key: string) => local.delete(key) })
  vi.stubGlobal('chrome', { storage: { local: {
    get: (_keys: string[], callback: (data: Record<string, unknown>) => void) => callback(chromeLocal),
    set: (data: Record<string, unknown>, callback: () => void) => { Object.assign(chromeLocal, data); callback() },
    remove: (keys: string[], callback: () => void) => { keys.forEach(key => delete chromeLocal[key]); callback() },
  } } })
})
afterEach(() => vi.unstubAllGlobals())

it('clears both Chrome storage and its mirror so deleted recent content cannot reappear', async () => {
  const { StorageAdapter } = await import('../src/utils/environment')
  await StorageAdapter.set('recent', ['private note'])
  await StorageAdapter.remove('recent')
  expect(await StorageAdapter.get('recent')).toBeNull()
  expect(local.has('recent')).toBe(false)
})

it('separates accounts after identical long endpoint prefixes', async () => {
  const { feedCache } = await import('../src/utils/feedCache')
  const prefix = `{"endpoint":"https://${'a'.repeat(60)}.example","token":"revision:`
  expect(feedCache.key('memos', '', `${prefix}one"}`)).not.toBe(feedCache.key('memos', '', `${prefix}two"}`))
})

it('treats malformed cached items as a miss', async () => {
  const { feedCache } = await import('../src/utils/feedCache')
  local.set('wikinote-feed-v2-test', JSON.stringify({ timestamp: Date.now(), items: 'invalid' }))
  expect(feedCache.getSync('test')).toBeNull()
})

it('does not upload WeRead text, credentials or tombstones to Chrome Sync', async () => {
  const { StorageAdapter } = await import('../src/utils/environment')
  const write = vi.spyOn(StorageAdapter, 'syncSet').mockResolvedValue()
  vi.spyOn(StorageAdapter, 'syncRemove').mockResolvedValue()
  const { writeFavoriteSyncRecords } = await import('../src/utils/favoriteSync')
  await writeFavoriteSyncRecords([
    { id: 'weread-private', updatedAt: 1, item: { id: 'weread-private', source: 'weread', title: 'private thought', url: '', raw: { token: 'wrk-secret' } } },
    { id: 'weread-deleted', updatedAt: 2, deleted: true },
  ])
  expect(JSON.stringify(write.mock.calls)).not.toMatch(/private thought|wrk-secret|weread-/)
})
