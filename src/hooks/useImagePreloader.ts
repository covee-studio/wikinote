import { useEffect, useRef } from 'react';
import { preloadImage } from '../utils/images';

interface UseImagePreloaderOptions {
  enabled?: boolean;
  maxConcurrent?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Hook for intelligently preloading images
 * Manages concurrent loading and prioritization
 */
export function useImagePreloader(
  imageUrls: string[],
  options: UseImagePreloaderOptions = {}
) {
  const {
    enabled = true,
    maxConcurrent = 3,
    priority = 'normal'
  } = options;

  const loadingQueueRef = useRef<Set<string>>(new Set());
  const loadedCacheRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    if (!enabled || imageUrls.length === 0) return;

    const loadImagesConcurrently = async () => {
      const urlsToLoad = imageUrls.filter(
        url => !loadedCacheRef.current.has(url) && !loadingQueueRef.current.has(url)
      );

      if (urlsToLoad.length === 0) return;

      // 根据优先级排序 URLs
      const sortedUrls = [...urlsToLoad].sort((a, b) => {
        // 优先加载较小的图片（通常是缩略图）
        const aIsThumb = a.includes('px-');
        const bIsThumb = b.includes('px-');
        
        if (aIsThumb && !bIsThumb) return -1;
        if (!aIsThumb && bIsThumb) return 1;
        
        // 如果都是缩略图，优先加载较小尺寸的
        if (aIsThumb && bIsThumb) {
          const aSize = parseInt(a.match(/(\d+)px-/)?.[1] || '999999');
          const bSize = parseInt(b.match(/(\d+)px-/)?.[1] || '999999');
          return aSize - bSize;
        }
        
        return 0;
      });

      // 智能批处理 - 高优先级时减少并发以提高质量
      const batchSize = priority === 'high' ? Math.max(1, maxConcurrent - 1) : maxConcurrent;
      
      for (let i = 0; i < sortedUrls.length; i += batchSize) {
        const batch = sortedUrls.slice(i, i + batchSize);
        
        const loadPromises = batch.map(async (url, index) => {
          if (loadingQueueRef.current.has(url)) return;
          
          loadingQueueRef.current.add(url);
          
          try {
            // 错开加载时间，避免网络拥塞
            const staggerDelay = index * 50;
            const priorityDelay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 200;
            
            await new Promise(resolve => setTimeout(resolve, staggerDelay + priorityDelay));
            
            await preloadImage(url);
            loadedCacheRef.current.add(url);
          } catch (error) {
            console.warn('Failed to preload image:', url, error);
          } finally {
            loadingQueueRef.current.delete(url);
          }
        });

        // 高优先级等待完成，其他模式并行处理
        if (priority === 'high') {
          await Promise.allSettled(loadPromises);
        } else {
          // 异步处理，不阻塞后续批次
          Promise.allSettled(loadPromises);
          // 但是添加一个小延迟避免过度并发
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    // Use requestIdleCallback if available for better performance
    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(loadImagesConcurrently, { timeout: 2000 });
      return () => cancelIdleCallback(idleCallbackId);
    } else {
      // Fallback to setTimeout
      const timeoutId = setTimeout(loadImagesConcurrently, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [imageUrls, enabled, maxConcurrent, priority]);

  // Cleanup on unmount
  useEffect(() => {
    const abortControllers = abortControllersRef.current;
    const loadingQueue = loadingQueueRef.current;
    return () => {
      abortControllers.forEach(controller => controller.abort());
      abortControllers.clear();
      loadingQueue.clear();
    };
  }, []);

  return {
    isLoading: (url: string) => loadingQueueRef.current.has(url),
    isLoaded: (url: string) => loadedCacheRef.current.has(url),
    loadedCount: loadedCacheRef.current.size,
    totalCount: imageUrls.length
  };
}
