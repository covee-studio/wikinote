import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  enabled = true,
}: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip certain shortcuts if focus is inside an input field
      const target = event.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        
        case 'Enter':
          if (onEnter && !isInInput) {
            event.preventDefault();
            onEnter();
          }
          break;
        
        case 'ArrowUp':
          if (onArrowUp && !isInInput) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        
        case 'ArrowDown':
          if (onArrowDown && !isInInput) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        
        case 'ArrowLeft':
          if (onArrowLeft && !isInInput) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        
        case 'ArrowRight':
          if (onArrowRight && !isInInput) {
            event.preventDefault();
            onArrowRight();
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}