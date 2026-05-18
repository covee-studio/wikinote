import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toast';
import type { ToastOptions } from './toast';


interface ToastState {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [counter, setCounter] = useState(0);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = counter + 1;
    setCounter(id);
    const toast: ToastState = { id, message };
    setToasts((prev) => [...prev, toast]);

    const duration = options?.duration ?? 2000;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, [counter]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] space-y-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="glass-effect px-4 py-2 rounded-lg shadow-lg border border-white/20 text-slate-800 bg-white/90"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

