/**
 * Device store - manages network device state
 */

import { proxy } from 'valtio'
import type { Device, DeviceType, DeviceStatus } from '@/data/devices'
import type { EventSeverity } from '@/data/events'
import { getAllDevices, getDeviceById } from '@/data/devices'
import { getDeviceIdsWithEvents } from '@/data/events'

export interface DeviceFilters {
  query?: string
  type?: DeviceType
  status?: DeviceStatus
  building?: string
  floor?: number
  outdated?: boolean
  /** Filter to devices that have events with this severity */
  eventSeverity?: EventSeverity
  /** Filter to devices that have events with this acknowledgment status */
  eventAcknowledged?: boolean
}

export interface DeviceStore {
  devices: Device[]
  filters: DeviceFilters
  selectedDeviceId?: string
}

const initialState: DeviceStore = {
  devices: getAllDevices(),
  filters: {},
}

export const deviceStore = proxy<DeviceStore>(initialState)

// Actions
export function updateFilters(newFilters: Partial<DeviceFilters>) {
  deviceStore.filters = { ...deviceStore.filters, ...newFilters }
}

export function clearFilters() {
  deviceStore.filters = {}
}

export function selectDevice(deviceId: string | undefined) {
  deviceStore.selectedDeviceId = deviceId
}

export function getSelectedDevice(): Device | undefined {
  return deviceStore.selectedDeviceId 
    ? getDeviceById(deviceStore.selectedDeviceId)
    : undefined
}

// Computed functions
export function getFilteredDevices(): Device[] {
  let filtered = deviceStore.devices

  const { query, type, status, building, floor, outdated, eventSeverity, eventAcknowledged } =
    deviceStore.filters

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(d =>
      d.hostname.toLowerCase().includes(q) ||
      d.deviceId.toLowerCase().includes(q) ||
      d.ipAddress.includes(q) ||
      d.model.toLowerCase().includes(q) ||
      d.location.building.toLowerCase().includes(q)
    )
  }

  if (type) {
    filtered = filtered.filter(d => d.type === type)
  }

  if (status) {
    filtered = filtered.filter(d => d.status === status)
  }

  if (building) {
    filtered = filtered.filter(d => d.location.building === building)
  }

  if (floor !== undefined) {
    filtered = filtered.filter(d => d.location.floor === floor)
  }

  if (outdated !== undefined) {
    filtered = filtered.filter(d => d.firmware.outdated === outdated)
  }

  /** Filter to devices that have events with specific severity or acknowledgment status */
  if (eventSeverity !== undefined || eventAcknowledged !== undefined) {
    const deviceIdsWithEvents = getDeviceIdsWithEvents(eventSeverity, eventAcknowledged)
    filtered = filtered.filter(d => deviceIdsWithEvents.has(d.id))
  }

  return filtered
}

export function getDeviceStats() {
  const devices = deviceStore.devices
  return {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length,
    outdated: devices.filter(d => d.firmware.outdated).length,
    byType: {
      router: devices.filter(d => d.type === 'router').length,
      switch: devices.filter(d => d.type === 'switch').length,
      'access-point': devices.filter(d => d.type === 'access-point').length,
      firewall: devices.filter(d => d.type === 'firewall').length,
    }
  }
}

// Simulate real-time device status updates (for demo)
let updateInterval: number | undefined

export function startDeviceUpdates() {
  if (updateInterval) return
  
  updateInterval = window.setInterval(() => {
    // Randomly update CPU/memory/temperature for online devices
    deviceStore.devices.forEach(device => {
      if (device.status === 'online') {
        device.metrics.cpu = Math.min(100, Math.max(10, device.metrics.cpu + (Math.random() - 0.5) * 10))
        device.metrics.memory = Math.min(100, Math.max(20, device.metrics.memory + (Math.random() - 0.5) * 5))
        device.metrics.temperature = Math.min(80, Math.max(35, device.metrics.temperature + (Math.random() - 0.5) * 2))
        device.lastSeen = new Date()
      }
    })
  }, 30000) // Update every 30 seconds
}

export function stopDeviceUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = undefined
  }
}
