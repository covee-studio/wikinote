/* eslint-disable react-refresh/only-export-components */
// Manages which sources are enabled and their per-source config (API keys, etc.).
// Source definitions (label, color, fetch, render) live in the adapter registry —
// this context handles only enabled/disabled state + user config + localStorage.

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { SourceId } from "../types/DiscoveryItem"
import { ADAPTER_LIST } from "../sources/registry"
import { requestOptionalHostPermission } from "../utils/environment"

function urlFieldKeys(id: SourceId): string[] {
  const adapter = ADAPTER_LIST.find((a) => a.id === id)
  return adapter?.configSchema?.filter((f) => f.isUrl).map((f) => f.key) ?? []
}

// ─── Types ────────────────────────────────────────────────────
export type SourceConfigs = Partial<Record<SourceId, Record<string, string>>>

interface SourcesContextType {
  enabledSources: Set<SourceId>
  toggleSource: (id: SourceId) => void
  isEnabled: (id: SourceId) => boolean
  sourceConfigs: SourceConfigs
  updateSourceConfig: (id: SourceId, key: string, value: string) => void
  getSourceConfig: (id: SourceId) => Record<string, string>
  /** Requests the Chrome extension host permission needed to fetch this
   *  source's configured URL field(s), if any. Safe to call repeatedly —
   *  no-ops once granted or outside the extension context. Call this from
   *  a genuine user gesture (e.g. an input's onBlur), since
   *  chrome.permissions.request requires one. */
  ensureHostPermission: (id: SourceId) => void
}

const SourcesContext = createContext<SourcesContextType | undefined>(undefined)

// ─── Storage keys ─────────────────────────────────────────────
const ENABLED_KEY = "wikinote-enabled-sources"
const CONFIGS_KEY = "wikinote-source-configs"

// Sources without requiresConfig are enabled by default
const DEFAULT_SOURCE_IDS: SourceId[] = ADAPTER_LIST
  .filter((a) => !a.requiresConfig)
  .map((a) => a.id)

const ALL_SOURCE_IDS: SourceId[] = ADAPTER_LIST.map((a) => a.id)

// ─── Loaders ──────────────────────────────────────────────────
function loadEnabled(): Set<SourceId> {
  try {
    const raw = localStorage.getItem(ENABLED_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SourceId[]
      const valid = parsed.filter((id) => ALL_SOURCE_IDS.includes(id))
      if (valid.length > 0) return new Set(valid)
    }
  } catch { /* ignore */ }
  return new Set(DEFAULT_SOURCE_IDS)
}

function loadConfigs(): SourceConfigs {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY)
    if (raw) return JSON.parse(raw) as SourceConfigs
  } catch { /* ignore */ }
  return {}
}

// ─── Provider ─────────────────────────────────────────────────
export function SourcesProvider({ children }: { children: ReactNode }) {
  const [enabledSources, setEnabledSources] = useState<Set<SourceId>>(loadEnabled)
  const [sourceConfigs, setSourceConfigs] = useState<SourceConfigs>(loadConfigs)

  useEffect(() => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify([...enabledSources]))
  }, [enabledSources])

  useEffect(() => {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(sourceConfigs))
  }, [sourceConfigs])

  const toggleSource = (id: SourceId) => {
    const adapter = ADAPTER_LIST.find((a) => a.id === id)
    setEnabledSources((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // always keep ≥1 active
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

    if (!enabledSources.has(id) && adapter?.requiresConfig) {
      ensureHostPermission(id)
    }
  }

  const isEnabled = (id: SourceId) => enabledSources.has(id)

  const updateSourceConfig = (id: SourceId, key: string, value: string) => {
    setSourceConfigs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }))
  }

  const getSourceConfig = (id: SourceId): Record<string, string> =>
    sourceConfigs[id] ?? {}

  // Requests the host permission for every configured URL field of this
  // source. Also called whenever the user finishes editing a URL field
  // (see SourcesModal's onBlur) — not just on enable — so changing an
  // already-enabled source's instance URL doesn't keep failing with a
  // silent CORS/"Failed to fetch" error because permission was only ever
  // granted for the *previous* URL.
  const ensureHostPermission = (id: SourceId) => {
    for (const key of urlFieldKeys(id)) {
      const value = sourceConfigs[id]?.[key]
      if (value?.trim()) void requestOptionalHostPermission(value)
    }
  }

  return (
    <SourcesContext.Provider
      value={{ enabledSources, toggleSource, isEnabled, sourceConfigs, updateSourceConfig, getSourceConfig, ensureHostPermission }}
    >
      {children}
    </SourcesContext.Provider>
  )
}

export function useSources() {
  const ctx = useContext(SourcesContext)
  if (!ctx) throw new Error("useSources must be used within a SourcesProvider")
  return ctx
}
