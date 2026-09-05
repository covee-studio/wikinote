// Development-only visual fixture. This entry is not included in either production build.
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { ZenMode } from '../src/components/ZenMode'
import { SourcesProvider } from '../src/contexts/SourcesContext'
import { LikedArticlesProvider } from '../src/contexts/LikedArticlesContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import type { DiscoveryItem } from '../src/types/DiscoveryItem'
import '../src/index.css'

const quote = '有些句子，第一次读的时候只是经过。\n\n等到某一天，在一个平常的午后重新遇见，才发现它已经悄悄走进了自己的生活。'
const sample: DiscoveryItem = {
  id: 'weread-preview-original-sample', source: 'weread', title: quote, url: '',
  raw: { bookId: 'preview', bookTitle: '阅读练习 · 示例', author: '演示内容，非真实书籍', chapter: '关于重新阅读', quote, thought: '读书留下的，不只是记住了多少。\n也包括那些在需要的时候，恰好想起来的一句话。' },
}
if (import.meta.env.DEV) {
  createRoot(document.getElementById('root')!).render(
    <SourcesProvider><LikedArticlesProvider><ToastProvider><MotionConfig reducedMotion="user">
      <ZenMode isOpen feedKey="sample" anchorKey={0} items={[sample]} initialIndex={0} />
    </MotionConfig></ToastProvider></LikedArticlesProvider></SourcesProvider>,
  )
}
