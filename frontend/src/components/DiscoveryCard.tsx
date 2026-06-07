// Dispatches rendering to the appropriate adapter — no source-specific logic here.
// Adding a new source never requires changing this file.

import { getAdapter } from "../sources/registry"
import type { DiscoveryItem } from "../types/DiscoveryItem"

interface DiscoveryCardProps {
  item: DiscoveryItem
  priority?: boolean
}

export function DiscoveryCard({ item, priority = false }: DiscoveryCardProps) {
  return <>{getAdapter(item.source).renderCard(item, { priority })}</>
}
