// Environment detection and adaptation utilities

// Global declarations
declare global {
  var __IS_EXTENSION__: boolean | undefined;
  var chrome:
    | {
        storage?: {
          local: {
            get: (
              keys: string[],
              cb: (result: Record<string, unknown>) => void
            ) => void;
            set: (
              items: Record<string, unknown>,
              cb: () => void
            ) => void;
            remove: (keys: string[], cb: () => void) => void;
          };
        };
      }
    | undefined;
}

export const isExtension = typeof __IS_EXTENSION__ !== 'undefined' && __IS_EXTENSION__;

// Chrome Storage API adapter
export class StorageAdapter {
  static async get<T = unknown>(key: string): Promise<T | null> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome!.storage!.local.get([key], (result: Record<string, unknown>) => {
          const value = result[key] as T | undefined;
          if (typeof value === 'undefined' || value === null) {
            // Fallback to localStorage mirror if any
            const mirrored = localStorage.getItem(key);
            if (mirrored == null) {
              resolve(null);
            } else {
              try {
                resolve(JSON.parse(mirrored) as T);
              } catch {
                resolve(mirrored as unknown as T);
              }
            }
          } else {
            resolve(value ?? null);
          }
        });
      });
    } else {
      const item = localStorage.getItem(key);
      if (item == null) return null;
      // Be tolerant to legacy plain-string values (e.g. 'en') that aren't JSON
      try {
        return JSON.parse(item) as unknown as T;
      } catch {
        return item as unknown as T;
      }
    }
  }

  static async set<T = unknown>(key: string, value: T): Promise<void> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome!.storage!.local.set({ [key]: value as unknown }, () => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (err) {
            console.warn('Failed to mirror to localStorage', err);
          }
          resolve();
        });
      });
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  static async remove(key: string): Promise<void> {
    if (isExtension && typeof chrome !== 'undefined') {
      return new Promise((resolve) => {
        chrome!.storage!.local.remove([key], resolve);
      });
    } else {
      localStorage.removeItem(key);
    }
  }
}

// Analytics adapter
export const Analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    if (!isExtension) {
      // Use Vercel Analytics only on Web
      if (typeof window !== 'undefined') {
        const w = window as unknown as {
          va?: (e: string, p?: Record<string, unknown>) => void;
        };
        if (w.va) {
          w.va(event, properties);
        }
      }
    }
    // In extension env either integrate other analytics or no-op
  }
};

// Fetch adapter with minimal CORS adjustments for extension
export const fetchWithCORS = async (url: string, options?: RequestInit): Promise<Response> => {
  if (isExtension && typeof chrome !== 'undefined') {
    // In MV3 most requests work with origin=* query; avoid forcing Origin header
    return fetch(url, options);
  }
  return fetch(url, options);
}; 