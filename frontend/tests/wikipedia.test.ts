import { afterEach, expect, it, vi } from 'vitest'

vi.mock('../src/utils/environment', () => ({ fetchWithCORS: vi.fn() }))
import { fetchWithCORS } from '../src/utils/environment'
import { wikipediaAdapter } from '../src/sources/wikipedia'

afterEach(() => vi.resetAllMocks())

it('requests disambiguation metadata and excludes ambiguous or unusable summaries', async () => {
  const page = { title: 'A useful subject', extract: 'A substantive introduction. '.repeat(8), pageid: 1, canonicalurl: 'https://en.wikipedia.org/wiki/Example' }
  vi.mocked(fetchWithCORS).mockImplementation(async () => Response.json({ query: { pages: {
    1: page,
    2: { ...page, pageid: 2, pageprops: { disambiguation: '' } },
    3: { ...page, pageid: 3, extract: 'Too short.' },
    4: { ...page, pageid: 4, extract: null },
    5: { ...page, pageid: 5, canonicalurl: '' },
  } } }))
  const result = await wikipediaAdapter.fetch()
  expect(result.map(item => item.id)).toEqual(['wiki-1'])
  expect(String(vi.mocked(fetchWithCORS).mock.calls[0][0])).toContain('ppprop=disambiguation')
})
