import { useState, useEffect, useRef } from 'react';
import { throttle } from '../utils/performance';

export function useScrollPosition(threshold: number = 10) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    // Find scroll container - prefer container with class containing overflow-y-scroll
    const findScrollContainer = (): HTMLElement | Window => {
      const containers = document.querySelectorAll('[class*="overflow-y-scroll"]');
      if (containers.length > 0) {
        return containers[0] as HTMLElement;
      }
      // Fallback to window if no container is found
      return window;
    };

    containerRef.current = findScrollContainer();

    const handleScroll = throttle(() => {
      let currentScrollY = 0;
      
      if (containerRef.current === window) {
        currentScrollY = window.scrollY;
      } else if (containerRef.current && 'scrollTop' in containerRef.current) {
        currentScrollY = (containerRef.current as HTMLElement).scrollTop;
      }
      
      setScrollY(currentScrollY);
      
      const shouldBeScrolled = currentScrollY > threshold;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    }, 100);

    // Initial check
    handleScroll();

    // Add scroll listener
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [threshold, isScrolled]);

  return { scrollY, isScrolled };
}