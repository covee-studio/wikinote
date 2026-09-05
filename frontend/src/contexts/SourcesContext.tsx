/* eslint-disable react-refresh/only-export-components */
// Manages which sources are enabled and their per-source config (API keys, etc.).
// Source definitions (label, color, fetch, render) live in the adapter registry —
// this context handles only enabled/disabled state + user config + localStorage.

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { SourceId } from "../types/DiscoveryItem"
import { ADAPTER_LIST } from "../sources/registry"
import { requestOptionalHostPermission } from "../utils/environment"
import { feedCache } from '../utils/feedCache'

function urlFieldKeys(id: SourceId): string[] {
  const adapter = ADAPTER_LIST.find((a) => a.id === id)
  return adapter?.configSchema?.filter((f) => f.isUrl).map((f) => f.key) ?? []
}

// ─── Types ────────────────────────────────────────────────────
export type SourceConfigs = Partial<Record<SourceId, Record<string, string>>>

interface SourcesContextType {
  enabledSources: Set<SourceId>
  /** Returns false when a source cannot be enabled because required config is missing. */
  toggleSource: (id: SourceId, configOverride?: Record<string, string>) => boolean
  isEnabled: (id: SourceId) => boolean
  sourceConfigs: SourceConfigs
  updateSourceConfig: (id: SourceId, key: string, value: string) => void
  getSourceConfig: (id: SourceId) => Record<string, string>
  disconnectSource: (id: SourceId) => void
  /** Requests the Chrome extension host permission needed to fetch this
   *  source's configured URL field(s), if any. Safe to call repeatedly —
   *  no-ops once granted or outside the extension context. Call this from
   *  a genuine user gesture (Save or the source toggle), since
   *  chrome.permissions.request requires one. */
  ensureHostPermission: (id: SourceId, configOverride?: Record<string, string>) => Promise<boolean>
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

function isFullyConfigured(id: SourceId, config: Record<string, string>): boolean {
  const adapter = ADAPTER_LIST.find((candidate) => candidate.id === id)
  if (!adapter?.requiresConfig || !adapter.configSchema) return true
  return adapter.configSchema.every((field) => field.required === false || Boolean(config[field.key]?.trim()))
}

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
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      return Object.fromEntries(ALL_SOURCE_IDS.flatMap(id => {
        const value = parsed[id]
        if (!value || typeof value !== 'object' || Array.isArray(value)) return []
        const config = Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry === 'string'))
        return [[id, { ...config, __cacheId: config.__cacheId || crypto.randomUUID() }]]
      })) as SourceConfigs
    }
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

  const toggleSource = (id: SourceId, configOverride?: Record<string, string>): boolean => {
    const adapter = ADAPTER_LIST.find((a) => a.id === id)
    const currentlyEnabled = enabledSources.has(id)
    const config = configOverride ?? sourceConfigs[id] ?? {}

    // Configuration-backed sources must be complete before they can enter the
    // active feed. This keeps the invariant at the state boundary instead of
    // relying only on the Sources UI to prevent an invalid activation.
    if (!currentlyEnabled && adapter?.requiresConfig && !isFullyConfigured(id, config)) {
      return false
    }

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

    // The setup UI awaits host permission before activating a configured source.
    return true
  }

  const isEnabled = (id: SourceId) => enabledSources.has(id)

  const updateSourceConfig = (id: SourceId, key: string, value: string) => {
    setSourceConfigs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value, __cacheId: crypto.randomUUID() },
    }))
  }

  const getSourceConfig = (id: SourceId): Record<string, string> =>
    sourceConfigs[id] ?? {}

  const disconnectSource = (id: SourceId) => {
    setSourceConfigs(previous => {
      const next = { ...previous }
      delete next[id]
      return next
    })
    setEnabledSources(previous => {
      const next = new Set(previous)
      next.delete(id)
      if (!next.size) next.add(DEFAULT_SOURCE_IDS[0])
      return next
    })
    void feedCache.clearSource(id)
  }

  // Save requests permission for the draft endpoint before persisting it,
  // including when an already-active source changes its instance URL.
  const ensureHostPermission = async (id: SourceId, configOverride?: Record<string, string>): Promise<boolean> => {
    const adapter = ADAPTER_LIST.find((candidate) => candidate.id === id)
    if (adapter?.permissionOrigin && !await requestOptionalHostPermission(adapter.permissionOrigin)) return false
    for (const key of urlFieldKeys(id)) {
      const value = configOverride?.[key] ?? sourceConfigs[id]?.[key]
      if (value?.trim() && !await requestOptionalHostPermission(value)) return false
    }
    return true
  }

  return (
    <SourcesContext.Provider
      value={{ enabledSources, toggleSource, isEnabled, sourceConfigs, updateSourceConfig, getSourceConfig, ensureHostPermission, disconnectSource }}
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
