/**
 * Event store - manages network events and filters
 */

import { proxy } from 'valtio'
import { getAllEvents, type NetworkEvent, type EventSeverity, type EventCategory } from '@/data/events'

export interface EventFilters {
  severity?: EventSeverity | 'all'
  category?: EventCategory | 'all'
  acknowledged?: 'all' | 'acknowledged' | 'unacknowledged'
}

export interface EventStore {
  events: NetworkEvent[]
  filters: EventFilters
  selectedEventId?: string
}

const initialState: EventStore = {
  events: getAllEvents(),
  filters: {
    severity: 'all',
    category: 'all',
    acknowledged: 'all',
  },
}

export const eventStore = proxy<EventStore>(initialState)

// Actions
export function updateFilters(newFilters: Partial<EventFilters>) {
  eventStore.filters = { ...eventStore.filters, ...newFilters }
}

export function clearFilters() {
  eventStore.filters = {
    severity: 'all',
    category: 'all',
    acknowledged: 'all',
  }
}

export function selectEvent(eventId: string | undefined) {
  eventStore.selectedEventId = eventId
}

export function getSelectedEvent(): NetworkEvent | undefined {
  return eventStore.selectedEventId
    ? eventStore.events.find(e => e.id === eventStore.selectedEventId)
    : undefined
}

// Computed functions
export function getFilteredEvents(): NetworkEvent[] {
  let filtered = eventStore.events

  const { severity, category, acknowledged } = eventStore.filters

  if (severity && severity !== 'all') {
    filtered = filtered.filter(e => e.severity === severity)
  }

  if (category && category !== 'all') {
    filtered = filtered.filter(e => e.category === category)
  }

  if (acknowledged === 'acknowledged') {
    filtered = filtered.filter(e => e.acknowledged)
  } else if (acknowledged === 'unacknowledged') {
    filtered = filtered.filter(e => !e.acknowledged)
  }

  // Sort by timestamp (newest first)
  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export function getEventStats() {
  const events = eventStore.events
  return {
    total: events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    warning: events.filter(e => e.severity === 'warning').length,
    info: events.filter(e => e.severity === 'info').length,
    success: events.filter(e => e.severity === 'success').length,
    unacknowledged: events.filter(e => !e.acknowledged).length,
  }
}
