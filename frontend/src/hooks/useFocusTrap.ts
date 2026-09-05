import { useEffect } from 'react';

export function useFocusTrap(enabled: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(',');

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    const frame = requestAnimationFrame(() => getFocusable()[0]?.focus());

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last || !container.contains(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeydown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [enabled, containerRef]);
}
