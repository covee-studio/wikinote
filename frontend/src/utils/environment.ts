// Environment detection and adaptation utilities

// Global declarations
type ChromeStorageArea = {
  get: (
    keys: string[],
    cb: (result: Record<string, unknown>) => void
  ) => void
  set: (
    items: Record<string, unknown>,
    cb: () => void
  ) => void
  remove: (keys: string[], cb: () => void) => void
}

type ChromeStorageChange = {
  newValue?: unknown
  oldValue?: unknown
}

declare global {
  var __IS_EXTENSION__: boolean | undefined;
  var chrome:
    | {
        storage?: {
          local: ChromeStorageArea
          sync?: ChromeStorageArea
          onChanged?: {
            addListener: (
              listener: (changes: Record<string, ChromeStorageChange>, areaName: string) => void
            ) => void
            removeListener: (
              listener: (changes: Record<string, ChromeStorageChange>, areaName: string) => void
            ) => void
          }
        };
        runtime?: { lastError?: { message?: string } }
        permissions?: {
          request: (
            permissions: { origins?: string[] },
            cb: (granted: boolean) => void
          ) => void;
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

  /** Chrome Sync is deliberately separate from the local adapter. The web
   * build and browsers without the API remain local-only. */
  static isSyncAvailable(): boolean {
    return Boolean(isExtension && typeof chrome !== 'undefined' && chrome.storage?.sync)
  }

  static async syncGet<T = unknown>(key: string): Promise<T | null> {
    const area = isExtension && typeof chrome !== 'undefined' ? chrome.storage?.sync : undefined
    if (!area) return null
    return new Promise((resolve, reject) => {
      area.get([key], (result) => {
        const message = chrome?.runtime?.lastError?.message
        if (message) {
          reject(new Error(message))
          return
        }
        const value = result[key] as T | undefined
        resolve(value === undefined || value === null ? null : value)
      })
    })
  }

  static async syncGetMany(keys: string[]): Promise<Record<string, unknown>> {
    const area = isExtension && typeof chrome !== 'undefined' ? chrome.storage?.sync : undefined
    if (!area || keys.length === 0) return {}
    return new Promise((resolve, reject) => {
      area.get(keys, (result) => {
        const message = chrome?.runtime?.lastError?.message
        if (message) {
          reject(new Error(message))
          return
        }
        resolve(result)
      })
    })
  }

  static async syncSet(items: Record<string, unknown>): Promise<void> {
    const area = isExtension && typeof chrome !== 'undefined' ? chrome.storage?.sync : undefined
    if (!area) throw new Error('Chrome Sync is unavailable')
    return new Promise((resolve, reject) => {
      area.set(items, () => {
        const message = chrome?.runtime?.lastError?.message
        if (message) {
          reject(new Error(message))
          return
        }
        resolve()
      })
    })
  }

  static async syncRemove(keys: string[]): Promise<void> {
    const area = isExtension && typeof chrome !== 'undefined' ? chrome.storage?.sync : undefined
    if (!area || keys.length === 0) return
    return new Promise((resolve, reject) => {
      area.remove(keys, () => {
        const message = chrome?.runtime?.lastError?.message
        if (message) {
          reject(new Error(message))
          return
        }
        resolve()
      })
    })
  }

  static onSyncChange(listener: (keys: string[]) => void): () => void {
    const events = isExtension && typeof chrome !== 'undefined' ? chrome.storage?.onChanged : undefined
    if (!events) return () => undefined
    const handler = (changes: Record<string, ChromeStorageChange>, areaName: string) => {
      if (areaName === 'sync') listener(Object.keys(changes))
    }
    events.addListener(handler)
    return () => events.removeListener(handler)
  }
}

// Analytics adapter. The Vercel script is injected from main.tsx for the web
// build only, so custom events below are intentionally no-ops in the extension.
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

// Users often paste a self-hosted instance address without a scheme
// (e.g. "memos.example.com"). Without a scheme, both `fetch()` and
// `chrome.permissions.request()` treat it as a relative path against the
// extension's own origin, which fails with a generic "Failed to fetch" /
// silently skips requesting the host permission. Default to https:// so
// these URLs resolve to the intended host.
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function hostPermissionPatternFromUrl(rawUrl: string): string | null {
  try {
    const { origin, protocol } = new URL(normalizeUrl(rawUrl));
    if (protocol !== 'https:' && protocol !== 'http:') return null;
    return `${origin}/*`;
  } catch {
    return null;
  }
}

export async function requestOptionalHostPermission(rawUrl: string): Promise<boolean> {
  const pattern = hostPermissionPatternFromUrl(rawUrl);
  if (!pattern) return false;
  const permissions = typeof chrome !== 'undefined' ? chrome.permissions : undefined;
  if (!isExtension || !permissions?.request) {
    return true;
  }
  return new Promise((resolve) => {
    permissions.request({ origins: [pattern] }, resolve);
  });
}
