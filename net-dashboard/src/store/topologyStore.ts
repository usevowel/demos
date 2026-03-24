/**
 * Topology store - manages network topology view filters
 * Used for event-based filtering on the topology page (devices with specific event status)
 */

import { proxy } from 'valtio'
import type { EventSeverity } from '@/data/events'

export interface TopologyFilters {
  /** Filter to nodes (devices) that have events with this severity */
  eventSeverity?: EventSeverity
  /** Filter to nodes that have events with this acknowledgment status */
  eventAcknowledged?: boolean
  /** Filter to nodes (devices) that need firmware updates */
  firmwareUpdateNeeded?: boolean
  /** Filter to nodes (devices) in this building */
  building?: string
  /** Filter to nodes (devices) on this floor */
  floor?: number
}

export interface TopologyStore {
  filters: TopologyFilters
}

const initialState: TopologyStore = {
  filters: {},
}

export const topologyStore = proxy<TopologyStore>(initialState)

/** Update topology filters (event-based) */
export function updateTopologyFilters(newFilters: Partial<TopologyFilters>) {
  topologyStore.filters = { ...topologyStore.filters, ...newFilters }
}

/** Clear all topology filters */
export function clearTopologyFilters() {
  topologyStore.filters = {}
}
